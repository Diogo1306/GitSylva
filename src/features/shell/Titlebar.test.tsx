import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Titlebar } from "./Titlebar";
import { useAppStore } from "../../state/appStore";
import { useShortcutsStore, DEFAULT_BINDINGS } from "../../state/shortcutsStore";
import { useRecentsStore } from "../../state/recentsStore";
import { usePinnedStore } from "../../state/pinnedStore";
import { comboHint } from "../../lib/platform";
import type { RepoInfo } from "../../lib/types";

// V2 titlebar: the repo picker is a dropdown (not tabs) with three sections —
// ABERTOS, FIXADOS, RECENTES. Clicking the pill lists them and switches/opens
// on select; `+` opens the picker; each row's `…` exposes pin/unpin, reveal,
// copy path and (open repos only) close. The sync tools collapse into a single
// ⇅ Sync menu below 1100px. Everything stays real, labeled, keyboard-focusable
// buttons with the platform-correct shortcut hints.

vi.mock("../../lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../lib/api")>();
  return {
    ...actual,
    getStatus: vi.fn().mockResolvedValue([]),
    syncStatus: vi.fn().mockResolvedValue({ ahead: 0, behind: 0, upstream: null }),
  };
});

const repoA: RepoInfo = { path: "/repo-a", current_branch: "main", head: "aaa", is_empty: false };
const repoB: RepoInfo = { path: "/repo-b", current_branch: "dev", head: "bbb", is_empty: false };
const repoC: RepoInfo = { path: "/repo-c", current_branch: "feat", head: "ccc", is_empty: false };

function renderTitlebar() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <Titlebar />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  window.innerWidth = 1360;
  useAppStore.setState({ repo: repoA, repos: [repoA, repoB, repoC], groups: [], groupOf: {}, view: "history", modal: null, pendingClose: null });
  usePinnedStore.setState({ pinned: [] });
  useRecentsStore.setState({ recents: [] });
});

afterEach(() => {
  cleanup();
  useAppStore.setState({ repo: null, repos: [], groups: [], groupOf: {}, modal: null });
  useShortcutsStore.getState().reset();
  usePinnedStore.setState({ pinned: [] });
  useRecentsStore.setState({ recents: [] });
});

describe("Titlebar repo dropdown", () => {
  it("shows the active repo and branch in the pill", () => {
    renderTitlebar();
    const pill = screen.getByRole("button", { name: /repo-a/ });
    expect(pill.textContent).toContain("repo-a");
    expect(pill.textContent).toContain("main");
  });

  it("opens a menu of the open repos when the pill is clicked", () => {
    renderTitlebar();
    fireEvent.click(screen.getByRole("button", { name: /repo-a/ }));
    const menu = screen.getByRole("menu", { name: "Repositórios abertos" });
    for (const path of ["repo-a", "repo-b", "repo-c"]) {
      expect(within(menu).getByText(path)).toBeTruthy();
    }
  });

  it("switches the active repo when a menu row is clicked", () => {
    renderTitlebar();
    fireEvent.click(screen.getByRole("button", { name: /repo-a/ }));
    const menu = screen.getByRole("menu");
    fireEvent.click(within(menu).getByText("repo-b"));
    expect(useAppStore.getState().repo?.path).toBe("/repo-b");
  });

  it("the + button opens the repo picker", () => {
    renderTitlebar();
    fireEvent.click(screen.getByRole("button", { name: "Abrir repositório" }));
    expect(useAppStore.getState().view).toBe("picker");
  });

  it("has a >=32px + button click target", () => {
    renderTitlebar();
    const btn = screen.getByRole("button", { name: "Abrir repositório" }) as HTMLElement;
    expect(parseFloat(String(btn.style.width))).toBeGreaterThanOrEqual(32);
    expect(parseFloat(String(btn.style.height))).toBeGreaterThanOrEqual(32);
  });

  it("closes a repo from its options menu without switching the active repo", () => {
    renderTitlebar();
    fireEvent.click(screen.getByRole("button", { name: /repo-a/ }));
    // Row order is repo-a, repo-b, repo-c; open repo-b's options.
    const options = screen.getAllByRole("button", { name: "Opções do repositório" });
    fireEvent.click(options[1]);
    fireEvent.click(screen.getByText("Fechar repositório"));
    expect(useAppStore.getState().repos.some((r) => r.path === "/repo-b")).toBe(false);
    expect(useAppStore.getState().repo?.path).toBe("/repo-a");
  });

  it("hides Fechar repositório when it is the only open repo", () => {
    useAppStore.setState({ repos: [repoA], repo: repoA });
    renderTitlebar();
    fireEvent.click(screen.getByRole("button", { name: /repo-a/ }));
    fireEvent.click(screen.getByRole("button", { name: "Opções do repositório" }));
    expect(screen.queryByText("Fechar repositório")).toBeNull();
  });
});

