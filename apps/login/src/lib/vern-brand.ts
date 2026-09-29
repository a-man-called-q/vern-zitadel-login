/**
 * Content of the Vern login shell: the logo, backdrop and brand aside rendered
 * by `DynamicTheme`. Deployments override it at runtime with a JSON file (see
 * `vern-brand-file.ts`), so one image serves every brand.
 */

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export const VERN_BRAND_ICONS = [
  "shield-check",
  "key-round",
  "languages",
  "fingerprint",
  "lock",
  "globe",
  "users",
  "sparkles",
] as const;

export type VernBrandIcon = (typeof VERN_BRAND_ICONS)[number];

export const MAX_HIGHLIGHTS = 4;

export type VernBrandImage = { light: string; dark: string };

export type VernBrand = {
  headline: string;
  description: string;
  highlights: { icon: VernBrandIcon; text: string }[];
  logo: VernBrandImage;
  backdrop: VernBrandImage;
  favicon: string;
};

export const DEFAULT_VERN_BRAND: VernBrand = {
  headline: "One secure sign-in. All your work.",
  description: "Sign in to your Vern workspace with the account and security options set up for you.",
  highlights: [
    { icon: "shield-check", text: "Single sign-on across every Vern workspace" },
    { icon: "key-round", text: "Passkeys, authenticator apps and security keys" },
    { icon: "languages", text: "Light and dark themes, in your language" },
  ],
  logo: { light: `${basePath}/vern/logo-light.svg`, dark: `${basePath}/vern/logo-dark.svg` },
  backdrop: { light: `${basePath}/vern/auth-backdrop-light.svg`, dark: `${basePath}/vern/auth-backdrop-dark.svg` },
  favicon: `${basePath}/vern/favicon.svg`,
};

export type ParsedVernBrand = { brand: VernBrand; problems: string[] };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Merges a parsed brand file over the defaults. Each invalid field keeps its
 * default and is reported, so a typo never takes the login page down.
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

  const text = (key: "headline" | "description") => {
    const value = input[key];
    if (value === undefined) return;
    if (typeof value === "string" && value.trim()) brand[key] = value.trim();
    else problems.push(`${key} must be a non-empty string`);
  };
  text("headline");
  text("description");

  const path = (value: unknown, name: string): string | undefined => {
    if (typeof value === "string" && value.startsWith("/") && !value.startsWith("//")) return value;
    problems.push(`${name} must be a path on the login origin, such as /brand/logo.svg`);
    return undefined;
  };

  const image = (key: "logo" | "backdrop") => {
    const value = input[key];
    if (value === undefined) return;
    if (!isRecord(value)) {
      problems.push(`${key} must be an object with light and dark paths`);
      return;
    }
    for (const theme of ["light", "dark"] as const) {
      if (value[theme] === undefined) continue;
      const resolved = path(value[theme], `${key}.${theme}`);
      if (resolved) brand[key][theme] = resolved;
    }
  };
  image("logo");
  image("backdrop");

  if (input.favicon !== undefined) {
    const favicon = path(input.favicon, "favicon");
    if (favicon) brand.favicon = favicon;
  }

  if (input.highlights !== undefined) {
    if (!Array.isArray(input.highlights)) {
      problems.push("highlights must be an array");
    } else {
      if (input.highlights.length > MAX_HIGHLIGHTS) {
        problems.push(`only the first ${MAX_HIGHLIGHTS} highlights are shown`);
      }
      brand.highlights = [];
      input.highlights.slice(0, MAX_HIGHLIGHTS).forEach((item, index) => {
        if (!isRecord(item) || typeof item.text !== "string" || !item.text.trim()) {
          problems.push(`highlights[${index}] needs a non-empty text`);
          return;
        }
        let icon: VernBrandIcon = "shield-check";
        if ((VERN_BRAND_ICONS as readonly unknown[]).includes(item.icon)) {
          icon = item.icon as VernBrandIcon;
        } else {
          problems.push(`highlights[${index}].icon must be one of ${VERN_BRAND_ICONS.join(", ")}`);
        }
        brand.highlights.push({ icon, text: item.text.trim() });
      });
    }
  }

  return { brand, problems };
}
