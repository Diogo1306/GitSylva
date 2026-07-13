import "./shell.css";
import { Suspense, lazy, useEffect } from "react";
import { useAppStore } from "../../state/appStore";
import { useThemeStore } from "../../state/themeStore";
import { Titlebar } from "./Titlebar";
import { Sidebar } from "./Sidebar";
import { RepoRail } from "./RepoRail";
import { ActionBar } from "./ActionBar";
import { CommandPalette } from "./CommandPalette";
import { Modals } from "./Modals";
import { Toaster } from "../../components/Toaster";
import { ConflictBanner } from "../working-copy/ConflictBanner";
import { openRepo } from "../../lib/api";
import { toast } from "../../state/toastStore";

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
  const setPaletteOpen = useAppStore((s) => s.setPaletteOpen);
  const repoPath = useAppStore((s) => s.repo?.path);
  const rail = useThemeStore((s) => s.repoLayout) === "rail";

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setPaletteOpen]);

  // Revalidate persisted repos once at startup: refresh branch/head for the
  // ones still on disk, close (with a warning) the ones that no longer exist.
  useEffect(() => {
    const { repos } = useAppStore.getState();
    for (const r of repos) {
      openRepo(r.path)
        .then((info) => useAppStore.getState().updateRepo(r.path, info))
        .catch(() => {
          useAppStore.getState().closeRepo(r.path);
          toast(`O repositório ${r.path} já não existe no disco — separador fechado`, "error");
        });
    }
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
      <Titlebar rail={rail} />
      <div style={{ flex: 1, display: "flex", minHeight: 0 }}>
        {rail && <RepoRail />}
        <Sidebar />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, overflow: "hidden" }}>
          {/* Global: an in-progress merge/rebase/cherry-pick must be visible
              from every screen, not just the working copy. */}
          <ConflictBanner />
          <div style={{ flex: 1, display: "flex", minWidth: 0, overflow: "hidden" }}>
            <Suspense fallback={<div style={{ flex: 1, display: "grid", placeItems: "center", color: "var(--muted)", fontSize: 13 }}>A carregar…</div>}>
              {/* Keyed by repo so per-screen state (commit message, amend flag,
                  selected file/commit) never leaks across repositories. */}
              <Screen key={repoPath ?? "none"} />
            </Suspense>
          </div>
        </div>
      </div>
      <ActionBar />
      <CommandPalette />
      <Modals />
      <Toaster />
    </div>
  );
}
