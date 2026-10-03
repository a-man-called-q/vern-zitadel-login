"use client";

import { Logo } from "@/components/logo";
import { VernAuthAside } from "@/components/vern-auth-aside";
import { VernBrandProvider, useVernBrand } from "@/components/vern-brand-provider";
import type { BrandingSettings } from "@zitadel/proto/zitadel/settings/v2/branding_settings_pb";
import type { ReactNode } from "react";
import { ThemeWrapper } from "./theme-wrapper";

/**
 * Vern's responsive Login App frame: a full-height split screen with an art
 * panel on the left and the form on the right. The form column renders the
 * upstream page content intact, so every ZITADEL authentication step uses the
 * same shell.
 *
 * The art panel is a slot. The frame only sizes and clips it (and hides it
 * below the `lg` breakpoint, where the logo moves above the form); `aside`
 * decides everything inside: image, logo, text. It defaults to
 * `<VernAuthAside />`, and `aside={null}` leaves the form on its own.
 *
 * The logo comes from the runtime brand file (see `vern-brand-file.ts`). A logo
 * uploaded in the ZITADEL branding settings wins over it, so each organization
 * can still use its own; the slot reads the resolved one with `useVernBrand()`.
 */
export function DynamicTheme({
  branding,
  children,
  aside = <VernAuthAside />,
}: {
  children: ReactNode;
  branding?: BrandingSettings;
  aside?: ReactNode;
}) {
  const brand = useVernBrand();
  const orgLight = branding?.lightTheme?.logoUrl;
  const orgDark = branding?.darkTheme?.logoUrl;
  const orgLogo = orgLight || orgDark;
  const logo = orgLogo ? { light: orgLight || orgLogo, dark: orgDark || orgLogo } : brand.logo;
  const hasAside = aside !== null && aside !== undefined && aside !== false;

  return (
    <ThemeWrapper branding={branding}>
      <VernBrandProvider brand={{ ...brand, logo }}>
        <div className={hasAside ? "lg:grid lg:grid-cols-[minmax(22rem,4fr)_minmax(0,5fr)]" : ""}>
          {hasAside && (
            <aside className="vern-auth-art relative hidden overflow-hidden bg-[#0c0e18] lg:sticky lg:top-0 lg:block lg:h-svh">
              {aside}
            </aside>
          )}

          <main className="vern-auth-panel flex min-h-svh flex-col bg-white px-6 pt-6 pb-20 sm:px-8 dark:bg-[#0c0e18]">
            <header className={hasAside ? "lg:hidden" : ""}>
              <Logo lightSrc={logo.light} darkSrc={logo.dark} height={34} width={133} />
            </header>

            <div className="mx-auto my-auto flex w-full max-w-md flex-col gap-8 py-10 [&_h1]:text-start [&_h1]:text-3xl [&_h1]:font-semibold [&_h1]:tracking-tight [&_h1]:text-neutral-950 [&_h1]:dark:text-white [&>div:first-child>.ztdl-p]:text-base">
              {children}
            </div>
          </main>
        </div>
      </VernBrandProvider>
    </ThemeWrapper>
  );
}
