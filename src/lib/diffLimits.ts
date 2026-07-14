// Rendering caps for large diffs. Measured on this machine (react render of
// the full pipeline): 20k lines ≈ 1.8–2.7s, 50k lines ≈ 4.6–6.6s of ONE task —
// a frozen UI. Rendering in pages keeps the first paint bounded no matter how
// big the patch is.

/** Lines rendered per "page"; more pages load via the footer button. */
export const DIFF_PAGE_LINES = 1500;

/** Lines longer than this render without syntax highlighting. */
export const HIGHLIGHT_MAX_LINE = 400;

/** Patches beyond this many (rendered) lines skip highlighting entirely. */
export const HIGHLIGHT_MAX_LINES = 8000;

/**
 * Marker line the backend appends when it capped a patch (see cap_patch in
 * git/mod.rs). `\`-prefixed lines can never be diff content, so it is
 * unambiguous. The UI strips it and offers "Carregar diff completo".
 */
export const TRUNCATED_MARKER = "\\ gitsylva:truncated";

/** Highlight gate shared by the unified and split views. */
export function shouldHighlight(totalLines: number): boolean {
  return totalLines <= HIGHLIGHT_MAX_LINES;
}
