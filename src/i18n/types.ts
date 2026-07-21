// Core i18n types. Kept in their own module so the catalogs (which derive the
// key union) and the translate engine can share them without an import cycle.

export type Locale = "pt" | "en";

/** Values that vary by grammatical number. `one` covers count === 1, `other`
 * everything else; `zero` is an optional special case for count === 0. */
export type Plural = { one: string; other: string; zero?: string };

/** A catalog entry is either a plain string or a set of plural forms. */
export type MessageValue = string | Plural;

/** Interpolation params. `count` (when present) also drives plural selection. */
export type Params = Record<string, string | number>;
