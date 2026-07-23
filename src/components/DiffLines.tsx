import { useMemo } from "react";
import { highlight } from "../lib/highlight";
import { parseHunks } from "../lib/hunks";
import { classifyDiffLine, parseHunkHeader, gutterDigits } from "../lib/diffLine";
import { HIGHLIGHT_MAX_LINE, shouldHighlight } from "../lib/diffLimits";

// Renders a unified patch with the design's diff colours: additions green,
// deletions red, hunk headers tinted, file/meta lines muted. Old/new line
// numbers sit in muted, non-selectable gutters. Content lines are
// syntax-highlighted; the +/- background tint carries the add/remove meaning.

const mono = "'JetBrains Mono', monospace";

// Off-screen diff lines skip layout/paint, so even huge diffs stay smooth.
const rowContain = { contentVisibility: "auto" as const, containIntrinsicSize: "auto 20px" };

export function DiffLines({
  patch,
  fontSize = 11.5,
  onStageHunk,
  stageLabel,
  partialTail,
  clean,
}: {
  patch: string;
  fontSize?: number;
  /** When set, each hunk header gets a button applying that hunk's patch. */
  onStageHunk?: (hunkPatch: string) => void;
  stageLabel?: string;
  /** The last hunk may be cut (paged/capped patch): no stage button for it. */
  partialTail?: boolean;
  /** Clean mode (commit detail): drop git plumbing (diff --git, index, mode,
   *  similarity/rename, --- / +++) and render each hunk boundary as a subtle
   *  separator with a readable line range instead of the raw `@@ … @@`. */
  clean?: boolean;
}) {
  // The whole line list (including syntax highlighting) is memoized on the
  // patch: re-renders of the parent no longer re-run the highlighter over
  // every line of a potentially huge diff.
  const rows = useMemo(() => {
    const lines = patch.replace(/\n$/, "").split("\n");
    const hunks = onStageHunk ? parseHunks(patch) : [];
    // Very large or very long content renders plain: highlighting was ~10% of
    // a multi-second render on 50k-line patches, and single mega-lines
    // (minified bundles) are worst-case for the tokenizer.
    const hlOk = shouldHighlight(lines.length);
    const hl = (text: string) => (hlOk && text.length <= HIGHLIGHT_MAX_LINE ? highlight(text) : text);
    const gutW = `${gutterDigits(lines)}ch`;
    const gutter = (no: number | null) => (
      <span style={{ width: gutW, flexShrink: 0, textAlign: "right", color: "var(--muted)", userSelect: "none", marginRight: 8 }}>
        {no ?? ""}
      </span>
    );
    const out: React.ReactNode[] = [];
    let hunkIdx = -1;
    let oldNo = 0;
    let newNo = 0;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const kind = classifyDiffLine(line);
      if (kind === "hunk" || kind === "meta") {
        if (kind === "hunk") {
          hunkIdx += 1;
          const h = parseHunkHeader(line);
          if (h) {
            oldNo = h.oldStart;
            newNo = h.newStart;
          }
        }
        // Clean mode: strip plumbing, show hunk boundaries as a quiet range.
        if (clean) {
          if (kind === "meta") {
            // Keep the one meta line that carries real content: a binary file
            // has no +/- lines, so its "Binary files … differ" note is all
            // there is to show. Everything else is noise.
            if (line.startsWith("Binary files")) {
              out.push(
                <div key={i} style={{ padding: "4px 14px", fontFamily: mono, fontSize, color: "var(--muted)", ...rowContain }}>
                  {line}
                </div>,
              );
            }
            continue;
          }
          const h = parseHunkHeader(line);
          const label = h ? `${h.newStart}–${h.newStart + Math.max(1, h.newCount) - 1}` : "";
          out.push(
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "5px 14px", userSelect: "none", ...rowContain }}>
              <span style={{ flex: 1, height: 1, background: "var(--bsoft)" }} />
              <span style={{ fontFamily: mono, fontSize: 10, color: "var(--muted)", letterSpacing: 0.3 }}>{label}</span>
              <span style={{ flex: 1, height: 1, background: "var(--bsoft)" }} />
            </div>,
          );
          continue;
        }
        // A cut tail hunk would stage a corrupt patch — skip its button.
        const hunkComplete = !partialTail || hunkIdx < hunks.length - 1;
        const hunk = kind === "hunk" && hunkComplete ? hunks[hunkIdx] : undefined;
        out.push(
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
          </div>,
        );
        continue;
      }
      const bg = kind === "add" ? "var(--daB)" : kind === "del" ? "var(--ddB)" : "transparent";
      const marker = kind === "add" ? "var(--daT)" : kind === "del" ? "var(--ddT)" : "var(--muted)";
      const prefix = kind === "ctx" ? " " : line[0];
      const content = kind === "ctx" ? line : line.slice(1);
      const oldShown = kind === "add" ? null : oldNo++;
      const newShown = kind === "del" ? null : newNo++;
      out.push(
        <div key={i} style={{ display: "flex", fontFamily: mono, fontSize, lineHeight: 1.75, padding: "0 14px", whiteSpace: "pre", background: bg, color: "var(--text2)", ...rowContain }}>
          {gutter(oldShown)}
          {gutter(newShown)}
          <span style={{ flex: 1, minWidth: 0 }}>
            <span style={{ color: marker }}>{prefix}</span>
            {hl(content) || " "}
          </span>
        </div>,
      );
    }
    return out;
  }, [patch, fontSize, onStageHunk, stageLabel, partialTail, clean]);

  return <>{rows}</>;
}
