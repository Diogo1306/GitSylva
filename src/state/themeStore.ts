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
export type Density = "conforto" | "compacta";
/** History detail/diff panel placement: beside the list or below it. */
export type HistoryLayout = "lado" | "baixo";

// Stale localStorage keys from earlier builds are simply ignored on rehydrate.
type ThemeState = {
  theme: ThemeKey;
  treeStyle: TreeStyleKey;
  branchColor: BranchColorKey;
  accentIdx: number;
  fontKey: FontKey;
  anims: boolean;
  repoLayout: RepoLayout;
  historyLayout: HistoryLayout;
  // Commit-row density: conforto = 52px rows, compacta = 40px (handoff token).
  density: Density;
  pullMode: PullMode;
  confirmDiscard: boolean;
  // Which async git results raise a bottom-right notification.
  notifPush: boolean;
  notifFetch: boolean;
  notifConflicts: boolean;
  savePrefs: (patch: Partial<ThemePrefsSlice>) => void;
  resetPrefs: () => void;
};

// V2 default theme is light "classic" (claro). New users only: rehydrate overlays these defaults and never resets an already-persisted pref.
const DEFAULTS: ThemePrefsSlice = {
  theme: "claro",
  treeStyle: "normal",
  branchColor: "auto",
  accentIdx: 0,
  fontKey: "inter",
  anims: true,
  repoLayout: "tabs",
  historyLayout: "lado",
  density: "conforto",
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
  | "historyLayout"
  | "density"
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
      // Reset accent on theme change to keep it in range (each theme has its own accent list).
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
    // Version 0 = pre-versioning shape; bump with a migrate fn on changes.
    { name: "gitsylva-prefs", version: 0 },
  ),
);
