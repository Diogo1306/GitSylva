import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Titlebar } from "./Titlebar";
import { useAppStore } from "../../state/appStore";
import type { RepoInfo } from "../../lib/types";

// Semantic/keyboard migration (Task 3): the repo tab strip must expose real,
// Tab-reachable role="tab" controls with roving tabindex and Left/Right arrow
// navigation between open repos, while the strip stays inside the Tauri drag
// region and the per-tab close control keeps working. The titlebar settings
// button (kept after the Sidebar "Definições" dedup) must be a real, labeled,
// keyboard-focusable >=32px button with a visible tooltip.

vi.mock("../../lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../lib/api")>();
  return { ...actual, getStatus: vi.fn().mockResolvedValue([]) };
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
  useAppStore.setState({
    repo: repoA,
    repos: [repoA, repoB, repoC],
    groups: [],
    groupOf: {},
  });
});

afterEach(() => {
  cleanup();
  useAppStore.setState({ repo: null, repos: [], groups: [], groupOf: {} });
});

describe("Titlebar repo tab strip: keyboard", () => {
  it("renders each open repo as a real, Tab-reachable role=tab button", () => {
    renderTitlebar();
    const a = screen.getByRole("tab", { name: /repo-a/ });
    const b = screen.getByRole("tab", { name: /repo-b/ });
    expect(a.tagName).toBe("BUTTON");
    expect(b.tagName).toBe("BUTTON");
  });

  it("wraps the repo tabs in a labeled role=tablist container", () => {
    renderTitlebar();
    const tablist = screen.getByRole("tablist", { name: "Repositórios abertos" });
    // Every repo tab lives inside the tablist (WAI-ARIA tab pattern).
    const tabsInList = within(tablist).getAllByRole("tab");
    expect(tabsInList).toHaveLength(3);
    for (const path of ["/repo-a", "/repo-b", "/repo-c"]) {
      expect(within(tablist).getByRole("tab", { name: new RegExp(path.slice(1)) })).toBeTruthy();
    }
  });

  it("marks the active repo's tab with aria-selected=true and the rest false", () => {
    renderTitlebar();
    expect(screen.getByRole("tab", { name: /repo-a/ }).getAttribute("aria-selected")).toBe("true");
    expect(screen.getByRole("tab", { name: /repo-b/ }).getAttribute("aria-selected")).toBe("false");
  });

  it("gives the active tab roving tabindex 0 and the rest -1", () => {
    renderTitlebar();
    expect((screen.getByRole("tab", { name: /repo-a/ }) as HTMLButtonElement).tabIndex).toBe(0);
    expect((screen.getByRole("tab", { name: /repo-b/ }) as HTMLButtonElement).tabIndex).toBe(-1);
  });

  it("ArrowRight/ArrowLeft move focus between repo tabs", () => {
    renderTitlebar();
    const a = screen.getByRole("tab", { name: /repo-a/ });
    const b = screen.getByRole("tab", { name: /repo-b/ });
    const c = screen.getByRole("tab", { name: /repo-c/ });
    a.focus();
    fireEvent.keyDown(a, { key: "ArrowRight" });
    expect(document.activeElement).toBe(b);
    fireEvent.keyDown(b, { key: "ArrowRight" });
    expect(document.activeElement).toBe(c);
    fireEvent.keyDown(c, { key: "ArrowLeft" });
    expect(document.activeElement).toBe(b);
    // Wraps around.
    fireEvent.keyDown(a, { key: "ArrowLeft" });
  });

  it("Home/End jump to the first/last repo tab", () => {
    renderTitlebar();
    const a = screen.getByRole("tab", { name: /repo-a/ });
    const c = screen.getByRole("tab", { name: /repo-c/ });
    a.focus();
    fireEvent.keyDown(a, { key: "End" });
    expect(document.activeElement).toBe(c);
    fireEvent.keyDown(c, { key: "Home" });
    expect(document.activeElement).toBe(a);
  });

  it("clicking a tab switches the active repo", () => {
    renderTitlebar();
    fireEvent.click(screen.getByRole("tab", { name: /repo-b/ }));
    expect(useAppStore.getState().repo?.path).toBe("/repo-b");
  });

  it("Enter activates the focused tab (switches repo)", () => {
    renderTitlebar();
    const b = screen.getByRole("tab", { name: /repo-b/ });
    b.focus();
    fireEvent.keyDown(b, { key: "Enter" });
    expect(useAppStore.getState().repo?.path).toBe("/repo-b");
  });

  it("keeps the tab strip inside a Tauri drag region", () => {
    renderTitlebar();
    const tab = screen.getByRole("tab", { name: /repo-a/ });
    expect(tab.closest("[data-tauri-drag-region]")).toBeTruthy();
  });

  it("closing a tab via its close control removes it without switching the active repo", () => {
    renderTitlebar();
    fireEvent.click(screen.getByRole("button", { name: /Fechar.*repo-b/i }));
    expect(useAppStore.getState().repos.some((r) => r.path === "/repo-b")).toBe(false);
    expect(useAppStore.getState().repo?.path).toBe("/repo-a");
  });

  it("does not disable the outline inline on a repo tab (focus ring must survive)", () => {
    renderTitlebar();
    expect((screen.getByRole("tab", { name: /repo-a/ }) as HTMLElement).style.outline).not.toBe("none");
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
    const width = parseFloat(String(btn.style.width));
    const height = parseFloat(String(btn.style.height));
    expect(width).toBeGreaterThanOrEqual(32);
    expect(height).toBeGreaterThanOrEqual(32);
  });

  it("opens the Definições view on click", () => {
    renderTitlebar();
    fireEvent.click(screen.getByRole("button", { name: "Definições" }));
    expect(useAppStore.getState().view).toBe("settings");
  });
});

// Task 6 ("Layout na janela mínima"): a couple of the titlebar's remaining
// under-32px icon buttons flagged by the audit, bumped alongside it.
describe("Titlebar: hit targets (Task 6)", () => {
  it("the terminal button clears a 32px click target", () => {
    renderTitlebar();
    const btn = screen.getByRole("button", { name: "Abrir terminal" }) as HTMLElement;
    expect(parseFloat(String(btn.style.width))).toBeGreaterThanOrEqual(32);
    expect(parseFloat(String(btn.style.height))).toBeGreaterThanOrEqual(32);
  });

  it("the 'Abrir repositório' tab-bar button clears a 32px click target", () => {
    renderTitlebar();
    const btn = screen.getByRole("button", { name: "Abrir repositório" }) as HTMLElement;
    expect(parseFloat(String(btn.style.width))).toBeGreaterThanOrEqual(32);
    expect(parseFloat(String(btn.style.height))).toBeGreaterThanOrEqual(32);
  });
});
