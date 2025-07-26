import { test, expect } from "@playwright/test";

test.describe("Article Page", () => {
  test("Displays article content", async ({ page }) => {
    await page.goto("http://localhost:3001/article/1"); // Example article id
    await expect(page.getByRole("heading")).toBeVisible();
    await expect(page.getByText(/published|author|date/i)).toBeVisible();
  });

  test("Handles non-existent article gracefully", async ({ page }) => {
    await page.goto("http://localhost:3001/article/does-not-exist");
    await expect(page.getByText(/not found|error/i)).toBeVisible();
  });
});
