// Maps a git status letter to the design's status colours: added green,
// deleted red, everything else (modified, renamed, untracked...) amber.

export function statusStyle(s: string): { bg: string; color: string } {
  if (s === "A" || s === "?") return { bg: "var(--stAB)", color: "var(--stAT)" };
  if (s === "D") return { bg: "var(--stDB)", color: "var(--stDT)" };
  return { bg: "var(--stMB)", color: "var(--stMT)" };
}
