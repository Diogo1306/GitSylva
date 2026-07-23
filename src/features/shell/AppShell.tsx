import "./shell.css";
import { Suspense, lazy, useEffect, useRef } from "react";
import { useAppStore } from "../../state/appStore";
import { useThemeStore } from "../../state/themeStore";
import { Titlebar } from "./Titlebar";
import { Sidebar } from "./Sidebar";
import { RepoRail } from "./RepoRail";
import { CommandPalette } from "./CommandPalette";
import { Modals } from "./Modals";
import { ErrorBoundary } from "../../components/ErrorBoundary";
import { EphemeralLeaves } from "../../components/EphemeralLeaves";
import { spawnLeaf } from "../../lib/leaf";
import { ConflictBanner } from "../working-copy/ConflictBanner";
import { openRepo } from "../../lib/api";
import { toast } from "../../state/toastStore";
import { notify } from "../../state/notificationStore";
import { fetchFailureNotice } from "../../lib/errors";
import { useShortcutsStore, actionForEvent } from "../../state/shortcutsStore";
import { useSyncActions } from "../../state/queries";
import { useT, t as tGlobal } from "../../i18n";

// Each screen is a separate chunk; only the active one is fetched and parsed.
const WorkingCopy = lazy(() => import("../working-copy/WorkingCopy").then((m) => ({ default: m.WorkingCopy })));
const History = lazy(() => import("../history/History").then((m) => ({ default: m.History })));
const Stashes = lazy(() => import("../stashes/Stashes").then((m) => ({ default: m.Stashes })));
const Settings = lazy(() => import("../settings/Settings").then((m) => ({ default: m.Settings })));
const RepoPicker = lazy(() => import("../repo/RepoPicker").then((m) => ({ default: m.RepoPicker })));

function Screen() {
  const view = useAppStore((s) => s.view);
  switch (view) {
    case "working":
      return <WorkingCopy />;
    case "stashes":
      return <Stashes />;
    case "settings":
      return <Settings />;
    case "picker":
      return <RepoPicker />;
    case "history":
    default:
      return <History />;
  }
}

export function AppShell() {
  const repoPath = useAppStore((s) => s.repo?.path);
  const rail = useThemeStore((s) => s.repoLayout) === "rail";
  const bindings = useShortcutsStore((s) => s.bindings);
  const sync = useSyncActions(repoPath ?? "");
  const t = useT();
  const fetchMutate = sync.fetch.mutate;
  // Ref (not isPending): the keydown closure below only re-binds when the
  // bindings change, so a state read would be stale.
  const fetchInFlight = useRef(false);

  // Global, rebindable shortcuts (Settings → Atalhos). All combos carry the
  // mod key, so typing never triggers them; ⌘Enter is allowed inside the
  // commit textarea by design.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // A row in Settings is capturing the next combo — don't act on it.
      if (document.documentElement.hasAttribute("data-recording-shortcut")) return;
      const action = actionForEvent(e, bindings);
      if (!action) return;
      const tag = (e.target as HTMLElement)?.tagName;
      const typing = tag === "INPUT" || tag === "TEXTAREA";
      if (typing && action !== "commit" && action !== "palette") return;
      e.preventDefault();
      const st = useAppStore.getState();
      switch (action) {
        case "palette":
          st.setPaletteOpen(!st.paletteOpen);
          break;
        case "commit":
          if (st.view !== "working") st.setView("working");
          else window.dispatchEvent(new CustomEvent("gitsylva:commit"));
          break;
        case "push":
          st.setModal("push");
          break;
        case "pull":
          st.setModal("pull");
          break;
        case "branch":
          st.setModal("branch");
          break;
        case "stash":
          st.setModal("stash");
          break;
        case "fetch":
          // Holding the shortcut must not queue a fetch per keypress.
          if (fetchInFlight.current) break;
          fetchInFlight.current = true;
          fetchMutate(undefined, {
            onSuccess: () => {
              spawnLeaf();
              notify(tGlobal("shell.fetch.doneTitle"), "origin", "success", "fetch");
            },
            onError: (err: unknown) => {
              const n = fetchFailureNotice(err);
              notify(n.title, n.sub, "error", "fetch");
            },
            onSettled: () => {
              fetchInFlight.current = false;
            },
          });
          break;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [bindings, fetchMutate]);

  // Revalidate persisted repos once at startup: refresh branch/head for the
  // ones still on disk, close (with a warning) the ones that no longer exist.
  // Sequential, ACTIVE REPO FIRST: it feeds the visible screen, and N repos
  // must not spawn N git processes at once while the app is still painting
  // (one repo on a slow network drive would also stall the others' slots).
  useEffect(() => {
    const { repos, repo } = useAppStore.getState();
    const ordered = [...repos].sort((a, b) => (a.path === repo?.path ? -1 : b.path === repo?.path ? 1 : 0));
    let cancelled = false;
    (async () => {
      for (const r of ordered) {
        if (cancelled) return;
        try {
          const info = await openRepo(r.path);
          useAppStore.getState().updateRepo(r.path, info);
        } catch {
          useAppStore.getState().closeRepo(r.path);
          toast(tGlobal("shell.repoGone", { path: r.path }), "error");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Warm the other screens' chunks while the machine is idle, so the first
  // switch to Working/Stashes/Settings is instant. First paint still only pays
  // for the active screen; these imports are deduped by the module cache.
  useEffect(() => {
    const warm = () => {
      import("../working-copy/WorkingCopy");
      import("../stashes/Stashes");
      import("../settings/Settings");
    };
    const ric = (window as unknown as { requestIdleCallback?: (cb: () => void) => number }).requestIdleCallback;
    const id = ric ? ric(warm) : window.setTimeout(warm, 1200);
    return () => {
      const cic = (window as unknown as { cancelIdleCallback?: (id: number) => void }).cancelIdleCallback;
      if (ric && cic) cic(id);
      else window.clearTimeout(id);
    };
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "var(--win)", color: "var(--text)", overflow: "hidden" }}>
      <Titlebar />
      <div style={{ flex: 1, display: "flex", minHeight: 0 }}>
        {rail && <RepoRail />}
        <Sidebar />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, overflow: "hidden" }}>
          {/* Global: an in-progress merge/rebase/cherry-pick must be visible
              from every screen, not just the working copy. */}
          <ConflictBanner />
          <div style={{ flex: 1, display: "flex", minWidth: 0, overflow: "hidden" }}>
            <Suspense fallback={<div style={{ flex: 1, display: "grid", placeItems: "center", color: "var(--muted)", fontSize: 13 }}>{t("common.loading")}</div>}>
              {/* A crash inside a screen must not take down the titlebar,
                  sidebar and navigation — the shell-level boundary catches it
                  and offers a way back to History. */}
              <ErrorBoundary homeLabel={t("shell.goToHistory")} onHome={() => useAppStore.getState().setView("history")}>
                {/* Keyed by repo so per-screen state (commit message, amend flag,
                    selected file/commit) never leaks across repositories. */}
                <Screen key={repoPath ?? "none"} />
              </ErrorBoundary>
            </Suspense>
          </div>
        </div>
      </div>
      <CommandPalette />
      <Modals />
      <EphemeralLeaves />
    </div>
  );
}
