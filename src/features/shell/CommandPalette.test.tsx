import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { CommandPalette } from "./CommandPalette";
import { useAppStore } from "../../state/appStore";
import { useRecentBranchesStore } from "../../state/recentBranchesStore";
import { checkoutBranch } from "../../lib/api";
import type { RepoInfo, BranchInfo } from "../../lib/types";

// Task 12: the palette's BRANCHES group used to hard-exclude every remote
// branch (`!b.is_remote`). It now surfaces them too, labelled "remota", and
// its action creates/switches to a local tracking branch (the same DWIM
// `git checkout <short-name>` the Sidebar's remote rows already rely on) —
// not a checkout of the full "origin/x" ref. "login" exists both locally and
// as "origin/login" so the dedup rule (skip a remote row once a local branch
// of the same short name exists) has something to dedup against.
const { branches } = vi.hoisted(() => ({
  branches: [
    { name: "main", is_current: true, is_remote: false, upstream: null, tip: "aaa1111", ahead: 0, behind: 0 },
    { name: "login", is_current: false, is_remote: false, upstream: null, tip: "bbb2222", ahead: 0, behind: 0 },
    { name: "origin/feature-x", is_current: false, is_remote: true, upstream: null, tip: "ccc3333", ahead: 0, behind: 0 },
    { name: "origin/login", is_current: false, is_remote: true, upstream: null, tip: "ddd4444", ahead: 0, behind: 0 },
  ] satisfies BranchInfo[],
}));

vi.mock("../../lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../lib/api")>();
  return {
    ...actual,
    getStatus: vi.fn().mockResolvedValue([]),
    getLog: vi.fn().mockResolvedValue([]),
    listBranches: vi.fn().mockResolvedValue(branches),
    checkoutBranch: vi.fn().mockResolvedValue(undefined),
  };
});

const repo: RepoInfo = { path: "/repo", current_branch: "main", head: "aaa1111", is_empty: false };

function renderWithProviders(ui: React.ReactElement) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
}

beforeEach(() => {
  useAppStore.setState({ repo, repos: [repo], view: "history", paletteOpen: true });
  useRecentBranchesStore.setState({ byRepo: {} });
});

afterEach(() => {
  cleanup();
  useAppStore.setState({ repo: null, repos: [], paletteOpen: false });
  useRecentBranchesStore.setState({ byRepo: {} });
});

describe("CommandPalette: remote branches", () => {
  it("lists a remote-only branch in the BRANCHES group", async () => {
    renderWithProviders(<CommandPalette />);
    expect(await screen.findByText("origin/feature-x")).toBeTruthy();
  });

  it("labels the remote branch row 'remota'", async () => {
    renderWithProviders(<CommandPalette />);
    await screen.findByText("origin/feature-x");
    expect(screen.getByText("remota")).toBeTruthy();
  });

  it("dedups a remote branch once a local branch of the same short name exists", async () => {
    renderWithProviders(<CommandPalette />);
    await screen.findByText("origin/feature-x");
    // "login" is local; "origin/login" must not also render as a separate row.
    expect(screen.getByText("login")).toBeTruthy();
    expect(screen.queryByText("origin/login")).toBeNull();
  });

  it("selecting a remote branch checks out its short name (local tracking branch), not the full ref", async () => {
    renderWithProviders(<CommandPalette />);
    const row = await screen.findByText("origin/feature-x");
    fireEvent.click(row);
    await vi.waitFor(() => expect(checkoutBranch).toHaveBeenCalledWith("/repo", "feature-x"));
  });
});

// Task 14: a short shortcuts help list, reachable from the palette. Simplest
// sound option: an "Atalhos" entry opens the compact ShortcutsModal (reuses
// the shared Modal shell — Escape-closable, focus-trapped — instead of
// deep-linking into Settings' scroll position).
describe("CommandPalette: Atalhos entry (Task 14)", () => {
  it("lists an 'Atalhos' entry", async () => {
    renderWithProviders(<CommandPalette />);
    expect(await screen.findByText("Atalhos")).toBeTruthy();
  });

  it("opens the shortcuts help and closes the palette when selected", async () => {
    renderWithProviders(<CommandPalette />);
    const row = await screen.findByText("Atalhos");
    fireEvent.click(row);
    expect(useAppStore.getState().modal).toBe("shortcuts");
    expect(useAppStore.getState().paletteOpen).toBe(false);
  });

  it("is filtered out of the results when the query does not match it", async () => {
    renderWithProviders(<CommandPalette />);
    const input = screen.getByPlaceholderText(/Pesquisar/);
    fireEvent.change(input, { target: { value: "Histórico" } });
    expect(screen.queryByText("Atalhos")).toBeNull();
  });
});

describe("CommandPalette: empty state with suggestion", () => {
  it("offers a real 'clear search' action when a query has no matches", async () => {
    renderWithProviders(<CommandPalette />);
    const input = screen.getByPlaceholderText(/Pesquisar/);
    fireEvent.change(input, { target: { value: "zzz-no-such-thing-zzz" } });
    expect(await screen.findByText(/Sem resultados/)).toBeTruthy();
    const clear = screen.getByRole("button", { name: "Limpar pesquisa" });
    fireEvent.click(clear);
    expect((screen.getByPlaceholderText(/Pesquisar/) as HTMLInputElement).value).toBe("");
  });
});
