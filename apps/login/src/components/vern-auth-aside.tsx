"use client";

import { useVernBrand } from "@/components/vern-brand-provider";

const art = `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/vern/auth-aside.svg`;

/**
 * Default content of the `aside` slot of `DynamicTheme`: an image that fills
 * the panel, the logo on top of it and a statement at the bottom. Edit this
 * fragment, or pass another one as `aside`, to change the art panel.
 *
 * The image must come from the login's own origin (`public/`): the Login App's
 * Content Security Policy only allows images from there.
 */
export function VernAuthAside() {
  const { logo } = useVernBrand();

  return (
    <>
      <img alt="" src={art} className="absolute inset-0 size-full object-cover" />
      <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

      <div className="relative flex h-full flex-col justify-between p-8 text-white xl:p-10">
        {/* The dark-theme logo: the image stays dark in both themes. */}
        <img alt="logo" src={logo.dark} height={34} width={133} className="self-start" />

        <figure className="flex flex-col gap-4">
          <blockquote className="text-3xl leading-tight font-semibold tracking-tight text-balance xl:text-4xl">
            One secure <span className="whitespace-nowrap">sign-in.</span> All your work.
          </blockquote>
          <figcaption className="text-sm leading-relaxed text-balance text-white/80">
            Single sign-on, passkeys and two-factor security for every app in your workspace.
          </figcaption>
        </figure>
      </div>
    </>
  );
}
