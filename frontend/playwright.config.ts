import { defineConfig } from "@playwright/test";

export default defineConfig({
  reporter: [
    ["list"],
    ["html", { outputFolder: "tests/reports", open: "never" }],
  ],
  testDir: "./tests",
});
