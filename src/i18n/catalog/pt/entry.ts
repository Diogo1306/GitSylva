import type { MessageValue } from "../../types";

// First-run + repo entry + shared low-level components: Onboarding, RepoPicker,
// useOpenRepo, and src/components/* (ConfirmDialog, DiffView, ErrorBoundary,
// Notifications, UpdatePrompt, ui/Modal, ui/PanelResize).
// Namespaces: "onboarding.*", "repo.*", "components.*".
export const ptEntry = {
} satisfies Record<string, MessageValue>;

export type EntryKey = keyof typeof ptEntry;
