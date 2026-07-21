import type { PullMode } from "../state/themeStore";
import { t } from "../i18n";

// Single source of truth for the pull-mode copy: shown as the picker in
// Settings → Push & Pull (src/features/settings/sections/PushPull.tsx) AND as
// read-only inline help in the Pull modal (src/features/shell/Modals.tsx), so
// both stay in sync. The names (Fast-forward/Merge/Rebase) read the same in
// both languages; the hint is localized via pullModeHint().
export const PULL_MODES: { key: PullMode; name: string }[] = [
  { key: "ff", name: "Fast-forward" },
  { key: "merge", name: "Merge" },
  { key: "rebase", name: "Rebase" },
];

/** The localized inline hint for a pull mode (reads the active language). */
export function pullModeHint(key: PullMode): string {
  return t(`pullMode.${key}.hint`);
}
