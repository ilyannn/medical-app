import type { ICloudDocumentStore } from "@/server/adapters/document-store";
import type { DraftService } from "@/server/adapters/draft-service";
import type { MacOSBridge } from "@/server/adapters/macos-bridge";
import type { PaperlessClient } from "@/server/adapters/paperless";
import type { AppConfig } from "@/server/config";
import type { AppDb } from "@/server/db/client";
import {
  appointmentLinksTable,
  billsTable,
  careAreasTable,
  doctorsTable,
  documentLinksTable,
  documentsTable,
  draftsTable,
  notesTable,
  peopleTable,
  prescriptionsTable,
  reimbursementsTable,
  syncRunsTable,
} from "@/server/db/schema";
import type { SqliteDatabase } from "@/server/db/sqlite";
import { querySearchIndex, rebuildSearchIndex } from "@/server/services/search";
import { createId } from "@/server/utils/id";
import type {
  CalendarEvent,
  CreateBillInput,
  CreateDoctorInput,
  CreateNoteInput,
  CreatePrescriptionInput,
  CreateReimbursementInput,
  DoctorWithContact,
  DocumentRecord,
  EncounterNote,
  GenerateDraftInput,
  ImportPaperlessInput,
  MessageDraft,
  OverviewSnapshot,
  PersonScope,
  SearchHit,
} from "@/shared/types";
import { desc, eq } from "drizzle-orm";

function matchesScope(personId: string, personScope: PersonScope) {
  return personScope === "all" || personId === personScope;
}

export class HouseholdService {
  constructor(
    private readonly db: AppDb,
    private readonly sqlite: SqliteDatabase,
    private readonly config: AppConfig,
    private readonly documentStore: ICloudDocumentStore,
    private readonly paperless: PaperlessClient,
    private readonly macosBridge: MacOSBridge,
    private readonly draftService: DraftService,
  ) {}

  async listPeople() {
    return this.db.select().from(peopleTable).orderBy(peopleTable.id);
  }

  async getOverview(personScope: PersonScope): Promise<OverviewSnapshot> {
    const people = await this.listPeople();
    const [prescriptions, bills, reimbursements, drafts, documents] =
      await Promise.all([
        this.listPrescriptions(personScope),
        this.listBills(personScope),
        this.listReimbursements(personScope),
        this.listDrafts(personScope),
        this.listDocuments(personScope),
      ]);
    const notes = await this.listNotes(personScope);
    const appointments = await this.listAppointments(personScope);

    return {
      filters: {
        people,
        personScope,
      },
      stats: {
        activePrescriptions: prescriptions.filter(
          (item) => item.status !== "completed",
        ).length,
        pendingBills: bills.filter((item) => item.status !== "reimbursed")
          .length,
        pendingReimbursements: reimbursements.filter(
          (item) => item.status !== "reimbursed",
        ).length,
        draftCount: drafts.length,
        documentCount: documents.length,
        upcomingAppointments: appointments.length,
      },
      recentNotes: notes.slice(0, 3),
      recentDrafts: drafts.slice(0, 3),
      upcomingAppointments: appointments.slice(0, 4),
    };
  }

  async listAreas(personScope: PersonScope) {
    const areas = await this.db
      .select()
      .from(careAreasTable)
      .orderBy(careAreasTable.name);
    const doctors = await this.listDoctors(personScope);
    const documents = await this.listDocuments(personScope);
    const prescriptions = await this.listPrescriptions(personScope);

    return areas
      .filter((area) => matchesScope(area.personId, personScope))
      .map((area) => ({
        ...area,
        doctorCount: doctors.filter((doctor) => doctor.careAreaId === area.id)
          .length,
        documentCount: documents.filter(
          (document) => document.careAreaId === area.id,
        ).length,
        prescriptionCount: prescriptions.filter(
          (prescription) => prescription.careAreaId === area.id,
        ).length,
      }));
  }

  async listDoctors(personScope: PersonScope): Promise<DoctorWithContact[]> {
    const doctors = await this.db
      .select()
      .from(doctorsTable)
      .leftJoin(careAreasTable, eq(doctorsTable.careAreaId, careAreasTable.id))
      .orderBy(doctorsTable.name);

    const filtered = doctors.filter((row) =>
      matchesScope(row.doctors.personId, personScope),
    );
    return Promise.all(
      filtered.map(async (row) => ({
        ...row.doctors,
        careAreaName: row.care_areas?.name ?? "Unassigned",
        contact: row.doctors.macosContactId
          ? await this.macosBridge.getContactById(row.doctors.macosContactId)
          : null,
      })),
    );
  }

