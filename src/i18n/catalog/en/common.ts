import type { MessageValue } from "../../types";
import type { CommonKey } from "../pt/common";

export const enCommon: Record<CommonKey, MessageValue> = {
  // ── common / shared vocabulary ─────────────────────────────────────────────
  "common.cancel": "Cancel",
  "common.confirm": "Confirm",
  "common.save": "Save",
  "common.close": "Close",
  "common.back": "Back",
  "common.open": "Open",
  "common.remove": "Remove",
  "common.delete": "Delete",
  "common.create": "Create",
  "common.rename": "Rename",
  "common.copy": "Copy",
  "common.search": "Search",
  "common.searchEllipsis": "Search…",
  "common.loading": "Loading…",
  "common.retry": "Try again",
  "common.yes": "Yes",
  "common.no": "No",
  "common.soon": "Soon",

  // ── relative time ──────────────────────────────────────────────────────────
  "time.now": "just now",
  "time.minutesAgo": "{count} min ago",
  "time.hoursAgo": "{count} h ago",
  "time.daysAgo": { one: "{count} day ago", other: "{count} days ago" },
  "time.weeksAgo": "{count} w ago",

  // ── sync / git errors ──────────────────────────────────────────────────────
  "error.generic": "an error occurred",
  "error.fetchFailedFallback": "could not fetch",
  "error.authTitle": "Authentication required",
  "error.authFetchHint": "Set up Git credentials for origin (credential manager or an SSH key).",
  "error.networkTitle": "No connection to the remote",
  "error.fetchFailedTitle": "Fetch failed",
};
