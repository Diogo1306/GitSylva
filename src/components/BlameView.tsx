import type { BlameLine } from "../lib/types";
import { avatarColor } from "../lib/format";

const mono = "'JetBrains Mono', monospace";

// Per-line blame: each line shows its commit hash and author gutter next to the
// code. Consecutive lines from the same commit share a gutter tint.
export function BlameView({ lines }: { lines: BlameLine[] }) {
  return (
    <div style={{ padding: "6px 0" }}>
      {lines.map((l, i) => {
        const sameAsPrev = i > 0 && lines[i - 1].hash === l.hash;
        const av = avatarColor(l.author);
        return (
          <div key={i} style={{ display: "flex", fontFamily: mono, fontSize: 11.5, lineHeight: 1.7 }}>
            <div style={{ width: 150, flexShrink: 0, display: "flex", alignItems: "center", gap: 6, padding: "0 10px", color: "var(--muted)", borderRight: "1px solid var(--border)", opacity: sameAsPrev ? 0.35 : 1, overflow: "hidden" }}>
              <span style={{ color: av.color }}>{sameAsPrev ? "" : l.hash}</span>
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{sameAsPrev ? "" : l.author}</span>
            </div>
            <div style={{ width: 40, flexShrink: 0, textAlign: "right", padding: "0 8px", color: "var(--muted)", opacity: 0.6 }}>{l.line}</div>
            <div style={{ flex: 1, padding: "0 10px", whiteSpace: "pre", color: "var(--text2)", overflow: "hidden" }}>{l.content || " "}</div>
          </div>
        );
      })}
    </div>
  );
}
