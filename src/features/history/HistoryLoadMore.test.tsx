import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { History } from "./History";
import { useAppStore } from "../../state/appStore";
import { useThemeStore } from "../../state/themeStore";
import type { RepoInfo, Commit } from "../../lib/types";

// Regression for the "load more makes everything disappear" bug: growing the
// limit changes the query key, so react-query reports isLoading=true during the
// placeholder phase even while placeholderData still serves the previous page.
// History must keep showing that page, not blank the whole view behind the
// loading text. We drive that state directly by mocking useLog.

const commits: Commit[] = [
  { hash: "aaa1111", parents: [], author: "Ana", email: "a@x.com", date: "2024-01-02T10:00:00Z", subject: "Commit visivel", refs: "HEAD -> main" },
  { hash: "bbb2222", parents: ["aaa1111"], author: "Bruno", email: "b@x.com", date: "2024-01-01T10:00:00Z", subject: "Outro commit", refs: "" },
];

let logState: { data: Commit[] | undefined; isLoading: boolean; isFetching: boolean; error: unknown };

vi.mock("../../state/queries", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../state/queries")>();
  return { ...actual, useLog: () => logState };
});
vi.mock("../../lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../lib/api")>();
  return { ...actual, listBranches: vi.fn().mockResolvedValue([]), getBranchCommits: vi.fn().mockResolvedValue([]), getPathCommits: vi.fn().mockResolvedValue([]) };
});

class Stub { observe() {} unobserve() {} disconnect() {} }
vi.stubGlobal("ResizeObserver", Stub);
vi.stubGlobal("IntersectionObserver", Stub);
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
  localStorage.clear();
  localStorage.setItem("gitsylva-history-detail", "off");
  useThemeStore.getState().resetPrefs();
  useAppStore.setState({ repo, repos: [repo], focusCommit: null, view: "history" });
});
afterEach(() => {
  cleanup();
  useAppStore.setState({ repo: null, repos: [], focusCommit: null });
});

describe("History load-more keeps the list visible", () => {
  it("keeps showing the previous page while a bigger one loads (isLoading + placeholder data)", () => {
    // The exact state react-query reports on 'load more': a new key is pending
    // (isLoading true) but placeholderData still provides the previous commits.
    logState = { data: commits, isLoading: true, isFetching: true, error: null };
    renderHistory();
    expect(screen.getByText("Commit visivel")).toBeTruthy();
    expect(screen.getByText("Outro commit")).toBeTruthy();
  });

  it("only shows the loading state on the true first load (no data yet)", () => {
    logState = { data: undefined, isLoading: true, isFetching: true, error: null };
    renderHistory();
    expect(screen.queryByText("Commit visivel")).toBeNull();
  });
});
