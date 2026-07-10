import "./shell.css";
import { useEffect } from "react";
import { useAppStore } from "../../state/appStore";
import { Titlebar } from "./Titlebar";
import { Sidebar } from "./Sidebar";
import { ActionBar } from "./ActionBar";
import { CommandPalette } from "./CommandPalette";
import { Modals } from "./Modals";
import { Toaster } from "../../components/Toaster";
import { WorkingCopy } from "../working-copy/WorkingCopy";
import { History } from "../history/History";
import { Stashes } from "../stashes/Stashes";
import { Settings } from "../settings/Settings";
import { RepoPicker } from "../repo/RepoPicker";

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
      <Titlebar />
      <div style={{ flex: 1, display: "flex", minHeight: 0 }}>
        <Sidebar />
        <div style={{ flex: 1, display: "flex", minWidth: 0, overflow: "hidden" }}>
          <Screen />
        </div>
      </div>
      <ActionBar />
      <CommandPalette />
      <Modals />
      <Toaster />
    </div>
  );
}
