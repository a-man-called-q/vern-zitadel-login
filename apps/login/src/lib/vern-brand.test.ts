import { mkdtempSync, rmSync, utimesSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { DEFAULT_VERN_BRAND, MAX_HIGHLIGHTS, parseVernBrand } from "./vern-brand";
import { loadVernBrand } from "./vern-brand-file";

describe("parseVernBrand", () => {
  it("merges valid fields over the defaults", () => {
    const { brand, problems } = parseVernBrand({
      headline: "  Acme sign-in  ",
      highlights: [{ icon: "lock", text: "Encrypted" }],
      logo: { light: "/brand/acme.svg" },
      favicon: "/brand/acme-icon.svg",
    });

    expect(problems).toEqual([]);
    expect(brand.headline).toBe("Acme sign-in");
    expect(brand.description).toBe(DEFAULT_VERN_BRAND.description);
    expect(brand.highlights).toEqual([{ icon: "lock", text: "Encrypted" }]);
    expect(brand.logo).toEqual({ light: "/brand/acme.svg", dark: DEFAULT_VERN_BRAND.logo.dark });
    expect(brand.favicon).toBe("/brand/acme-icon.svg");
  });

  it("allows hiding the highlights", () => {
    expect(parseVernBrand({ highlights: [] }).brand.highlights).toEqual([]);
  });

  it("keeps defaults for invalid fields and reports them", () => {
    const { brand, problems } = parseVernBrand({
      headline: "",
      logo: { light: "https://cdn.example.com/logo.svg", dark: "//cdn.example.com/logo.svg" },
      backdrop: "/brand/backdrop.svg",
      highlights: [{ icon: "rocket", text: "Fast" }, { icon: "lock" }],
    });

    expect(brand.headline).toBe(DEFAULT_VERN_BRAND.headline);
    expect(brand.logo).toEqual(DEFAULT_VERN_BRAND.logo);
    expect(brand.backdrop).toEqual(DEFAULT_VERN_BRAND.backdrop);
    expect(brand.highlights).toEqual([{ icon: "shield-check", text: "Fast" }]);
    expect(problems).toHaveLength(6);
  });

  it("shows at most the maximum number of highlights", () => {
    const highlights = Array.from({ length: MAX_HIGHLIGHTS + 2 }, (_, i) => ({ icon: "globe", text: `Item ${i}` }));
    const { brand, problems } = parseVernBrand({ highlights });

    expect(brand.highlights).toHaveLength(MAX_HIGHLIGHTS);
    expect(problems).toHaveLength(1);
  });

  it("rejects input that is not an object", () => {
    const { brand, problems } = parseVernBrand(["headline"]);

    expect(brand).toEqual(DEFAULT_VERN_BRAND);
    expect(problems).toHaveLength(1);
  });
});

describe("loadVernBrand", () => {
  let dir: string;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "vern-brand-"));
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it("uses the default brand without a file", () => {
    expect(loadVernBrand(undefined)).toBe(DEFAULT_VERN_BRAND);
    expect(loadVernBrand(join(dir, "missing.json"))).toBe(DEFAULT_VERN_BRAND);
  });

  it("uses the default brand when the file is not valid JSON", () => {
    const path = join(dir, "brand.json");
    writeFileSync(path, "{ headline: ");

    expect(loadVernBrand(path)).toBe(DEFAULT_VERN_BRAND);
  });

  it("reloads the file after it changes", () => {
    const path = join(dir, "brand.json");
    writeFileSync(path, JSON.stringify({ headline: "First" }));
    utimesSync(path, 1, 1);
    expect(loadVernBrand(path).headline).toBe("First");

    writeFileSync(path, JSON.stringify({ headline: "Second" }));
    utimesSync(path, 2, 2);
    expect(loadVernBrand(path).headline).toBe("Second");
  });
});
