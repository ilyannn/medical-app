import { createTestRuntime } from "@/test/helpers";
import { describe, expect, it } from "vitest";

describe("HouseholdService", () => {
  it("returns shared overview and person-specific filtering", async () => {
    const { runtime, cleanup } = await createTestRuntime("overview");

    const all = await runtime.householdService.getOverview("all");
    const me = await runtime.householdService.getOverview("me");

    expect(all.stats.documentCount).toBeGreaterThan(me.stats.documentCount);
    expect(me.recentNotes.every((note) => note.personId === "me")).toBe(true);

    await cleanup();
  });

  it("imports Paperless documents into managed folders and indexes them", async () => {
    const { runtime, cleanup } = await createTestRuntime("import");

    const imported = await runtime.householdService.importPaperlessDocument({
      personId: "me",
      careAreaId: "area-derm",
      paperlessId: "paperless-insurance-letter",
      semanticName: "insurance reimbursement letter",
      documentDate: "2026-03-30",
      documentType: "insurance_letter",
      extractedText: "insurance reimbursement letter",
      links: [],
    });

    expect(imported.relativePath).toContain(
      "Me/2026/2026-03-30 insurance reimbursement letter.txt",
    );
    const search = await runtime.householdService.globalSearch(
      "reimbursement",
      "me",
    );
    expect(search.some((hit) => hit.recordType === "document")).toBe(true);

    await cleanup();
  });

  it("resolves live doctor contact details from the fake macOS bridge", async () => {
    const { runtime, cleanup } = await createTestRuntime("contacts");

    const doctors = await runtime.householdService.listDoctors("all");
    const dermatologist = doctors.find((doctor) => doctor.id === "doctor-derm");

    expect(dermatologist?.contact?.email).toContain("stern-haut");
    expect(dermatologist?.contact?.phone).toContain("+49");

    await cleanup();
  });

  it("creates appointment events through the bridge and keeps person scoping", async () => {
    const { runtime, cleanup } = await createTestRuntime("appointments");

    await runtime.householdService.upsertAppointment({
      personId: "me",
      title: "Quick reimbursement call",
      start: "2026-05-01T08:00:00.000Z",
      end: "2026-05-01T08:30:00.000Z",
      notes: "Call insurer about the claim.",
      externalEventId: null,
      doctorId: null,
      careAreaId: null,
    });

    const meAppointments =
      await runtime.householdService.listAppointments("me");
    const wifeAppointments =
      await runtime.householdService.listAppointments("wife");

    expect(
      meAppointments.some(
        (event) => event.title === "Quick reimbursement call",
      ),
    ).toBe(true);
    expect(
      wifeAppointments.some(
        (event) => event.title === "Quick reimbursement call",
      ),
    ).toBe(false);

    await cleanup();
  });
});