describe("Titlebar repo dropdown — pinned (FIXADOS)", () => {
  it("shows a pinned, closed repo under FIXADOS and not under RECENTES", () => {
    usePinnedStore.setState({ pinned: ["/repo-recent"] });
    useRecentsStore.setState({ recents: [{ path: "/repo-recent", name: "repo-recent", branch: "main" }] });
    renderTitlebar();
    fireEvent.click(screen.getByRole("button", { name: /repo-a/ }));
    const menu = screen.getByRole("menu");
    expect(within(menu).getByText("FIXADOS")).toBeTruthy();
    expect(within(menu).getByText("repo-recent")).toBeTruthy();
    expect(within(menu).queryByText("RECENTES")).toBeNull();
  });

  it("shows a ★ next to an open repo that is also pinned", () => {
    usePinnedStore.setState({ pinned: ["/repo-b"] });
    renderTitlebar();
    fireEvent.click(screen.getByRole("button", { name: /repo-a/ }));
    const menu = screen.getByRole("menu");
    expect(within(menu).getByTitle("Fixado")).toBeTruthy();
  });

  it("Fixar in the row menu pins the repo; the menu then offers Remover dos fixados", () => {
    renderTitlebar();
    fireEvent.click(screen.getByRole("button", { name: /repo-a/ }));
    const options = screen.getAllByRole("button", { name: "Opções do repositório" });
    fireEvent.click(options[0]); // repo-a's row
    fireEvent.click(screen.getByText("Fixar"));
    expect(usePinnedStore.getState().pinned).toContain("/repo-a");

    // Picking the item only closes the `…` menu, not the parent dropdown.
    const optionsAgain = screen.getAllByRole("button", { name: "Opções do repositório" });
    fireEvent.click(optionsAgain[0]);
    expect(screen.getByText("Remover dos fixados")).toBeTruthy();
  });
});

describe("Titlebar sync tools", () => {
  it("Pull opens the pull modal", () => {
    renderTitlebar();
    fireEvent.click(screen.getByRole("button", { name: "Pull de origin" }));
    expect(useAppStore.getState().modal).toBe("pull");
  });

  it("Push opens the push modal", () => {
    renderTitlebar();
    fireEvent.click(screen.getByRole("button", { name: "Push para origin" }));
    expect(useAppStore.getState().modal).toBe("push");
  });
});

describe("Titlebar sync tools — compact (< 1100px)", () => {
  it("collapses Pull/Push/Fetch into a single ⇅ Sync menu and turns Search into an icon", () => {
    window.innerWidth = 1000;
    renderTitlebar();
    expect(screen.queryByRole("button", { name: "Pull de origin" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Push para origin" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Fetch de origin" })).toBeNull();
    expect(screen.getByRole("button", { name: "Fetch · Pull · Push" })).toBeTruthy();
    // Search collapses to a bare icon: accessible name survives, visible text doesn't.
    const searchBtn = screen.getByRole("button", { name: /Pesquisar/ });
    expect(searchBtn.textContent).toBe("");
  });

  it("stays uncollapsed at 1100px and above", () => {
    window.innerWidth = 1100;
    renderTitlebar();
    expect(screen.getByRole("button", { name: "Pull de origin" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Fetch · Pull · Push" })).toBeNull();
  });

  it("the ⇅ Sync menu opens Pull/Push/Fetch actions", () => {
    window.innerWidth = 1000;
    renderTitlebar();
    fireEvent.click(screen.getByRole("button", { name: "Fetch · Pull · Push" }));
    const menu = screen.getByRole("menu", { name: "Fetch · Pull · Push" });
    fireEvent.click(within(menu).getByText(/Pull/));
    expect(useAppStore.getState().modal).toBe("pull");
  });
});

describe("Titlebar settings button", () => {
  it("is a real, labeled, focusable button with a visible tooltip on focus", () => {
    renderTitlebar();
    const btn = screen.getByRole("button", { name: "Definições" });
    expect(btn.tagName).toBe("BUTTON");
    fireEvent.focus(btn);
    expect(screen.getByRole("tooltip").textContent).toContain("Definições");
  });

  it("has a >=32px click target", () => {
    renderTitlebar();
    const btn = screen.getByRole("button", { name: "Definições" }) as HTMLElement;
    expect(parseFloat(String(btn.style.width))).toBeGreaterThanOrEqual(32);
    expect(parseFloat(String(btn.style.height))).toBeGreaterThanOrEqual(32);
  });

  it("opens the Definições view on click", () => {
    renderTitlebar();
    fireEvent.click(screen.getByRole("button", { name: "Definições" }));
    expect(useAppStore.getState().view).toBe("settings");
  });
});

describe("Titlebar: hit targets", () => {
  it("the terminal button clears a 32px click target", () => {
    renderTitlebar();
    const btn = screen.getByRole("button", { name: "Abrir terminal" }) as HTMLElement;
    expect(parseFloat(String(btn.style.width))).toBeGreaterThanOrEqual(32);
    expect(parseFloat(String(btn.style.height))).toBeGreaterThanOrEqual(32);
  });
});

describe("Titlebar: shortcut hint tooltips", () => {
  it("shows the Fetch shortcut hint via the Tooltip primitive on keyboard focus", () => {
    renderTitlebar();
    const fetchBtn = screen.getByRole("button", { name: "Fetch de origin" });
    expect(screen.queryByRole("tooltip")).toBeNull();
    fireEvent.focus(fetchBtn);
    expect(screen.getByRole("tooltip").textContent).toContain(comboHint(DEFAULT_BINDINGS.fetch));
  });

  it("shows the search/palette shortcut hint via the Tooltip primitive on keyboard focus", () => {
    renderTitlebar();
    const searchBtn = screen.getByRole("button", { name: /Pesquisar/ });
    fireEvent.focus(searchBtn);
    expect(screen.getByRole("tooltip").textContent).toContain(comboHint(DEFAULT_BINDINGS.palette));
  });

  it("reflects a rebound Fetch shortcut live (pulled from shortcutsStore, not hardcoded)", () => {
    useShortcutsStore.getState().setBinding("fetch", "mod+9");
    renderTitlebar();
    fireEvent.focus(screen.getByRole("button", { name: "Fetch de origin" }));
    expect(screen.getByRole("tooltip").textContent).toContain(comboHint("mod+9"));
  });
});
