import { pt, type MessageKey } from "./catalog/pt";
import { en } from "./catalog/en";
import type { Locale, MessageValue, Params } from "./types";

const catalogs: Record<Locale, Record<string, MessageValue>> = { pt, en };

/** Pick the plural form. PT and EN share the same simple rule: `one` for a
 * count of exactly 1, `other` otherwise; `zero` wins for 0 when provided. */
function selectPlural(value: Exclude<MessageValue, string>, count: number): string {
  if (count === 0 && value.zero !== undefined) return value.zero;
  return count === 1 ? value.one : value.other;
}

/** Replace `{name}` placeholders with the matching param, stringified. */
function interpolate(text: string, params?: Params): string {
  if (!params) return text;
  return text.replace(/\{(\w+)\}/g, (whole, name: string) =>
    name in params ? String(params[name]) : whole,
  );
}

/** Resolve a key in the given locale, falling back to Portuguese (the complete
 * catalog) and finally to the raw key so a missing translation is visible but
 * never crashes. */
export function translate(locale: Locale, key: MessageKey, params?: Params): string {
  const entry = catalogs[locale]?.[key] ?? pt[key];
  if (entry === undefined) return key;
  if (typeof entry === "string") return interpolate(entry, params);
  const count = typeof params?.count === "number" ? params.count : 0;
  return interpolate(selectPlural(entry, count), params);
}