  async listNotes(personScope: PersonScope): Promise<EncounterNote[]> {
    const rows = await this.db
      .select()
      .from(notesTable)
      .orderBy(desc(notesTable.visitDate));
    return rows.filter((row) => matchesScope(row.personId, personScope));
  }

  async listPrescriptions(personScope: PersonScope) {
    const rows = await this.db
      .select()
      .from(prescriptionsTable)
      .orderBy(desc(prescriptionsTable.issuedOn));
    return rows.filter((row) => matchesScope(row.personId, personScope));
  }

  async listBills(personScope: PersonScope) {
    const rows = await this.db
      .select()
      .from(billsTable)
      .orderBy(desc(billsTable.incurredOn));
    return rows.filter((row) => matchesScope(row.personId, personScope));
  }

  async listReimbursements(personScope: PersonScope) {
    const rows = await this.db
      .select()
      .from(reimbursementsTable)
      .orderBy(desc(reimbursementsTable.submittedOn));
    return rows.filter((row) => matchesScope(row.personId, personScope));
  }

  async listDrafts(personScope: PersonScope): Promise<MessageDraft[]> {
    const rows = await this.db
      .select()
      .from(draftsTable)
      .orderBy(desc(draftsTable.createdAt));
    return rows
      .filter((row) => matchesScope(row.personId, personScope))
      .map((row) => ({
        ...row,
        locale: row.locale as MessageDraft["locale"],
      }));
  }

  async listDocuments(
    personScope: PersonScope,
    filters?: { year?: string; documentType?: string; careAreaId?: string },
  ) {
    const rows = await this.db
      .select()
      .from(documentsTable)
      .orderBy(desc(documentsTable.documentDate));
    return rows.filter((row) => {
      if (!matchesScope(row.personId, personScope)) {
        return false;
      }
      if (filters?.year && !row.documentDate.startsWith(filters.year)) {
        return false;
      }
      if (filters?.documentType && row.documentType !== filters.documentType) {
        return false;
      }
      if (filters?.careAreaId && row.careAreaId !== filters.careAreaId) {
        return false;
      }
      return true;
    });
  }

  async listPaperless(query = "") {
    return this.paperless.search(query);
  }

  async importPaperlessDocument(
    input: ImportPaperlessInput,
  ): Promise<DocumentRecord> {
    const source = await this.paperless.getById(input.paperlessId);
    if (!source) {
      throw new Error(`Paperless document ${input.paperlessId} not found`);
    }

    const relativePath = await this.documentStore.importFromPaperless(
      input.personId,
      input.documentDate,
      input.semanticName,
      source.content,
    );

    const documentRecord: DocumentRecord = {
      id: createId("doc"),
      personId: input.personId,
      careAreaId: input.careAreaId ?? null,
      relativePath,
      semanticName: input.semanticName,
      documentDate: input.documentDate,
      documentType: input.documentType,
      sourceKind: "paperless",
      sourceRef: input.paperlessId,
      extractedText: input.extractedText || source.content,
      importedAt: new Date().toISOString(),
    };

    await this.db.insert(documentsTable).values(documentRecord);
    if (input.links.length) {
      await this.db.insert(documentLinksTable).values(
        input.links.map((link) => ({
          id: createId("doclink"),
          documentId: documentRecord.id,
          entityType: link.entityType,
          entityId: link.entityId,
        })),
      );
    }
    await this.recordSync("paperless", "imported", `Imported ${source.title}`);
    await this.rebuildSearchIndex();
    return documentRecord;
  }

  async renameDocument(
    documentId: string,
    semanticName: string,
    documentDate: string,
  ) {
    const [document] = await this.db
      .select()
      .from(documentsTable)
      .where(eq(documentsTable.id, documentId));
    if (!document) {
      throw new Error(`Document ${documentId} not found`);
    }

    const relativePath = await this.documentStore.renameDocument(
      document.relativePath,
      document.personId,
      documentDate,
      semanticName,
    );

    await this.db
      .update(documentsTable)
      .set({
        semanticName,
        documentDate,
        relativePath,
      })
      .where(eq(documentsTable.id, documentId));

    await this.rebuildSearchIndex();
    return { ...document, semanticName, documentDate, relativePath };
  }

