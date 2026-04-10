import { expect, test } from "@playwright/test";

test("documents and drafts workflows operate on seeded household data", async ({
  page,
}) => {
  await page.goto("/documents");
  await expect(page.getByText("Paperless import")).toBeVisible();
  const paperlessSection = page.getByTestId("paperless-import-section");
  const managedDocumentsSection = page.getByTestId("documents-managed-section");

  await page
    .getByPlaceholder("Search Paperless import source")
    .fill("insurance");
  await expect(
    page.getByTestId("paperless-document-paperless-insurance-letter"),
  ).toContainText("Insurance reimbursement letter");
  await page.getByTestId("import-paperless-paperless-insurance-letter").click();
  await expect(
    managedDocumentsSection.getByTestId(/managed-document-/).first(),
  ).toContainText("Insurance reimbursement letter");

  await page.goto("/drafts");
  const recentDraftsSection = page.getByTestId("recent-drafts-section");
  await page.getByRole("button", { name: "Generate draft" }).click();
  await expect(
    recentDraftsSection.getByTestId(/draft-card-/).first(),
  ).toContainText("Follow-up question - medical follow-up");
});
