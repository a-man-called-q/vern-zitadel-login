import { expect, test } from "@playwright/test";

test.describe("Vern Login App @vern-login", () => {
  test("renders the branded desktop sign-in screen", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 960 });
    await page.goto("./loginname");

    await expect(page.locator(".vern-auth-panel")).toBeVisible();
    await expect(page.locator(".vern-auth-art")).toBeVisible();
    await expect(page.getByText("One secure sign-in.")).toBeVisible();
    await expect(page.getByTestId("username-text-input")).toBeVisible();
    await expect(page.getByTestId("submit-button")).toBeVisible();
  });

  test("puts the form on the left and the brand aside on the right", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 960 });
    await page.goto("./loginname");
    // boundingBox() does not wait: it returns null while the Suspense fallback shows.
    await expect(page.getByTestId("username-text-input")).toBeVisible();
    await expect(page.locator(".vern-auth-art")).toBeVisible();

    const form = await page.getByTestId("username-text-input").boundingBox();
    const aside = await page.locator(".vern-auth-art").boundingBox();
    const panel = await page.locator(".vern-auth-panel").boundingBox();

    expect(form).not.toBeNull();
    expect(aside).not.toBeNull();
    expect(panel).not.toBeNull();
    expect(form!.x + form!.width).toBeLessThanOrEqual(aside!.x);
    // A single centered card, not a full-bleed split screen.
    expect(panel!.width).toBeLessThanOrEqual(896);
  });

  test("keeps the sign-in form usable on a mobile viewport", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("./loginname");

    await expect(page.locator(".vern-auth-panel")).toBeVisible();
    await expect(page.locator(".vern-auth-art")).toBeHidden();
    await expect(page.getByTestId("username-text-input")).toBeVisible();
    await expect(page.getByTestId("submit-button")).toBeVisible();
  });
});
