// Shared unified-diff line classification. File headers are only `--- `/`+++ ` lines whose target is a git path (a/…, b/…, quoted, /dev/null) — a removed content line starting with "--" must stay a removal.

export type DiffLineKind = "hunk" | "meta" | "add" | "del" | "ctx";

export function classifyDiffLine(line: string): DiffLineKind {
  if (line.startsWith("@@")) return "hunk";
  if (line.startsWith("+++ ") || line.startsWith("--- ")) {
    const rest = line.slice(4);
    if (rest.startsWith("a/") || rest.startsWith("b/") || rest.startsWith('"a/') || rest.startsWith('"b/') || rest === "/dev/null") {
      return "meta";
    }
  }
  if (
    line.startsWith("diff ") ||
    line.startsWith("index ") ||
    line.startsWith("new file mode") ||
    line.startsWith("deleted file mode") ||
    line.startsWith("old mode") ||
    line.startsWith("new mode") ||
    line.startsWith("similarity index") ||
    line.startsWith("rename from") ||
    line.startsWith("rename to") ||
    line.startsWith("copy from") ||
    line.startsWith("copy to") ||
    line.startsWith("Binary files") ||
    line.startsWith("\\ No newline")
  ) {
    return "meta";
  }
  if (line.startsWith("+")) return "add";
  if (line.startsWith("-")) return "del";
  return "ctx";
}

/** Starting line numbers (and spans) from a `@@ -a,b +c,d @@` header. */
export function parseHunkHeader(line: string): { oldStart: number; oldCount: number; newStart: number; newCount: number } | null {
  const m = /^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/.exec(line);
  if (!m) return null;
  return {
    oldStart: Number(m[1]),
    oldCount: m[2] === undefined ? 1 : Number(m[2]),
    newStart: Number(m[3]),
    newCount: m[4] === undefined ? 1 : Number(m[4]),
  };
}

/** Gutter width (in ch) able to fit the largest line number in the patch. */
export function gutterDigits(lines: string[]): number {
  let max = 99;
  for (const l of lines) {
    const h = l.startsWith("@@") ? parseHunkHeader(l) : null;
    if (h) max = Math.max(max, h.oldStart + h.oldCount, h.newStart + h.newCount);
  }
  return String(max).length;
}
