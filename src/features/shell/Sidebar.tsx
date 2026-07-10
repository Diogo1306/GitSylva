import { useAppStore } from "../../state/appStore";
import { useStatus, useBranches, useBranchActions } from "../../state/queries";
import { toast } from "../../state/toastStore";
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
  const setModal = useAppStore((s) => s.setModal);
  const repo = useAppStore((s) => s.repo)!;
  const { data } = useStatus(repo.path);
  const wcCount = (data ?? []).length;
  const { data: branchData } = useBranches(repo.path);
  const { checkout } = useBranchActions(repo.path);
  // Local branches only in the sidebar list.
  const localBranches = (branchData ?? []).filter((b) => !b.is_remote);

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
        <div style={{ display: "flex", alignItems: "center", padding: "0 10px 6px" }}>
          <div style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: "1.2px", color: "var(--muted)", flex: 1 }}>BRANCHES</div>
          <span
            onClick={() => setModal("branch")}
            className="gs-row"
            title="Nova branch"
            style={{ width: 18, height: 18, borderRadius: 5, display: "grid", placeItems: "center", color: "var(--muted)", fontSize: 14, cursor: "pointer" }}
          >
            +
          </span>
        </div>
        {localBranches.map((b) => (
          <div
            key={b.name}
            onClick={() => {
              if (b.is_current) return;
              checkout.mutate(b.name, {
                onSuccess: () => toast(`Em ${b.name}`),
                onError: (e: unknown) => toast((e as { message?: string })?.message ?? "não foi possível mudar de branch"),
              });
            }}
            className="gs-row"
            title={b.is_current ? "Branch atual" : `Mudar para ${b.name}`}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 9,
              padding: "6px 10px",
              borderRadius: 8,
              fontSize: 13,
              fontFamily: mono,
              color: b.is_current ? "var(--l0)" : "var(--text2)",
              fontWeight: b.is_current ? 600 : 400,
              cursor: b.is_current ? "default" : "pointer",
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: b.is_current ? "var(--l0bg)" : "transparent",
                border: `1.5px solid ${b.is_current ? "var(--l0)" : "var(--muted)"}`,
                boxSizing: "border-box",
                flexShrink: 0,
              }}
            />
            <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{b.name}</span>
          </div>
        ))}
        {localBranches.length === 0 && (
          <div style={{ padding: "6px 10px", fontSize: 12, color: "var(--muted)", fontFamily: mono }}>{repo.current_branch}</div>
        )}
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
