import { hexAlpha } from "../theme/themes";
import { t, type MessageKey } from "../i18n";

// Tab-group palette (user request R5): groups pick from a fixed set of eight
// mid-tone hues that read on every theme, instead of borrowing the three lane
// colors. The stored `color` is an index into this table — the historical
// values 0..2 keep (roughly) their old green/blue/amber look.

export const GROUP_COLORS: { name: string; hex: string }[] = [
  { name: "Verde", hex: "#4E9B6A" },
  { name: "Azul", hex: "#5B8FD6" },
  { name: "Âmbar", hex: "#C99A3E" },
  { name: "Rosa", hex: "#D06A96" },
  { name: "Roxo", hex: "#9A6FD0" },
  { name: "Ciano", hex: "#3FA9B8" },
  { name: "Vermelho", hex: "#D06055" },
  { name: "Cinza", hex: "#8A93A6" },
];

export type GroupColorStyle = { fg: string; bg: string; bd: string };

/** Chip colors for a stored group color index (out-of-range folds back in). */
export function groupColor(idx: number): GroupColorStyle {
  const { hex } = GROUP_COLORS[((idx % GROUP_COLORS.length) + GROUP_COLORS.length) % GROUP_COLORS.length];
  return { fg: hex, bg: hexAlpha(hex, 0.13), bd: hexAlpha(hex, 0.32) };
}

/** The localized name for a group color index (reads the active language). */
export function groupColorName(idx: number): string {
  const i = ((idx % GROUP_COLORS.length) + GROUP_COLORS.length) % GROUP_COLORS.length;
  return t(`groupColor.${i}` as MessageKey);
}
