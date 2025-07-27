import { test, expect } from "@playwright/test";

// Projects Page Playwright Tests
// Reports will be generated in frontend/tests/reports

test.describe("Projects Page", () => {
  test("Displays Project Management page title", async ({ page }) => {
    await page.goto("http://localhost:3000/projects");
    await expect(
      page.getByRole("heading", { name: "Project Management" })
    ).toBeVisible();
  });

  test("Displays view switch buttons", async ({ page }) => {
    await page.goto("http://localhost:3000/projects");
    await expect(page.getByRole("button", { name: "Overview" })).toBeVisible();
    await expect(page.getByRole("button", { name: /Timeline/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /Calendar/ })).toBeVisible();
  });

  test("Can switch to Timeline and Calendar views", async ({ page }) => {
    await page.goto("http://localhost:3000/projects");
    await page.getByRole("button", { name: /Timeline/ }).click();
    await expect(page.locator("text=Timeline")).toBeVisible(); // TimelineView should render some indicator
    await page.getByRole("button", { name: /Calendar/ }).click();
    await expect(page.locator("text=Calendar")).toBeVisible(); // CalendarView should render some indicator
    await page.getByRole("button", { name: "Overview" }).click();
    await expect(page.getByRole("heading", { name: "Projects" })).toBeVisible();
  });

  test("Can open and close New Project dialog", async ({ page }) => {
    await page.goto("http://localhost:3000/projects");
    const newProjectBtn = page.getByRole("button", { name: /New Project/ });
    await expect(newProjectBtn).toBeVisible();
    await newProjectBtn.click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(
      page.getByRole("heading", { name: /Create New Project/ })
    ).toBeVisible();
    await expect(page.getByLabel("Project Name")).toBeVisible();
    await expect(page.getByLabel("Description")).toBeVisible();
    await expect(page.getByLabel("Status")).toBeVisible();
    await expect(page.getByLabel("Start Date")).toBeVisible();
    await expect(page.getByLabel("End Date")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Create Project" })
    ).toBeVisible();
    await page.getByRole("button", { name: "Cancel" }).click();
    await expect(page.getByRole("dialog")).not.toBeVisible();
  });

  test("Displays all project summary cards", async ({ page }) => {
    await page.goto("http://localhost:3000/projects");
    await expect(page.getByText("Total Projects")).toBeVisible();
    await expect(page.getByText("Active")).toBeVisible();
    await expect(page.getByText("Completed")).toBeVisible();
    await expect(page.getByText("Total Tasks")).toBeVisible();
    await expect(page.getByText("Tasks Done")).toBeVisible();
    await expect(page.getByText("Overdue")).toBeVisible();
  });

  test("Displays projects list and elements", async ({ page }) => {
    await page.goto("http://localhost:3000/projects");
    await expect(page.getByRole("heading", { name: "Projects" })).toBeVisible();
    // If no projects, show empty state
    if (
      await page
        .getByText("No projects yet. Create your first project to get started!")
        .isVisible()
    ) {
      await expect(
        page.getByText(
          "No projects yet. Create your first project to get started!"
        )
      ).toBeVisible();
    } else {
      // Otherwise, check for at least one project button
      const projectButtons = await page.locator("button:has(h3)").all();
      expect(projectButtons.length).toBeGreaterThan(0);
      // Check for key elements in the first project
      const firstProject = projectButtons[0];
      await expect(firstProject.locator("h3")).toBeVisible(); // Project name
      await expect(firstProject.locator(".badge")).toBeVisible(); // Status badge
      await expect(firstProject.locator('span:text("Progress")')).toBeVisible(); // Progress label
      await expect(firstProject.locator(".h-2")).toBeVisible(); // Progress bar
    }
  });

  test("Displays recent tasks section and elements", async ({ page }) => {
    await page.goto("http://localhost:3000/projects");
    await expect(
      page.getByRole("heading", { name: "Recent Tasks" })
    ).toBeVisible();
    // If no recent tasks, show empty state
    if (await page.getByText("No recent tasks").isVisible()) {
      await expect(page.getByText("No recent tasks")).toBeVisible();
    } else {
      // Otherwise, check for at least one recent task card
      const taskCards = await page.locator("div.border.rounded-lg.p-3").all();
      expect(taskCards.length).toBeGreaterThan(0);
      // Check for key elements in the first task
      const firstTask = taskCards[0];
      await expect(firstTask.locator("h4")).toBeVisible(); // Task name
      await expect(firstTask.locator(".badge")).toBeVisible(); // Priority badge
      await expect(firstTask.locator("p.text-xs")).toBeVisible(); // Project name
      await expect(firstTask.locator(".h-1")).toBeVisible(); // Progress bar
      await expect(firstTask.locator(".badge")).toBeVisible(); // Status badge
    }
  });

  test("Can open project edit dialog when a project is clicked", async ({
    page,
  }) => {
    await page.goto("http://localhost:3000/projects");
    // Only run if there is at least one project
    if (
      !(await page
        .getByText("No projects yet. Create your first project to get started!")
        .isVisible())
    ) {
      const projectButtons = await page.locator("button:has(h3)").all();
      if (projectButtons.length > 0) {
        await projectButtons[0].click();
        await expect(page.getByRole("dialog")).toBeVisible();
        await expect(
          page.getByRole("heading", { name: /Edit Project|Project Details/ })
        ).toBeVisible();
        // Close dialog (assuming a close button or similar exists)
        await page.keyboard.press("Escape");
        await expect(page.getByRole("dialog")).not.toBeVisible();
      }
    }
  });
});
