import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Titlebar } from "./Titlebar";
import { useAppStore } from "../../state/appStore";
import { useShortcutsStore, DEFAULT_BINDINGS } from "../../state/shortcutsStore";
import { comboHint } from "../../lib/platform";
import type { RepoInfo } from "../../lib/types";

// V2 titlebar: the repo picker is a dropdown (not tabs). Clicking the pill lists
// the open repos and switches on select; `+` opens the picker; each row's `…`
// exposes the close/group actions. The sync/search/settings tools stay real,
// labeled, keyboard-focusable buttons with the platform-correct shortcut hints.

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
});

afterEach(() => {
  cleanup();
  useAppStore.setState({ repo: null, repos: [], groups: [], groupOf: {}, modal: null });
  useShortcutsStore.getState().reset();
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
    fireEvent.click(screen.getByText(/Fechar repo-b/i));
    expect(useAppStore.getState().repos.some((r) => r.path === "/repo-b")).toBe(false);
    expect(useAppStore.getState().repo?.path).toBe("/repo-a");
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
