import { type KeyboardEvent } from "react";
import type { RepoGroup } from "../../state/appStore";
import { groupColor } from "../../lib/groupColors";
import { activateOnKeyDown } from "../../components/ui/keys";
import { useT } from "../../i18n";
import type { RepoInfo } from "../../lib/types";

// Repo tabs: a real accessible tablist (role=tablist/tab, roving tabindex,
// Left/Right/Home/End move focus, Enter/Space or click selects). Built by
// hand — rather than the generic <Tabs> primitive — because the strip also
// needs a per-tab close ✕ button and group chips interleaved between tabs,
// neither of which the flat, single-button-per-item <Tabs> can render; the
// roving-tabindex contract below matches it exactly. The set spans every
// CURRENTLY VISIBLE tab (grouped + ungrouped, respecting collapse) so arrow
// keys move seamlessly across group boundaries.
//
// The roving-focus memory (`tabRefs` + `focusedTab`) is OWNED BY Titlebar and
// passed down: Titlebar renders this strip only in tab mode (`!rail`), and the
// rail/tabs layout is live-toggleable (Settings → Aparência), so keeping that
// state here would reset the keyboard-focused tab every time the user flipped
// the layout and back. Lifting it to the always-mounted parent preserves it —
// same reasoning as Sidebar's shared `openFolders`.
export function TabStrip({
  repo,
  repos,
  groups,
  groupOf,
  tabRefs,
  focusedTab,
  setFocusedTab,
  onSwitchRepo,
  onRequestCloseRepo,
  onTabContextMenu,
  onToggleGroupCollapsed,
  onOpenPicker,
}: {
  repo: RepoInfo;
  repos: RepoInfo[];
  groups: RepoGroup[];
  groupOf: Record<string, string | undefined>;
  tabRefs: { current: Record<string, HTMLButtonElement | null> };
  focusedTab: string;
  setFocusedTab: (path: string) => void;
  onSwitchRepo: (path: string) => void;
  onRequestCloseRepo: (path: string) => void;
  onTabContextMenu: (x: number, y: number, kind: "repo" | "group", id: string) => void;
  onToggleGroupCollapsed: (id: string) => void;
  onOpenPicker: () => void;
}) {
  const t = useT();
  const ungrouped = repos.filter((r) => !groupOf[r.path] || !groups.some((g) => g.id === groupOf[r.path]));

  const visibleTabOrder = [
    ...groups.flatMap((g) => {
      if (g.collapsed) return [];
      return repos.filter((r) => groupOf[r.path] === g.id).map((r) => r.path);
    }),
    ...ungrouped.map((r) => r.path),
  ];
  // If the focus target isn't currently rendered (its group is collapsed),
  // fall back to the first visible tab so roving tabindex always lands one
  // real tab at index 0 instead of stranding every tab at -1.
  const effectiveFocusedTab = visibleTabOrder.includes(focusedTab) ? focusedTab : visibleTabOrder[0];

  const moveTabFocus = (delta: number) => {
    if (visibleTabOrder.length === 0) return;
    const from = visibleTabOrder.indexOf(effectiveFocusedTab);
    const base = from === -1 ? 0 : from;
    const next = visibleTabOrder[(base + delta + visibleTabOrder.length) % visibleTabOrder.length];
    tabRefs.current[next]?.focus();
  };

  const onTabKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    switch (e.key) {
      case "ArrowRight":
        e.preventDefault();
        moveTabFocus(1);
        break;
      case "ArrowLeft":
        e.preventDefault();
        moveTabFocus(-1);
        break;
      case "Home":
        e.preventDefault();
        tabRefs.current[visibleTabOrder[0]]?.focus();
        break;
      case "End":
        e.preventDefault();
        tabRefs.current[visibleTabOrder[visibleTabOrder.length - 1]]?.focus();
        break;
      case "Enter":
      case " ":
        activateOnKeyDown(e);
        break;
    }
  };

  // One repo tab. Used flat and inside group containers.
  function tabEl(r: RepoInfo, i: number) {
    const active = r.path === repo.path;
    const name = r.path.replace(/[/\\]$/, "").split(/[/\\]/).pop() ?? r.path;
    return (
      <div
        key={r.path}
        className="gs-row"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 7,
          padding: "5px var(--sp-3) 5px var(--sp-5)",
          borderRadius: "var(--r-btn)",
          border: `1px solid ${active ? "var(--btnB)" : "transparent"}`,
          background: active ? "var(--sel)" : undefined,
          minWidth: 0,
        }}
      >
        <button
          type="button"
          role="tab"
          ref={(el) => {
            tabRefs.current[r.path] = el;
          }}
          id={`repo-tab-${r.path}`}
          aria-selected={active}
          tabIndex={r.path === effectiveFocusedTab ? 0 : -1}
          onFocus={() => setFocusedTab(r.path)}
          onClick={() => onSwitchRepo(r.path)}
          onKeyDown={onTabKeyDown}
          onContextMenu={(e) => {
            e.preventDefault();
            onTabContextMenu(e.clientX, e.clientY, "repo", r.path);
          }}
          title={t("shell.tab.rightClickGroups", { path: r.path })}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 7,
            minWidth: 0,
            background: "transparent",
            border: "none",
            padding: 0,
            cursor: "pointer",
            fontFamily: "inherit",
            textAlign: "left",
          }}
        >
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: `var(--l${i % 3})`, flexShrink: 0 }} />
          <span style={{ fontSize: "var(--fs-btn)", fontWeight: active ? "var(--fw-semibold)" : "var(--fw-regular)", color: active ? "var(--text)" : "var(--text2)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {name}
          </span>
          <span className="gs-resp-tabbr" style={{ fontFamily: "var(--font-mono)", fontSize: "var(--fs-label)", color: "var(--muted)", whiteSpace: "nowrap" }}>
            {active ? repo.current_branch : r.current_branch}
          </span>
        </button>
        <button
          type="button"
          onClick={() => onRequestCloseRepo(r.path)}
          title={t("common.close")}
          aria-label={t("shell.tab.close", { name })}
          className="gs-row gs-press-97"
          style={{ width: 16, height: 16, borderRadius: "var(--r-xs)", display: "grid", placeItems: "center", color: "var(--muted)", fontSize: 10, flexShrink: 0, background: "transparent", border: "none", padding: 0, cursor: "pointer", fontFamily: "inherit" }}
        >
          ✕
        </button>
      </div>
    );
  }

  return (
    <div
      data-tauri-drag-region
      role="tablist"
      aria-label={t("shell.tabs.aria")}
      style={{ height: 38, display: "flex", alignItems: "center", gap: 5, padding: "0 var(--sp-5)", borderTop: "1px solid var(--bsoft)", minWidth: 0, overflowX: "auto", overflowY: "hidden", scrollbarWidth: "thin", animation: "fadeUp 0.25s ease both" }}
    >
      {groups.map((g) => {
        const members = repos.filter((r) => groupOf[r.path] === g.id);
        if (members.length === 0) return null;
        const gc = groupColor(g.color);
        return (
          <div
            key={g.id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 3,
              padding: 3,
              borderRadius: "var(--r-lg)",
              border: `1px solid ${gc.bd}`,
              background: g.collapsed ? gc.bg : undefined,
              flexShrink: 0,
            }}
          >
            <button
              type="button"
              onClick={() => onToggleGroupCollapsed(g.id)}
              onKeyDown={activateOnKeyDown}
              onContextMenu={(e) => {
                e.preventDefault();
                onTabContextMenu(e.clientX, e.clientY, "group", g.id);
              }}
              title={t("shell.group.toggleTooltip", { action: g.collapsed ? t("shell.expand") : t("shell.collapse") })}
              aria-expanded={!g.collapsed}
              className="gs-press-97"
              style={{ fontSize: "var(--fs-2xs)", fontWeight: "var(--fw-bold)", padding: "3px 9px", borderRadius: "var(--r-md)", background: gc.bg, color: gc.fg, cursor: "pointer", whiteSpace: "nowrap", border: "none", fontFamily: "inherit" }}
            >
              {g.name} · {members.length}
            </button>
            {!g.collapsed && members.map((r) => tabEl(r, repos.indexOf(r)))}
          </div>
        );
      })}
      {ungrouped.map((r) => tabEl(r, repos.indexOf(r)))}
      <button
        type="button"
        onClick={onOpenPicker}
        onKeyDown={activateOnKeyDown}
        className="gs-lift gs-press-97"
        title={t("shell.openRepo")}
        aria-label={t("shell.openRepo")}
        style={{ width: 32, height: 32, borderRadius: "var(--r-btn)", display: "grid", placeItems: "center", color: "var(--muted)", fontSize: 15, cursor: "pointer", flexShrink: 0, background: "transparent", border: "none", padding: 0, fontFamily: "inherit" }}
      >
        +
      </button>
    </div>
  );
}
