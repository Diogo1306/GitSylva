import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  ThemeKey,
  TreeStyleKey,
  BranchColorKey,
  FontKey,
} from "../theme/themes";

export type Density = "normal" | "compacta";
export type RepoLayout = "tabs" | "rail";
export type Language = "pt" | "en";
export type PullMode = "ff" | "merge" | "rebase";

type ThemeState = {
  theme: ThemeKey;
  treeStyle: TreeStyleKey;
  branchColor: BranchColorKey;
  accentIdx: number;
  fontKey: FontKey;
  anims: boolean;
  density: Density;
  repoLayout: RepoLayout;
  language: Language;
  pullMode: PullMode;
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
  density: "normal",
  repoLayout: "tabs",
  language: "pt",
  pullMode: "ff",
};

type ThemePrefsSlice = Pick<
  ThemeState,
  | "theme"
  | "treeStyle"
  | "branchColor"
  | "accentIdx"
  | "fontKey"
  | "anims"
  | "density"
  | "repoLayout"
  | "language"
  | "pullMode"
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
