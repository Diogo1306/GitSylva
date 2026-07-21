import { useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAppStore } from "../../state/appStore";
import { useStatus, queryKeys, useSyncActions } from "../../state/queries";
import { useThemeStore } from "../../state/themeStore";
import { discardAll } from "../../lib/api";
import { spawnLeaf } from "../../lib/leaf";
import { toast } from "../../state/toastStore";
import { notify } from "../../state/notificationStore";
import { fetchFailureNotice } from "../../lib/errors";
import { Wordmark } from "../../components/Wordmark";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { ContextMenu, type MenuItem } from "../../components/ui/ContextMenu";
import { GroupEditModal } from "./GroupEditModal";
import { isMac, comboHint } from "../../lib/platform";
import { useShortcutsStore } from "../../state/shortcutsStore";
import { useT } from "../../i18n";
import { TrafficLights, WinControls } from "./WindowControls";
import { TitlebarTools } from "./TitlebarTools";
import { TabStrip } from "./TabStrip";

export { WinControls };

export function Titlebar({ rail = false }: { rail?: boolean }) {
  const t = useT();
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
  // Roving-tabindex focus memory for the repo tab strip. It lives HERE, not in
  // TabStrip, because Titlebar renders the strip only in tab mode (`!rail`) and
  // the rail/tabs layout is live-toggleable (Settings → Aparência); owning it in
  // TabStrip would reset the keyboard-focused tab every time the user flipped the
  // layout. Passed down to TabStrip, which stays a controlled child for it.
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [focusedTab, setFocusedTab] = useState(repo.path);
  // The search hint follows the rebindable palette shortcut and the platform
  // (Ctrl+K on Windows/Linux, ⌘K on macOS) — it was a hardcoded ⌘K before.
  const paletteHint = comboHint(useShortcutsStore((s) => s.bindings.palette));
  // Task 14: same treatment for Fetch's tooltip hint.
  const fetchHint = comboHint(useShortcutsStore((s) => s.bindings.fetch));

  const files = data ?? [];
  const unstaged = files.filter((f) => f.worktree_status !== ".").length;

  function refresh() {
    // The ⟳ fetches origin; on failure (no remote/credentials) still reload local.
    // Repeated clicks while a fetch is in flight must not queue more fetches.
    if (sync.fetch.isPending) return;
    const name = repo.path.replace(/[/\\]$/, "").split(/[/\\]/).pop() ?? repo.path;
    sync.fetch.mutate(undefined, {
      onSuccess: () => {
        spawnLeaf();
        notify(t("shell.fetch.doneTitle"), `origin · ${name}`, "success", "fetch");
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
      toast(t("shell.discard.nothing"));
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
      toast(t("shell.discard.done"));
    } catch (e: unknown) {
      toast((e as { message?: string })?.message ?? t("shell.error.discard"), "error");
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

      <TitlebarTools
        fetchPending={sync.fetch.isPending}
        onFetch={refresh}
        fetchHint={fetchHint}
        unstaged={unstaged}
        onDiscardClick={onDiscardClick}
        paletteHint={paletteHint}
        onOpenPalette={() => setPaletteOpen(true)}
        onOpenSettings={() => setView("settings")}
      />

      {!isMac && <WinControls />}
    </div>

    {/* Row 2 (tab mode only): the whole width belongs to the repo tabs.
        Grouped exactly like the rail (spec: groups work identically): chip
        toggles collapse, right-click opens options. Horizontal scroll keeps
        every tab reachable; empty space still drags the window.
        fadeUp on appear = animation spec §"Tab bar appear". */}
    {!rail && (
      <TabStrip
        repo={repo}
        repos={repos}
        groups={groups}
        groupOf={groupOf}
        tabRefs={tabRefs}
        focusedTab={focusedTab}
        setFocusedTab={setFocusedTab}
        onSwitchRepo={switchRepo}
        onRequestCloseRepo={requestCloseRepo}
        onTabContextMenu={(x, y, kind, id) => setTabMenu({ x, y, kind, id })}
        onToggleGroupCollapsed={toggleGroupCollapsed}
        onOpenPicker={() => setView("picker")}
      />
    )}

      {tabMenu &&
        (() => {
          if (tabMenu.kind === "group") {
            const members = repos.filter((r) => groupOf[r.path] === tabMenu.id);
            const items: MenuItem[] = [
              { label: t("shell.group.editNameColor"), onClick: () => setEditGroup(tabMenu.id) },
              {
                label: t("shell.group.closeAllTabs", { count: members.length }),
                danger: true,
                onClick: () => members.forEach((r) => closeRepo(r.path)),
              },
              { label: t("shell.group.deleteKeepTabs"), onClick: () => removeGroup(tabMenu.id) },
            ];
            return <ContextMenu x={tabMenu.x} y={tabMenu.y} items={items} onClose={() => setTabMenu(null)} />;
          }
          const path = tabMenu.id;
          const items: MenuItem[] = [
            { label: t("shell.group.newWithRepo"), onClick: () => { const id = addGroup(t("shell.group.defaultName")); setRepoGroup(path, id); } },
            ...groups.map((g) => ({ label: t("shell.group.moveTo", { name: g.name }), onClick: () => setRepoGroup(path, g.id) })),
          ];
          if (groupOf[path]) items.push({ label: t("shell.group.removeFrom"), onClick: () => setRepoGroup(path, undefined) });
          return <ContextMenu x={tabMenu.x} y={tabMenu.y} items={items} onClose={() => setTabMenu(null)} />;
        })()}

      {confirmDiscard && (() => {
        const untracked = files.filter((f) => f.worktree_status === "?").length;
        const message =
          t("shell.discard.confirmCount", { count: unstaged }) +
          (untracked > 0 ? t("shell.discard.confirmUntracked", { count: untracked }) : "") +
          t("shell.discard.confirmTail");
        return (
          <ConfirmDialog
            message={message}
            onCancel={() => setConfirmDiscard(false)}
            onConfirm={doDiscardAll}
          />
        );
      })()}

      {editGroup && <GroupEditModal groupId={editGroup} onClose={() => setEditGroup(null)} />}

      {pendingClose && (
        <ConfirmDialog
          message={t("shell.close.busyMessage")}
          confirmLabel={t("common.close")}
          onCancel={cancelCloseRepo}
          onConfirm={confirmCloseRepo}
        />
      )}
    </div>
  );
}
