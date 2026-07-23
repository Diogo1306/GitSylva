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

export type FilePatch = { path: string; patch: string };

// Git may quote a path with special chars ("a/spá ce.ts"); unwrap it.
function unquotePath(p: string): string {
  if (p.startsWith('"') && p.endsWith('"')) {
    try {
      return JSON.parse(p) as string;
    } catch {
      return p.slice(1, -1);
    }
  }
  return p;
}

// The path a `+++ `/`--- ` header points at, without the a//b/ prefix, or ""
// for /dev/null (a creation's old side or a deletion's new side).
function headerPath(line: string): string {
  const rest = line.slice(4);
  if (rest === "/dev/null") return "";
  return unquotePath(rest).replace(/^[ab]\//, "");
}

/** Split a combined multi-file commit diff into one patch per file, keyed by
 *  the file's path. The path is taken from the `+++ b/…` header (the new path,
 *  which matches the commit's file list), falling back to `--- a/…` for pure
 *  deletions and to the `diff --git` line for headerless (e.g. binary) files. */
export function splitDiffByFile(diff: string): FilePatch[] {
  if (!diff.trim()) return [];
  const segments: string[][] = [];
  for (const line of diff.split("\n")) {
    if (line.startsWith("diff --git ")) segments.push([line]);
    else if (segments.length) segments[segments.length - 1].push(line);
  }
  return segments.map((seg) => {
    let path = "";
    for (const l of seg) if (l.startsWith("+++ ")) { path = headerPath(l); break; }
    if (!path) for (const l of seg) if (l.startsWith("--- ")) { path = headerPath(l); break; }
    if (!path) {
      const m = /^diff --git a\/(.+) b\/(.+)$/.exec(seg[0]);
      if (m) path = unquotePath(m[2]);
    }
    return { path, patch: seg.join("\n") };
  });
}

/** The single-file patch for `path` inside a combined commit diff, matched by
 *  the file list's path (with a loose fallback for renames/quoting). */
export function patchForFile(diff: string, path: string): string {
  const files = splitDiffByFile(diff);
  return (
    files.find((f) => f.path === path)?.patch ??
    files.find((f) => f.patch.includes(` b/${path}`) || f.patch.includes(` a/${path}`))?.patch ??
    ""
  );
}
