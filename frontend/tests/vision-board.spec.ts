import { test, expect } from "@playwright/test";

test.describe("Vision Board Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("http://localhost:3000/vision-board");
  });

  test("Displays page header, actions, and progress overview", async ({
    page,
  }) => {
    await expect(
      page.getByRole("heading", { name: "Vision Board" })
    ).toBeVisible();
    await expect(
      page.getByText("Visualize your goals and track your progress")
    ).toBeVisible();
    await expect(page.getByRole("button", { name: /share/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /export/i })).toBeVisible();
    await expect(page.getByText("Total Goals")).toBeVisible();
    await expect(page.getByText("Completed")).toBeVisible();
    await expect(page.getByText("Progress")).toBeVisible();
    // Progress bar and percentage
    await expect(page.getByText(/%/)).toBeVisible();
  });

  test("Can add a new vision item with image URL", async ({ page }) => {
    await test.step("Open add dialog and fill form", async () => {
      await page.getByRole("button", { name: /add vision item/i }).click();
      await page.getByLabel("Title").fill("Test Goal");
      await page.getByLabel("Description").fill("Test Description");
      await page.getByLabel("Category").click();
      await page.getByRole("option", { name: "Career" }).click();
      await page.getByLabel("Target Date").fill("2025-12-31");
      await page.getByLabel("Priority").click();
      await page.getByRole("option", { name: "High" }).click();
      await page.getByLabel("Image").fill("/test-image.png");
    });
    await test.step("Submit and verify new item", async () => {
      await page.getByRole("button", { name: /add item/i }).click();
      await expect(page.getByText("Test Goal")).toBeVisible();
      await expect(page.getByText("Career")).toBeVisible();
      await expect(page.getByText(/high/i)).toBeVisible();
    });
  });

  test("Can filter vision items by category and show/hide completed", async ({
    page,
  }) => {
    await test.step("Filter by category", async () => {
      await page.getByText("All Categories").click();
      await page.getByRole("option", { name: "Travel" }).click();
      await expect(page.getByText("Visit Japan")).toBeVisible();
    });
    await test.step("Toggle show/hide completed", async () => {
      const toggle = page.getByRole("button", {
        name: /hide completed|show completed/i,
      });
      await toggle.click();
      // Should hide completed items (if any)
      // Optionally check for absence of a completed item
    });
  });

  test("Can mark vision item as complete and incomplete", async ({ page }) => {
    await page.getByText("Run a Marathon").click();
    await page.getByRole("button", { name: /mark as complete/i }).click();
    await expect(
      page.getByRole("button", { name: /mark as incomplete/i })
    ).toBeVisible();
    // Optionally toggle back
    await page.getByRole("button", { name: /mark as incomplete/i }).click();
    await expect(
      page.getByRole("button", { name: /mark as complete/i })
    ).toBeVisible();
  });

  test("Can edit and delete a vision item", async ({ page }) => {
    // Find the item to edit (assume "Test Goal" exists from previous test)
    await test.step("Edit item", async () => {
      await page
        .getByText("Test Goal")
        .locator("..")
        .getByRole("button", { name: /edit/i })
        .click();
      await page.getByLabel("Title").fill("Updated Goal");
      await page.getByRole("button", { name: /update item/i }).click();
      await expect(page.getByText("Updated Goal")).toBeVisible();
    });
    await test.step("Delete item", async () => {
      await page
        .getByText("Updated Goal")
        .locator("..")
        .getByRole("button", { name: /delete/i })
        .click();
      // Confirm deletion by checking item is gone
      await expect(page.getByText("Updated Goal")).not.toBeVisible();
    });
  });

  test("Displays badges and item details", async ({ page }) => {
    // Add a new item to check badges
    await page.getByRole("button", { name: /add vision item/i }).click();
    await page.getByLabel("Title").fill("Badge Test");
    await page.getByLabel("Category").click();
    await page.getByRole("option", { name: "Finance" }).click();
    await page.getByLabel("Priority").click();
    await page.getByRole("option", { name: "Low" }).click();
    await page.getByRole("button", { name: /add item/i }).click();
    await expect(page.getByText("Finance")).toBeVisible();
    await expect(page.getByText(/low/i)).toBeVisible();
  });

  test("Displays empty state and add first vision item button", async ({
    page,
  }) => {
    // Filter to a category with no items
    await page.getByText("All Categories").click();
    await page.getByRole("option", { name: "Other" }).click();
    await expect(page.getByText("No vision items found")).toBeVisible();
    await expect(
      page.getByRole("button", { name: /add your first vision item/i })
    ).toBeVisible();
  });

  test("Add dialog and edit dialog open and close correctly", async ({
    page,
  }) => {
    // Add dialog
    await page.getByRole("button", { name: /add vision item/i }).click();
    await expect(
      page.getByRole("dialog", { name: /add new vision item/i })
    ).toBeVisible();
    await page.getByRole("button", { name: /cancel/i }).click();
    await expect(
      page.getByRole("dialog", { name: /add new vision item/i })
    ).not.toBeVisible();
    // Edit dialog
    await page
      .getByText("Badge Test")
      .locator("..")
      .getByRole("button", { name: /edit/i })
      .click();
    await expect(
      page.getByRole("dialog", { name: /edit vision item/i })
    ).toBeVisible();
    await page.getByRole("button", { name: /cancel/i }).click();
    await expect(
      page.getByRole("dialog", { name: /edit vision item/i })
    ).not.toBeVisible();
  });
});
