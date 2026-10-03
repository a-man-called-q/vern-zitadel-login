"use client";

import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";
import { useSyncExternalStore } from "react";
import { Button, ButtonVariants } from "./button";
import { Translated } from "./translated";

// The history length never changes while a page is shown, so there is nothing to subscribe to.
const subscribe = () => () => {};

/**
 * Whether the browser has a page to go back to. A login opened in a fresh tab
 * (a bookmark, a link from an email) has none, and `router.back()` would do
 * nothing. The server renders the button; the client hides it after hydration.
 */
function useCanGoBack() {
  return useSyncExternalStore(
    subscribe,
    () => window.history.length > 1,
    () => true,
  );
}

export function BackButton() {
  const router = useRouter();
  const canGoBack = useCanGoBack();

  if (!canGoBack) {
    return null;
  }

  return (
    <Button onClick={() => router.back()} type="button" variant={ButtonVariants.Secondary}>
      <ArrowLeftIcon aria-hidden="true" className="mr-2 h-4 w-4" />
      <Translated i18nKey="back" namespace="common" />
    </Button>
  );
}
