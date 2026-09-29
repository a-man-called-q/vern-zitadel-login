"use client";

import { DEFAULT_VERN_BRAND, type VernBrand } from "@/lib/vern-brand";
import { createContext, useContext, type ReactNode } from "react";

const VernBrandContext = createContext<VernBrand>(DEFAULT_VERN_BRAND);

export function VernBrandProvider({ brand, children }: { brand: VernBrand; children: ReactNode }) {
  return <VernBrandContext.Provider value={brand}>{children}</VernBrandContext.Provider>;
}

export function useVernBrand(): VernBrand {
  return useContext(VernBrandContext);
}
