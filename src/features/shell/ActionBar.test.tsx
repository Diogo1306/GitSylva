import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ActionBar } from "./ActionBar";
import { useAppStore } from "../../state/appStore";
import type { RepoInfo } from "../../lib/types";

// Semantic/keyboard migration (Task 3): the action row becomes a real
// role="toolbar" of real <button>s (roving tabindex, arrow-key roaming),
// each keyboard-activatable and labeled, badges preserved.

vi.mock("../../lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../lib/api")>();
  return {
    ...actual,
    getStatus: vi.fn().mockResolvedValue([{ path: "a.txt", index_status: "M", worktree_status: ".", orig_path: null }]),
    syncStatus: vi.fn().mockResolvedValue({ ahead: 2, behind: 3, upstream: "origin/main" }),
  };
});

const repo: RepoInfo = { path: "/repo", current_branch: "main", head: "aaa", is_empty: false };

function renderActionBar() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <ActionBar />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  useAppStore.setState({ repo, repos: [repo] });
});

afterEach(() => {
  cleanup();
  useAppStore.setState({ repo: null, repos: [] });
});

describe("ActionBar", () => {
  it("renders the actions as role=toolbar with real <button> children", () => {
    renderActionBar();
    expect(screen.getByRole("toolbar")).toBeTruthy();
    for (const name of ["Commit", "↓ Pull", "↑ Push", "Branch", "Merge", "Stash", "Tag"]) {
      expect(screen.getByRole("button", { name }).tagName).toBe("BUTTON");
    }
  });

  it("gives only one button roving tabindex 0 at a time and roams with ArrowRight/ArrowLeft", () => {
    renderActionBar();
    const commit = screen.getByRole("button", { name: "Commit" }) as HTMLButtonElement;
    const pull = screen.getByRole("button", { name: "↓ Pull" }) as HTMLButtonElement;
    expect(commit.tabIndex).toBe(0);
    expect(pull.tabIndex).toBe(-1);
    commit.focus();
    fireEvent.keyDown(commit, { key: "ArrowRight" });
    expect(document.activeElement).toBe(pull);
  });

  it("activates an action on click", () => {
    renderActionBar();
    fireEvent.click(screen.getByRole("button", { name: "Branch" }));
    expect(useAppStore.getState().modal).toBe("branch");
  });

  it("activates an action on Enter and on Space (keyboard, via ToolbarButton)", () => {
    renderActionBar();
    const stash = screen.getByRole("button", { name: "Stash" });
    fireEvent.keyDown(stash, { key: "Enter" });
    expect(useAppStore.getState().modal).toBe("stash");
    // Reset, then confirm Space activates too (ToolbarButton wires both).
    useAppStore.getState().setModal(null);
    const tag = screen.getByRole("button", { name: "Tag" });
    fireEvent.keyDown(tag, { key: " " });
    expect(useAppStore.getState().modal).toBe("tag");
  });

  it("keeps the staged/ahead/behind badges", async () => {
    renderActionBar();
    const commit = screen.getByRole("button", { name: "Commit" });
    await within(commit).findByText("1");
    const pull = screen.getByRole("button", { name: "↓ Pull" });
    await within(pull).findByText("3");
    const push = screen.getByRole("button", { name: "↑ Push" });
    await within(push).findByText("2");
  });

  it("does not disable the outline inline on an action button (focus ring must survive)", () => {
    renderActionBar();
    expect((screen.getByRole("button", { name: "Commit" }) as HTMLElement).style.outline).not.toBe("none");
  });
});

// Task 6 ("Layout na janela mínima"): progressive disclosure — the trailing
// repo/branch/ahead-behind footer duplicates context already visible in the
// Sidebar/Titlebar, so it's the first thing to go at narrow widths, leaving
// room for the primary action buttons instead of forcing them to scroll.
describe("ActionBar: progressive disclosure (Task 6)", () => {
  afterEach(() => {
    Object.defineProperty(window, "innerWidth", { writable: true, configurable: true, value: 1024 });
    Object.defineProperty(window, "innerHeight", { writable: true, configurable: true, value: 768 });
  });

  it("hides the repo/branch footer stats at the window minimum width", () => {
    Object.defineProperty(window, "innerWidth", { writable: true, configurable: true, value: 900 });
    Object.defineProperty(window, "innerHeight", { writable: true, configurable: true, value: 560 });
    renderActionBar();
    expect(screen.queryByTitle("commits por enviar")).toBeNull();
  });

  it("shows the repo/branch footer stats at a comfortable width", () => {
    Object.defineProperty(window, "innerWidth", { writable: true, configurable: true, value: 1440 });
    Object.defineProperty(window, "innerHeight", { writable: true, configurable: true, value: 900 });
    renderActionBar();
    expect(screen.getByTitle("commits por enviar")).toBeTruthy();
  });
});
