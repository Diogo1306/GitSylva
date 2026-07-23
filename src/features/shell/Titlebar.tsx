import { useQueryClient } from "@tanstack/react-query";
import { useAppStore } from "../../state/appStore";
import { queryKeys, useSyncActions, useSyncStatus } from "../../state/queries";
import { spawnLeaf } from "../../lib/leaf";
import { notify } from "../../state/notificationStore";
import { fetchFailureNotice } from "../../lib/errors";
import { Wordmark } from "../../components/Wordmark";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { isMac, comboHint } from "../../lib/platform";
import { useShortcutsStore } from "../../state/shortcutsStore";
import { useBreakpoint } from "../../lib/useBreakpoint";
import { useT } from "../../i18n";
import { TrafficLights, WinControls } from "./WindowControls";
import { TitlebarTools } from "./TitlebarTools";
import { RepoSelect } from "./RepoSelect";

export { WinControls };

// V2 single-row titlebar: window controls + wordmark + repo dropdown, then the
// sync/search/settings tools. There is no bottom action bar — Pull/Push/Fetch
// live here, Commit lives in the Working Copy, the rest via ⌘K + context menus.
export function Titlebar() {
  const t = useT();
  const repo = useAppStore((s) => s.repo)!;
  const setModal = useAppStore((s) => s.setModal);
  const setView = useAppStore((s) => s.setView);
  const setPaletteOpen = useAppStore((s) => s.setPaletteOpen);
  const pendingClose = useAppStore((s) => s.pendingClose);
  const confirmCloseRepo = useAppStore((s) => s.confirmCloseRepo);
  const cancelCloseRepo = useAppStore((s) => s.cancelCloseRepo);
  const qc = useQueryClient();
  const sync = useSyncActions(repo.path);
  const { data: syncData } = useSyncStatus(repo.path);
  const bp = useBreakpoint();
  const paletteHint = comboHint(useShortcutsStore((s) => s.bindings.palette));
  const fetchHint = comboHint(useShortcutsStore((s) => s.bindings.fetch));

  const ahead = syncData?.ahead ?? 0;
  const behind = syncData?.behind ?? 0;

  function refresh() {
    // The ⟳ fetches origin; on failure (no remote/credentials) still reload local.
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

  return (
    <div
      data-tauri-drag-region
      style={{
        height: "var(--h-titlebar)",
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        gap: "var(--sp-4)",
        padding: "0 var(--sp-4)",
        borderBottom: "1px solid var(--border)",
        background: "var(--panel)",
      }}
    >
      {isMac && <TrafficLights />}

      {/* pointerEvents none: clicks fall through to the drag region, so the
          wordmark itself is a grab handle. */}
      <div style={{ flexShrink: 0, pointerEvents: "none" }}>
        <Wordmark size={17} />
      </div>

      <RepoSelect />

      <div data-tauri-drag-region style={{ flex: 1, alignSelf: "stretch" }} />

      <TitlebarTools
        fetchPending={sync.fetch.isPending}
        onFetch={refresh}
        fetchHint={fetchHint}
        ahead={ahead}
        behind={behind}
        onPull={() => setModal("pull")}
        onPush={() => setModal("push")}
        paletteHint={paletteHint}
        onOpenPalette={() => setPaletteOpen(true)}
        onOpenSettings={() => setView("settings")}
        // < 1100px: Pull/Push/Fetch collapse into one ⇅ Sync menu, search becomes an icon.
        compact={bp.width < 1100}
      />

      {!isMac && <WinControls />}

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
