import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor, cleanup } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useAppStore } from "./appStore";
import { useSyncActions, markRepoBusy, clearRepoBusy } from "./queries";
import { fetchRemote } from "../lib/api";

// Keep every real api export except the three network ops, which we drive by
// hand with a controllable promise so we can hold a mutation "in flight" and
// resolve/reject it exactly when the test needs to.
vi.mock("../lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../lib/api")>();
  return { ...actual, fetchRemote: vi.fn(), pull: vi.fn(), push: vi.fn() };
});

function deferred() {
  let resolve!: () => void;
  let reject!: (e?: unknown) => void;
  const promise = new Promise<void>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

// A STABLE QueryClient per test: renderHook re-renders the wrapper on
// rerender(), so newing one up inside the wrapper would discard the pending
// mutation's state. One client, referenced by a closure wrapper.
function makeWrapper() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
}

beforeEach(() => {
  useAppStore.setState({ repos: [], repo: null, groups: [], groupOf: {}, busyRepos: {}, pendingClose: null });
  vi.clearAllMocks();
});

afterEach(cleanup);

describe("useSyncActions busy tracking through the real react-query wiring (B9)", () => {
  // The regression: start a network op on repo /A, switch tabs to /B before it
  // resolves, and the flag on /A must still be cleared when /A's op settles.
  // Because these mutations carry no mutationKey, TanStack v5 overwrites the
  // pending mutation's onSettled with the newest render's closures on every
  // render — so clearing by the render-time `path` would clear /B (the active
  // repo) and orphan /A's busy flag forever.
  it("clears the operation's OWN repo on settle after a mid-op tab switch", async () => {
    const d = deferred();
    vi.mocked(fetchRemote).mockReturnValue(d.promise);

    const { result, rerender } = renderHook(({ p }: { p: string }) => useSyncActions(p), {
      initialProps: { p: "/A" },
      wrapper: makeWrapper(),
    });

    // Fetch starts on /A (the active repo at click time).
    act(() => {
      result.current.fetch.mutate();
    });
    expect(useAppStore.getState().busyRepos["/A"]).toBe(true);

    // Tab switch to /B while the fetch is still in flight: useSyncActions
    // re-renders bound to "/B" and TanStack re-arms the pending mutation.
    rerender({ p: "/B" });

    // /A's fetch resolves.
    await act(async () => {
      d.resolve();
      await d.promise;
    });
    await waitFor(() => expect(result.current.fetch.isPending).toBe(false));

    // The op's OWN repo (/A) is cleared; the newly active /B was never touched.
    expect(useAppStore.getState().busyRepos["/A"]).toBeFalsy();
    expect(useAppStore.getState().busyRepos["/B"]).toBeFalsy();
  });

  // Busy must be cleared whether the op succeeds OR fails: clearing lives in
  // onSettled (runs on both), never only in onSuccess.
  it("clears busy on the error path, not only on success", async () => {
    const d = deferred();
    vi.mocked(fetchRemote).mockReturnValue(d.promise);

    const { result } = renderHook(() => useSyncActions("/A"), { wrapper: makeWrapper() });

    act(() => {
      result.current.fetch.mutate();
    });
    expect(useAppStore.getState().busyRepos["/A"]).toBe(true);

    await act(async () => {
      d.reject(new Error("network down"));
      await d.promise.catch(() => {});
    });
    await waitFor(() => expect(result.current.fetch.isError).toBe(true));

    expect(useAppStore.getState().busyRepos["/A"]).toBeFalsy();
  });
});

describe("busy-tracking helpers (own-path clear, direct callback contract)", () => {
  it("marks the op's repo busy and carries its path in the returned context", () => {
    const ctx = markRepoBusy("/A");
    expect(ctx).toEqual({ busyPath: "/A" });
    expect(useAppStore.getState().busyRepos["/A"]).toBe(true);
  });

  // The core of the fix: the clear targets the path in the context (the op's
  // OWN repo), not whatever repo is active/busy when settle finally runs.
  it("clears the repo carried in context, not the currently active one", () => {
    const ctxA = markRepoBusy("/A"); // op starts on /A, context pins /A
    markRepoBusy("/B"); // meanwhile /B becomes the active/busy repo

    clearRepoBusy(ctxA); // /A's op settles with ITS OWN context

    expect(useAppStore.getState().busyRepos["/A"]).toBeFalsy();
    expect(useAppStore.getState().busyRepos["/B"]).toBe(true);
  });

  it("is a no-op when the context is missing", () => {
    useAppStore.getState().setRepoBusy("/A", true);
    clearRepoBusy(undefined);
    expect(useAppStore.getState().busyRepos["/A"]).toBe(true);
  });
});
