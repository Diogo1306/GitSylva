import type { Locale } from "./types";

// Initial-language detection. The Tauri webview inherits the OS locale through
// `navigator.language`, so that is enough to guess PT vs EN without pulling in
// the OS plugin. Portuguese is the fallback (GitSylva ships PT-by-default).
export function detectLocale(): Locale {
  const tags: string[] = [];
  if (typeof navigator !== "undefined") {
    if (Array.isArray(navigator.languages)) tags.push(...navigator.languages);
    if (navigator.language) tags.push(navigator.language);
  }
  for (const tag of tags) {
    if (/^pt\b/i.test(tag)) return "pt";
    if (/^en\b/i.test(tag)) return "en";
  }
  return "pt";
}
