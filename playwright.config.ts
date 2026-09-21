import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright E2E configuration (Spec 2).
 *
 * E2E runs against the REAL application: Next.js → Application → Repository →
 * PostgreSQL. It requires DATABASE_URL (Neon DEVELOPMENT branch) to be present in the
 * environment; CI injects it as a secret. `webServer` builds and starts the production
 * server so tests exercise the same code path as production.
 *
 * These tests do NOT run in the corporate-network local environment (outbound 5432 is
 * blocked); they run in the CI database-verification job.
 */
const PORT = 3000;

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    // Build + start the production server. Assumes migrate + seed have already run
    // (the CI job runs them before Playwright). Reuses an existing server locally.
    command: "npm run build && npm run start",
    url: `http://localhost:${PORT}`,
    timeout: 180_000,
    reuseExistingServer: !process.env.CI,
  },
});
