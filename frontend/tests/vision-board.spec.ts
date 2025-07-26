import { test, expect } from "@playwright/test";

test.describe("Vision Board Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("http://localhost:3001/vision-board");
  });

  test("Displays vision items and progress overview", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: "Vision Board" })
    ).toBeVisible();
    await expect(
      page.getByText("Visualize your goals and track your progress")
    ).toBeVisible();
    await expect(page.getByText("Total Goals")).toBeVisible();
    await expect(page.getByText("Completed")).toBeVisible();
    await expect(page.getByText("Progress")).toBeVisible();
  });

  test("Can add a new vision item", async ({ page }) => {
    await page.getByRole("button", { name: /add vision item/i }).click();
    await page.getByLabel("Title").fill("Test Goal");
    await page.getByLabel("Description").fill("Test Description");
    await page.getByLabel("Category").click();
    await page.getByRole("option", { name: "Career" }).click();
    await page.getByLabel("Target Date").fill("2025-12-31");
    await page.getByLabel("Priority").click();
    await page.getByRole("option", { name: "High" }).click();
    await page.getByRole("button", { name: /add item/i }).click();
    await expect(page.getByText("Test Goal")).toBeVisible();
  });

  test("Can filter by category", async ({ page }) => {
    await page.getByLabel("Category").click();
    await page.getByRole("option", { name: "Travel" }).click();
    await expect(page.getByText("Visit Japan")).toBeVisible();
  });

  test("Can mark item as complete/incomplete", async ({ page }) => {
    await page.getByText("Run a Marathon").click();
    await page.getByRole("button", { name: /mark as complete/i }).click();
    await expect(
      page.getByRole("button", { name: /mark as incomplete/i })
    ).toBeVisible();
  });

  test("Shows empty state when no items match filter", async ({ page }) => {
    // Simulate filter that yields no results
    await page.getByLabel("Category").click();
    await page.getByRole("option", { name: "Other" }).click();
    await expect(page.getByText("No vision items found")).toBeVisible();
  });
});
