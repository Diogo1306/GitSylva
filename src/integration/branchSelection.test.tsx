import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Sidebar } from "../features/shell/Sidebar";
import { History } from "../features/history/History";
import { useAppStore } from "../state/appStore";
import { useThemeStore } from "../state/themeStore";
import { useRecentBranchesStore } from "../state/recentBranchesStore";
import type { RepoInfo, BranchInfo, Commit } from "../lib/types";

// Flow 1 (Task 18): branch selection is a genuinely CROSS-COMPONENT effect —
// Sidebar owns the branch rows, but a single click's result (focusCommit) is
// consumed by History to select that branch's tip commit. Mounting both real
// components against one shared appStore/QueryClient is the only way to catch
// a regression where that wiring breaks (a store-only assertion would pass
// even if History stopped reading focusCommit at all).

const { commits, branches } = vi.hoisted(() => ({
  // Hashes double as branch tips below, so a branch click's target row is
  // unambiguous: "login" -> "Segundo commit", "logout" -> "Primeiro commit".
  commits: [
    { hash: "aaa1111", parents: [], author: "Ana", email: "ana@x.com", date: "2024-01-03T10:00:00Z", subject: "Terceiro commit", refs: "HEAD -> main" },
    { hash: "bbb2222", parents: ["aaa1111"], author: "Bruno", email: "bruno@x.com", date: "2024-01-02T10:00:00Z", subject: "Segundo commit", refs: "" },
    { hash: "ccc3333", parents: ["bbb2222"], author: "Carla", email: "carla@x.com", date: "2024-01-01T10:00:00Z", subject: "Primeiro commit", refs: "" },
  ] satisfies Commit[],
  branches: [
    { name: "main", is_current: true, is_remote: false, upstream: null, tip: "aaa1111", ahead: 0, behind: 0 },
    { name: "login", is_current: false, is_remote: false, upstream: null, tip: "bbb2222", ahead: 1, behind: 0 },
    { name: "logout", is_current: false, is_remote: false, upstream: null, tip: "ccc3333", ahead: 0, behind: 2 },
  ] satisfies BranchInfo[],
}));

vi.mock("../lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../lib/api")>();
  return {
    ...actual,
    getStatus: vi.fn().mockResolvedValue([]),
    listBranches: vi.fn().mockResolvedValue(branches),
    listStashes: vi.fn().mockResolvedValue([]),
    listTags: vi.fn().mockResolvedValue([]),
    getLog: vi.fn().mockResolvedValue(commits),
    commitDetail: vi.fn().mockResolvedValue({ message: "", additions: 0, deletions: 0, files: [], diff: "" }),
    getBranchCommits: vi.fn().mockResolvedValue([]),
    getPathCommits: vi.fn().mockResolvedValue([]),
  };
});

// jsdom lacks ResizeObserver/scrollTo; History always wires both up.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
vi.stubGlobal("ResizeObserver", ResizeObserverStub);
HTMLElement.prototype.scrollTo = vi.fn();

const repo: RepoInfo = { path: "/repo", current_branch: "main", head: "aaa1111", is_empty: false };

function renderShell() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <div style={{ display: "flex" }}>
        <Sidebar />
        <History />
      </div>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  // Keep History's own detail-panel fetch out of the picture; this flow is
  // about row selection, not the diff panel.
  localStorage.setItem("gitsylva-history-detail", "off");
  useThemeStore.getState().resetPrefs();
  useAppStore.setState({ repo, repos: [repo], focusCommit: null, view: "history", groups: [], groupOf: {}, selectedFile: null });
  useRecentBranchesStore.setState({ byRepo: {} });
});

afterEach(() => {
  cleanup();
  useAppStore.setState({ repo: null, repos: [], focusCommit: null, groups: [], groupOf: {} });
  useRecentBranchesStore.setState({ byRepo: {} });
});

describe("Branch selection (Sidebar -> History cross-component effect)", () => {
  it("clicking a branch row selects it in the sidebar and focuses its tip commit in History", async () => {
    renderShell();

    const login = await screen.findByRole("button", { name: "login" });
    // Baseline: with no selection yet, History defaults to the newest commit.
    const terceiro = await screen.findByRole("option", { name: /Terceiro commit/ });
    expect(terceiro.getAttribute("aria-selected")).toBe("true");
    expect(login.getAttribute("aria-pressed")).toBe("false");

    fireEvent.click(login);

    // Sidebar: persistent selected state on the clicked branch (Task 8).
    expect(login.getAttribute("aria-pressed")).toBe("true");
    // Store: the branch's tip becomes the focus target.
    expect(useAppStore.getState().focusCommit).toBe("bbb2222");

    // History: the row for that exact hash ("Segundo commit") becomes
    // selected, and the previously-selected row is deselected — this is the
    // real cross-component effect, not just a store field changing.
    const segundo = await screen.findByRole("option", { name: /Segundo commit/ });
    expect(segundo.getAttribute("aria-selected")).toBe("true");
    expect(terceiro.getAttribute("aria-selected")).toBe("false");
  });

  it("selecting a different branch afterwards moves both the sidebar selection and the History focus", async () => {
    renderShell();

    const login = await screen.findByRole("button", { name: "login" });
    const logout = screen.getByRole("button", { name: "logout" });
    fireEvent.click(login);
    await screen.findByRole("option", { name: /Segundo commit/, selected: true });

    fireEvent.click(logout);

    expect(logout.getAttribute("aria-pressed")).toBe("true");
    expect(login.getAttribute("aria-pressed")).toBe("false");
    expect(useAppStore.getState().focusCommit).toBe("ccc3333");

    const primeiro = await screen.findByRole("option", { name: /Primeiro commit/ });
    expect(primeiro.getAttribute("aria-selected")).toBe("true");
    expect(screen.getByRole("option", { name: /Segundo commit/ }).getAttribute("aria-selected")).toBe("false");
  });
});
