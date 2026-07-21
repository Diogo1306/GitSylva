import type { MessageValue } from "../types";
import type { MessageKey } from "./pt";
import { enCommon } from "./en/common";
import { enSettings } from "./en/settings";
import { enShell } from "./en/shell";
import { enWorkspace } from "./en/workspace";
import { enEntry } from "./en/entry";

// English catalog, assembled from the per-area namespace files. Typed as
// Record<MessageKey, …> so a missing or extra key versus Portuguese is a
// compile error. Real translations, never a copy of the Portuguese text.
export const en: Record<MessageKey, MessageValue> = {
  ...enCommon,
  ...enSettings,
  ...enShell,
  ...enWorkspace,
  ...enEntry,
};
