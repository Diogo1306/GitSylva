import type { CSSProperties, ReactNode } from "react";

export function SectionTitle({ children }: { children: ReactNode }) {
  return <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "1.4px", color: "var(--muted)" }}>{children}</div>;
}

export function FieldLabel({ children }: { children: ReactNode }) {
  return <div style={{ fontSize: 13.5, fontWeight: 600 }}>{children}</div>;
}

export function Hint({ children }: { children: ReactNode }) {
  return <div style={{ fontSize: 12, color: "var(--muted)" }}>{children}</div>;
}

// Pill selector style shared by accent / branch-color / tree pickers.
export function pillStyle(active: boolean): CSSProperties {
  return {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "7px 12px",
    borderRadius: "var(--radius-pill)",
    border: `2px solid ${active ? "var(--accent)" : "var(--btnB)"}`,
    cursor: "pointer",
    background: "var(--panel)",
    fontSize: 13,
  };
}

export function StubSection({ id, title, children }: { id: string; title: string; children?: ReactNode }) {
  return (
    <div id={id} style={{ display: "flex", flexDirection: "column", gap: 12, scrollMarginTop: 20 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <SectionTitle>{title}</SectionTitle>
        <span className="gs-soon">Em breve</span>
      </div>
      <div style={{ padding: 16, border: "1px dashed var(--btnB)", borderRadius: 12, color: "var(--muted)", fontSize: 13, lineHeight: 1.5 }}>{children}</div>
    </div>
  );
}
