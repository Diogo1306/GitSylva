import { t } from "../i18n";

// Extracts a readable message from anything a Tauri invoke / react-query error
// can be. `String(error)` on an invoke error object renders "[object Object]".
export function errMsg(e: unknown, fallback = t("error.generic")): string {
  if (typeof e === "string" && e.trim()) return e;
  if (e instanceof Error && e.message.trim()) return e.message;
  const m = (e as { message?: unknown } | null)?.message;
  if (typeof m === "string" && m.trim()) return m;
  return fallback;
}

// ── Sync error classification ────────────────────────────────────────────────
//
// fetch/pull/push run with GIT_TERMINAL_PROMPT=0 (see src-tauri/src/git/mod.rs
// `run_git`), so a missing/rejected credential fails fast with a raw git
// stderr instead of hanging on a prompt. The backend's `friendly()` may
// prepend a Portuguese hint, but it always keeps the original stderr below it
// — so classification matches on that stable, English raw text and is
// unaffected by whether a hint was prepended.
export type SyncErrorKind = "auth" | "network" | "conflict" | "other";

export function classifySyncError(message: string): SyncErrorKind {
  const lower = message.toLowerCase();

  // HTTPS credential failures + SSH key/host rejections + HTTP 403 (git prints
  // it as "The requested URL returned error: 403" — \b avoids matching a hash
  // like "eb4033ff" that merely contains the digits).
  if (
    lower.includes("authentication failed") ||
    lower.includes("could not read username") ||
    lower.includes("could not read password") ||
    lower.includes("terminal prompts disabled") ||
    lower.includes("permission denied (publickey)") ||
    lower.includes("host key verification failed") ||
    /\b403\b/.test(lower)
  ) {
    return "auth";
  }

  // Remote unreachable — worth telling apart from auth since retrying (or
  // checking the connection) is the fix, not credentials.
  if (
    lower.includes("could not resolve host") ||
    lower.includes("could not connect") ||
    lower.includes("failed to connect") ||
    lower.includes("connection timed out") ||
    lower.includes("connection refused") ||
    lower.includes("network is unreachable") ||
    lower.includes("ssl certificate problem")
  ) {
    return "network";
  }

  // Merge/rebase conflicts from a pull — same check already used ad hoc for
  // the merge-conflict notification.
  if (lower.includes("conflict") || lower.includes("conflito")) {
    return "conflict";
  }

  return "other";
}

// Fetch has no dedicated modal (it is a one-shot action fired from the
// toolbar/sidebar/command palette/shortcut, surfaced only via a bottom-right
// notification), so it gets a lighter-touch version of the same distinct
// auth/network messaging the Pull/Push modals show inline.
export function fetchFailureNotice(e: unknown): { title: string; sub: string } {
  const msg = errMsg(e, t("error.fetchFailedFallback"));
  const kind = classifySyncError(msg);
  // Every branch keeps the raw git message so diagnostic detail is never
  // hidden (same principle as SyncFailurePanel); auth prepends guidance.
  if (kind === "auth") return { title: t("error.authTitle"), sub: `${t("error.authFetchHint")}\n${msg}` };
  if (kind === "network") return { title: t("error.networkTitle"), sub: msg };
  return { title: t("error.fetchFailedTitle"), sub: msg };
}
