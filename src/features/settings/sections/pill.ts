import type { CSSProperties } from "react";

// Pill selector style shared by accent / branch-color / tree pickers.
// Lives outside _shared.tsx so that file only exports components (fast refresh).
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
