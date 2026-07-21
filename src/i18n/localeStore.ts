import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Locale } from "./types";

// Persisted in a dedicated versioned key (`gitsylva-locale`) rather than folded
// into `gitsylva-prefs`, so the large prefs store needs no migration and the
// locale can rehydrate independently. Brand-new key → no legacy state to
// migrate; `version`/`migrate` are in place for future shape changes.
type LocaleState = {
  locale: Locale;
  /** True once the user picks a language in Settings. Until then, startup
   * detection (applyDetected) may override the default. */
  userSet: boolean;
  /** User action from the Settings language selector — pins the choice. */
  setLocale: (locale: Locale) => void;
  /** Startup OS detection — only applied while the user hasn't chosen. */
  applyDetected: (locale: Locale) => void;
};

export const useLocaleStore = create<LocaleState>()(
  persist(
    (set, get) => ({
      // PT-by-default; startup detection (App) may switch this to a detected
      // locale until the user makes an explicit choice.
      locale: "pt",
      userSet: false,
      setLocale: (locale) => set({ locale, userSet: true }),
      applyDetected: (locale) => {
        if (!get().userSet) set({ locale });
      },
    }),
    {
      name: "gitsylva-locale",
      version: 0,
      partialize: (s) => ({ locale: s.locale, userSet: s.userSet }),
      migrate: (persisted) => persisted as { locale: Locale; userSet: boolean },
    },
  ),
);
