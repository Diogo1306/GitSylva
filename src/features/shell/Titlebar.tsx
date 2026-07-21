import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAppStore } from "../../state/appStore";
import { useStatus, queryKeys, useSyncActions } from "../../state/queries";
import { useThemeStore } from "../../state/themeStore";
import { discardAll } from "../../lib/api";
import { winMinimize, winToggleMaximize, winClose, winIsMaximized } from "../../lib/window";
import { spawnLeaf } from "../../lib/leaf";
import { toast } from "../../state/toastStore";
import { notify } from "../../state/notificationStore";
import { fetchFailureNotice } from "../../lib/errors";
import { Wordmark } from "../../components/Wordmark";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { ContextMenu, type MenuItem } from "../../components/ui/ContextMenu";
import { Tooltip } from "../../components/ui/Tooltip";
import { activateOnKeyDown } from "../../components/ui/keys";
import { GroupEditModal } from "./GroupEditModal";
import { groupColor } from "../../lib/groupColors";
import { isMac, comboHint } from "../../lib/platform";
import { useShortcutsStore } from "../../state/shortcutsStore";
import type { RepoInfo } from "../../lib/types";

const mono = "'JetBrains Mono', monospace";

// macOS: traffic lights on the left. Minimize is the plain native one — the
// handoff's mac-style shrink animation was cut on user request (R5.2).
function TrafficLights() {
  const light = (bg: string, glyph: string, onClick: () => void, title: string) => (
    <button
      type="button"
      className="gs-light"
      onClick={onClick}
      onKeyDown={activateOnKeyDown}
      title={title}
      aria-label={title}
      style={{
        width: 12,
        height: 12,
        borderRadius: "50%",
        background: bg,
        display: "grid",
        placeItems: "center",
        cursor: "pointer",
        border: "none",
        padding: 0,
        fontFamily: "inherit",
      }}
    >
      <span>{glyph}</span>
    </button>
  );
  return (
    <div className="gs-lights" style={{ display: "flex", gap: 8, flexShrink: 0 }}>
      {light("#FF5F57", "✕", () => void winClose(), "Fechar")}
      {light("#FEBC2E", "–", () => void winMinimize(), "Minimizar")}
      {light("#28C840", "+", () => void winToggleMaximize(), "Maximizar")}
    </div>
  );
}

// Windows: min / max-restore / close on the RIGHT; close hover turns red
// (#E81123) per the interaction spec. Exported: the no-repo picker shell and
// other bare screens need the same controls.
export function WinControls() {
  const [maxed, setMaxed] = useState(false);
  useEffect(() => {
    void winIsMaximized().then(setMaxed);
  }, []);
  const btn = (glyph: React.ReactNode, onClick: () => void, title: string, close = false) => (
    <button
      type="button"
      onClick={onClick}
      onKeyDown={activateOnKeyDown}
      title={title}
      aria-label={title}
      className={close ? "gs-winclose" : "gs-winbtn"}
      style={{ width: 40, height: 30, display: "grid", placeItems: "center", cursor: "pointer", fontSize: 11, color: "var(--text2)", borderRadius: 6, border: "none", background: "transparent", padding: 0, fontFamily: "inherit" }}
    >
      {glyph}
    </button>
  );
  return (
    <div style={{ display: "flex", flexShrink: 0, marginLeft: 2 }}>
      {btn("—", () => void winMinimize(), "Minimizar")}
      {btn(
        maxed ? "❐" : "▢",
        () => {
          void winToggleMaximize().then(() => winIsMaximized().then(setMaxed));
        },
        maxed ? "Restaurar" : "Maximizar",
      )}
      {btn("✕", () => void winClose(), "Fechar", true)}
    </div>
  );
}

function Tool({
  onClick,
  title,
  stub,
  children,
  bareLabel,
  ...rest
}: {
  onClick?: () => void;
  title: string;
  stub?: boolean;
  children: React.ReactNode;
  // Task 14: when wrapped in the custom Tooltip primitive (which already
  // surfaces the label on hover/focus), skip the native title attribute so
  // mouse users don't get two overlapping tooltips.
  bareLabel?: boolean;
} & React.HTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      onClick={stub ? undefined : onClick}
      onKeyDown={(e) => !stub && activateOnKeyDown(e)}
      disabled={stub}
      title={stub ? `${title} · em breve` : bareLabel ? undefined : title}
      aria-label={title}
      className={stub ? "gs-stub" : "gs-lift"}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        padding: "6px 11px",
        borderRadius: 8,
        background: "var(--btn)",
        border: "1px solid var(--btnB)",
        fontSize: 12.5,
        color: "var(--btnT)",
        cursor: stub ? "default" : "pointer",
        whiteSpace: "nowrap",
        boxSizing: "border-box",
        fontFamily: "inherit",
      }}
      {...rest}
    >
      {children}
    </button>
  );
}

