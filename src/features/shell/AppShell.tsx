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

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "var(--win)", color: "var(--text)", overflow: "hidden" }}>
      <Titlebar rail={rail} />
      <div style={{ flex: 1, display: "flex", minHeight: 0 }}>
        {rail && <RepoRail />}
        <Sidebar />
        <div style={{ flex: 1, display: "flex", minWidth: 0, overflow: "hidden" }}>
          <Suspense fallback={<div style={{ flex: 1, display: "grid", placeItems: "center", color: "var(--muted)", fontSize: 13 }}>A carregar…</div>}>
            <Screen />
          </Suspense>
        </div>
      </div>
      <ActionBar />
      <CommandPalette />
      <Modals />
      <Toaster />
    </div>
  );
}
