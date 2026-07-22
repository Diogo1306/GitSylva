import type { BlameLine } from "../lib/types";
import { avatarColor } from "../lib/format";

// Per-line blame: each line shows its commit hash and author gutter next to the
// code. Consecutive lines from the same commit share a gutter tint.
export function BlameView({ lines }: { lines: BlameLine[] }) {
  return (
    <div className="gs-selectable" style={{ padding: "var(--sp-2) 0" }}>
      {lines.map((l, i) => {
        const sameAsPrev = i > 0 && lines[i - 1].hash === l.hash;
        const av = avatarColor(l.author);
        return (
          <div key={i} style={{ display: "flex", fontFamily: "var(--font-mono)", fontSize: "var(--fs-2xs)", lineHeight: "var(--lh-mono)" }}>
            <div style={{ width: 150, flexShrink: 0, display: "flex", alignItems: "center", gap: "var(--sp-2)", padding: "0 var(--sp-4)", color: "var(--muted)", borderRight: "1px solid var(--border)", opacity: sameAsPrev ? 0.35 : 1, overflow: "hidden" }}>
              <span style={{ color: av.color }}>{sameAsPrev ? "" : l.hash}</span>
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{sameAsPrev ? "" : l.author}</span>
            </div>
            <div style={{ width: 40, flexShrink: 0, textAlign: "right", padding: "0 var(--sp-3)", color: "var(--muted)", opacity: 0.6 }}>{l.line}</div>
            <div style={{ flex: 1, padding: "0 var(--sp-4)", whiteSpace: "pre", color: "var(--text2)", overflow: "hidden" }}>{l.content || " "}</div>
          </div>
        );
      })}
    </div>
  );
}
