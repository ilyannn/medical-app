import * as z from "zod";

export const personScopeSchema = z.union([z.literal("all"), z.string().min(1)]);

export type PersonScope = z.infer<typeof personScopeSchema>;

export interface Person {
  id: string;
  label: string;
  displayName: string;
  accent: string;
  folderName: string;
}

export interface CareArea {
  id: string;
  personId: string;
  name: string;
  description: string;
  priority: "routine" | "attention" | "watch";
  notes: string;
}

export interface Doctor {
  id: string;
  personId: string;
  careAreaId: string;
  name: string;
  specialty: string;
  practiceName: string;
  preferredChannel: string;
  notes: string;
  macosContactId?: string | null;
}

export interface DoctorWithContact extends Doctor {
  careAreaName: string;
  contact?: ContactProfile | null;
}

export interface EncounterNote {
  id: string;
  personId: string;
  careAreaId?: string | null;
  doctorId?: string | null;
  title: string;
  body: string;
  visitDate: string;
  nextStep: string;
}

export interface Prescription {
  id: string;
  personId: string;
  careAreaId: string;
  doctorId: string;
  medicationName: string;
  dosage: string;
  frequency: string;
  issuedOn: string;
  renewalDueOn?: string | null;
  status: "active" | "watch" | "renewal_due" | "completed";
  notes: string;
}

export interface Bill {
  id: string;
  personId: string;
  careAreaId?: string | null;
  doctorId?: string | null;
  label: string;
  amountCents: number;
  currency: string;
  incurredOn: string;
  status: "new" | "submitted" | "partially_reimbursed" | "reimbursed";
  notes: string;
}

export interface ReimbursementClaim {
  id: string;
  personId: string;
  billId: string;
  payerName: string;
  submittedOn: string;
  reimbursedOn?: string | null;
  amountCents: number;
  reimbursedCents: number;
  status:
    | "new"
    | "submitted"
    | "partially_reimbursed"
    | "reimbursed"
    | "rejected";
  notes: string;
}

export interface MessageDraft {
  id: string;
  personId: string;
  careAreaId?: string | null;
  doctorId?: string | null;
  intent: string;
  subject: string;
  body: string;
  locale: "de" | "en" | "ru";
  aiGenerated: boolean;
  createdAt: string;
}

export interface DocumentRecord {
  id: string;
  personId: string;
  careAreaId?: string | null;
  relativePath: string;
  semanticName: string;
  documentDate: string;
  documentType: string;
  sourceKind: "paperless" | "upload" | "manual";
  sourceRef?: string | null;
  extractedText: string;
  importedAt: string;
}

export interface DocumentLink {
  id: string;
  documentId: string;
  entityType: "bill" | "prescription" | "note";
  entityId: string;
}

export interface ContactProfile {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  notes: string;
  personId?: string | null;
}

export interface AppointmentLink {
  id: string;
  personId: string;
  externalEventId: string;
  doctorId?: string | null;
  careAreaId?: string | null;
  note: string;
}

export interface SearchHit {
  kind: "app" | "contact" | "paperless" | "calendar";
  recordType: string;
  id: string;
  personId?: string | null;
  title: string;
  excerpt: string;
}

export interface OverviewSnapshot {
  filters: {
    people: Person[];
    personScope: PersonScope;
  };
  stats: {
    activePrescriptions: number;
    pendingBills: number;
    pendingReimbursements: number;
    draftCount: number;
    documentCount: number;
    upcomingAppointments: number;
  };
  recentNotes: EncounterNote[];
  recentDrafts: MessageDraft[];
  upcomingAppointments: CalendarEvent[];
}

export interface CareAreaSummary extends CareArea {
  doctorCount: number;
  documentCount: number;
  prescriptionCount: number;
}

export const createDoctorSchema = z.object({
  personId: z.string().min(1),
  careAreaId: z.string().min(1),
  name: z.string().min(2),
  specialty: z.string().min(2),
  practiceName: z.string().min(2),
  preferredChannel: z.string().min(2),
  notes: z.string().default(""),
  macosContactId: z.string().optional().nullable(),
});

