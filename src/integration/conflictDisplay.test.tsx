import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, within, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConflictBanner } from "../features/working-copy/ConflictBanner";
import { useAppStore } from "../state/appStore";
import { conflictState, resolveUse, markResolved, continueOp } from "../lib/api";
import type { RepoInfo, ConflictState } from "../lib/types";

// Flow 4 (Task 18): a mocked conflict_state (as a merge/pull would leave
// behind) must render the conflict UI with the right kind/count/file rows,
// and resolving a file must call resolve_use with the exact args and have
// the banner reflect the smaller remaining set once it refetches.

vi.mock("../lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../lib/api")>();
  return {
    ...actual,
    conflictState: vi.fn(),
    resolveUse: vi.fn().mockResolvedValue(undefined),
    markResolved: vi.fn().mockResolvedValue(undefined),
    continueOp: vi.fn().mockResolvedValue(undefined),
    abortOp: vi.fn().mockResolvedValue(undefined),
  };
});

const repo: RepoInfo = { path: "/repo", current_branch: "main", head: "aaa", is_empty: false };

function mergeConflict(files: string[]): ConflictState {
  return { in_merge: true, in_rebase: false, in_cherry_pick: false, in_revert: false, files };
}

function renderBanner() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <ConflictBanner />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  // conflictState varies per test (some use mockResolvedValueOnce chains);
  // reset it so a leftover queued value can never bleed into the next test.
  vi.mocked(conflictState).mockReset();
  vi.mocked(resolveUse).mockReset().mockResolvedValue(undefined);
  vi.mocked(markResolved).mockReset().mockResolvedValue(undefined);
  vi.mocked(continueOp).mockReset().mockResolvedValue(undefined);
  useAppStore.setState({ repo, repos: [repo] });
});

afterEach(() => {
  cleanup();
  useAppStore.setState({ repo: null, repos: [] });
});

describe("Conflict display: a pull/merge result with conflicts renders the ConflictBanner correctly", () => {
  it("renders nothing when there is no in-progress operation and no conflicted files", async () => {
    vi.mocked(conflictState).mockResolvedValue({ in_merge: false, in_rebase: false, in_cherry_pick: false, in_revert: false, files: [] });
    const { container } = renderBanner();
    await vi.waitFor(() => expect(conflictState).toHaveBeenCalled());
    expect(container.firstChild).toBeNull();
  });

  it("shows the merge kind, the remaining count, and one row per conflicted file with resolution actions", async () => {
    vi.mocked(conflictState).mockResolvedValue(mergeConflict(["a.txt", "b.txt"]));
    renderBanner();

    expect(await screen.findByText(/Merge com conflitos/)).toBeTruthy();
    expect(screen.getByText(/2 por resolver/)).toBeTruthy();
    expect(screen.getByText("a.txt")).toBeTruthy();
    expect(screen.getByText("b.txt")).toBeTruthy();

    // Continue is visually disabled (dimmed) while conflicts remain.
    const cont = screen.getByRole("button", { name: "Continuar" });
    expect(cont.style.opacity).toBe("0.5");
  });

  it("resolving a file with 'Usar meu' calls resolve_use with the right args and the row drops off once refetched", async () => {
    vi.mocked(conflictState)
      .mockResolvedValueOnce(mergeConflict(["a.txt", "b.txt"]))
      .mockResolvedValueOnce(mergeConflict(["b.txt"]));

    renderBanner();
    await screen.findByText("a.txt");

    const rowA = screen.getByText("a.txt").closest("div") as HTMLElement;
    fireEvent.click(within(rowA).getByRole("button", { name: "Usar meu" }));

    // mutate() dispatches the mutationFn call on a microtask, not
    // synchronously with the click — assert through waitFor.
    await waitFor(() => expect(resolveUse).toHaveBeenCalledWith("/repo", "a.txt", "ours"));

    await vi.waitFor(() => expect(screen.queryByText("a.txt")).toBeNull());
    expect(screen.getByText("b.txt")).toBeTruthy();
    expect(await screen.findByText(/1 por resolver/)).toBeTruthy();
  });

  it("resolving the last file lets Continue proceed and calls continue_op for the right kind", async () => {
    vi.mocked(conflictState)
      .mockResolvedValueOnce(mergeConflict(["only.txt"]))
      .mockResolvedValueOnce(mergeConflict([]));

    renderBanner();
    await screen.findByText("only.txt");

    const row = screen.getByText("only.txt").closest("div") as HTMLElement;
    fireEvent.click(within(row).getByRole("button", { name: "Resolvido" }));

    await waitFor(() => expect(markResolved).toHaveBeenCalledWith("/repo", "only.txt"));
    await vi.waitFor(() => expect(screen.getByText(/0 por resolver/)).toBeTruthy());
    const cont = screen.getByRole("button", { name: "Continuar" });
    expect(cont.style.opacity).not.toBe("0.5");

    fireEvent.click(cont);
    await waitFor(() => expect(continueOp).toHaveBeenCalledWith("/repo", "merge"));
  });
});
