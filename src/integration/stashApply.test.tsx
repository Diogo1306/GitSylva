import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, within, act, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stashes } from "../features/stashes/Stashes";
import { useAppStore } from "../state/appStore";
import { useToastStore } from "../state/toastStore";
import { listStashes, stashFiles, applyStash } from "../lib/api";
import type { RepoInfo, StashInfo } from "../lib/types";

// Flow 5 (Task 18): the stash list renders mocked stashes (message, files
// summary), and applying one calls apply_stash with the exact index — while
// the mutation is in flight the row's own busy state is reflected, and once
// it settles the stash list is refetched (a real invalidate, not a manual
// local splice) and a success toast is pushed.

const stashes: StashInfo[] = [
  { index: 0, message: "WIP on main: fix login", relative_date: "há 2 horas" },
  { index: 1, message: "WIP on main: cleanup", relative_date: "há 1 dia" },
];

vi.mock("../lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../lib/api")>();
  return {
    ...actual,
    listStashes: vi.fn(),
    stashFiles: vi.fn().mockResolvedValue([]),
    applyStash: vi.fn(),
  };
});

function deferred<T>() {
  let resolve!: (v: T) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

const repo: RepoInfo = { path: "/repo", current_branch: "main", head: "aaa", is_empty: false };

function renderStashes() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <Stashes />
    </QueryClientProvider>,
  );
}

// The stash message is the deepest matching text; walk up to the outer card
// so `within` scopes to just that stash's own Aplicar/Aplicar e remover/
// Descartar controls (both stashes render the same button text).
function cardFor(message: string): HTMLElement {
  return screen.getByText(message).closest("div")!.parentElement as HTMLElement;
}

beforeEach(() => {
  // These vary per test (mockResolvedValueOnce / mockImplementation /
  // deferred returns) — reset so nothing queued leaks into the next test.
  vi.mocked(listStashes).mockReset();
  vi.mocked(stashFiles).mockReset();
  vi.mocked(applyStash).mockReset();
  useAppStore.setState({ repo, repos: [repo] });
});

afterEach(() => {
  cleanup();
  useAppStore.setState({ repo: null, repos: [] });
  useToastStore.setState({ toasts: [] });
});

describe("Stash apply: list renders mocked stashes and applying one drives the real mutation + refetch", () => {
  it("renders each mocked stash's message, index and file summary", async () => {
    vi.mocked(listStashes).mockResolvedValue(stashes);
    vi.mocked(stashFiles).mockImplementation((_path, index) => Promise.resolve(index === 0 ? ["a.txt", "b.txt"] : ["c.txt"]));

    renderStashes();

    expect(await screen.findByText("WIP on main: fix login")).toBeTruthy();
    expect(screen.getByText("WIP on main: cleanup")).toBeTruthy();
    expect(await screen.findByText(/2 ficheiros · a\.txt, b\.txt/)).toBeTruthy();
    expect(await screen.findByText(/1 ficheiro · c\.txt/)).toBeTruthy();
  });

  it("applying a stash calls apply_stash with the exact index, shows a busy state, then refetches the list and toasts success", async () => {
    vi.mocked(listStashes).mockResolvedValue(stashes);
    vi.mocked(stashFiles).mockResolvedValue([]);
    const d = deferred<void>();
    vi.mocked(applyStash).mockReturnValue(d.promise);

    renderStashes();
    await screen.findByText("WIP on main: fix login");
    const card = cardFor("WIP on main: fix login");

    fireEvent.click(within(card).getByText("Aplicar"));

    // mutate() dispatches the mutationFn call (and the isPending flip) on a
    // microtask, not synchronously with the click.
    await waitFor(() => expect(applyStash).toHaveBeenCalledWith("/repo", 0));
    await waitFor(() => expect(within(card).getByText("A aplicar…")).toBeTruthy());

    await act(async () => {
      d.resolve();
      await d.promise;
    });

    await waitFor(() => expect(within(card).getByText("Aplicar")).toBeTruthy());
    expect(listStashes).toHaveBeenCalledTimes(2);
    expect(useToastStore.getState().toasts.some((t) => t.text === "Stash aplicado")).toBe(true);
  });

  it("applying the OTHER stash targets its own index, not the first row's", async () => {
    vi.mocked(listStashes).mockResolvedValue(stashes);
    vi.mocked(stashFiles).mockResolvedValue([]);
    vi.mocked(applyStash).mockResolvedValue(undefined);

    renderStashes();
    await screen.findByText("WIP on main: cleanup");
    const card = cardFor("WIP on main: cleanup");

    fireEvent.click(within(card).getByText("Aplicar"));

    await waitFor(() => expect(applyStash).toHaveBeenCalledWith("/repo", 1));
  });
});
