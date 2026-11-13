import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  outputDir: "./.local/evidence/browser",
  // One CPU and a software rasterizer on a shared host: allow slow runs without retries.
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  forbidOnly: true,
  reporter: [["list"], ["json", { outputFile: ".local/evidence/e2e-results.json" }]],
  use: {
    baseURL: process.env.BASE_URL ?? "http://127.0.0.1:18109",
    browserName: "chromium",
    viewport: { width: 1440, height: 1080 },
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    actionTimeout: 10_000,
  },
});
