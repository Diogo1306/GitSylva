import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WorkingCopy } from "./WorkingCopy";
import { useAppStore } from "../../state/appStore";
import type { RepoInfo, FileChange } from "../../lib/types";

// Task 6 ("Layout na janela mínima"): the commit message box + commit button
// must stay reachable at small heights WITHOUT scrolling past hundreds of
// files — the file lists get their own bounded, scrollable region while the
// commit box is a pinned (flexShrink: 0) sibling, never nested inside it.
// The files/diff split also stops using its own local matchMedia in favor of
// the shared useBreakpoint hook (same 980px threshold, consolidated).

const { files } = vi.hoisted(() => ({
  files: [
    { path: "a.txt", index_status: ".", worktree_status: "M", orig_path: null },
    { path: "b.txt", index_status: "M", worktree_status: ".", orig_path: null },
  ] satisfies FileChange[],
}));

vi.mock("../../lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../lib/api")>();
  return {
    ...actual,
    getStatus: vi.fn().mockResolvedValue(files),
    syncStatus: vi.fn().mockResolvedValue({ ahead: 0, behind: 0, upstream: null }),
  };
});

const repo: RepoInfo = { path: "/repo", current_branch: "main", head: "aaa", is_empty: false };

function renderWC() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <WorkingCopy />
    </QueryClientProvider>,
  );
}

function setWindowSize(width: number, height: number) {
  Object.defineProperty(window, "innerWidth", { writable: true, configurable: true, value: width });
  Object.defineProperty(window, "innerHeight", { writable: true, configurable: true, value: height });
}

beforeEach(() => {
  useAppStore.setState({ repo, repos: [repo], selectedFile: null });
});

afterEach(() => {
  cleanup();
  useAppStore.setState({ repo: null, repos: [] });
  setWindowSize(1024, 768);
});

describe("WorkingCopy: pinned commit box (Task 6)", () => {
  it("wraps both file lists in one bounded, scrollable region, separate from the pinned commit box", async () => {
    renderWC();
    const unstagedHeader = await screen.findByText(/^NÃO PREPARADAS/);
    let wrapper: HTMLElement | null = unstagedHeader.parentElement;
    while (wrapper && wrapper.style.overflowY !== "auto") wrapper = wrapper.parentElement;
    expect(wrapper).not.toBeNull();

    const stagedHeader = screen.getByText(/^PREPARADAS/);
    expect(wrapper!.contains(stagedHeader)).toBe(true);

    const textarea = screen.getByPlaceholderText("Mensagem do commit…");
    expect(wrapper!.contains(textarea)).toBe(false);
    // Allowed to shrink below its content size so the pinned commit box below
    // it always keeps the room it needs instead of being pushed off-screen.
    expect(wrapper!.style.minHeight).toBe("0px");
  });

  it("keeps the commit box itself from shrinking away (flexShrink: 0)", async () => {
    renderWC();
    const textarea = await screen.findByPlaceholderText("Mensagem do commit…");
    const commitBox = textarea.parentElement as HTMLElement;
    expect(commitBox.style.flexShrink).toBe("0");
  });
});

describe("WorkingCopy: responsive split (Task 6, consolidated onto useBreakpoint)", () => {
  it("stacks the files/diff split at the window minimum width", async () => {
    setWindowSize(900, 560);
    const { container } = renderWC();
    await screen.findByText(/^NÃO PREPARADAS/);
    const root = container.firstElementChild as HTMLElement;
    const split = root.firstElementChild as HTMLElement;
    expect(split.style.flexDirection).toBe("column");
  });

  it("keeps the side-by-side split at a comfortable width", async () => {
    setWindowSize(1440, 900);
    const { container } = renderWC();
    await screen.findByText(/^NÃO PREPARADAS/);
    const root = container.firstElementChild as HTMLElement;
    const split = root.firstElementChild as HTMLElement;
    expect(split.style.flexDirection).toBe("row");
  });
});

describe("WorkingCopy: progressive disclosure (Task 6)", () => {
  it("hides the secondary diff-source label at the window minimum width", async () => {
    setWindowSize(900, 560);
    renderWC();
    await screen.findByText(/^NÃO PREPARADAS/);
    expect(screen.queryByText("diff da cópia de trabalho")).toBeNull();
  });

  it("shows the secondary diff-source label at a comfortable width", async () => {
    setWindowSize(1440, 900);
    renderWC();
    await screen.findByText(/^NÃO PREPARADAS/);
    expect(screen.getByText("diff da cópia de trabalho")).toBeTruthy();
  });
});
