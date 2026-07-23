import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Titlebar } from "../features/shell/Titlebar";
import { Sidebar } from "../features/shell/Sidebar";
import { useAppStore } from "../state/appStore";
import { useShortcutsStore } from "../state/shortcutsStore";
import { listBranches } from "../lib/api";
import type { RepoInfo, BranchInfo } from "../lib/types";

// Flow 6 (Task 18): with two open repos, switching the active one via the repo
// dropdown must update appStore.repo AND the other mounted views must re-fetch
// and show the NEW repo's own data — the regression this guards against is a
// query staying keyed on the old path (stale data bleeding across repos).

// Switch the active repo through the titlebar dropdown: open the pill, pick a row.
function switchTo(name: string) {
  const pill = screen.getAllByRole("button").find((b) => b.getAttribute("aria-haspopup") === "menu")!;
  fireEvent.click(pill);
  fireEvent.click(within(screen.getByRole("menu")).getByText(name));
}

const repoA: RepoInfo = { path: "/repo-a", current_branch: "main", head: "aaa", is_empty: false };
const repoB: RepoInfo = { path: "/repo-b", current_branch: "develop", head: "bbb", is_empty: false };

const branchesA: BranchInfo[] = [
  { name: "main", is_current: true, is_remote: false, upstream: null, tip: "aaa", ahead: 0, behind: 0 },
  { name: "feature-a-only", is_current: false, is_remote: false, upstream: null, tip: "a2", ahead: 0, behind: 0 },
];
const branchesB: BranchInfo[] = [
  { name: "develop", is_current: true, is_remote: false, upstream: null, tip: "bbb", ahead: 0, behind: 0 },
  { name: "feature-b-only", is_current: false, is_remote: false, upstream: null, tip: "b2", ahead: 0, behind: 0 },
];

vi.mock("../lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../lib/api")>();
  return {
    ...actual,
    getStatus: vi.fn().mockResolvedValue([]),
    listStashes: vi.fn().mockResolvedValue([]),
    listTags: vi.fn().mockResolvedValue([]),
    listBranches: vi.fn((path: string) => Promise.resolve(path === repoA.path ? branchesA : branchesB)),
  };
});

function renderShell() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <Titlebar />
      <Sidebar />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  useAppStore.setState({ repo: repoA, repos: [repoA, repoB], groups: [], groupOf: {} });
});

afterEach(() => {
  cleanup();
  useAppStore.setState({ repo: null, repos: [], groups: [], groupOf: {} });
  useShortcutsStore.getState().reset();
});

describe("Repo switch: the repo dropdown updates the active repo and dependent views refetch its data", () => {
  it("shows repo A's own branches initially, not repo B's", async () => {
    renderShell();
    expect(await screen.findByRole("button", { name: "main" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "feature-a-only" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "develop" })).toBeNull();
    expect(screen.queryByRole("button", { name: "feature-b-only" })).toBeNull();
  });

  it("switching to repo B updates appStore.repo and the sidebar now shows repo B's branches, not repo A's", async () => {
    renderShell();
    await screen.findByRole("button", { name: "main" });

    switchTo("repo-b");

    expect(useAppStore.getState().repo?.path).toBe("/repo-b");
    expect(await screen.findByRole("button", { name: "develop" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "feature-b-only" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "main" })).toBeNull();
    expect(screen.queryByRole("button", { name: "feature-a-only" })).toBeNull();
    expect(listBranches).toHaveBeenCalledWith("/repo-b");
  });

  it("switching back to repo A restores its branches (round trip, not a one-way fluke)", async () => {
    renderShell();
    await screen.findByRole("button", { name: "main" });
    switchTo("repo-b");
    await screen.findByRole("button", { name: "develop" });

    switchTo("repo-a");

    expect(useAppStore.getState().repo?.path).toBe("/repo-a");
    expect(await screen.findByRole("button", { name: "main" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "feature-a-only" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "develop" })).toBeNull();
  });
});
