import type { CSSProperties } from "react";

/** Git file status: A(dded) / M(odified) / D(eleted) / U(nmerged, conflict). */
export type FileStatus = "A" | "M" | "D" | "U";

const TONE: Record<FileStatus, [bg: string, color: string]> = {
  A: ["var(--stAB)", "var(--stAT)"],
  M: ["var(--stMB)", "var(--stMT)"],
  D: ["var(--stDB)", "var(--stDT)"],
  U: ["var(--stDB)", "var(--stDT)"],
};

// 16x16 letter glyph for a file's git status.
export function StatusBadge({ status = "M", title, style }: { status?: FileStatus; title?: string; style?: CSSProperties }) {
  const [bg, color] = TONE[status];
  return (
    <span
      title={title}
      style={{
        display: "grid",
        placeItems: "center",
        width: 16,
        height: 16,
        borderRadius: "var(--r-xs)",
        fontFamily: "var(--font-mono)",
        fontSize: 10,
        fontWeight: "var(--fw-bold)",
        background: bg,
        color,
        flexShrink: 0,
        ...style,
      }}
    >
      {status}
    </span>
  );
}
