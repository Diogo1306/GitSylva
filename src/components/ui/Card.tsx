import type { CSSProperties, ReactNode } from "react";

// Panel container for settings blocks, stash entries, grouped content.
export function Card({ pad = 18, children, style }: { pad?: number; children: ReactNode; style?: CSSProperties }) {
  return (
    <div
      style={{
        border: "1px solid var(--border)",
        borderRadius: "var(--r-card)",
        background: "var(--panel)",
        padding: pad,
        boxSizing: "border-box",
        ...style,
      }}
    >
      {children}
    </div>
  );
}
