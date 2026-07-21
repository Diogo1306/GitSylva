import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { History } from "./History";
import { useAppStore } from "../../state/appStore";
import { useThemeStore } from "../../state/themeStore";
import type { RepoInfo } from "../../lib/types";

// Keyboard/semantic migration (Task 2): commit rows must be real Tab-reachable
// options (SelectableRow, role="option") inside a listbox, activatable with
// Enter/Space, with aria-selected reflecting the current selection. The
// existing ArrowUp/ArrowDown row navigation (global keydown, not per-row
// focus) must keep working unchanged.

const { mockCommits } = vi.hoisted(() => ({
  mockCommits: [
    { hash: "aaa1111", parents: [], author: "Ana", email: "ana@x.com", date: "2024-01-03T10:00:00Z", subject: "Terceiro commit", refs: "HEAD -> main" },
    { hash: "bbb2222", parents: ["aaa1111"], author: "Bruno", email: "bruno@x.com", date: "2024-01-02T10:00:00Z", subject: "Segundo commit", refs: "" },
    { hash: "ccc3333", parents: ["bbb2222"], author: "Carla", email: "carla@x.com", date: "2024-01-01T10:00:00Z", subject: "Primeiro commit", refs: "" },
  ],
}));

vi.mock("../../lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../lib/api")>();
  return { ...actual, getLog: vi.fn().mockResolvedValue(mockCommits) };
});

// jsdom has no ResizeObserver; History observes the scroll container to size
// the virtualization window. A no-op stub is enough for these tests.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
vi.stubGlobal("ResizeObserver", ResizeObserverStub);
// jsdom doesn't implement Element.scrollTo (used to keep the selected row in view).
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
  // Detail/diff panel closed: keeps the test focused on the commit list and
  // avoids a real commit-detail fetch (useCommitDetail) firing on mount.
  localStorage.setItem("gitsylva-history-detail", "off");
  useThemeStore.getState().resetPrefs();
  useAppStore.setState({ repo, repos: [repo], focusCommit: null, view: "history" });
});

afterEach(() => {
  cleanup();
  useAppStore.setState({ repo: null, repos: [], focusCommit: null });
});

describe("History commit rows: keyboard + semantics", () => {
  it("renders commit rows as Tab-reachable options inside a listbox", async () => {
    renderHistory();
    const rows = await screen.findAllByRole("option");
    expect(rows).toHaveLength(mockCommits.length);
    rows.forEach((row) => expect(row.tabIndex).toBe(0));
    expect(screen.getByRole("listbox", { name: /histórico/i })).toBeTruthy();
  });

  it("marks the selected row with aria-selected=true and the rest false", async () => {
    renderHistory();
    const first = await screen.findByRole("option", { name: /Terceiro commit/ });
    // No explicit selection yet: the first (newest) commit is selected by default.
    expect(first.getAttribute("aria-selected")).toBe("true");
    const second = screen.getByRole("option", { name: /Segundo commit/ });
    expect(second.getAttribute("aria-selected")).toBe("false");
  });

  it("activates a row's selection on Enter and on Space", async () => {
    renderHistory();
    await screen.findByRole("option", { name: /Terceiro commit/ });
    const second = screen.getByRole("option", { name: /Segundo commit/ });
    fireEvent.keyDown(second, { key: "Enter" });
    expect(second.getAttribute("aria-selected")).toBe("true");

    const third = screen.getByRole("option", { name: /Primeiro commit/ });
    fireEvent.keyDown(third, { key: " " });
    expect(third.getAttribute("aria-selected")).toBe("true");
    expect(second.getAttribute("aria-selected")).toBe("false");
  });

  it("keeps the existing ArrowDown/ArrowUp row navigation working", async () => {
    renderHistory();
    await screen.findByRole("option", { name: /Terceiro commit/ });
    fireEvent.keyDown(window, { key: "ArrowDown" });
    expect(screen.getByRole("option", { name: /Segundo commit/ }).getAttribute("aria-selected")).toBe("true");
    fireEvent.keyDown(window, { key: "ArrowUp" });
    expect(screen.getByRole("option", { name: /Terceiro commit/ }).getAttribute("aria-selected")).toBe("true");
  });

  it("does not disable the outline inline on the filter input (focus ring must survive)", async () => {
    renderHistory();
    await screen.findByRole("option", { name: /Terceiro commit/ });
    const input = screen.getByLabelText(/Filtrar histórico/i);
    expect((input as HTMLInputElement).style.outline).not.toBe("none");
  });
});