export const createNoteSchema = z.object({
  personId: z.string().min(1),
  careAreaId: z.string().optional().nullable(),
  doctorId: z.string().optional().nullable(),
  title: z.string().min(2),
  body: z.string().min(2),
  visitDate: z.string().min(10),
  nextStep: z.string().default(""),
});

export const createPrescriptionSchema = z.object({
  personId: z.string().min(1),
  careAreaId: z.string().min(1),
  doctorId: z.string().min(1),
  medicationName: z.string().min(2),
  dosage: z.string().min(1),
  frequency: z.string().min(1),
  issuedOn: z.string().min(10),
  renewalDueOn: z.string().optional().nullable(),
  status: z.enum(["active", "watch", "renewal_due", "completed"]),
  notes: z.string().default(""),
});

export const createBillSchema = z.object({
  personId: z.string().min(1),
  careAreaId: z.string().optional().nullable(),
  doctorId: z.string().optional().nullable(),
  label: z.string().min(2),
  amountCents: z.number().int().positive(),
  currency: z.string().length(3).default("EUR"),
  incurredOn: z.string().min(10),
  status: z.enum(["new", "submitted", "partially_reimbursed", "reimbursed"]),
  notes: z.string().default(""),
});

export const createReimbursementSchema = z.object({
  personId: z.string().min(1),
  billId: z.string().min(1),
  payerName: z.string().min(2),
  submittedOn: z.string().min(10),
  reimbursedOn: z.string().optional().nullable(),
  amountCents: z.number().int().nonnegative(),
  reimbursedCents: z.number().int().nonnegative(),
  status: z.enum([
    "new",
    "submitted",
    "partially_reimbursed",
    "reimbursed",
    "rejected",
  ]),
  notes: z.string().default(""),
});

export const generateDraftSchema = z.object({
  personId: z.string().min(1),
  careAreaId: z.string().optional().nullable(),
  doctorId: z.string().optional().nullable(),
  intent: z.string().min(2),
  locale: z.enum(["de", "en", "ru"]),
  keyFacts: z.array(z.string()).default([]),
});

export const importPaperlessSchema = z.object({
  personId: z.string().min(1),
  careAreaId: z.string().optional().nullable(),
  paperlessId: z.string().min(1),
  semanticName: z.string().min(2),
  documentDate: z.string().min(10),
  documentType: z.string().min(2),
  extractedText: z.string().default(""),
  links: z
    .array(
      z.object({
        entityType: z.enum(["bill", "prescription", "note"]),
        entityId: z.string().min(1),
      }),
    )
    .default([]),
});

export const renameDocumentSchema = z.object({
  semanticName: z.string().min(2),
  documentDate: z.string().min(10),
});

export const createAppointmentSchema = z.object({
  personId: z.string().min(1),
  title: z.string().min(2),
  start: z.string().min(10),
  end: z.string().min(10),
  notes: z.string().default(""),
  externalEventId: z.string().optional().nullable(),
  doctorId: z.string().optional().nullable(),
  careAreaId: z.string().optional().nullable(),
});

export const searchSchema = z.object({
  query: z.string().min(1),
  personScope: personScopeSchema.default("all"),
});

export type CreateDoctorInput = z.infer<typeof createDoctorSchema>;
export type CreateNoteInput = z.infer<typeof createNoteSchema>;
export type CreatePrescriptionInput = z.infer<typeof createPrescriptionSchema>;
export type CreateBillInput = z.infer<typeof createBillSchema>;
export type CreateReimbursementInput = z.infer<
  typeof createReimbursementSchema
>;
export type GenerateDraftInput = z.infer<typeof generateDraftSchema>;
export type ImportPaperlessInput = z.infer<typeof importPaperlessSchema>;
export type RenameDocumentInput = z.infer<typeof renameDocumentSchema>;
export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>;
