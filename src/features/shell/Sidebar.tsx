import { useAppStore } from "../../state/appStore";
import { useStatus } from "../../state/queries";
import type { View } from "../../state/appStore";

const mono = "'JetBrains Mono', monospace";

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: "1.2px", color: "var(--muted)", padding: "0 10px 6px" }}>
      {children}
    </div>
  );
}

export function Sidebar() {
  const view = useAppStore((s) => s.view);
  const setView = useAppStore((s) => s.setView);
  const repo = useAppStore((s) => s.repo)!;
  const { data } = useStatus(repo.path);
  const wcCount = (data ?? []).length;

  const navRow = (
    key: View,
    label: string,
    dot: React.ReactNode,
    badge?: number | null,
  ) => (
    <div
      onClick={() => setView(key)}
      className="gs-row"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 9,
        padding: "7px 10px",
        borderRadius: 8,
        fontSize: 13.5,
        color: "var(--text)",
        cursor: "pointer",
        background: view === key ? "var(--sel)" : "transparent",
      }}
    >
      {dot}
      <span style={{ flex: 1 }}>{label}</span>
      {badge != null && badge > 0 && (
        <span style={{ background: "var(--badge)", color: "var(--badgeT)", borderRadius: 999, fontSize: 11, fontWeight: 600, padding: "1px 7px" }}>
          {badge}
        </span>
      )}
    </div>
  );

  return (
    <div
      style={{
        width: 230,
        flexShrink: 0,
        borderRight: "1px solid var(--border)",
        background: "var(--panel)",
        padding: "14px 10px",
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
        gap: 20,
        boxSizing: "border-box",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <SectionLabel>ESPAÇO DE TRABALHO</SectionLabel>
        {navRow(
          "working",
          "Cópia de trabalho",
          <span style={{ width: 7, height: 7, borderRadius: 2, background: "var(--l2)", flexShrink: 0 }} />,
          wcCount,
        )}
        {navRow(
          "history",
          "Histórico",
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--l0)", flexShrink: 0 }} />,
        )}
        {navRow(
          "stashes",
          "Stashes",
          <span style={{ width: 7, height: 7, borderRadius: 2, background: "var(--l1)", transform: "rotate(45deg)", flexShrink: 0 }} />,
          0,
        )}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <SectionLabel>BRANCHES</SectionLabel>
        <div
          className="gs-row"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 9,
            padding: "6px 10px",
            borderRadius: 8,
            fontSize: 13,
            fontFamily: mono,
            color: "var(--l0)",
            fontWeight: 600,
            cursor: "default",
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: "var(--l0bg)",
              border: "1.5px solid var(--l0)",
              boxSizing: "border-box",
              flexShrink: 0,
            }}
          />
          <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {repo.current_branch}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", opacity: 0.5 }}>
          <span style={{ fontSize: 12, color: "var(--muted)" }}>Lista de branches</span>
          <span className="gs-soon">Em breve</span>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <SectionLabel>REMOTOS</SectionLabel>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 9,
            padding: "6px 10px",
            borderRadius: 8,
            fontSize: 13,
            fontFamily: mono,
            color: "var(--text2)",
            opacity: 0.7,
          }}
        >
          <span style={{ color: "var(--muted)", fontSize: 11 }}>▸</span>
          <span style={{ flex: 1 }}>origin</span>
          <span className="gs-soon">Em breve</span>
        </div>
      </div>

      <div style={{ flex: 1 }} />
      <div
        onClick={() => setView("settings")}
        className="gs-row"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 9,
          padding: "7px 10px",
          borderRadius: 8,
          fontSize: 13.5,
          color: "var(--text2)",
          cursor: "pointer",
          background: view === "settings" ? "var(--sel)" : "transparent",
        }}
      >
        <span style={{ width: 9, height: 9, borderRadius: "50%", border: "2px solid var(--muted)", boxSizing: "border-box", flexShrink: 0 }} />
        <span style={{ flex: 1 }}>Definições</span>
      </div>
    </div>
  );
}
