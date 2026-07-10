import type { ReactNode } from "react";

// Small shared primitives: pill Chip, count Badge, IconButton, Toggle, labels.

export function Chip({ children, bg = "var(--badge)", color = "var(--badgeT)", border = "transparent", mono = true }: { children: ReactNode; bg?: string; color?: string; border?: string; mono?: boolean }) {
  return (
    <span
      style={{
        fontFamily: mono ? "var(--font-mono)" : "var(--font)",
        fontSize: 10.5,
        padding: "2px 8px",
        borderRadius: "var(--radius-pill)",
        whiteSpace: "nowrap",
        background: bg,
        color,
        border: `1px solid ${border}`,
      }}
    >
      {children}
    </span>
  );
}

export function Badge({ children, accent }: { children: ReactNode; accent?: boolean }) {
  return (
    <span
      style={{
        background: accent ? "var(--accent)" : "var(--badge)",
        color: accent ? "var(--accentT)" : "var(--badgeT)",
        borderRadius: "var(--radius-pill)",
        fontSize: 10.5,
        fontWeight: 700,
        padding: "1px 6px",
      }}
    >
      {children}
    </span>
  );
}

export function IconButton({ onClick, title, size = 30, children }: { onClick?: () => void; title?: string; size?: number; children: ReactNode }) {
  return (
    <div
      onClick={onClick}
      title={title}
      className="gs-lift"
      style={{ display: "flex", alignItems: "center", justifyContent: "center", width: size, height: size, borderRadius: "var(--radius-sm)", background: "var(--btn)", border: "1px solid var(--btnB)", color: "var(--btnT)", cursor: "pointer" }}
    >
      {children}
    </div>
  );
}

export function Toggle({ on }: { on: boolean }) {
  return (
    <div style={{ width: 38, height: 22, borderRadius: "var(--radius-pill)", background: on ? "var(--accent)" : "var(--btnB)", position: "relative", flexShrink: 0, transition: "background 0.15s" }}>
      <div style={{ position: "absolute", top: 2, left: on ? 18 : 2, width: 18, height: 18, borderRadius: "50%", background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.25)", transition: "left 0.15s" }} />
    </div>
  );
}

export function SectionHeader({ children }: { children: ReactNode }) {
  return <div style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: "1.2px", color: "var(--muted)", padding: "0 10px 6px" }}>{children}</div>;
}

export function CheckSquare({ on }: { on: boolean }) {
  return (
    <span style={{ width: 17, height: 17, borderRadius: 5, border: "1.5px solid var(--btnB)", boxSizing: "border-box", display: "grid", placeItems: "center", background: on ? "var(--accent)" : "transparent", color: "var(--accentT)", fontSize: 11, fontWeight: 800 }}>
      {on ? "✓" : ""}
    </span>
  );
}
