import type { PullMode } from "../state/themeStore";

// Single source of truth for the pull-mode copy: shown as the picker in
// Settings → Push & Pull (src/features/settings/sections/PushPull.tsx) AND as
// read-only inline help in the Pull modal (src/features/shell/Modals.tsx), so
// both stay in sync.
export const PULL_MODES: { key: PullMode; name: string; hint: string }[] = [
  { key: "ff", name: "Fast-forward", hint: "Só avança se possível; falha se divergir (sem merge surpresa)." },
  { key: "merge", name: "Merge", hint: "Integra com um commit de merge quando divergir." },
  { key: "rebase", name: "Rebase", hint: "Reaplica os teus commits por cima dos remotos." },
];
