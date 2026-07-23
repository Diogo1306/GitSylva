// Per-repository "show diff code" preference for the History commit-detail
// panel. Session-scoped (sessionStorage): the manual choice survives switching
// commits and views within a session and is remembered independently per repo
// (keyed by repo.path); a fresh session starts from the caller's default.

const KEY = "gitsylva-diffpref";

type PrefMap = Record<string, boolean>;

function read(): PrefMap {
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as PrefMap) : {};
  } catch {
    return {};
  }
}

/** The stored choice for `repoPath`, or `fallback` when the repo has none yet. */
export function getDiffPref(repoPath: string, fallback: boolean): boolean {
  const m = read();
  return repoPath in m ? m[repoPath] : fallback;
}

/** Persist the diff open/closed choice for `repoPath` (session + per repo). */
export function setDiffPref(repoPath: string, open: boolean): void {
  try {
    const m = read();
    m[repoPath] = open;
    sessionStorage.setItem(KEY, JSON.stringify(m));
  } catch {
    // sessionStorage unavailable (private mode / tests) — the in-memory state
    // still drives this session; nothing else to do.
  }
}
