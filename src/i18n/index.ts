import { useCallback } from "react";
import { useLocaleStore } from "./localeStore";
import { translate } from "./translate";
import type { MessageKey } from "./catalog/pt";
import type { Locale, Params } from "./types";

export type { Locale, Params } from "./types";
export type { MessageKey } from "./catalog/pt";
export { detectLocale } from "./detect";
export { useLocaleStore } from "./localeStore";

/** The translator signature used throughout the UI. */
export type TFunction = (key: MessageKey, params?: Params) => string;

/** Reactive translator for components — re-renders on a language switch. */
export function useT(): TFunction {
  const locale = useLocaleStore((s) => s.locale);
  return useCallback<TFunction>((key, params) => translate(locale, key, params), [locale]);
}

/** The active locale, for locale-aware formatting (dates, number formats). */
export function useLocale(): Locale {
  return useLocaleStore((s) => s.locale);
}

/** Non-reactive translator for callers outside React render (stores, helpers).
 * Reads the current locale at call time. */
export function t(key: MessageKey, params?: Params): string {
  return translate(useLocaleStore.getState().locale, key, params);
}

/** The current locale as a BCP-47 tag for Intl / toLocale* APIs. */
export function localeTag(locale: Locale): string {
  return locale === "en" ? "en-US" : "pt-PT";
}
