import type { MessageValue } from "../types";
import { ptCommon } from "./pt/common";
import { ptConfig } from "./pt/config";
import { ptSettings } from "./pt/settings";
import { ptShell } from "./pt/shell";
import { ptWorkspace } from "./pt/workspace";
import { ptEntry } from "./pt/entry";

// Portuguese catalog — the source of truth for the key set. Split into
// per-area namespace files (pt/*.ts) that merge here; keys are namespaced
// strings ("history.*", "shell.*", …) so the areas never collide. `en.ts`
// mirrors this shape and is checked key-for-key at compile time.
export const pt = {
  ...ptCommon,
  ...ptConfig,
  ...ptSettings,
  ...ptShell,
  ...ptWorkspace,
  ...ptEntry,
} satisfies Record<string, MessageValue>;

/** The catalog key union — every `t()` call and the English catalog are typed
 * against this, so keys stay in sync at compile time. */
export type MessageKey = keyof typeof pt;
