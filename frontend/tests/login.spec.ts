import { test, expect } from "@playwright/test";

test.describe("Login Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("http://localhost:3000/login");
  });

  test("Displays login form", async ({ page }) => {
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();
    await expect(page.getByRole("button", { name: /login/i })).toBeVisible();
  });

  test("Shows error on invalid credentials", async ({ page }) => {
    await page.getByLabel("Email").fill("wrong@example.com");
    await page.getByLabel("Password").fill("wrongpassword");
    await page.getByRole("button", { name: /login/i }).click();
    await expect(page.getByText(/invalid|error/i)).toBeVisible();
  });

  test("Allows successful login", async ({ page }) => {
    await page.getByLabel("Email").fill("user@example.com");
    await page.getByLabel("Password").fill("correctpassword");
    await page.getByRole("button", { name: /login/i }).click();
    await expect(page).toHaveURL(/news|dashboard|home/);
  });
  test("Admin can sign in and is redirected to login page after sign out", async ({
    page,
  }) => {
    await test.step("Sign in as admin", async () => {
      await page.getByLabel("Email").fill("admin@gmail.com");
      await page.getByLabel("Password").fill("Danang@123");
      await page.getByRole("button", { name: /login/i }).click();
      // Wait for dashboard or home page
      await expect(page).toHaveURL(/news|dashboard|home/);
    });

    await test.step("Sign out and verify redirect to login", async () => {
      // Try to find a sign out button or menu
      // Common patterns: button with text 'Sign out' or 'Logout', or a menu
      const signOutButton = page.getByRole("button", {
        name: /sign out|logout/i,
      });
      await signOutButton.click();
      // After sign out, should be redirected to login page
      await expect(page).toHaveURL(/login/);
      await expect(page.getByLabel("Email")).toBeVisible();
      await expect(page.getByLabel("Password")).toBeVisible();
    });
  });
});
