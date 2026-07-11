import { highlight } from "../lib/highlight";
import { parseHunks } from "../lib/hunks";

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

export function DiffLines({
  patch,
  fontSize = 11.5,
  onStageHunk,
  stageLabel,
}: {
  patch: string;
  fontSize?: number;
  /** When set, each hunk header gets a button applying that hunk's patch. */
  onStageHunk?: (hunkPatch: string) => void;
  stageLabel?: string;
}) {
  const lines = patch.replace(/\n$/, "").split("\n");
  const hunks = onStageHunk ? parseHunks(patch) : [];
  let hunkIdx = -1;
  return (
    <>
      {lines.map((line, i) => {
        const kind = classify(line);
        if (kind === "hunk" || kind === "meta") {
          if (kind === "hunk") hunkIdx += 1;
          const hunk = kind === "hunk" ? hunks[hunkIdx] : undefined;
          return (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: mono, fontSize, lineHeight: 1.75, padding: "0 14px", whiteSpace: "pre", background: kind === "hunk" ? "var(--dhB)" : "transparent", color: kind === "hunk" ? "var(--dhT)" : "var(--dcT)", ...rowContain }}>
              <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis" }}>{line || " "}</span>
              {onStageHunk && hunk && (
                <span
                  onClick={() => onStageHunk(hunk.patch)}
                  className="gs-lift"
                  style={{ fontFamily: "var(--font)", fontSize: 10.5, fontWeight: 600, color: "var(--l0)", background: "var(--btn)", border: "1px solid var(--btnB)", borderRadius: 6, padding: "1px 8px", cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0 }}
                >
                  {stageLabel ?? "Preparar"}
                </span>
              )}
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