  async listAppointments(personScope: PersonScope): Promise<CalendarEvent[]> {
    const events = await this.macosBridge.listEvents(
      this.config.macosBridge.calendarId,
    );
    return events
      .filter((event) =>
        matchesScope(
          event.personId ?? extractPersonId(event.notes) ?? "",
          personScope,
        ),
      )
      .sort((left, right) => left.start.localeCompare(right.start));
  }

  async upsertAppointment(input: {
    personId: string;
    title: string;
    start: string;
    end: string;
    notes: string;
    externalEventId?: string | null;
    doctorId?: string | null;
    careAreaId?: string | null;
  }) {
    const personTaggedNotes =
      `${input.notes}\n[person:${input.personId}]`.trim();
    const event = await this.macosBridge.upsertEvent(
      this.config.macosBridge.calendarId,
      {
        id: input.externalEventId,
        title: input.title,
        start: input.start,
        end: input.end,
        notes: personTaggedNotes,
        personId: input.personId,
      },
    );

    const existing = await this.db
      .select()
      .from(appointmentLinksTable)
      .where(eq(appointmentLinksTable.externalEventId, event.id));

    if (existing.length) {
      await this.db
        .update(appointmentLinksTable)
        .set({
          personId: input.personId,
          doctorId: input.doctorId ?? null,
          careAreaId: input.careAreaId ?? null,
          note: input.notes,
        })
        .where(eq(appointmentLinksTable.externalEventId, event.id));
    } else {
      await this.db.insert(appointmentLinksTable).values({
        id: createId("appt"),
        personId: input.personId,
        externalEventId: event.id,
        doctorId: input.doctorId ?? null,
        careAreaId: input.careAreaId ?? null,
        note: input.notes,
      });
    }

    await this.recordSync("calendar", "upserted", `Appointment ${event.title}`);
    return event;
  }

  async createDoctor(input: CreateDoctorInput) {
    const doctor = {
      id: createId("doctor"),
      ...input,
      macosContactId: input.macosContactId ?? null,
    };
    await this.db.insert(doctorsTable).values(doctor);
    await this.rebuildSearchIndex();
    return doctor;
  }

  async createNote(input: CreateNoteInput) {
    const note = {
      id: createId("note"),
      ...input,
      careAreaId: input.careAreaId ?? null,
      doctorId: input.doctorId ?? null,
    };
    await this.db.insert(notesTable).values(note);
    await this.rebuildSearchIndex();
    return note;
  }

  async createPrescription(input: CreatePrescriptionInput) {
    const record = {
      id: createId("rx"),
      ...input,
      renewalDueOn: input.renewalDueOn ?? null,
    };
    await this.db.insert(prescriptionsTable).values(record);
    await this.rebuildSearchIndex();
    return record;
  }

  async createBill(input: CreateBillInput) {
    const record = {
      id: createId("bill"),
      ...input,
      careAreaId: input.careAreaId ?? null,
      doctorId: input.doctorId ?? null,
    };
    await this.db.insert(billsTable).values(record);
    await this.rebuildSearchIndex();
    return record;
  }

  async createReimbursement(input: CreateReimbursementInput) {
    const record = {
      id: createId("claim"),
      ...input,
      reimbursedOn: input.reimbursedOn ?? null,
    };
    await this.db.insert(reimbursementsTable).values(record);
    await this.rebuildSearchIndex();
    return record;
  }

  async generateDraft(input: GenerateDraftInput) {
    const [person] = await this.db
      .select()
      .from(peopleTable)
      .where(eq(peopleTable.id, input.personId));
    const [doctor] = input.doctorId
      ? await this.db
          .select()
          .from(doctorsTable)
          .where(eq(doctorsTable.id, input.doctorId))
      : [null];
    const [careArea] = input.careAreaId
      ? await this.db
          .select()
          .from(careAreasTable)
          .where(eq(careAreasTable.id, input.careAreaId))
      : [null];

    const generated = await this.draftService.generate({
      locale: input.locale,
      personLabel: person?.label ?? input.personId,
      intent: input.intent,
      doctorName: doctor?.name,
      careAreaName: careArea?.name,
      keyFacts: input.keyFacts,
    });

    const draft = {
      id: createId("draft"),
      personId: input.personId,
      careAreaId: input.careAreaId ?? null,
      doctorId: input.doctorId ?? null,
      intent: input.intent,
      subject: generated.subject,
      body: generated.body,
      locale: input.locale,
      aiGenerated: generated.aiGenerated,
      createdAt: new Date().toISOString(),
    };

    await this.db.insert(draftsTable).values(draft);
    await this.rebuildSearchIndex();
    return draft;
  }

