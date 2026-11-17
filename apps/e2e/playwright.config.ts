import { defineConfig, devices } from "@playwright/test";

// Ports of their own, so the scenario never reuses a `mise run dev` server (with demo data)
// and always starts from an empty in-memory store.
const API_PORT = 3100;
const WEB_PORT = 4173;
const isCI = Boolean(process.env.CI);

export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  workers: 1,
  forbidOnly: isCI,
  retries: 0,
  reporter: isCI ? [["list"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: `http://127.0.0.1:${WEB_PORT}`,
    locale: "ru-RU",
    // Not the owner's Europe/Moscow, so the scenario also checks the time zone conversion.
    timezoneId: "Asia/Yekaterinburg",
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: [
    {
      // The real API server, without --demo-data.
      command: "node ../api/src/server.ts",
      env: { API_PORT: String(API_PORT) },
      url: `http://127.0.0.1:${API_PORT}/health`,
      reuseExistingServer: false,
      timeout: 30_000,
    },
    {
      // The built web app; `vite preview` proxies /api to API_PORT like the dev server does.
      command: `pnpm --filter @calls-booking/web exec vite build && pnpm --filter @calls-booking/web exec vite preview --host 127.0.0.1 --port ${WEB_PORT} --strictPort`,
      env: { API_PORT: String(API_PORT) },
      url: `http://127.0.0.1:${WEB_PORT}`,
      reuseExistingServer: false,
      timeout: 120_000,
    },
  ],
});
