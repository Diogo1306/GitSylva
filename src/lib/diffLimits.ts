// Rendering caps for large diffs — paging keeps first paint bounded (rendering 50k lines at once froze the UI for ~5s).

/** Lines rendered per "page"; more pages load via the footer button. */
export const DIFF_PAGE_LINES = 1500;

/** Lines longer than this render without syntax highlighting. */
export const HIGHLIGHT_MAX_LINE = 400;

/** Patches beyond this many (rendered) lines skip highlighting entirely. */
export const HIGHLIGHT_MAX_LINES = 8000;

/** Marker the backend appends when it capped a patch (cap_patch in git/mod.rs); `\`-prefixed so it can never be diff content. UI strips it and offers the full diff. */
export const TRUNCATED_MARKER = "\\ gitsylva:truncated";

/** Highlight gate shared by the unified and split views. */
export function shouldHighlight(totalLines: number): boolean {
  return totalLines <= HIGHLIGHT_MAX_LINES;
}
