// Maps a git status letter to the design's status colours: added green,
// deleted red, conflicted red, everything else (modified, renamed...) amber.
import { t } from "../i18n";

export function statusStyle(s: string): { bg: string; color: string } {
  if (s === "A" || s === "?") return { bg: "var(--stAB)", color: "var(--stAT)" };
  if (s === "D" || s === "U") return { bg: "var(--stDB)", color: "var(--stDT)" };
  return { bg: "var(--stMB)", color: "var(--stMT)" };
}

/** Human title for a status letter (tooltips next to the file-type icon). */
export function statusTitle(s: string): string {
  if (s === "A") return t("status.added");
  if (s === "?") return t("status.untracked");
  if (s === "D") return t("status.deleted");
  if (s === "U") return t("status.conflict");
  if (s === "R") return t("status.renamed");
  if (s === "C") return t("status.copied");
  return t("status.modified");
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
