// Maps a git status letter to the design's status colours: added green,
// deleted red, conflicted red, everything else (modified, renamed...) amber.

export function statusStyle(s: string): { bg: string; color: string } {
  if (s === "A" || s === "?") return { bg: "var(--stAB)", color: "var(--stAT)" };
  if (s === "D" || s === "U") return { bg: "var(--stDB)", color: "var(--stDT)" };
  return { bg: "var(--stMB)", color: "var(--stMT)" };
}

// A porcelain-v2 unmerged entry: either side is "U", or both added / both deleted.
export function isConflict(index: string, worktree: string): boolean {
  return (
    index === "U" ||
    worktree === "U" ||
    (index === "A" && worktree === "A") ||
    (index === "D" && worktree === "D")
  );
}
