import { hexAlpha } from "../theme/themes";
import { t, type MessageKey } from "../i18n";

// Tab-group palette: eight fixed mid-tone hues that read on every theme. Stored `color` is an index here (0..2 keep their old green/blue/amber); display names live in the i18n "groupColor.*" catalog.
export const GROUP_COLORS: { hex: string }[] = [
  { hex: "#4E9B6A" },
  { hex: "#5B8FD6" },
  { hex: "#C99A3E" },
  { hex: "#D06A96" },
  { hex: "#9A6FD0" },
  { hex: "#3FA9B8" },
  { hex: "#D06055" },
  { hex: "#8A93A6" },
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
