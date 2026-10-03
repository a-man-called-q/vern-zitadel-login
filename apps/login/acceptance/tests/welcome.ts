import { test } from "@playwright/test";

test("login is accessible", async ({ page }) => {
  await page.goto("./");
  await page.getByRole("heading", { name: "Sign in to your account" }).isVisible();
});
