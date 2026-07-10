import { useAppStore } from "../../state/appStore";

const mono = "'JetBrains Mono', monospace";

// VS Code-style left rail listing open repositories. Alternative to the top
// tabs, chosen in Settings → "Repositórios abertos".
export function RepoRail() {
  const repos = useAppStore((s) => s.repos);
  const repo = useAppStore((s) => s.repo);
  const switchRepo = useAppStore((s) => s.switchRepo);
  const closeRepo = useAppStore((s) => s.closeRepo);
  const setView = useAppStore((s) => s.setView);

  return (
    <div style={{ width: 176, flexShrink: 0, borderRight: "1px solid var(--border)", background: "var(--panel2)", padding: "12px 8px", display: "flex", flexDirection: "column", gap: 3, overflowY: "auto", boxSizing: "border-box", animation: "fadeUp 0.25s ease both" }}>
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "1.2px", color: "var(--muted)", padding: "0 8px 6px" }}>PROJETOS</div>
      {repos.map((r, i) => {
        const active = r.path === repo?.path;
        const name = r.path.replace(/[/\\]$/, "").split(/[/\\]/).pop() ?? r.path;
        return (
          <div
            key={r.path}
            onClick={() => switchRepo(r.path)}
            className="gs-row"
            style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 8px", borderRadius: 8, cursor: "pointer", background: active ? "var(--sel)" : "transparent" }}
          >
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: `var(--l${i % 3})`, flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12.5, fontWeight: active ? 600 : 400, color: active ? "var(--text)" : "var(--text2)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</div>
              <div style={{ fontFamily: mono, fontSize: 10, color: "var(--muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{active ? repo?.current_branch : r.current_branch}</div>
            </div>
            <span onClick={(e) => { e.stopPropagation(); closeRepo(r.path); }} title="Fechar" className="gs-row" style={{ width: 15, height: 15, borderRadius: 5, display: "grid", placeItems: "center", color: "var(--muted)", fontSize: 9, flexShrink: 0 }}>✕</span>
          </div>
        );
      })}
      <div onClick={() => setView("picker")} className="gs-row" style={{ marginTop: 6, padding: "7px 10px", borderRadius: 8, border: "1.5px dashed var(--btnB)", color: "var(--muted)", fontSize: 12, textAlign: "center", cursor: "pointer" }}>
        + Abrir repositório
      </div>
    </div>
  );
}
