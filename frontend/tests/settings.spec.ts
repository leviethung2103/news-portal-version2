import { test, expect } from "@playwright/test";

test.describe("Settings Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("http://localhost:3001/settings");
  });

  test("Displays settings form", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: /settings/i })
    ).toBeVisible();
    await expect(page.getByLabel(/email|username|password/i)).toBeVisible();
  });

  test("Can update settings", async ({ page }) => {
    await page.getByLabel(/email/i).fill("newemail@example.com");
    await page.getByRole("button", { name: /save|update/i }).click();
    await expect(page.getByText(/success|updated/i)).toBeVisible();
  });
});
