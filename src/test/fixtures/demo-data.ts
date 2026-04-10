import type {
  AppointmentLink,
  Bill,
  CalendarEvent,
  CareArea,
  ContactProfile,
  Doctor,
  DocumentLink,
  DocumentRecord,
  EncounterNote,
  MessageDraft,
  Person,
  Prescription,
  ReimbursementClaim,
} from "@/shared/types";

export interface FakePaperlessDocument {
  id: string;
  title: string;
  documentDate: string;
  content: string;
  documentType: string;
}

export const demoPeople: Person[] = [
  {
    id: "me",
    label: "Me",
    displayName: "Me",
    accent: "#0f766e",
    folderName: "Me",
  },
  {
    id: "wife",
    label: "Wife",
    displayName: "Wife",
    accent: "#a21caf",
    folderName: "Wife",
  },
];

export const demoAreas: CareArea[] = [
  {
    id: "area-derm",
    personId: "me",
    name: "Dermatology",
    description:
      "Skin follow-ups, prescription renewals, and recurring observations.",
    priority: "attention",
    notes: "Track photo checkpoints before each visit.",
  },
  {
    id: "area-dental",
    personId: "wife",
    name: "Dental",
    description: "Invoices, treatment plans, and next appointments.",
    priority: "routine",
    notes: "Reimbursement window is usually within 30 days.",
  },
];

export const demoContacts: ContactProfile[] = [
  {
    id: "contact-derm",
    name: "Dr. Anika Stern",
    email: "praxis@stern-haut.example",
    phone: "+49 30 555 0191",
    address: "Karl-Liebknecht-Str. 19, 10178 Berlin",
  },
  {
    id: "contact-dental",
    name: "Dr. Markus Heim",
    email: "team@heim-dental.example",
    phone: "+49 30 555 7721",
    address: "Schonhauser Allee 118, 10437 Berlin",
  },
];

export const demoDoctors: Doctor[] = [
  {
    id: "doctor-derm",
    personId: "me",
    careAreaId: "area-derm",
    name: "Dr. Anika Stern",
    specialty: "Dermatologist",
    practiceName: "Praxis Stern",
    preferredChannel: "Email",
    notes: "Send symptom summary 48h before the review.",
    macosContactId: "contact-derm",
  },
  {
    id: "doctor-dental",
    personId: "wife",
    careAreaId: "area-dental",
    name: "Dr. Markus Heim",
    specialty: "Dentist",
    practiceName: "Heim Dental Studio",
    preferredChannel: "Phone",
    notes: "Prefers invoice IDs in the subject line.",
    macosContactId: "contact-dental",
  },
];

export const demoNotes: EncounterNote[] = [
  {
    id: "note-derm-checkin",
    personId: "me",
    careAreaId: "area-derm",
    doctorId: "doctor-derm",
    title: "March flare follow-up",
    body: "Irritation improved after tapering the topical steroid. Keep moisturizer twice daily and photograph the patch every Monday.",
    visitDate: "2026-03-19",
    nextStep: "Send comparison photos and request a refill in mid-April.",
  },
  {
    id: "note-dental-plan",
    personId: "wife",
    careAreaId: "area-dental",
    doctorId: "doctor-dental",
    title: "Crown treatment plan",
    body: "Approved treatment plan for upper molar. Need reimbursement claim attached with invoice and x-ray summary.",
    visitDate: "2026-03-28",
    nextStep: "Book follow-up in late April and upload the finalized invoice.",
  },
];

export const demoPrescriptions: Prescription[] = [
  {
    id: "rx-derm-001",
    personId: "me",
    careAreaId: "area-derm",
    doctorId: "doctor-derm",
    medicationName: "Tacrolimus Ointment",
    dosage: "0.1%",
    frequency: "Apply nightly for 14 days",
    issuedOn: "2026-03-19",
    renewalDueOn: "2026-04-16",
    status: "renewal_due",
    notes: "Only request refill if flare has not settled.",
  },
  {
    id: "rx-dental-001",
    personId: "wife",
    careAreaId: "area-dental",
    doctorId: "doctor-dental",
    medicationName: "Ibuprofen",
    dosage: "400mg",
    frequency: "After treatment as needed",
    issuedOn: "2026-03-28",
    renewalDueOn: null,
    status: "active",
    notes: "Use sparingly during the first 3 post-op days.",
  },
];

