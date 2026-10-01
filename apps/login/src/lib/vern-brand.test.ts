import { mkdtempSync, rmSync, utimesSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { DEFAULT_VERN_BRAND, parseVernBrand } from "./vern-brand";
import { loadVernBrand } from "./vern-brand-file";

describe("parseVernBrand", () => {
  it("merges valid fields over the defaults", () => {
    const { brand, problems } = parseVernBrand({
      logo: { light: "/brand/acme.svg" },
      favicon: "/brand/acme-icon.svg",
    });

    expect(problems).toEqual([]);
    expect(brand.logo).toEqual({ light: "/brand/acme.svg", dark: DEFAULT_VERN_BRAND.logo.dark });
    expect(brand.favicon).toBe("/brand/acme-icon.svg");
  });

  it("keeps defaults for invalid fields and reports them", () => {
    const { brand, problems } = parseVernBrand({
      logo: { light: "https://cdn.example.com/logo.svg", dark: "//cdn.example.com/logo.svg" },
      favicon: "favicon.svg",
    });

    expect(brand).toEqual(DEFAULT_VERN_BRAND);
    expect(problems).toHaveLength(3);
  });

  it("ignores the fields of older brand files", () => {
    const { brand, problems } = parseVernBrand({
      headline: "Acme sign-in",
      highlights: [{ icon: "lock", text: "Encrypted" }],
      backdrop: { light: "/brand/backdrop-light.svg" },
    });

    expect(brand).toEqual(DEFAULT_VERN_BRAND);
    expect(problems).toEqual([]);
  });

  it("rejects input that is not an object", () => {
    const { brand, problems } = parseVernBrand(["logo"]);

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
    writeFileSync(path, "{ favicon: ");

    expect(loadVernBrand(path)).toBe(DEFAULT_VERN_BRAND);
  });

  it("reloads the file after it changes", () => {
    const path = join(dir, "brand.json");
    writeFileSync(path, JSON.stringify({ favicon: "/brand/first.svg" }));
    utimesSync(path, 1, 1);
    expect(loadVernBrand(path).favicon).toBe("/brand/first.svg");

    writeFileSync(path, JSON.stringify({ favicon: "/brand/second.svg" }));
    utimesSync(path, 2, 2);
    expect(loadVernBrand(path).favicon).toBe("/brand/second.svg");
  });
});
