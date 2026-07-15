// Single platform check so every shortcut hint agrees (Ctrl on Windows/Linux,
// ⌘ on macOS) — the pieces used to each carry their own copy or a hardcoded ⌘.

export const isMac = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform);

/** "mod+k" → "⌘K" (mac) or "Ctrl+K" — the inline-hint flavor of formatCombo. */
export function comboHint(combo: string): string {
  const parts = combo.split("+").map((p) => {
    if (p === "mod") return isMac ? "⌘" : "Ctrl";
    if (p === "shift") return isMac ? "⇧" : "Shift";
    if (p === "alt") return isMac ? "⌥" : "Alt";
    if (p === "enter") return "↵";
    return p.length === 1 ? p.toUpperCase() : p[0].toUpperCase() + p.slice(1);
  });
  return parts.join(isMac ? "" : "+");
}