export const demoBills: Bill[] = [
  {
    id: "bill-dental-001",
    personId: "wife",
    careAreaId: "area-dental",
    doctorId: "doctor-dental",
    label: "Crown consultation invoice",
    amountCents: 28900,
    currency: "EUR",
    incurredOn: "2026-03-28",
    status: "submitted",
    notes: "Attached to the insurer claim on the same day.",
  },
  {
    id: "bill-derm-001",
    personId: "me",
    careAreaId: "area-derm",
    doctorId: "doctor-derm",
    label: "Prescription co-pay",
    amountCents: 1200,
    currency: "EUR",
    incurredOn: "2026-03-19",
    status: "new",
    notes: "Check if reimbursement is possible via supplemental coverage.",
  },
];

export const demoReimbursements: ReimbursementClaim[] = [
  {
    id: "claim-dental-001",
    personId: "wife",
    billId: "bill-dental-001",
    payerName: "TK Zusatz",
    submittedOn: "2026-03-28",
    reimbursedOn: null,
    amountCents: 28900,
    reimbursedCents: 0,
    status: "submitted",
    notes: "Waiting on treatment plan confirmation.",
  },
];

export const demoDrafts: MessageDraft[] = [
  {
    id: "draft-derm-renewal",
    personId: "me",
    careAreaId: "area-derm",
    doctorId: "doctor-derm",
    intent: "Prescription renewal",
    subject: "Request for tacrolimus renewal",
    body: "Hello Dr. Stern,\n\nThe flare improved but is not fully gone. Could we please renew the tacrolimus ointment for another short course?\n\nBest,\nMe",
    locale: "en",
    aiGenerated: true,
    createdAt: "2026-04-04T10:15:00.000Z",
  },
];

export const demoDocuments: DocumentRecord[] = [
  {
    id: "doc-dental-invoice",
    personId: "wife",
    careAreaId: "area-dental",
    relativePath: "Wife/2026/2026-03-28 crown consultation invoice.txt",
    semanticName: "crown consultation invoice",
    documentDate: "2026-03-28",
    documentType: "invoice",
    sourceKind: "manual",
    sourceRef: null,
    extractedText: "Invoice for dental crown consultation, total 289 EUR.",
    importedAt: "2026-03-28T09:30:00.000Z",
  },
  {
    id: "doc-derm-summary",
    personId: "me",
    careAreaId: "area-derm",
    relativePath: "Me/2026/2026-03-19 dermatologist visit summary.txt",
    semanticName: "dermatologist visit summary",
    documentDate: "2026-03-19",
    documentType: "visit_summary",
    sourceKind: "paperless",
    sourceRef: "paperless-derm-summary",
    extractedText:
      "Visit summary describing treatment response and next review step.",
    importedAt: "2026-03-20T07:45:00.000Z",
  },
];

export const demoDocumentLinks: DocumentLink[] = [
  {
    id: "link-doc-bill",
    documentId: "doc-dental-invoice",
    entityType: "bill",
    entityId: "bill-dental-001",
  },
];

export const demoAppointments: CalendarEvent[] = [
  {
    id: "event-derm-review",
    title: "Dermatology review",
    start: "2026-04-18T09:00:00.000Z",
    end: "2026-04-18T09:30:00.000Z",
    notes: "Bring symptom photos and refill questions.\n[person:me]",
    personId: "me",
  },
  {
    id: "event-dental-followup",
    title: "Dental crown follow-up",
    start: "2026-04-23T14:00:00.000Z",
    end: "2026-04-23T14:45:00.000Z",
    notes: "Review final treatment plan.\n[person:wife]",
    personId: "wife",
  },
];

export const demoAppointmentLinks: AppointmentLink[] = [
  {
    id: "link-event-dental",
    personId: "wife",
    externalEventId: "event-dental-followup",
    doctorId: "doctor-dental",
    careAreaId: "area-dental",
    note: "Created from the dental follow-up card.",
  },
];

export const demoPaperlessDocuments: FakePaperlessDocument[] = [
  {
    id: "paperless-derm-summary",
    title: "Dermatology visit summary",
    documentDate: "2026-03-19",
    content:
      "Dermatology summary: improvement observed, continue moisturizer twice daily.",
    documentType: "visit_summary",
  },
  {
    id: "paperless-insurance-letter",
    title: "Insurance reimbursement letter",
    documentDate: "2026-03-30",
    content: "Your dental claim has been received and is being processed.",
    documentType: "insurance_letter",
  },
];
