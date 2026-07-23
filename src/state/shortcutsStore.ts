import { create } from "zustand";
import { persist } from "zustand/middleware";
import { t } from "../i18n";

// Rebindable global shortcuts. Combo stored as "mod+shift+k" (`mod` = ⌘ on macOS, Ctrl elsewhere); every action requires the mod key so plain typing never triggers git ops.
export type ShortcutAction = "palette" | "commit" | "push" | "pull" | "fetch" | "branch" | "stash";

/** All actions, in display order — for iterating the shortcut list. */
export const SHORTCUT_ACTIONS: ShortcutAction[] = ["palette", "commit", "push", "pull", "fetch", "branch", "stash"];

/** The localized label for an action (reads the active language at call time). */
export function shortcutLabel(action: ShortcutAction): string {
  return t(`shortcut.${action}`);
}

export const DEFAULT_BINDINGS: Record<ShortcutAction, string> = {
  palette: "mod+k",
  commit: "mod+enter",
  push: "mod+p",
  pull: "mod+shift+l",
  fetch: "mod+r",
  branch: "mod+b",
  stash: "mod+s",
};

type ShortcutsState = {
  bindings: Record<ShortcutAction, string>;
  /** Rebinds an action; if the combo is taken, the two actions swap combos. */
  setBinding: (action: ShortcutAction, combo: string) => void;
  reset: () => void;
};

export const useShortcutsStore = create<ShortcutsState>()(
  persist(
    (set) => ({
      bindings: { ...DEFAULT_BINDINGS },
      setBinding: (action, combo) =>
        set((s) => {
          const next = { ...s.bindings };
          const holder = (Object.keys(next) as ShortcutAction[]).find((a) => next[a] === combo);
          if (holder && holder !== action) next[holder] = next[action];
          next[action] = combo;
          return { bindings: next };
        }),
      reset: () => set({ bindings: { ...DEFAULT_BINDINGS } }),
    }),
    { name: "gitsylva-shortcuts", version: 0 },
  ),
);

/** Normalizes a keydown into a combo string, or null if it can't be one
 * (pure modifier, or missing the required mod key). */
export function comboFromEvent(e: Pick<KeyboardEvent, "key" | "ctrlKey" | "metaKey" | "shiftKey" | "altKey">): string | null {
  const key = e.key.toLowerCase();
  if (key === "control" || key === "meta" || key === "shift" || key === "alt") return null;
  if (!e.ctrlKey && !e.metaKey) return null;
  let combo = "mod+";
  if (e.altKey) combo += "alt+";
  if (e.shiftKey) combo += "shift+";
  combo += key === " " ? "space" : key;
  return combo;
}

/** Renders "mod+shift+l" as "⌘⇧L" (mac) or "Ctrl+Shift+L". */
export function formatCombo(combo: string, isMac: boolean): string[] {
  const parts = combo.split("+");
  const out: string[] = [];
  for (const p of parts) {
    if (p === "mod") out.push(isMac ? "⌘" : "Ctrl");
    else if (p === "shift") out.push(isMac ? "⇧" : "Shift");
    else if (p === "alt") out.push(isMac ? "⌥" : "Alt");
    else if (p === "enter") out.push("↵");
    else out.push(p.length === 1 ? p.toUpperCase() : p[0].toUpperCase() + p.slice(1));
  }
  return out;
}

/** The action bound to this event, if any. */
export function actionForEvent(
  e: Pick<KeyboardEvent, "key" | "ctrlKey" | "metaKey" | "shiftKey" | "altKey">,
  bindings: Record<ShortcutAction, string>,
): ShortcutAction | null {
  const combo = comboFromEvent(e);
  if (!combo) return null;
  const found = (Object.keys(bindings) as ShortcutAction[]).find((a) => bindings[a] === combo);
  return found ?? null;
}
