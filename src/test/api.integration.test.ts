import { createTestRuntime } from "@/test/helpers";
import { describe, expect, it } from "vitest";

describe("API integration", () => {
  it("serves the overview endpoint", async () => {
    const { app, cleanup } = await createTestRuntime("api-overview");

    const response = await app.request("/api/overview?personScope=all");
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.stats.activePrescriptions).toBeGreaterThan(0);

    await cleanup();
  });

  it("creates a bill through HTTP and includes it in filtered reads", async () => {
    const { app, cleanup } = await createTestRuntime("api-bill");

    const createResponse = await app.request("/api/bills", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        personId: "me",
        careAreaId: "area-derm",
        doctorId: "doctor-derm",
        label: "Test bill",
        amountCents: 9900,
        currency: "EUR",
        incurredOn: "2026-04-10",
        status: "new",
        notes: "Created in integration test",
      }),
    });

    expect(createResponse.status).toBe(201);

    const listResponse = await app.request("/api/bills?personScope=me");
    const bills = await listResponse.json();
    expect(
      bills.some((bill: { label: string }) => bill.label === "Test bill"),
    ).toBe(true);

    await cleanup();
  });

  it("renames a managed document via HTTP without touching unmanaged folders", async () => {
    const { app, runtime, cleanup } = await createTestRuntime("api-docs");

    const docs = (await runtime.householdService.listDocuments(
      "wife",
    )) as Array<{ id: string }>;
    const target = docs[0];

    const response = await app.request(`/api/documents/${target.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        semanticName: "renamed invoice",
        documentDate: "2026-03-28",
      }),
    });

    const renamed = await response.json();
    expect(response.status).toBe(200);
    expect(renamed.relativePath).toContain("renamed invoice");

    await cleanup();
  });
});