  async globalSearch(
    query: string,
    personScope: PersonScope,
  ): Promise<SearchHit[]> {
    const [ftsHits, contacts, paperless, appointments] = await Promise.all([
      Promise.resolve(querySearchIndex(this.sqlite, query, personScope)),
      this.macosBridge.searchContacts(query),
      this.paperless.search(query),
      this.listAppointments(personScope),
    ]);

    const appointmentHits = appointments
      .filter((event) =>
        `${event.title} ${event.notes}`
          .toLowerCase()
          .includes(query.toLowerCase()),
      )
      .map<SearchHit>((event) => ({
        kind: "calendar",
        recordType: "appointment",
        id: event.id,
        personId: event.personId ?? extractPersonId(event.notes),
        title: event.title,
        excerpt: event.notes.slice(0, 140),
      }));

    const contactHits = contacts.map<SearchHit>((contact) => ({
      kind: "contact",
      recordType: "contact",
      id: contact.id,
      title: contact.name,
      excerpt: `${contact.email ?? ""} ${contact.phone ?? ""}`.trim(),
    }));

    const paperlessHits = paperless.map<SearchHit>((document) => ({
      kind: "paperless",
      recordType: "paperless_document",
      id: document.id,
      title: document.title,
      excerpt: document.content.slice(0, 140),
    }));

    return [
      ...ftsHits,
      ...contactHits,
      ...paperlessHits,
      ...appointmentHits,
    ].slice(0, 30);
  }

  async rebuildSearchIndex() {
    const [
      areas,
      doctors,
      notes,
      prescriptions,
      bills,
      reimbursements,
      drafts,
      documents,
    ] = await Promise.all([
      this.db.select().from(careAreasTable),
      this.db.select().from(doctorsTable),
      this.db.select().from(notesTable),
      this.db.select().from(prescriptionsTable),
      this.db.select().from(billsTable),
      this.db.select().from(reimbursementsTable),
      this.db.select().from(draftsTable),
      this.db.select().from(documentsTable),
    ]);

    await rebuildSearchIndex(this.sqlite, [
      ...areas.map((area) => ({
        record_type: "care_area",
        record_id: area.id,
        person_id: area.personId,
        title: area.name,
        body: `${area.description} ${area.notes}`,
      })),
      ...doctors.map((doctor) => ({
        record_type: "doctor",
        record_id: doctor.id,
        person_id: doctor.personId,
        title: doctor.name,
        body: `${doctor.specialty} ${doctor.practiceName} ${doctor.notes}`,
      })),
      ...notes.map((note) => ({
        record_type: "note",
        record_id: note.id,
        person_id: note.personId,
        title: note.title,
        body: `${note.body} ${note.nextStep}`,
      })),
      ...prescriptions.map((prescription) => ({
        record_type: "prescription",
        record_id: prescription.id,
        person_id: prescription.personId,
        title: prescription.medicationName,
        body: `${prescription.dosage} ${prescription.frequency} ${prescription.notes}`,
      })),
      ...bills.map((bill) => ({
        record_type: "bill",
        record_id: bill.id,
        person_id: bill.personId,
        title: bill.label,
        body: `${bill.notes} ${bill.amountCents / 100}`,
      })),
      ...reimbursements.map((claim) => ({
        record_type: "reimbursement",
        record_id: claim.id,
        person_id: claim.personId,
        title: claim.payerName,
        body: `${claim.notes} ${claim.status} ${claim.amountCents / 100}`,
      })),
      ...drafts.map((draft) => ({
        record_type: "draft",
        record_id: draft.id,
        person_id: draft.personId,
        title: draft.subject,
        body: `${draft.intent} ${draft.body}`,
      })),
      ...documents.map((document) => ({
        record_type: "document",
        record_id: document.id,
        person_id: document.personId,
        title: document.semanticName,
        body: `${document.documentType} ${document.extractedText}`,
      })),
    ]);
  }

  private async recordSync(source: string, status: string, details: string) {
    await this.db.insert(syncRunsTable).values({
      id: createId("sync"),
      source,
      status,
      details,
      ranAt: new Date().toISOString(),
    });
  }
}

function extractPersonId(notes: string): string | null {
  const match = notes.match(/\[person:([^\]]+)\]/);
  return match?.[1] ?? null;
}
