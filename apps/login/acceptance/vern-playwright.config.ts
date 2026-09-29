import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  testMatch: "vern-login.spec.ts",
  fullyParallel: true,
  reporter: "line",
  use: {
    baseURL: process.env.LOGIN_BASE_URL || "http://localhost:8081/ui/v2/login/",
    headless: true,
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
    launchOptions:
      process.env.LOGIN_LOCALHOST_IPV6 === "true"
        ? { args: ["--host-resolver-rules=MAP localhost [::1]"] }
        : undefined,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
