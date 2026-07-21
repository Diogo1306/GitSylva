// Task 11: History filters, composed over the existing free-text filter.
//
// `matchesFilters` is a pure predicate so it stays unit-testable without any
// React/query machinery. Branch and path filters need data the loaded log
// window doesn't carry (branch reachability, per-commit changed files), so
// their membership is resolved ASYNC by the caller (backend hash sets — see
// `useBranchCommits`/`usePathCommits` in state/queries.ts) and passed in
// already-resolved. When a membership set isn't available yet (`undefined`),
// the predicate does NOT exclude the commit — it's the component's job to
// avoid showing the (still unfiltered-for-that-dimension) list while the
// membership is resolving, so the user never sees silently-wrong results.

import { fold } from "./fold";
import type { Commit } from "./types";

export type MergeFilter = "all" | "merges" | "normal";

export type HistoryFilters = {
  /** Free text over subject + hash + author (accent-tolerant). */
  text: string;
  /** Author substring (accent-tolerant), independent of the free-text field. */
  author: string;
  /** Branch name (local or remote, e.g. "main" or "origin/main"); "" = all. */
  branch: string;
  /** Inclusive lower bound, "YYYY-MM-DD"; "" = no bound. */
  dateFrom: string;
  /** Inclusive upper bound, "YYYY-MM-DD"; "" = no bound. */
  dateTo: string;
  merge: MergeFilter;
  /** Path or glob pathspec (e.g. "src/", "*.rs"); "" = no filter. */
  path: string;
};

export const EMPTY_HISTORY_FILTERS: HistoryFilters = {
  text: "",
  author: "",
  branch: "",
  dateFrom: "",
  dateTo: "",
  merge: "all",
  path: "",
};

export function hasActiveFilters(filters: HistoryFilters): boolean {
  return (
    filters.text.trim() !== "" ||
    filters.author.trim() !== "" ||
    filters.branch !== "" ||
    filters.dateFrom !== "" ||
    filters.dateTo !== "" ||
    filters.merge !== "all" ||
    filters.path.trim() !== ""
  );
}

export type FilterMembership = {
  /** Hashes reachable from `filters.branch` (backend-resolved). */
  branchHashes?: Set<string> | null;
  /** Hashes of commits touching `filters.path` (backend-resolved). */
  pathHashes?: Set<string> | null;
};

export function matchesFilters(commit: Commit, filters: HistoryFilters, membership: FilterMembership = {}): boolean {
  const text = filters.text.trim();
  if (text) {
    const haystack = fold(`${commit.subject} ${commit.hash} ${commit.author}`);
    if (!haystack.includes(fold(text))) return false;
  }

  const author = filters.author.trim();
  if (author && !fold(commit.author).includes(fold(author))) return false;

  if (filters.branch && membership.branchHashes && !membership.branchHashes.has(commit.hash)) return false;

  if (filters.dateFrom) {
    const from = new Date(`${filters.dateFrom}T00:00:00`).getTime();
    if (!Number.isNaN(from) && new Date(commit.date).getTime() < from) return false;
  }
  if (filters.dateTo) {
    const to = new Date(`${filters.dateTo}T23:59:59.999`).getTime();
    if (!Number.isNaN(to) && new Date(commit.date).getTime() > to) return false;
  }

  const isMerge = commit.parents.length > 1;
  if (filters.merge === "merges" && !isMerge) return false;
  if (filters.merge === "normal" && isMerge) return false;

  if (filters.path.trim() && membership.pathHashes && !membership.pathHashes.has(commit.hash)) return false;

  return true;
}
