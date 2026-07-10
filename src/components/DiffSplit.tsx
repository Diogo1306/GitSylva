import { highlight } from "../lib/highlight";

// Side-by-side diff. Parses a unified patch into aligned old/new columns:
// removals go left, additions right, context on both; hunk/file headers span
// the full width. Content is syntax-highlighted; the tint carries add/remove.

const mono = "'JetBrains Mono', monospace";

type Cell = { text: string; kind: "ctx" | "del" | "add" } | null;
type Row = { header?: string; left?: Cell; right?: Cell };

function isHeader(l: string): boolean {
  return l.startsWith("@@") || l.startsWith("diff ") || l.startsWith("index ") || l.startsWith("+++") || l.startsWith("---");
}

function parse(patch: string): Row[] {
  const rows: Row[] = [];
  let rem: string[] = [];
  let add: string[] = [];
  const flush = () => {
    const n = Math.max(rem.length, add.length);
    for (let i = 0; i < n; i++) {
      rows.push({
        left: i < rem.length ? { text: rem[i], kind: "del" } : null,
        right: i < add.length ? { text: add[i], kind: "add" } : null,
      });
    }
    rem = [];
    add = [];
  };
  for (const line of patch.replace(/\n$/, "").split("\n")) {
    if (isHeader(line)) {
      flush();
      rows.push({ header: line });
    } else if (line.startsWith("-")) {
      rem.push(line.slice(1));
    } else if (line.startsWith("+")) {
      add.push(line.slice(1));
    } else {
      flush();
      const t = line.startsWith(" ") ? line.slice(1) : line;
      rows.push({ left: { text: t, kind: "ctx" }, right: { text: t, kind: "ctx" } });
    }
  }
  flush();
  return rows;
}

function cellStyle(cell: Cell): React.CSSProperties {
  const bg = cell?.kind === "del" ? "var(--ddB)" : cell?.kind === "add" ? "var(--daB)" : "transparent";
  return { fontFamily: mono, fontSize: 11.5, lineHeight: 1.75, padding: "0 10px", whiteSpace: "pre", background: bg, color: "var(--text2)", overflow: "hidden" };
}

export function DiffSplit({ patch }: { patch: string }) {
  const rows = parse(patch);
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", columnGap: 1, background: "var(--border)" }}>
      {rows.map((r, i) =>
        r.header !== undefined ? (
          <div key={i} style={{ gridColumn: "1 / -1", fontFamily: mono, fontSize: 11.5, lineHeight: 1.75, padding: "0 10px", whiteSpace: "pre", color: "var(--dhT)", background: "var(--dhB)" }}>
            {r.header}
          </div>
        ) : (
          <div key={i} style={{ display: "contents" }}>
            <div style={cellStyle(r.left ?? null)}>{r.left ? highlight(r.left.text) || " " : " "}</div>
            <div style={cellStyle(r.right ?? null)}>{r.right ? highlight(r.right.text) || " " : " "}</div>
          </div>
        ),
      )}
    </div>
  );
}
