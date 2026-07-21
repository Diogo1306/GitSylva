import type { MessageValue } from "../../types";

// Repository workspace views: History (+ commit detail/diff), WorkingCopy,
// ConflictBanner, Stashes. Namespaces: "history.*", "workingCopy.*", "stashes.*".
export const ptWorkspace = {
} satisfies Record<string, MessageValue>;

export type WorkspaceKey = keyof typeof ptWorkspace;
