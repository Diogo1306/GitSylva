import type { MessageValue } from "../../types";

// App shell chrome: Titlebar, Sidebar, ActionBar, RepoRail, CommandPalette,
// Modals, GroupEditModal, AppShell. Namespace: "shell.*".
export const ptShell = {
} satisfies Record<string, MessageValue>;

export type ShellKey = keyof typeof ptShell;
