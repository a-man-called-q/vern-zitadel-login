import "@/styles/globals.scss";

import { BackgroundWrapper } from "@/components/background-wrapper";
import { LanguageProvider } from "@/components/language-provider";
import { LanguageSwitcher } from "@/components/language-switcher";
import { Skeleton } from "@/components/skeleton";
import { ThemeProvider } from "@/components/theme-provider";
import ThemeSwitch from "@/components/theme-switch";
import { VernBrandProvider } from "@/components/vern-brand-provider";
import { LANGS, getLanguage } from "@/lib/i18n";
import { getServiceConfig } from "@/lib/service-url";
import { loadVernBrand } from "@/lib/vern-brand-file";
import { getAllowedLanguages } from "@/lib/zitadel";
import * as Tooltip from "@radix-ui/react-tooltip";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { headers } from "next/headers";
import React, { Suspense } from "react";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("common");
  return {
    title: t("title"),
    icons: { icon: loadVernBrand().favicon },
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const _headers = await headers();
  const { serviceConfig } = getServiceConfig(_headers);
  const brand = loadVernBrand();

  let languages = LANGS;
  try {
    const settings = await getAllowedLanguages({ serviceConfig });
    if (settings.allowedLanguages?.length) {
      languages = settings.allowedLanguages
        .filter((code) => LANGS.find((l) => l.code === code))
        .map((code) => getLanguage(code));
    }
  } catch (e) {
    console.error("Failed to load supported languages", e);
  }

  return (
    <html suppressHydrationWarning>
      <head />
      <body>
        <ThemeProvider>
          <Tooltip.Provider>
            <Suspense
              fallback={
                <BackgroundWrapper
                  className={`bg-background-light-600 dark:bg-background-dark-600 relative flex min-h-svh flex-col justify-center`}
                >
                  <div className="relative mx-auto w-full max-w-[1280px] px-4 py-6 sm:px-6 lg:px-10">
                    <Skeleton>
                      <div className="h-40"></div>
                    </Skeleton>
                    <div className="flex flex-row items-center justify-end space-x-4 py-4">
                      <ThemeSwitch />
                    </div>
                  </div>
                </BackgroundWrapper>
              }
            >
              <LanguageProvider>
                <VernBrandProvider brand={brand}>
                  <BackgroundWrapper
                    className={`bg-background-light-600 dark:bg-background-dark-600 relative isolate flex min-h-svh flex-col justify-center`}
                  >
                    <div className="relative mx-auto flex w-full max-w-[1280px] flex-1 flex-col justify-center px-4 py-5 sm:px-6 lg:px-10">
                      <div className="w-full flex-1 content-center">{children}</div>
                      <div className="mx-auto flex w-full max-w-[1180px] flex-row items-center justify-end space-x-4 px-2 py-3 sm:px-4">
                        <LanguageSwitcher languages={languages} />
                        <ThemeSwitch />
                      </div>
                    </div>
                  </BackgroundWrapper>
                </VernBrandProvider>
              </LanguageProvider>
            </Suspense>
          </Tooltip.Provider>
        </ThemeProvider>
      </body>
    </html>
  );
}
