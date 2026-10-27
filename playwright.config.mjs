import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  workers: 1,
  timeout: 30000,
  use: {
    baseURL: "http://127.0.0.1:4180/tradegame/",
    headless: true,
    launchOptions: process.env.CHROMIUM_PATH
      ? { executablePath: process.env.CHROMIUM_PATH, args: ["--no-sandbox"] }
      : {},
  },
  webServer: {
    command: "node scripts/serve-pages.mjs",
    port: 4180,
    reuseExistingServer: !process.env.CI,
  },
  reporter: "list",
});
