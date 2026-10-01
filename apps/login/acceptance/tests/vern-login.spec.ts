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

  test("puts the art panel on the left and the form on the right", async ({ page }) => {
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
    expect(aside!.x + aside!.width).toBeLessThanOrEqual(form!.x);
    // A full-bleed split screen: the two panels fill the viewport.
    expect(aside!.x).toBe(0);
    expect(aside!.height).toBe(960);
    expect(aside!.width + panel!.width).toBe(1440);
  });

  test("fills the art panel with its image", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 960 });
    await page.goto("./loginname");
    await expect(page.locator(".vern-auth-art")).toBeVisible();

    const aside = await page.locator(".vern-auth-art").boundingBox();
    const image = page.locator(".vern-auth-art img").first();
    await expect(image).toHaveJSProperty("complete", true);
    expect(await image.evaluate((img: HTMLImageElement) => img.naturalWidth)).toBeGreaterThan(0);
    expect(await image.boundingBox()).toEqual(aside);
  });

  test("keeps the sign-in form usable on a mobile viewport", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("./loginname");

    await expect(page.locator(".vern-auth-panel")).toBeVisible();
    await expect(page.locator(".vern-auth-art")).toBeHidden();
    await expect(page.getByAltText("logo").locator("visible=true")).toHaveCount(1);
    await expect(page.getByTestId("username-text-input")).toBeVisible();
    await expect(page.getByTestId("submit-button")).toBeVisible();
  });
});
