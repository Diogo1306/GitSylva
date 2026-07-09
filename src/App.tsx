import { useAppStore } from "./state/appStore";
import { useApplyTheme } from "./theme/useApplyTheme";
import { OpenRepo } from "./features/repo/OpenRepo";
import { WorkingCopy } from "./features/working-copy/WorkingCopy";
import { History } from "./features/history/History";

function Tab({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "6px 14px",
        borderRadius: "var(--radius-sm)",
        border: "none",
        cursor: "pointer",
        font: "inherit",
        background: active ? "var(--bg-elevated)" : "transparent",
        color: active ? "var(--text)" : "var(--text-muted)",
      }}
    >
      {label}
    </button>
  );
}

export default function App() {
  useApplyTheme();
  const repo = useAppStore((s) => s.repo);
  const view = useAppStore((s) => s.view);
  const setView = useAppStore((s) => s.setView);

  if (!repo) return <OpenRepo />;

  const repoName = repo.path.replace(/[/\\]$/, "").split(/[/\\]/).pop();

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <header
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          padding: "10px 12px",
          borderBottom: "1px solid var(--border)",
          background: "var(--bg-panel)",
        }}
      >
        <div style={{ fontWeight: 600 }}>{repoName}</div>
        <div style={{ color: "var(--accent)", fontSize: 13 }}>{repo.current_branch}</div>
        <div style={{ flex: 1 }} />
        <div style={{ display: "flex", gap: 4 }}>
          <Tab label="Changes" active={view === "working"} onClick={() => setView("working")} />
          <Tab label="History" active={view === "history"} onClick={() => setView("history")} />
        </div>
      </header>
      <div style={{ flex: 1, overflow: "hidden" }}>
        {view === "working" ? <WorkingCopy /> : <History />}
      </div>
    </div>
  );
}
