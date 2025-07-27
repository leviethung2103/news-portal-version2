import { test, expect } from "@playwright/test";

test.describe("Home Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("http://localhost:3000/");
  });

  test("Displays hero section and main navigation", async ({ page }) => {
    await expect(page.getByRole("heading")).toBeVisible();
    await expect(page.getByRole("navigation")).toBeVisible();
  });
});
