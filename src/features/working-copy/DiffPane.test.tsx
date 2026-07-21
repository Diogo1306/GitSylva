import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { afterEach } from "vitest";
import { DiffPane } from "./DiffPane";
import type { Sel } from "./WorkingCopy";
import type { useBlame, useDiff } from "../../state/queries";

// Final-review fix: the Blame toggle and the Stacked/Side-by-side toggle used
// to be bare <div onClick> — unreachable and inoperable by keyboard/screen
// reader (WCAG 2.1.1). Both are now real <button>s. This also covers the
// sibling i18n fix: "Blame" used to be a raw English literal, now routed
// through t() (see workingCopy.blame in both catalogs).

const effSel: Sel = { path: "a.txt", staged: false };

function renderPane(overrides: Partial<Parameters<typeof DiffPane>[0]> = {}) {
  const onToggleBlame = vi.fn();
  const onToggleStacked = vi.fn();
  const props = {
    effSel,
    selStatus: "M",
    isStacked: false,
    order: 0,
    hideSecondaryLabel: false,
    blameOn: false,
    onToggleBlame,
    onToggleStacked,
    blameQ: { isLoading: false, data: undefined } as unknown as ReturnType<typeof useBlame>,
    diff: { isLoading: false, data: "" } as unknown as ReturnType<typeof useDiff>,
    onStageHunk: undefined,
    onLoadFull: vi.fn(),
    ...overrides,
  };
  render(<DiffPane {...props} />);
  return { onToggleBlame, onToggleStacked };
}

afterEach(cleanup);

describe("DiffPane toggles are real, keyboard-operable controls", () => {
  it("renders the Blame toggle as a real, focusable <button> with its label routed through t()", () => {
    renderPane();
    const blameBtn = screen.getByRole("button", { name: "Blame" });
    expect(blameBtn.tagName).toBe("BUTTON");
    expect((blameBtn as HTMLButtonElement).disabled).toBe(false);
    expect(blameBtn.tabIndex).toBe(0);
  });

  it("activates the Blame toggle on Enter and on Space (keyboard, not just click)", () => {
    const { onToggleBlame } = renderPane();
    const blameBtn = screen.getByRole("button", { name: "Blame" });

    fireEvent.keyDown(blameBtn, { key: "Enter" });
    expect(onToggleBlame).toHaveBeenCalledTimes(1);

    fireEvent.keyDown(blameBtn, { key: " " });
    expect(onToggleBlame).toHaveBeenCalledTimes(2);
  });

  it("reflects the blame state via aria-pressed", () => {
    renderPane({ blameOn: true });
    const blameBtn = screen.getByRole("button", { name: "Blame" });
    expect(blameBtn.getAttribute("aria-pressed")).toBe("true");
  });

  it("renders the Stacked/Side-by-side toggle as a real, focusable <button>", () => {
    renderPane();
    // isStacked: false renders the label for the action it switches TO ("Empilhado" / Stacked).
    const stackedBtn = screen.getByRole("button", { name: "Empilhado" });
    expect(stackedBtn.tagName).toBe("BUTTON");
    expect((stackedBtn as HTMLButtonElement).disabled).toBe(false);
    expect(stackedBtn.tabIndex).toBe(0);
  });

  it("activates the Stacked/Side-by-side toggle on Enter and on Space", () => {
    const { onToggleStacked } = renderPane();
    const stackedBtn = screen.getByRole("button", { name: "Empilhado" });

    fireEvent.keyDown(stackedBtn, { key: "Enter" });
    expect(onToggleStacked).toHaveBeenCalledTimes(1);

    fireEvent.keyDown(stackedBtn, { key: " " });
    expect(onToggleStacked).toHaveBeenCalledTimes(2);
  });
});
