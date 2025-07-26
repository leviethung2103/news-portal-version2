import { test, expect } from "@playwright/test";

test.describe("Dashboard Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("http://localhost:3001/dashboard");
  });

  test("Displays dashboard content", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: /dashboard/i })
    ).toBeVisible();
    await expect(page.getByText(/overview|summary|welcome/i)).toBeVisible();
  });

  test("Shows user-specific data", async ({ page }) => {
    await expect(page.getByTestId("user-info")).toBeVisible();
  });
});
