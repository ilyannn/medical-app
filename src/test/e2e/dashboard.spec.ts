import { expect, test } from "@playwright/test";

test("shared dashboard loads with seeded content", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("Shared command center")).toBeVisible();
  await expect(page.getByText("March flare follow-up")).toBeVisible();
  await expect(page.getByText("Dermatology review")).toBeVisible();
});
