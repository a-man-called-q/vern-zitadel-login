"use client";

import { Logo } from "@/components/logo";
import type { BrandingSettings } from "@zitadel/proto/zitadel/settings/v2/branding_settings_pb";
import { KeyRound, Languages, ShieldCheck } from "lucide-react";
import type { ReactNode } from "react";
import { ThemeWrapper } from "./theme-wrapper";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const highlights = [
  { icon: ShieldCheck, text: "Single sign-on across every Vern workspace" },
  { icon: KeyRound, text: "Passkeys, authenticator apps and security keys" },
  { icon: Languages, text: "Light and dark themes, in your language" },
];

/**
 * Vern's responsive Login App frame, modelled on the shadcn/studio "login-08"
 * block: a blurred backdrop, the logo top-left and one translucent card with
 * the form on the left and a muted brand aside on the right. The left column
 * renders the upstream page content intact, so every ZITADEL authentication
 * step uses the same shell.
 */
export function DynamicTheme({ branding, children }: { children: ReactNode; branding?: BrandingSettings }) {
  return (
    <ThemeWrapper branding={branding}>
      <div aria-hidden="true" className="vern-auth-backdrop pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <img
          alt=""
          src={`${basePath}/vern/auth-backdrop-light.svg`}
          className="size-full scale-105 object-cover opacity-90 blur-[7px] saturate-[0.3] dark:hidden"
        />
        <img
          alt=""
          src={`${basePath}/vern/auth-backdrop-dark.svg`}
          className="hidden size-full scale-105 object-cover opacity-90 blur-[7px] saturate-[0.3] dark:block"
        />
        <div className="absolute inset-0 bg-neutral-100/60 dark:bg-[#0c0e18]/70" />
      </div>

      <header className="fixed top-0 left-0 z-10 px-6 py-4 sm:px-8">
        <Logo
          lightSrc={`${basePath}/vern/logo-light.svg`}
          darkSrc={`${basePath}/vern/logo-dark.svg`}
          height={34}
          width={133}
        />
      </header>

      <div className="py-12">
        <section className="vern-auth-panel mx-auto flex w-full max-w-md flex-col overflow-hidden rounded-[14px] bg-white/85 shadow-xl ring-1 ring-black/10 backdrop-blur-2xl lg:grid lg:max-w-4xl lg:grid-cols-2 dark:bg-[#171a27]/85 dark:ring-white/10">
          <main className="flex flex-col gap-6 p-6 sm:p-8 [&_h1]:text-left [&_h1]:text-2xl [&_h1]:font-semibold [&_h1]:tracking-tight [&_h1]:text-neutral-950 [&_h1]:dark:text-white">
            {children}
          </main>

          <aside className="vern-auth-art hidden flex-col justify-center gap-8 border-s border-neutral-200 bg-neutral-100/60 p-8 lg:flex dark:border-white/10 dark:bg-white/[0.04]">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-balance text-neutral-950 dark:text-white">
                One secure sign-in. All your work.
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-balance text-neutral-500 dark:text-neutral-400">
                Sign in to your Vern workspace with the account and security options set up for you.
              </p>
            </div>

            <ul className="flex flex-col gap-5">
              {highlights.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-center gap-3.5">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#6d5ef5] text-white">
                    <Icon aria-hidden="true" className="size-4" />
                  </span>
                  <span className="text-sm leading-relaxed text-neutral-950 dark:text-white">{text}</span>
                </li>
              ))}
            </ul>
          </aside>
        </section>
      </div>
    </ThemeWrapper>
  );
}
