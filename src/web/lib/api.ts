import type {
  Bill,
  CalendarEvent,
  CareAreaSummary,
  CreateAppointmentInput,
  CreateBillInput,
  CreateDoctorInput,
  CreateNoteInput,
  CreatePrescriptionInput,
  CreateReimbursementInput,
  DoctorWithContact,
  DocumentRecord,
  GenerateDraftInput,
  ImportPaperlessInput,
  MessageDraft,
  OverviewSnapshot,
  Prescription,
  ReimbursementClaim,
  RenameDocumentInput,
  SearchHit,
} from "@/shared/types";

async function fetchJson<T>(
  input: RequestInfo,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(input, {
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    ...init,
  });
  if (!response.ok) {
    throw new Error(`Request failed with ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export const api = {
  getOverview: (personScope: string) =>
    fetchJson<OverviewSnapshot>(`/api/overview?personScope=${personScope}`),
  getAreas: (personScope: string) =>
    fetchJson<CareAreaSummary[]>(`/api/areas?personScope=${personScope}`),
  getDoctors: (personScope: string) =>
    fetchJson<DoctorWithContact[]>(`/api/doctors?personScope=${personScope}`),
  createDoctor: (body: CreateDoctorInput) =>
    fetchJson("/api/doctors", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  getNotes: (personScope: string) =>
    fetchJson(`/api/notes?personScope=${personScope}`),
  createNote: (body: CreateNoteInput) =>
    fetchJson("/api/notes", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  getPrescriptions: (personScope: string) =>
    fetchJson<Prescription[]>(`/api/prescriptions?personScope=${personScope}`),
  createPrescription: (body: CreatePrescriptionInput) =>
    fetchJson("/api/prescriptions", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  getBills: (personScope: string) =>
    fetchJson<Bill[]>(`/api/bills?personScope=${personScope}`),
  createBill: (body: CreateBillInput) =>
    fetchJson("/api/bills", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  getReimbursements: (personScope: string) =>
    fetchJson<ReimbursementClaim[]>(
      `/api/reimbursements?personScope=${personScope}`,
    ),
  createReimbursement: (body: CreateReimbursementInput) =>
    fetchJson("/api/reimbursements", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  getDocuments: (personScope: string, filters = "") =>
    fetchJson<DocumentRecord[]>(
      `/api/documents?personScope=${personScope}${filters}`,
    ),
  searchPaperless: (query: string) =>
    fetchJson(`/api/documents/paperless?query=${encodeURIComponent(query)}`),
  importPaperless: (body: ImportPaperlessInput) =>
    fetchJson("/api/documents/import-paperless", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  renameDocument: (id: string, body: RenameDocumentInput) =>
    fetchJson(`/api/documents/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  getDrafts: (personScope: string) =>
    fetchJson<MessageDraft[]>(`/api/drafts?personScope=${personScope}`),
  generateDraft: (body: GenerateDraftInput) =>
    fetchJson("/api/drafts/generate", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  getAppointments: (personScope: string) =>
    fetchJson<CalendarEvent[]>(`/api/appointments?personScope=${personScope}`),
  createAppointment: (body: CreateAppointmentInput) =>
    fetchJson("/api/appointments", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  search: (query: string, personScope: string) =>
    fetchJson<SearchHit[]>(
      `/api/search?query=${encodeURIComponent(query)}&personScope=${personScope}`,
    ),
};
