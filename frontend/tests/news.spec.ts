import { test, expect } from "@playwright/test";

test.describe("News Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("http://localhost:3000/news");
  });

  test("Displays news grid and cards", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /news/i })).toBeVisible();
    await expect(page.getByTestId("news-grid")).toBeVisible();
    const cardCount = await page.getByTestId("news-card").count();
    expect(cardCount).toBeGreaterThan(0);
  });

  test("Can search/filter news", async ({ page }) => {
    await page.getByRole("searchbox").fill("AI");
    await expect(page.getByTestId("news-card")).toContainText(/AI/i);
  });

  test("Can open news article", async ({ page }) => {
    const firstCard = page.getByTestId("news-card").first();
    await firstCard.click();
    await expect(page).toHaveURL(/article/);
    await expect(page.getByRole("heading")).toBeVisible();
  });
});
