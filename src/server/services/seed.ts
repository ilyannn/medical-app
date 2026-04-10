import type { ICloudDocumentStore } from "@/server/adapters/document-store";
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
} from "@/server/db/schema";
import {
  demoAppointmentLinks,
  demoAreas,
  demoBills,
  demoDoctors,
  demoDocumentLinks,
  demoDocuments,
  demoDrafts,
  demoNotes,
  demoPeople,
  demoPrescriptions,
  demoReimbursements,
} from "@/test/fixtures/demo-data";
interface SeedDependencies {
  db: AppDb;
  documentStore: ICloudDocumentStore;
  config: AppConfig;
}

export async function seedDemoData({ db, documentStore }: SeedDependencies) {
  await documentStore.ensureManagedFolders();
  await db
    .insert(peopleTable)
    .values(
      demoPeople.map((person) => ({
        ...person,
        folderName: person.folderName,
      })),
    )
    .onConflictDoNothing();
  await db.insert(careAreasTable).values(demoAreas).onConflictDoNothing();
  await db.insert(doctorsTable).values(demoDoctors).onConflictDoNothing();
  await db.insert(notesTable).values(demoNotes).onConflictDoNothing();
  await db
    .insert(prescriptionsTable)
    .values(demoPrescriptions)
    .onConflictDoNothing();
  await db.insert(billsTable).values(demoBills).onConflictDoNothing();
  await db
    .insert(reimbursementsTable)
    .values(demoReimbursements)
    .onConflictDoNothing();
  await db
    .insert(draftsTable)
    .values(
      demoDrafts.map((draft) => ({
        ...draft,
        aiGenerated: draft.aiGenerated,
      })),
    )
    .onConflictDoNothing();
  await db.insert(documentsTable).values(demoDocuments).onConflictDoNothing();
  await db
    .insert(documentLinksTable)
    .values(demoDocumentLinks)
    .onConflictDoNothing();
  await db
    .insert(appointmentLinksTable)
    .values(demoAppointmentLinks)
    .onConflictDoNothing();

  await Promise.all(
    demoDocuments.map((document) =>
      documentStore.writeManagedDocument(
        document.relativePath,
        `${document.semanticName}\n\n${document.extractedText}\n`,
      ),
    ),
  );
}
