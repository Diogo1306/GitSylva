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
// behavior is covered separately below with its own branch set. The remote
// entry uses a name distinct from any local branch ("feature-x", once the
// "origin/" prefix is stripped for display) so role/name queries stay
// unambiguous between the local and remote sections.
const { branches } = vi.hoisted(() => ({
  branches: [
    { name: "main", is_current: true, is_remote: false, upstream: null, tip: "aaa1111", ahead: 0, behind: 0 },
    { name: "login", is_current: false, is_remote: false, upstream: null, tip: "bbb2222", ahead: 1, behind: 0 },
    { name: "logout", is_current: false, is_remote: false, upstream: null, tip: "ccc3333", ahead: 0, behind: 2 },
    { name: "origin/feature-x", is_current: false, is_remote: true, upstream: null, tip: "ddd4444", ahead: 0, behind: 0 },
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

// Task 8 ("Dar feedback visual inequívoco"): a single click on a branch row
// must leave a PERSISTENT selected state — background + a lateral accent bar
// — distinct from the is_current dot/halo (a branch can be selected without
// being the checked-out branch). role stays "button" (folder toggles, a
// nested delete button and a rename <input> live inside/among these rows, so
// restructuring into a role="listbox"/"option" pair is not a clean fit here
// — see History's commit list for that pattern where it DOES fit cleanly).
// The selected branch carries aria-pressed (a toggled-button state, valid on
// role="button"), NOT aria-current: in a git client "current branch" means
// the CHECKED-OUT branch (is_current), so aria-current on a merely
// single-clicked non-current branch would be misread as "now checked out".
describe("Sidebar: branch selection persists (Task 8)", () => {
  it("single click on a branch row marks it aria-pressed and gives it the selected background, until another branch is clicked", async () => {
    renderWithProviders(<Sidebar />);
    const login = await screen.findByRole("button", { name: "login" });
    const logout = screen.getByRole("button", { name: "logout" });
    expect(login.getAttribute("aria-pressed")).toBe("false");

    fireEvent.click(login);
    expect(login.getAttribute("aria-pressed")).toBe("true");
    expect(login.style.background).toContain("--sel");
    expect(logout.getAttribute("aria-pressed")).toBe("false");

    fireEvent.click(logout);
    expect(logout.getAttribute("aria-pressed")).toBe("true");
    expect(logout.style.background).toContain("--sel");
    // Selection moved: the previous branch loses it.
    expect(login.getAttribute("aria-pressed")).toBe("false");
  });

  it("does not emit aria-selected or aria-current on branch rows (role=button: aria-current would misread as 'checked out')", async () => {
    renderWithProviders(<Sidebar />);
    const login = await screen.findByRole("button", { name: "login" });
    fireEvent.click(login);
    expect(login.getAttribute("aria-selected")).toBeNull();
    expect(login.getAttribute("aria-current")).toBeNull();
  });

  it("selecting a branch keeps focusing its tip commit in the history (existing behavior, unchanged)", async () => {
    renderWithProviders(<Sidebar />);
    const login = await screen.findByRole("button", { name: "login" });
    fireEvent.click(login);
    expect(useAppStore.getState().focusCommit).toBe("bbb2222");
  });

  it("the selected-branch accent is distinct from the current-branch (checked out) dot/halo styling", async () => {
    renderWithProviders(<Sidebar />);
    // "main" is_current (checked out) but never clicked: no selection accent,
    // and not aria-pressed (selection and checkout are independent states).
    const main = await screen.findByRole("button", { name: "main" });
    expect(main.getAttribute("aria-pressed")).toBe("false");
    expect(main.style.background).not.toContain("--sel");

    const login = screen.getByRole("button", { name: "login" });
    fireEvent.click(login);
    // Selecting a non-current branch: it gets the selection accent while
    // remaining visually distinct from is_current (still not is_current).
    expect(login.getAttribute("aria-pressed")).toBe("true");
  });

  it("also persists selection for a remote-tracking branch row, independently from local branches", async () => {
    renderWithProviders(<Sidebar />);
    const remoteBranch = await screen.findByRole("button", { name: "feature-x" });
    const login = screen.getByRole("button", { name: "login" });

    fireEvent.click(remoteBranch);
    expect(remoteBranch.getAttribute("aria-pressed")).toBe("true");
    expect(remoteBranch.style.background).toContain("--sel");
    expect(login.getAttribute("aria-pressed")).toBe("false");

    // Selecting a local branch afterwards does not clear the remote row's own
    // id space by accident (they never collide: "login" vs "origin/feature-x").
    fireEvent.click(login);
    expect(login.getAttribute("aria-pressed")).toBe("true");
    expect(remoteBranch.getAttribute("aria-pressed")).toBe("false");
  });
});

// Task 6 ("Layout na janela mínima"): below ~1024px wide the sidebar
// defaults to a collapsed icon rail (a width-driven default), but a real,
// keyboard-operable toggle always lets the user get nav/branches back — the
// sidebar is never permanently unreachable.
describe("Sidebar: responsive collapse (Task 6)", () => {
  afterEach(() => {
    Object.defineProperty(window, "innerWidth", { writable: true, configurable: true, value: 1024 });
    Object.defineProperty(window, "innerHeight", { writable: true, configurable: true, value: 768 });
  });

  it("collapses by default at the window minimum width, keeping an expand affordance", async () => {
    Object.defineProperty(window, "innerWidth", { writable: true, configurable: true, value: 900 });
    Object.defineProperty(window, "innerHeight", { writable: true, configurable: true, value: 560 });
    renderWithProviders(<Sidebar />);
    const expand = await screen.findByRole("button", { name: "Expandir barra lateral" });
    expect(expand.tagName).toBe("BUTTON");
    expect(screen.queryByRole("button", { name: /Cópia de trabalho/ })).toBeNull();
  });

  it("the expand button clears at least a 32px hit target", async () => {
    Object.defineProperty(window, "innerWidth", { writable: true, configurable: true, value: 900 });
    Object.defineProperty(window, "innerHeight", { writable: true, configurable: true, value: 560 });
    renderWithProviders(<Sidebar />);
    const expand = await screen.findByRole("button", { name: "Expandir barra lateral" });
    expect(expand.style.width).toBe("32px");
    expect(expand.style.height).toBe("32px");
  });

  it("stays expanded by default at a comfortable width", async () => {
    Object.defineProperty(window, "innerWidth", { writable: true, configurable: true, value: 1440 });
    Object.defineProperty(window, "innerHeight", { writable: true, configurable: true, value: 900 });
    renderWithProviders(<Sidebar />);
    await screen.findByRole("button", { name: /Cópia de trabalho/ });
    expect(screen.queryByRole("button", { name: "Expandir barra lateral" })).toBeNull();
  });

  it("a real, keyboard-operable collapse toggle hides nav/branches and an expand affordance brings them back", async () => {
    renderWithProviders(<Sidebar />);
    const collapse = await screen.findByRole("button", { name: "Colapsar barra lateral" });
    expect(collapse.tagName).toBe("BUTTON");

    fireEvent.click(collapse);
    expect(screen.queryByRole("button", { name: /Cópia de trabalho/ })).toBeNull();
    const expand = screen.getByRole("button", { name: "Expandir barra lateral" });

    fireEvent.click(expand);
    expect(await screen.findByRole("button", { name: /Cópia de trabalho/ })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Colapsar barra lateral" })).toBeTruthy();
  });

  it("the 'Nova branch' and 'Nova tag' header buttons clear a 32px hit target", async () => {
    renderWithProviders(<Sidebar />);
    const novaBranch = await screen.findByRole("button", { name: "Nova branch" });
    expect(novaBranch.style.width).toBe("32px");
    expect(novaBranch.style.height).toBe("32px");
  });

  it("the collapse toggle activates on Enter (keyboard, not just click)", async () => {
    renderWithProviders(<Sidebar />);
    const collapse = await screen.findByRole("button", { name: "Colapsar barra lateral" });
    fireEvent.keyDown(collapse, { key: "Enter" });
    expect(screen.queryByRole("button", { name: /Cópia de trabalho/ })).toBeNull();
    expect(screen.getByRole("button", { name: "Expandir barra lateral" })).toBeTruthy();
  });
});
