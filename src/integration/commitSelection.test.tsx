import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { History } from "../features/history/History";
import { useAppStore } from "../state/appStore";
import { useThemeStore } from "../state/themeStore";
import { commitDetail } from "../lib/api";
import type { RepoInfo, Commit, CommitDetail } from "../lib/types";

// Flow 2 (Task 18): selecting a commit in History must fetch and render THAT
// commit's own detail via commit_detail (useCommitDetail is keyed on the
// hash), not a static placeholder. The mock below is keyed by hash so a
// regression that fetches/display the wrong commit's data is caught.

const { commits } = vi.hoisted(() => ({
  commits: [
    { hash: "aaa1111", parents: [], author: "Ana", email: "ana@x.com", date: "2024-01-03T10:00:00Z", subject: "Terceiro commit", refs: "HEAD -> main" },
    { hash: "bbb2222", parents: ["aaa1111"], author: "Bruno", email: "bruno@x.com", date: "2024-01-02T10:00:00Z", subject: "Segundo commit", refs: "" },
  ] satisfies Commit[],
}));

const detailByHash: Record<string, CommitDetail> = {
  aaa1111: { message: "Terceiro commit\n\nCorpo do terceiro.", additions: 3, deletions: 1, files: [{ path: "c.txt", status: "M", additions: 3, deletions: 1 }], diff: "" },
  bbb2222: { message: "Segundo commit", additions: 5, deletions: 2, files: [{ path: "b.txt", status: "A", additions: 5, deletions: 2 }], diff: "" },
};

vi.mock("../lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../lib/api")>();
  return {
    ...actual,
    getLog: vi.fn().mockResolvedValue(commits),
    listBranches: vi.fn().mockResolvedValue([]),
    getBranchCommits: vi.fn().mockResolvedValue([]),
    getPathCommits: vi.fn().mockResolvedValue([]),
    commitDetail: vi.fn((_path: string, hash: string) => Promise.resolve(detailByHash[hash])),
  };
});

class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
vi.stubGlobal("ResizeObserver", ResizeObserverStub);
HTMLElement.prototype.scrollTo = vi.fn();

const repo: RepoInfo = { path: "/repo", current_branch: "main", head: "aaa1111", is_empty: false };

function renderHistory() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <History />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  // Detail panel OPEN by default (no override): this flow is about it.
  useThemeStore.getState().resetPrefs();
  useAppStore.setState({ repo, repos: [repo], focusCommit: null, view: "history" });
});

afterEach(() => {
  cleanup();
  useAppStore.setState({ repo: null, repos: [], focusCommit: null });
});

describe("Commit selection: detail panel shows the selected commit's own data", () => {
  it("shows the default-selected (newest) commit's detail on first render", async () => {
    renderHistory();
    await screen.findByRole("option", { name: /Terceiro commit/ });

    expect(commitDetail).toHaveBeenCalledWith("/repo", "aaa1111", false);
    expect(await screen.findByText("c.txt")).toBeTruthy();
    expect(screen.getByText("+3")).toBeTruthy();
    expect(screen.getByText("Corpo do terceiro.")).toBeTruthy();
  });

  it("selecting a different commit fetches and renders ITS OWN detail, replacing the previous one", async () => {
    renderHistory();
    await screen.findByRole("option", { name: /Terceiro commit/ });
    await screen.findByText("c.txt");

    const second = screen.getByRole("option", { name: /Segundo commit/ });
    fireEvent.click(second);

    expect(second.getAttribute("aria-selected")).toBe("true");
    expect(screen.getByRole("option", { name: /Terceiro commit/ }).getAttribute("aria-selected")).toBe("false");

    expect(commitDetail).toHaveBeenCalledWith("/repo", "bbb2222", false);
    // The new commit's own file/stat data is shown...
    expect(await screen.findByText("b.txt")).toBeTruthy();
    expect(screen.getByText("+5")).toBeTruthy();
    // ...and the PREVIOUS commit's data is gone, not just appended alongside.
    expect(screen.queryByText("c.txt")).toBeNull();
    expect(screen.queryByText("+3")).toBeNull();
  });

  it("keeps the selection (and its detail) after a re-render triggered by an unrelated store update", async () => {
    renderHistory();
    await screen.findByRole("option", { name: /Terceiro commit/ });
    const second = screen.getByRole("option", { name: /Segundo commit/ });
    fireEvent.click(second);
    await screen.findByText("b.txt");

    // An unrelated store flip (palette open/close) must not reset the
    // selection or re-trigger a detail fetch for a different commit.
    useAppStore.getState().setPaletteOpen(true);
    useAppStore.getState().setPaletteOpen(false);

    expect(screen.getByRole("option", { name: /Segundo commit/ }).getAttribute("aria-selected")).toBe("true");
    expect(screen.getByText("b.txt")).toBeTruthy();
    expect(commitDetail).toHaveBeenCalledTimes(2); // once per commit, not re-fetched
  });
});
