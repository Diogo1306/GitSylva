import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, createEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Sidebar } from "./Sidebar";
import { Titlebar } from "./Titlebar";
import { useAppStore } from "../../state/appStore";
import type { RepoInfo, BranchInfo } from "../../lib/types";

// Semantic/keyboard migration (Task 3): branch/nav rows become real,
// Tab-reachable controls (SelectableRow) with Enter/Space activation and a
// visible focus ring, folder/remote toggles become real <button>s, and the
// "Definições" nav entry — a duplicate of the titlebar settings button — is
// removed from the Sidebar entirely.

// Flat (no "/") so none of these group into a folder — folder collapse
// behavior is covered separately below with its own branch set.
const { branches } = vi.hoisted(() => ({
  branches: [
    { name: "main", is_current: true, is_remote: false, upstream: null, tip: "aaa1111", ahead: 0, behind: 0 },
    { name: "login", is_current: false, is_remote: false, upstream: null, tip: "bbb2222", ahead: 1, behind: 0 },
    { name: "logout", is_current: false, is_remote: false, upstream: null, tip: "ccc3333", ahead: 0, behind: 2 },
  ] satisfies BranchInfo[],
}));

vi.mock("../../lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../lib/api")>();
  return {
    ...actual,
    getStatus: vi.fn().mockResolvedValue([]),
    listBranches: vi.fn().mockResolvedValue(branches),
    listStashes: vi.fn().mockResolvedValue([]),
    listTags: vi.fn().mockResolvedValue([]),
  };
});

const repo: RepoInfo = { path: "/repo", current_branch: "main", head: "aaa1111", is_empty: false };

function renderWithProviders(ui: React.ReactElement) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
}

beforeEach(() => {
  useAppStore.setState({ repo, repos: [repo], view: "history", groups: [], groupOf: {}, focusCommit: null });
});

afterEach(() => {
  cleanup();
  useAppStore.setState({ repo: null, repos: [], groups: [], groupOf: {} });
});

describe("Sidebar: Definições dedup", () => {
  it("no longer renders a Definições nav entry", () => {
    renderWithProviders(<Sidebar />);
    expect(screen.queryByText("Definições")).toBeNull();
  });

  it("the titlebar still exposes exactly one accessible, labeled Definições button", () => {
    renderWithProviders(<Titlebar />);
    expect(screen.getAllByRole("button", { name: "Definições" })).toHaveLength(1);
  });
});

describe("Sidebar: nav rows", () => {
  it("renders workspace nav rows as real Tab-reachable controls", async () => {
    renderWithProviders(<Sidebar />);
    await screen.findByRole("button", { name: /Histórico/ });
    const working = screen.getByRole("button", { name: /Cópia de trabalho/ });
    const history = screen.getByRole("button", { name: /Histórico/ });
    expect(working.tabIndex).toBe(0);
    expect(history.tabIndex).toBe(0);
  });

  it("switches view on click and on Enter", async () => {
    renderWithProviders(<Sidebar />);
    const stashes = await screen.findByRole("button", { name: /Stashes/ });
    fireEvent.click(stashes);
    expect(useAppStore.getState().view).toBe("stashes");
    useAppStore.getState().setView("history");
    fireEvent.keyDown(stashes, { key: "Enter" });
    expect(useAppStore.getState().view).toBe("stashes");
  });

  it("does not disable the outline inline on a nav row (focus ring must survive)", async () => {
    renderWithProviders(<Sidebar />);
    const working = await screen.findByRole("button", { name: /Cópia de trabalho/ });
    expect((working as HTMLElement).style.outline).not.toBe("none");
  });
});

describe("Sidebar: branch rows", () => {
  it("renders each local branch as a real, focusable option row", async () => {
    renderWithProviders(<Sidebar />);
    const main = await screen.findByRole("button", { name: "main" });
    const login = screen.getByRole("button", { name: "login" });
    expect(main.tabIndex).toBe(0);
    expect(login.tabIndex).toBe(0);
  });

  it("single click on a branch row focuses its tip in the history (does not switch branch)", async () => {
    renderWithProviders(<Sidebar />);
    const login = await screen.findByRole("button", { name: "login" });
    fireEvent.click(login);
    expect(useAppStore.getState().focusCommit).toBe("bbb2222");
  });

  it("Enter on a branch row activates the same single-click behavior", async () => {
    renderWithProviders(<Sidebar />);
    const login = await screen.findByRole("button", { name: "login" });
    fireEvent.keyDown(login, { key: "Enter" });
    expect(useAppStore.getState().focusCommit).toBe("bbb2222");
  });

  it("double click on a non-current branch opens the switch confirmation", async () => {
    renderWithProviders(<Sidebar />);
    const login = await screen.findByRole("button", { name: "login" });
    fireEvent.doubleClick(login);
    expect(screen.getByText(/Mudar para a branch login/)).toBeTruthy();
  });

  it("ArrowDown/ArrowUp move focus between visible branch rows", async () => {
    renderWithProviders(<Sidebar />);
    const main = await screen.findByRole("button", { name: "main" });
    const login = screen.getByRole("button", { name: "login" });
    const logout = screen.getByRole("button", { name: "logout" });
    main.focus();
    fireEvent.keyDown(main, { key: "ArrowDown" });
    expect(document.activeElement).toBe(login);
    fireEvent.keyDown(login, { key: "ArrowDown" });
    expect(document.activeElement).toBe(logout);
    fireEvent.keyDown(logout, { key: "ArrowUp" });
    expect(document.activeElement).toBe(login);
  });

  it("has a real, independently focusable delete button that does not also trigger the row's select", async () => {
    renderWithProviders(<Sidebar />);
    await screen.findByRole("button", { name: "login" });
    const del = screen.getByRole("button", { name: "Apagar login" });
    expect(del.tagName).toBe("BUTTON");
    fireEvent.click(del);
    expect(screen.getByText(/Apagar a branch login/)).toBeTruthy();
    // Clicking delete must not also have focused the branch's commit tip.
    expect(useAppStore.getState().focusCommit).toBeNull();
  });

  it("pressing Enter on the focused delete button does not also bubble into the row's select", async () => {
    renderWithProviders(<Sidebar />);
    await screen.findByRole("button", { name: "login" });
    const del = screen.getByRole("button", { name: "Apagar login" });
    del.focus();
    fireEvent.keyDown(del, { key: "Enter" });
    // The delete confirm dialog opened...
    expect(screen.getByText(/Apagar a branch login/)).toBeTruthy();
    // ...but the row's own Enter/Space activation (SelectableRow's
    // onKeyDown) must not ALSO have fired via bubbling and focused the tip.
    expect(useAppStore.getState().focusCommit).toBeNull();
  });

  it("typing Space/Enter while renaming does not bubble into the row's own Enter/Space activation", async () => {
    renderWithProviders(<Sidebar />);
    const login = await screen.findByRole("button", { name: "login" });
    fireEvent.contextMenu(login);
    fireEvent.click(screen.getByText("Renomear login…"));
    const input = screen.getByDisplayValue("login") as HTMLInputElement;
    // The row itself now has onKeyDown={activateOnKeyDown}, which calls
    // preventDefault() on Enter/Space to fire a synthetic click. If the rename
    // input's keydown were allowed to bubble there, that preventDefault would
    // also suppress the browser's native "insert this character" behavior —
    // i.e. typing a space while renaming would silently stop working.
    const spaceEvent = createEvent.keyDown(input, { key: " " });
    fireEvent(input, spaceEvent);
    expect(spaceEvent.defaultPrevented).toBe(false);
  });
});
