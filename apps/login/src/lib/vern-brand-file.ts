import "server-only";

import { readFileSync, statSync } from "fs";
import { createLogger } from "./logger";
import { DEFAULT_VERN_BRAND, parseVernBrand, type VernBrand } from "./vern-brand";

const logger = createLogger("vern-brand");

// The file is re-read when its modification time changes, so brand edits show
// up on the next request without restarting the container.
let cached: { path: string; mtimeMs: number; brand: VernBrand } | undefined;

/**
 * Loads the brand file named by `VERN_BRAND_FILE`, falling back to the built-in
 * Vern brand when the variable is unset or the file cannot be used.
 */
export function loadVernBrand(path = process.env.VERN_BRAND_FILE): VernBrand {
  if (!path) return DEFAULT_VERN_BRAND;

  let mtimeMs: number;
  try {
    mtimeMs = statSync(path).mtimeMs;
  } catch (error) {
    if (cached?.path !== path || cached.mtimeMs !== -1) {
      logger.warn("Brand file is not readable; using the default brand", { path, error: String(error) });
      cached = { path, mtimeMs: -1, brand: DEFAULT_VERN_BRAND };
    }
    return DEFAULT_VERN_BRAND;
  }

  if (cached?.path === path && cached.mtimeMs === mtimeMs) return cached.brand;

  let brand = DEFAULT_VERN_BRAND;
  try {
    const parsed = parseVernBrand(JSON.parse(readFileSync(path, "utf-8")));
    brand = parsed.brand;
    if (parsed.problems.length) {
      logger.warn("Brand file has invalid fields; their defaults are used", { path, problems: parsed.problems });
    }
  } catch (error) {
    logger.warn("Brand file is not valid JSON; using the default brand", { path, error: String(error) });
  }

  cached = { path, mtimeMs, brand };
  return brand;
}
