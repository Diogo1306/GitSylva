import type { MessageValue } from "../../types";

// Settings screen: nav, Settings.tsx chrome, and every section
// (Appearance, GitIdentity, Commits, PushPull, Shortcuts, Notifications,
// Cleanup, About) plus the stub sections. Namespace: "settings.*".
export const ptSettings = {
} satisfies Record<string, MessageValue>;

export type SettingsKey = keyof typeof ptSettings;
