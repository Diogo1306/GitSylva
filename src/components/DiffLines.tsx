import { highlight } from "../lib/highlight";

// Renders a unified patch with the design's diff colours: additions green,
// deletions red, hunk headers tinted, file/meta lines muted. Content lines are
// syntax-highlighted; the +/- background tint carries the add/remove meaning.

const mono = "'JetBrains Mono', monospace";

type Kind = "hunk" | "meta" | "add" | "del" | "ctx";

function classify(line: string): Kind {
  if (line.startsWith("@@")) return "hunk";
  if (line.startsWith("+++") || line.startsWith("---") || line.startsWith("diff ") || line.startsWith("index ")) return "meta";
  if (line.startsWith("+")) return "add";
  if (line.startsWith("-")) return "del";
  return "ctx";
}

// Off-screen diff lines skip layout/paint, so even huge diffs stay smooth.
const rowContain = { contentVisibility: "auto" as const, containIntrinsicSize: "auto 20px" };

export function DiffLines({ patch, fontSize = 11.5 }: { patch: string; fontSize?: number }) {
  const lines = patch.replace(/\n$/, "").split("\n");
  return (
    <>
      {lines.map((line, i) => {
        const kind = classify(line);
        if (kind === "hunk" || kind === "meta") {
          return (
            <div key={i} style={{ fontFamily: mono, fontSize, lineHeight: 1.75, padding: "0 14px", whiteSpace: "pre", background: kind === "hunk" ? "var(--dhB)" : "transparent", color: kind === "hunk" ? "var(--dhT)" : "var(--dcT)", ...rowContain }}>
              {line || " "}
            </div>
          );
        }
        const bg = kind === "add" ? "var(--daB)" : kind === "del" ? "var(--ddB)" : "transparent";
        const marker = kind === "add" ? "var(--daT)" : kind === "del" ? "var(--ddT)" : "var(--muted)";
        const prefix = kind === "ctx" ? " " : line[0];
        const content = kind === "ctx" ? line : line.slice(1);
        return (
          <div key={i} style={{ fontFamily: mono, fontSize, lineHeight: 1.75, padding: "0 14px", whiteSpace: "pre", background: bg, color: "var(--text2)", ...rowContain }}>
            <span style={{ color: marker }}>{prefix}</span>
            {highlight(content) || " "}
          </div>
        );
      })}
    </>
  );
}
