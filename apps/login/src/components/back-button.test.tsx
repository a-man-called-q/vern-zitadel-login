import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { BackButton } from "./back-button";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ back: vi.fn() }),
}));

vi.mock("./translated", () => ({
  Translated: ({ i18nKey }: { i18nKey: string }) => <span>{i18nKey}</span>,
}));

describe("BackButton", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders nothing without a page to go back to", () => {
    vi.spyOn(window.history, "length", "get").mockReturnValue(1);
    render(<BackButton />);
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("renders when the browser has a previous page", () => {
    vi.spyOn(window.history, "length", "get").mockReturnValue(2);
    render(<BackButton />);
    expect(screen.getByRole("button", { name: "back" })).toBeTruthy();
  });
});
