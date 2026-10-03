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
      <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

      <div className="relative flex h-full flex-col justify-between p-8 text-white xl:p-12">
        {/* The dark-theme logo: the image stays dark in both themes. */}
        <img alt="logo" src={logo.dark} height={34} width={133} className="self-start" />

        <figure className="flex flex-col gap-5">
          <blockquote className="text-4xl leading-[1.1] font-semibold tracking-tight text-balance 2xl:text-5xl">
            <span className="block">One secure </span>
            <span className="whitespace-nowrap">sign-in.</span>{" "}
            <span className="bg-gradient-to-r from-[#8c80ff] to-[#5eead4] bg-clip-text text-transparent">
              All your work.
            </span>
          </blockquote>
          <figcaption className="max-w-xs text-base leading-relaxed text-white/75">
            Single sign-on, passkeys and two-factor security for every app in your workspace.
          </figcaption>
        </figure>
      </div>
    </>
  );
}
