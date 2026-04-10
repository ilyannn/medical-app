import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const peopleTable = sqliteTable("people", {
  id: text("id").primaryKey(),
  label: text("label").notNull(),
  displayName: text("display_name").notNull(),
  accent: text("accent").notNull(),
  folderName: text("folder_name").notNull(),
});

export const careAreasTable = sqliteTable("care_areas", {
  id: text("id").primaryKey(),
  personId: text("person_id")
    .notNull()
    .references(() => peopleTable.id),
  name: text("name").notNull(),
  description: text("description").notNull(),
  priority: text("priority").notNull(),
  notes: text("notes").notNull(),
});

export const doctorsTable = sqliteTable("doctors", {
  id: text("id").primaryKey(),
  personId: text("person_id")
    .notNull()
    .references(() => peopleTable.id),
  careAreaId: text("care_area_id")
    .notNull()
    .references(() => careAreasTable.id),
  name: text("name").notNull(),
  specialty: text("specialty").notNull(),
  practiceName: text("practice_name").notNull(),
  macosContactId: text("macos_contact_id"),
  preferredChannel: text("preferred_channel").notNull(),
  notes: text("notes").notNull(),
});

export const notesTable = sqliteTable("notes", {
  id: text("id").primaryKey(),
  personId: text("person_id")
    .notNull()
    .references(() => peopleTable.id),
  careAreaId: text("care_area_id").references(() => careAreasTable.id),
  doctorId: text("doctor_id").references(() => doctorsTable.id),
  title: text("title").notNull(),
  body: text("body").notNull(),
  visitDate: text("visit_date").notNull(),
  nextStep: text("next_step").notNull(),
});

export const prescriptionsTable = sqliteTable("prescriptions", {
  id: text("id").primaryKey(),
  personId: text("person_id")
    .notNull()
    .references(() => peopleTable.id),
  careAreaId: text("care_area_id")
    .notNull()
    .references(() => careAreasTable.id),
  doctorId: text("doctor_id")
    .notNull()
    .references(() => doctorsTable.id),
  medicationName: text("medication_name").notNull(),
  dosage: text("dosage").notNull(),
  frequency: text("frequency").notNull(),
  issuedOn: text("issued_on").notNull(),
  renewalDueOn: text("renewal_due_on"),
  status: text("status").notNull(),
  notes: text("notes").notNull(),
});

export const billsTable = sqliteTable("bills", {
  id: text("id").primaryKey(),
  personId: text("person_id")
    .notNull()
    .references(() => peopleTable.id),
  careAreaId: text("care_area_id").references(() => careAreasTable.id),
  doctorId: text("doctor_id").references(() => doctorsTable.id),
  label: text("label").notNull(),
  amountCents: integer("amount_cents").notNull(),
  currency: text("currency").notNull(),
  incurredOn: text("incurred_on").notNull(),
  status: text("status").notNull(),
  notes: text("notes").notNull(),
});

export const reimbursementsTable = sqliteTable("reimbursements", {
  id: text("id").primaryKey(),
  personId: text("person_id")
    .notNull()
    .references(() => peopleTable.id),
  billId: text("bill_id")
    .notNull()
    .references(() => billsTable.id),
  payerName: text("payer_name").notNull(),
  submittedOn: text("submitted_on").notNull(),
  reimbursedOn: text("reimbursed_on"),
  amountCents: integer("amount_cents").notNull(),
  reimbursedCents: integer("reimbursed_cents").notNull(),
  status: text("status").notNull(),
  notes: text("notes").notNull(),
});

export const draftsTable = sqliteTable("drafts", {
  id: text("id").primaryKey(),
  personId: text("person_id")
    .notNull()
    .references(() => peopleTable.id),
  careAreaId: text("care_area_id").references(() => careAreasTable.id),
  doctorId: text("doctor_id").references(() => doctorsTable.id),
  intent: text("intent").notNull(),
  subject: text("subject").notNull(),
  body: text("body").notNull(),
  locale: text("locale").notNull(),
  aiGenerated: integer("ai_generated", { mode: "boolean" }).notNull(),
  createdAt: text("created_at").notNull(),
});

export const documentsTable = sqliteTable("documents", {
  id: text("id").primaryKey(),
  personId: text("person_id")
    .notNull()
    .references(() => peopleTable.id),
  careAreaId: text("care_area_id").references(() => careAreasTable.id),
  relativePath: text("relative_path").notNull(),
  semanticName: text("semantic_name").notNull(),
  documentDate: text("document_date").notNull(),
  documentType: text("document_type").notNull(),
  sourceKind: text("source_kind").notNull(),
  sourceRef: text("source_ref"),
  extractedText: text("extracted_text").notNull(),
  importedAt: text("imported_at").notNull(),
});

export const documentLinksTable = sqliteTable("document_links", {
  id: text("id").primaryKey(),
  documentId: text("document_id")
    .notNull()
    .references(() => documentsTable.id),
  entityType: text("entity_type").notNull(),
  entityId: text("entity_id").notNull(),
});

export const appointmentLinksTable = sqliteTable("appointment_links", {
  id: text("id").primaryKey(),
  personId: text("person_id")
    .notNull()
    .references(() => peopleTable.id),
  externalEventId: text("external_event_id").notNull(),
  doctorId: text("doctor_id").references(() => doctorsTable.id),
  careAreaId: text("care_area_id").references(() => careAreasTable.id),
  note: text("note").notNull(),
});

export const appSettingsTable = sqliteTable("app_settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});

export const syncRunsTable = sqliteTable("sync_runs", {
  id: text("id").primaryKey(),
  source: text("source").notNull(),
  status: text("status").notNull(),
  details: text("details").notNull(),
  ranAt: text("ran_at").notNull(),
});