export function Titlebar({ rail = false }: { rail?: boolean }) {
  const repo = useAppStore((s) => s.repo)!;
  const repos = useAppStore((s) => s.repos);
  const switchRepo = useAppStore((s) => s.switchRepo);
  const closeRepo = useAppStore((s) => s.closeRepo);
  const requestCloseRepo = useAppStore((s) => s.requestCloseRepo);
  const pendingClose = useAppStore((s) => s.pendingClose);
  const confirmCloseRepo = useAppStore((s) => s.confirmCloseRepo);
  const cancelCloseRepo = useAppStore((s) => s.cancelCloseRepo);
  const setView = useAppStore((s) => s.setView);
  const setPaletteOpen = useAppStore((s) => s.setPaletteOpen);
  const qc = useQueryClient();
  const { data } = useStatus(repo.path);
  const sync = useSyncActions(repo.path);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const groups = useAppStore((s) => s.groups);
  const groupOf = useAppStore((s) => s.groupOf);
  const addGroup = useAppStore((s) => s.addGroup);
  const removeGroup = useAppStore((s) => s.removeGroup);
  const toggleGroupCollapsed = useAppStore((s) => s.toggleGroupCollapsed);
  const setRepoGroup = useAppStore((s) => s.setRepoGroup);
  const [tabMenu, setTabMenu] = useState<{ x: number; y: number; kind: "repo" | "group"; id: string } | null>(null);
  const [editGroup, setEditGroup] = useState<string | null>(null);
  // The search hint follows the rebindable palette shortcut and the platform
  // (Ctrl+K on Windows/Linux, ⌘K on macOS) — it was a hardcoded ⌘K before.
  const paletteHint = comboHint(useShortcutsStore((s) => s.bindings.palette));
  // Task 14: same treatment for Fetch's tooltip hint.
  const fetchHint = comboHint(useShortcutsStore((s) => s.bindings.fetch));

  const files = data ?? [];
  const unstaged = files.filter((f) => f.worktree_status !== ".").length;
  const ungrouped = repos.filter((r) => !groupOf[r.path] || !groups.some((g) => g.id === groupOf[r.path]));

  // Repo tabs: a real accessible tablist (role=tablist/tab, roving tabindex,
  // Left/Right/Home/End move focus, Enter/Space or click selects). Built by
  // hand — rather than the generic <Tabs> primitive — because the strip also
  // needs a per-tab close ✕ button and group chips interleaved between tabs,
  // neither of which the flat, single-button-per-item <Tabs> can render; the
  // roving-tabindex contract below matches it exactly. The set spans every
  // CURRENTLY VISIBLE tab (grouped + ungrouped, respecting collapse) so arrow
  // keys move seamlessly across group boundaries.
  const visibleTabOrder = [
    ...groups.flatMap((g) => {
      if (g.collapsed) return [];
      return repos.filter((r) => groupOf[r.path] === g.id).map((r) => r.path);
    }),
    ...ungrouped.map((r) => r.path),
  ];
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [focusedTab, setFocusedTab] = useState(repo.path);
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
          padding: "5px 8px 5px 12px",
          borderRadius: 8,
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
          onClick={() => switchRepo(r.path)}
          onKeyDown={onTabKeyDown}
          onContextMenu={(e) => {
            e.preventDefault();
            setTabMenu({ x: e.clientX, y: e.clientY, kind: "repo", id: r.path });
          }}
          title={`${r.path} · botão direito para grupos`}
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
          <span style={{ fontSize: 12.5, fontWeight: active ? 600 : 400, color: active ? "var(--text)" : "var(--text2)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {name}
          </span>
          <span className="gs-resp-tabbr" style={{ fontFamily: mono, fontSize: 10.5, color: "var(--muted)", whiteSpace: "nowrap" }}>
            {active ? repo.current_branch : r.current_branch}
          </span>
        </button>
        <button
          type="button"
          onClick={() => requestCloseRepo(r.path)}
          title="Fechar"
          aria-label={`Fechar ${name}`}
          className="gs-row"
          style={{ width: 16, height: 16, borderRadius: 5, display: "grid", placeItems: "center", color: "var(--muted)", fontSize: 10, flexShrink: 0, background: "transparent", border: "none", padding: 0, cursor: "pointer", fontFamily: "inherit" }}
        >
          ✕
        </button>
      </div>
    );
  }

  function refresh() {
    // The ⟳ fetches origin; on failure (no remote/credentials) still reload local.
    // Repeated clicks while a fetch is in flight must not queue more fetches.
    if (sync.fetch.isPending) return;
    const name = repo.path.replace(/[/\\]$/, "").split(/[/\\]/).pop() ?? repo.path;
    sync.fetch.mutate(undefined, {
      onSuccess: () => {
        spawnLeaf();
        notify("Fetch concluído", `origin · ${name}`, "success", "fetch");
      },
      onError: (e: unknown) => {
        qc.invalidateQueries({ queryKey: queryKeys.status(repo.path) });
        qc.invalidateQueries({ queryKey: queryKeys.log(repo.path) });
        const n = fetchFailureNotice(e);
        notify(n.title, n.sub, "error", "fetch");
      },
    });
  }

  function onDiscardClick() {
    if (unstaged === 0) {
      toast("Sem alterações para descartar");
      return;
    }
    if (useThemeStore.getState().confirmDiscard) setConfirmDiscard(true);
    else void doDiscardAll();
  }

  async function doDiscardAll() {
    setConfirmDiscard(false);
    try {
      await discardAll(repo.path);
      qc.invalidateQueries({ queryKey: queryKeys.status(repo.path) });
      toast("Alterações não preparadas descartadas");
    } catch (e: unknown) {
      toast((e as { message?: string })?.message ?? "não foi possível descartar", "error");
    }
  }

  return (
    <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", borderBottom: "1px solid var(--border)", background: "var(--panel)" }}>
    {/* Row 1: wordmark + a wide empty strip to grab the window with + tools.
        In tab mode the tabs moved to their own full-width row below (user
        request R5: more room to drag, more room for tabs). */}
    <div
      data-tauri-drag-region
      style={{
        height: rail ? 50 : 40,
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "0 10px 0 16px",
      }}
    >
      {isMac && <TrafficLights />}

      {/* pointerEvents none: clicks fall through to the drag region, so the
          wordmark itself is also a grab handle. */}
      <div style={{ flexShrink: 0, pointerEvents: "none" }}>
        <Wordmark size={17} />
      </div>

      {/* Repo/branch já vive na barra inferior — repeti-los aqui em modo rail
          duplicava a informação (R5.28). A faixa fica toda para arrastar. */}
      <div data-tauri-drag-region style={{ flex: 1, alignSelf: "stretch" }} />

      <div style={{ display: "flex", gap: 6, alignItems: "center", flexShrink: 0 }}>
        <Tooltip content="Fetch de origin" shortcut={fetchHint}>
          <Tool onClick={refresh} title="Fetch de origin" bareLabel>
            <span style={{ fontSize: 14, lineHeight: 1, display: "inline-block", animation: sync.fetch.isPending ? "spin 0.8s linear infinite" : "none" }}>⟳</span>
            {sync.fetch.isPending ? "A obter…" : "Fetch"}
          </Tool>
        </Tooltip>
        <Tool onClick={onDiscardClick} title="Descartar alterações não preparadas">
          ↩ Descartar
          {unstaged > 0 && (
            <span
              style={{
                background: "var(--stMB)",
                color: "var(--stMT)",
                borderRadius: 999,
                fontSize: 10.5,
                fontWeight: 700,
                padding: "1px 6px",
              }}
            >
              {unstaged}
            </span>
          )}
        </Tool>
        <button
          type="button"
          onClick={() => toast("Terminal integrado chega numa próxima fase")}
          onKeyDown={activateOnKeyDown}
          className="gs-lift"
          title="Abrir terminal"
          aria-label="Abrir terminal"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 32,
            height: 32,
            borderRadius: 8,
            background: "var(--btn)",
            border: "1px solid var(--btnB)",
            color: "var(--btnT)",
            fontFamily: mono,
            fontSize: 11,
            cursor: "pointer",
            padding: 0,
          }}
        >
          &gt;_
        </button>
        <Tooltip content="Pesquisar" shortcut={paletteHint}>
          <button
            type="button"
            onClick={() => setPaletteOpen(true)}
            onKeyDown={activateOnKeyDown}
            className="gs-lift"
            aria-label={`Pesquisar (${paletteHint})`}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "6px 11px",
              borderRadius: 8,
              background: "var(--input)",
              border: "1px solid var(--btnB)",
              fontSize: 12.5,
              color: "var(--muted)",
              whiteSpace: "nowrap",
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            Pesquisar
            <span style={{ fontFamily: mono, fontSize: 10, border: "1px solid var(--btnB)", borderRadius: 5, padding: "1px 4px" }}>
              {paletteHint}
            </span>
          </button>
        </Tooltip>
        {/* Definições: only entry point left after the Sidebar dedup (that nav
            row duplicated this exact action). Custom Tooltip (not just a
            native title, which never shows on keyboard focus) so keyboard
            users get the same label mouse users see; the target grows to
            32px to clear the minimum hit area (was 30px). */}
        <Tooltip content="Definições">
          <button
            type="button"
            onClick={() => setView("settings")}
            onKeyDown={activateOnKeyDown}
            aria-label="Definições"
            className="gs-lift"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 32,
              height: 32,
              borderRadius: 8,
              background: "var(--btn)",
              border: "1px solid var(--btnB)",
              color: "var(--btnT)",
              cursor: "pointer",
              padding: 0,
              fontFamily: "inherit",
            }}
          >
            <span style={{ width: 11, height: 11, borderRadius: "50%", border: "2.5px dotted currentColor", boxSizing: "border-box" }} />
          </button>
        </Tooltip>
      </div>

      {!isMac && <WinControls />}
    </div>

    {/* Row 2 (tab mode only): the whole width belongs to the repo tabs.
        Grouped exactly like the rail (spec: groups work identically): chip
        toggles collapse, right-click opens options. Horizontal scroll keeps
        every tab reachable; empty space still drags the window.
        fadeUp on appear = animation spec §"Tab bar appear". */}
    {!rail && (
      <div
        data-tauri-drag-region
        role="tablist"
        aria-label="Repositórios abertos"
        style={{ height: 38, display: "flex", alignItems: "center", gap: 5, padding: "0 12px", borderTop: "1px solid var(--bsoft)", minWidth: 0, overflowX: "auto", overflowY: "hidden", scrollbarWidth: "thin", animation: "fadeUp 0.25s ease both" }}
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
                borderRadius: 10,
                border: `1px solid ${gc.bd}`,
                background: g.collapsed ? gc.bg : undefined,
                flexShrink: 0,
              }}
            >
              <button
                type="button"
                onClick={() => toggleGroupCollapsed(g.id)}
                onKeyDown={activateOnKeyDown}
                onContextMenu={(e) => {
                  e.preventDefault();
                  setTabMenu({ x: e.clientX, y: e.clientY, kind: "group", id: g.id });
                }}
                title={`${g.collapsed ? "Expandir" : "Colapsar"} grupo · botão direito para opções`}
                aria-expanded={!g.collapsed}
                style={{ fontSize: 11.5, fontWeight: 700, padding: "3px 9px", borderRadius: 7, background: gc.bg, color: gc.fg, cursor: "pointer", whiteSpace: "nowrap", border: "none", fontFamily: "inherit" }}
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
          onClick={() => setView("picker")}
          onKeyDown={activateOnKeyDown}
          className="gs-lift"
          title="Abrir repositório"
          aria-label="Abrir repositório"
          style={{ width: 32, height: 32, borderRadius: 8, display: "grid", placeItems: "center", color: "var(--muted)", fontSize: 15, cursor: "pointer", flexShrink: 0, background: "transparent", border: "none", padding: 0, fontFamily: "inherit" }}
        >
          +
        </button>
      </div>
    )}

      {tabMenu &&
        (() => {
          if (tabMenu.kind === "group") {
            const members = repos.filter((r) => groupOf[r.path] === tabMenu.id);
            const items: MenuItem[] = [
              { label: "Editar nome e cor…", onClick: () => setEditGroup(tabMenu.id) },
              {
                label: `Fechar todas as abas do grupo (${members.length})`,
                danger: true,
                onClick: () => members.forEach((r) => closeRepo(r.path)),
              },
              { label: "Apagar grupo (mantém as abas)", onClick: () => removeGroup(tabMenu.id) },
            ];
            return <ContextMenu x={tabMenu.x} y={tabMenu.y} items={items} onClose={() => setTabMenu(null)} />;
          }
          const path = tabMenu.id;
          const items: MenuItem[] = [
            { label: "Novo grupo com este repo", onClick: () => { const id = addGroup("Grupo"); setRepoGroup(path, id); } },
            ...groups.map((g) => ({ label: `Mover para “${g.name}”`, onClick: () => setRepoGroup(path, g.id) })),
          ];
          if (groupOf[path]) items.push({ label: "Remover do grupo", onClick: () => setRepoGroup(path, undefined) });
          return <ContextMenu x={tabMenu.x} y={tabMenu.y} items={items} onClose={() => setTabMenu(null)} />;
        })()}

      {confirmDiscard && (
        <ConfirmDialog
          message={`Descartar ${unstaged} alteração(ões) não preparada(s)?${
            files.filter((f) => f.worktree_status === "?").length > 0
              ? ` ${files.filter((f) => f.worktree_status === "?").length} ficheiro(s) não rastreado(s) serão apagados do disco.`
              : ""
          } As alterações preparadas mantêm-se. Esta ação não pode ser desfeita.`}
          onCancel={() => setConfirmDiscard(false)}
          onConfirm={doDiscardAll}
        />
      )}

      {editGroup && <GroupEditModal groupId={editGroup} onClose={() => setEditGroup(null)} />}

      {pendingClose && (
        <ConfirmDialog
          message="Uma operação Git está em curso. Fechar mesmo assim?"
          confirmLabel="Fechar"
          onCancel={cancelCloseRepo}
          onConfirm={confirmCloseRepo}
        />
      )}
    </div>
  );
}
