import { useMemo } from "react";
import { highlight } from "../lib/highlight";
import { classifyDiffLine, parseHunkHeader } from "../lib/diffLine";

// Side-by-side diff. Parses a unified patch into aligned old/new columns:
// removals go left, additions right, context on both; hunk/file headers span
// the full width. Each side carries its own line-number gutter. Content is
// syntax-highlighted; the tint carries the add/remove meaning.

const mono = "'JetBrains Mono', monospace";

// Off-screen rows skip layout/paint (matches the unified view).
const rowContain = { contentVisibility: "auto" as const, containIntrinsicSize: "auto 21px" };

type Cell = { text: string; kind: "ctx" | "del" | "add"; no: number } | null;
type Row = { header?: string; headerKind?: "hunk" | "meta"; left?: Cell; right?: Cell };

function parse(patch: string): Row[] {
  const rows: Row[] = [];
  let rem: Cell[] = [];
  let add: Cell[] = [];
  let oldNo = 0;
  let newNo = 0;
  const flush = () => {
    const n = Math.max(rem.length, add.length);
    for (let i = 0; i < n; i++) {
      rows.push({ left: i < rem.length ? rem[i] : null, right: i < add.length ? add[i] : null });
    }
    rem = [];
    add = [];
  };
  for (const line of patch.replace(/\n$/, "").split("\n")) {
    const kind = classifyDiffLine(line);
    if (kind === "hunk" || kind === "meta") {
      flush();
      if (kind === "hunk") {
        const h = parseHunkHeader(line);
        if (h) {
          oldNo = h.oldStart;
          newNo = h.newStart;
        }
      }
      rows.push({ header: line, headerKind: kind });
    } else if (kind === "del") {
      rem.push({ text: line.slice(1), kind: "del", no: oldNo++ });
    } else if (kind === "add") {
      add.push({ text: line.slice(1), kind: "add", no: newNo++ });
    } else {
      flush();
      const t = line.startsWith(" ") ? line.slice(1) : line;
      rows.push({
        left: { text: t, kind: "ctx", no: oldNo++ },
        right: { text: t, kind: "ctx", no: newNo++ },
      });
    }
  }
  flush();
  return rows;
}

function cellStyle(cell: Cell): React.CSSProperties {
  const bg = cell?.kind === "del" ? "var(--ddB)" : cell?.kind === "add" ? "var(--daB)" : "transparent";
  return { display: "flex", fontFamily: mono, fontSize: 11.5, lineHeight: 1.75, padding: "0 10px", whiteSpace: "pre", background: bg, color: "var(--text2)", overflow: "hidden", ...rowContain };
}

export function DiffSplit({ patch }: { patch: string }) {
  const rows = useMemo(() => parse(patch), [patch]);
  const gutW = "4ch";
  const cell = (c: Cell) => (
    <div style={cellStyle(c)}>
      <span style={{ width: gutW, flexShrink: 0, textAlign: "right", color: "var(--muted)", userSelect: "none", marginRight: 8 }}>
        {c ? c.no : ""}
      </span>
      <span style={{ flex: 1, minWidth: 0 }}>{c ? highlight(c.text) || " " : " "}</span>
    </div>
  );
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", columnGap: 1, background: "var(--border)" }}>
      {rows.map((r, i) =>
        r.header !== undefined ? (
          <div
            key={i}
            style={{
              gridColumn: "1 / -1",
              fontFamily: mono,
              fontSize: 11.5,
              lineHeight: 1.75,
              padding: "0 10px",
              whiteSpace: "pre",
              color: r.headerKind === "hunk" ? "var(--dhT)" : "var(--dcT)",
              background: r.headerKind === "hunk" ? "var(--dhB)" : "transparent",
              ...rowContain,
            }}
          >
            {r.header}
          </div>
        ) : (
          <div key={i} style={{ display: "contents" }}>
            {cell(r.left ?? null)}
            {cell(r.right ?? null)}
          </div>
        ),
      )}
    </div>
  );
}
