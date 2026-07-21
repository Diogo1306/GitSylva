import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WorkingCopy } from "../features/working-copy/WorkingCopy";
import { useAppStore } from "../state/appStore";
import { getStatus, commit, stageFile } from "../lib/api";
import type { RepoInfo, FileChange } from "../lib/types";

// Flow 3 (Task 18): stage a file, type a message, click Commit — the mutation
// must be called with the exact (path, message, amend) args, and on success
// the working copy must actually refresh (status refetches through the real
// react-query wiring, not just "the mutate function got called").

const unstagedFile: FileChange = { path: "a.txt", index_status: ".", worktree_status: "M", orig_path: null };
const stagedFile: FileChange = { path: "a.txt", index_status: "M", worktree_status: ".", orig_path: null };

vi.mock("../lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../lib/api")>();
  return {
    ...actual,
    getStatus: vi.fn(),
    syncStatus: vi.fn().mockResolvedValue({ ahead: 0, behind: 0, upstream: null }),
    stageFile: vi.fn().mockResolvedValue(undefined),
    commit: vi.fn().mockResolvedValue("newhash1"),
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

beforeEach(() => {
  // getStatus/commit vary per test (mockResolvedValueOnce chains / a
  // rejection); reset so a leftover queued value never bleeds into the next
  // test, then re-establish the other mocks' stable defaults.
  vi.mocked(getStatus).mockReset();
  vi.mocked(commit).mockReset().mockResolvedValue("newhash1");
  vi.mocked(stageFile).mockReset().mockResolvedValue(undefined);
  useAppStore.setState({ repo, repos: [repo], selectedFile: null });
});

afterEach(() => {
  cleanup();
  useAppStore.setState({ repo: null, repos: [] });
});

describe("Committing: stage + message + commit, end to end through the real mutation wiring", () => {
  it("stages a file (refetching status), then commits with the exact message/amend args and refreshes the working copy on success", async () => {
    // Three sequential reads of status: initial mount, after staging
    // invalidates it, after the commit invalidates it again.
    vi.mocked(getStatus)
      .mockResolvedValueOnce([unstagedFile])
      .mockResolvedValueOnce([stagedFile])
      .mockResolvedValueOnce([]);

    renderWC();

    await screen.findByText("a.txt");
    expect(screen.getByText("NÃO PREPARADAS · 1")).toBeTruthy();
    expect(screen.getByText("PREPARADAS · 0")).toBeTruthy();

    // Stage it via its row checkbox (title="Preparar" on the unstaged row).
    fireEvent.click(screen.getByTitle("Preparar"));
    // mutate() dispatches the mutationFn call on a microtask, not
    // synchronously with the click — assert through waitFor.
    await waitFor(() => expect(stageFile).toHaveBeenCalledWith("/repo", "a.txt"));

    // Real refresh: the status query refetches and the staged count updates.
    await waitFor(() => expect(screen.getByText("PREPARADAS · 1")).toBeTruthy());
    expect(getStatus).toHaveBeenCalledTimes(2);

    const textarea = screen.getByPlaceholderText("Mensagem do commit…") as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: "Fix the login bug" } });

    fireEvent.click(screen.getByText("Commit em main"));

    await waitFor(() => expect(commit).toHaveBeenCalledWith("/repo", "Fix the login bug", false));

    // Success reflected: the message box clears...
    await waitFor(() => expect(textarea.value).toBe(""));
    // ...and status is refetched again, now showing a clean tree.
    await waitFor(() => expect(getStatus).toHaveBeenCalledTimes(3));
    await waitFor(() => expect(screen.getByText("PREPARADAS · 0")).toBeTruthy());
    expect(screen.getByText("NÃO PREPARADAS · 0")).toBeTruthy();
  });

  it("shows a commit error inline and does NOT clear the message when the commit mutation fails", async () => {
    vi.mocked(getStatus).mockResolvedValueOnce([stagedFile]);
    vi.mocked(commit).mockRejectedValueOnce({ message: "nothing to commit" });

    renderWC();
    await screen.findByText("PREPARADAS · 1");

    const textarea = screen.getByPlaceholderText("Mensagem do commit…") as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: "Will fail" } });
    fireEvent.click(screen.getByText("Commit em main"));

    expect(await screen.findByText("nothing to commit")).toBeTruthy();
    expect(textarea.value).toBe("Will fail");
  });
});
