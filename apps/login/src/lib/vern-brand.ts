/**
 * Runtime brand of the Vern login shell: the logo and the favicon. Deployments
 * override it with a JSON file (see `vern-brand-file.ts`), so one image serves
 * every brand. The art panel is not part of it: that is a slot of
 * `DynamicTheme`, filled in code (see `vern-auth-aside.tsx`).
 */

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export type VernBrandImage = { light: string; dark: string };

export type VernBrand = {
  logo: VernBrandImage;
  favicon: string;
};

export const DEFAULT_VERN_BRAND: VernBrand = {
  logo: { light: `${basePath}/vern/logo-light.svg`, dark: `${basePath}/vern/logo-dark.svg` },
  favicon: `${basePath}/vern/favicon.svg`,
};

export type ParsedVernBrand = { brand: VernBrand; problems: string[] };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Merges a parsed brand file over the defaults. Each invalid field keeps its
 * default and is reported, so a typo never takes the login page down. Unknown
 * fields are ignored, so a brand file written for an older image still loads.
 *
 * Image paths must be absolute paths on the login's own origin (`/brand/logo.svg`):
 * the Login App's Content Security Policy only allows images from there.
 */
export function parseVernBrand(input: unknown, fallback: VernBrand = DEFAULT_VERN_BRAND): ParsedVernBrand {
  const problems: string[] = [];
  const brand: VernBrand = structuredClone(fallback);

  if (!isRecord(input)) {
    return { brand, problems: ["the brand file must contain a JSON object"] };
  }

  const path = (value: unknown, name: string): string | undefined => {
    if (typeof value === "string" && value.startsWith("/") && !value.startsWith("//")) return value;
    problems.push(`${name} must be a path on the login origin, such as /brand/logo.svg`);
    return undefined;
  };

  if (input.logo !== undefined) {
    if (!isRecord(input.logo)) {
      problems.push("logo must be an object with light and dark paths");
    } else {
      for (const theme of ["light", "dark"] as const) {
        if (input.logo[theme] === undefined) continue;
        const resolved = path(input.logo[theme], `logo.${theme}`);
        if (resolved) brand.logo[theme] = resolved;
      }
    }
  }

  if (input.favicon !== undefined) {
    const favicon = path(input.favicon, "favicon");
    if (favicon) brand.favicon = favicon;
  }

  return { brand, problems };
}
