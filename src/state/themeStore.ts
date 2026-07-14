import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  ThemeKey,
  TreeStyleKey,
  BranchColorKey,
  FontKey,
} from "../theme/themes";

export type RepoLayout = "tabs" | "rail";
export type PullMode = "ff" | "merge" | "rebase";

// Note: earlier builds persisted `density` and `language` keys that nothing
// consumed; they were dropped to keep every stored preference real. Stale keys
// in localStorage are simply ignored on rehydrate.
type ThemeState = {
  theme: ThemeKey;
  treeStyle: TreeStyleKey;
  branchColor: BranchColorKey;
  accentIdx: number;
  fontKey: FontKey;
  anims: boolean;
  repoLayout: RepoLayout;
  pullMode: PullMode;
  confirmDiscard: boolean;
  // Which async git results raise a top-right notification.
  notifPush: boolean;
  notifFetch: boolean;
  notifConflicts: boolean;
  savePrefs: (patch: Partial<ThemePrefsSlice>) => void;
  resetPrefs: () => void;
};

const DEFAULTS: ThemePrefsSlice = {
  theme: "escuro",
  treeStyle: "normal",
  branchColor: "auto",
  accentIdx: 0,
  fontKey: "inter",
  anims: true,
  repoLayout: "tabs",
  pullMode: "ff",
  confirmDiscard: true,
  notifPush: true,
  notifFetch: true,
  notifConflicts: true,
};

type ThemePrefsSlice = Pick<
  ThemeState,
  | "theme"
  | "treeStyle"
  | "branchColor"
  | "accentIdx"
  | "fontKey"
  | "anims"
  | "repoLayout"
  | "pullMode"
  | "confirmDiscard"
  | "notifPush"
  | "notifFetch"
  | "notifConflicts"
>;

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      ...DEFAULTS,
      // Resetting the accent when the theme changes keeps it in range, since
      // each theme has its own accent list.
      savePrefs: (patch) =>
        set((s) => {
          const next = { ...patch };
          if ("theme" in patch && patch.theme !== s.theme && !("accentIdx" in patch)) {
            next.accentIdx = 0;
          }
          return next;
        }),
      resetPrefs: () => set({ ...DEFAULTS }),
    }),
    { name: "gitsylva-prefs" },
  ),
);
