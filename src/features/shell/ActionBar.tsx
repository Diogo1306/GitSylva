import { useAppStore } from "../../state/appStore";
import { useStatus } from "../../state/queries";

const mono = "'JetBrains Mono', monospace";

function Divider() {
  return <div style={{ width: 1, height: 22, background: "var(--border)", margin: "0 4px" }} />;
}

function Btn({
  label,
  onClick,
  stub,
  badge,
  badgeAccent,
}: {
  label: string;
  onClick?: () => void;
  stub?: boolean;
  badge?: number | null;
  badgeAccent?: boolean;
}) {
  return (
    <div
      onClick={stub ? undefined : onClick}
      title={stub ? `${label} · em breve` : label}
      className={stub ? "gs-stub" : "gs-lift"}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        padding: "7px 13px",
        borderRadius: 8,
        background: "var(--btn)",
        border: "1px solid var(--btnB)",
        fontSize: 12.5,
        fontWeight: 600,
        color: "var(--btnT)",
        cursor: stub ? "default" : "pointer",
        whiteSpace: "nowrap",
      }}
    >
      {label}
      {badge != null && badge > 0 && (
        <span
          style={{
            background: badgeAccent ? "var(--accent)" : "var(--badge)",
            color: badgeAccent ? "var(--accentT)" : "var(--badgeT)",
            borderRadius: 999,
            fontSize: 10.5,
            fontWeight: 700,
            padding: "1px 6px",
          }}
        >
          {badge}
        </span>
      )}
    </div>
  );
}

export function ActionBar() {
  const repo = useAppStore((s) => s.repo)!;
  const setView = useAppStore((s) => s.setView);
  const { data } = useStatus(repo.path);

  const files = data ?? [];
  const staged = files.filter((f) => f.index_status !== "." && f.index_status !== "?").length;
  const repoName = repo.path.replace(/[/\\]$/, "").split(/[/\\]/).pop() ?? repo.path;

  return (
    <div
      style={{
        height: 54,
        flexShrink: 0,
        borderTop: "1px solid var(--border)",
        background: "var(--panel)",
        display: "flex",
        alignItems: "center",
        gap: 6,
        padding: "0 14px",
      }}
    >
      <Btn label="Commit" onClick={() => setView("working")} badge={staged} badgeAccent />
      <Divider />
      <Btn label="↓ Pull" stub />
      <Btn label="↑ Push" stub />
      <Divider />
      <Btn label="Branch" stub />
      <Btn label="Merge" stub />
      <Btn label="Stash" onClick={() => setView("stashes")} />
      <Btn label="Tag" stub />
      <div style={{ flex: 1 }} />
      <div style={{ display: "flex", alignItems: "center", gap: 10, fontFamily: mono, fontSize: 11.5, color: "var(--muted)", whiteSpace: "nowrap" }}>
        <span>
          {repoName}
          <span style={{ color: "var(--muted)" }}> / </span>
          <span style={{ color: "var(--l0)", fontWeight: 600 }}>{repo.current_branch}</span>
        </span>
        <span title="commits por enviar">↑0</span>
        <span title="commits por integrar">↓0</span>
      </div>
    </div>
  );
}
