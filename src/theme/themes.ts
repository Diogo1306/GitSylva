// Theme system ported from the GitSylva design handoff (docs/design).
// A theme is a full set of CSS custom properties. On top of the theme sit
// three orthogonal choices: tree style, branch color palette, and accent.
// computeThemeVars() folds all four into one flat { "--x": "value" } map that
// the app writes onto :root. This mirrors the design's renderVals() logic.

export type ThemeKey = "escuro" | "claro" | "gitclassic" | "nipon";
export type TreeStyleKey = "normal" | "sakura" | "tropical" | "grafo";
export type BranchColorKey =
  | "auto"
  | "oceano"
  | "sunset"
  | "fogo"
  | "neon"
  | "outono"
  | "uva";
export type FontKey = "inter" | "sistema" | "atkinson";

export type Vars = Record<string, string>;

export type Palette = {
  name: string;
  hint: string;
  canopy: [string, string, string];
  vivid: [string, string];
  vars: Vars;
  accents: [string, string, string][]; // [name, hex, textOn]
};

/** #RRGGBB + alpha -> rgba(). */
export function hexAlpha(hex: string, alpha: number): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

export const PALETTES: Record<ThemeKey, Palette> = {
  claro: {
    name: "Clássico",
    hint: "preto & branco",
    canopy: ["#C6CFC1", "#D3DCCE", "#DEE6D9"],
    vivid: ["#1F78E0", "#E06A2B"],
    vars: {
      "--leaf": "#7BA083",
      "--desk": "radial-gradient(120% 90% at 50% 0%, #F7F7F3 0%, #E8E8E3 70%)",
      "--win": "#FFFFFF",
      "--winB": "rgba(0,0,0,0.12)",
      "--shadow": "0 24px 70px rgba(0,0,0,0.16)",
      "--panel": "#FAFAF7",
      "--panel2": "#F5F5F1",
      "--border": "#E7E7E0",
      "--bsoft": "rgba(0,0,0,0.05)",
      "--text": "#191C1A",
      "--text2": "#59605A",
      // Slightly darker than the prototype's #90968F so small labels pass AA.
      "--muted": "#767C74",
      "--danger": "#B14C4C",
      "--dangerT": "#FFFFFF",
      "--sel": "rgba(25,28,26,0.07)",
      "--hover": "rgba(25,28,26,0.045)",
      "--btn": "#FFFFFF",
      "--btnB": "#DDDDD5",
      "--btnT": "#363C37",
      "--badge": "#EDEDE7",
      "--badgeT": "#59605A",
      "--input": "#FFFFFF",
      "--l0": "#3B7A57",
      "--l0bg": "rgba(59,122,87,0.11)",
      "--l0bd": "rgba(59,122,87,0.30)",
      "--l1": "#4E76A8",
      "--l1bg": "rgba(78,118,168,0.11)",
      "--l1bd": "rgba(78,118,168,0.30)",
      "--l2": "#B08540",
      "--l2bg": "rgba(176,133,64,0.13)",
      "--l2bd": "rgba(176,133,64,0.32)",
      "--tagbd": "#DCDCD4",
      "--dhB": "rgba(78,118,168,0.10)",
      "--dhT": "#40628C",
      "--dcT": "#6F766E",
      "--daB": "rgba(59,122,87,0.10)",
      "--daT": "#2F6B4F",
      "--ddB": "rgba(179,80,80,0.10)",
      "--ddT": "#A34D4D",
      "--stMB": "rgba(176,133,64,0.15)",
      "--stMT": "#8A6A33",
      "--stAB": "rgba(59,122,87,0.14)",
      "--stAT": "#2F6B4F",
      "--stDB": "rgba(179,80,80,0.13)",
      "--stDT": "#A34D4D",
      "--auAS": "#3B7A57",
      "--auASb": "rgba(59,122,87,0.14)",
      "--auMD": "#4E76A8",
      "--auMDb": "rgba(78,118,168,0.14)",
      "--auLF": "#8A6A33",
      "--auLFb": "rgba(176,133,64,0.16)",
    },
    accents: [
      ["Preto", "#191C1A", "#FFFFFF"],
      ["Verde", "#3B7A57", "#FFFFFF"],
      ["Azul", "#4E76A8", "#FFFFFF"],
      ["Âmbar", "#8A6A33", "#FFFFFF"],
    ],
  },
  escuro: {
    name: "Batman",
    hint: "grafite escuro",
    canopy: ["#1E211F", "#252927", "#2D332F"],
    vivid: ["#4EA8FF", "#FFA13F"],
    vars: {
      "--desk": "radial-gradient(120% 90% at 50% 0%, #1B1D1F 0%, #0B0C0D 62%)",
      "--win": "#141618",
      "--winB": "rgba(255,255,255,0.08)",
      "--shadow": "0 0 0 1px rgba(0,0,0,0.55), 0 24px 80px rgba(0,0,0,0.55)",
      "--panel": "#101214",
      "--panel2": "#0C0E10",
      "--border": "#272B2E",
      "--bsoft": "rgba(255,255,255,0.05)",
      "--text": "#EAECEE",
      "--text2": "#A5ACB2",
      // Lifted from the prototype's #61686E so small labels pass AA on #141618.
      "--muted": "#7B838B",
      "--danger": "#C25555",
      "--dangerT": "#FFFFFF",
      "--sel": "rgba(234,236,238,0.08)",
      "--hover": "rgba(234,236,238,0.05)",
      "--btn": "#1B1E21",
      "--btnB": "#2D3134",
      "--btnT": "#C8CDD2",
      "--badge": "#262A2E",
      "--badgeT": "#AEB5BB",
      "--input": "#181B1D",
      "--leaf": "#82C99B",
      "--l0": "#82C99B",
      "--l0bg": "rgba(130,201,155,0.12)",
      "--l0bd": "rgba(130,201,155,0.28)",
      "--l1": "#7FA6D9",
      "--l1bg": "rgba(127,166,217,0.12)",
      "--l1bd": "rgba(127,166,217,0.28)",
      "--l2": "#D9A96B",
      "--l2bg": "rgba(217,169,107,0.13)",
      "--l2bd": "rgba(217,169,107,0.30)",
      "--tagbd": "#31363A",
      "--dhB": "rgba(127,166,217,0.08)",
      "--dhT": "#7FA6D9",
      "--dcT": "#8C9399",
      "--daB": "rgba(130,201,155,0.10)",
      "--daT": "#A9DDBC",
      "--ddB": "rgba(228,122,122,0.10)",
      "--ddT": "#E4A3A3",
      "--stMB": "rgba(217,169,107,0.14)",
      "--stMT": "#DCBE93",
      "--stAB": "rgba(130,201,155,0.14)",
      "--stAT": "#A9DDBC",
      "--stDB": "rgba(228,122,122,0.14)",
      "--stDT": "#E4A3A3",
      "--auAS": "#82C99B",
      "--auASb": "rgba(130,201,155,0.15)",
      "--auMD": "#7FA6D9",
      "--auMDb": "rgba(127,166,217,0.15)",
      "--auLF": "#D9A96B",
      "--auLFb": "rgba(217,169,107,0.15)",
    },
    accents: [
      ["Branco", "#EAECEE", "#111315"],
      ["Amarelo", "#E8C55A", "#111315"],
      ["Azul", "#7FA6D9", "#111315"],
      ["Roxo", "#B79AE0", "#111315"],
    ],
  },
  gitclassic: {
    name: "Git Classic",
    hint: "preto, cores vivas",
    canopy: ["#12241A", "#16301F", "#1C3E26"],
    vivid: ["#58A6FF", "#F0883E"],
    vars: {
      "--desk": "radial-gradient(120% 90% at 50% 0%, #10151B 0%, #010409 62%)",
      "--win": "#0D1117",
      "--winB": "rgba(255,255,255,0.08)",
      "--shadow": "0 0 0 1px rgba(0,0,0,0.6), 0 24px 80px rgba(0,0,0,0.6)",
      "--panel": "#090C10",
      "--panel2": "#06080B",
      "--border": "#21262D",
      "--bsoft": "rgba(255,255,255,0.045)",
      "--text": "#E6EDF3",
      "--text2": "#9DA7B1",
      // GitHub's fg.muted — the prototype's #6E7681 fails AA on #0D1117.
      "--muted": "#7D8590",
      "--danger": "#DA3633",
      "--dangerT": "#FFFFFF",
      "--sel": "rgba(63,185,80,0.12)",
      "--hover": "rgba(230,237,243,0.05)",
      "--btn": "#161B22",
      "--btnB": "#30363D",
      "--btnT": "#C9D1D9",
      "--badge": "#21262D",
      "--badgeT": "#9DA7B1",
      "--input": "#0D1117",
      "--leaf": "#3FB950",
      "--l0": "#3FB950",
      "--l0bg": "rgba(63,185,80,0.13)",
      "--l0bd": "rgba(63,185,80,0.34)",
      "--l1": "#58A6FF",
      "--l1bg": "rgba(88,166,255,0.13)",
      "--l1bd": "rgba(88,166,255,0.32)",
      "--l2": "#F0883E",
      "--l2bg": "rgba(240,136,62,0.13)",
      "--l2bd": "rgba(240,136,62,0.32)",
      "--tagbd": "#30363D",
      "--dhB": "rgba(88,166,255,0.09)",
      "--dhT": "#58A6FF",
      "--dcT": "#8B949E",
      "--daB": "rgba(86,211,100,0.11)",
      "--daT": "#56D364",
      "--ddB": "rgba(248,81,73,0.11)",
      "--ddT": "#F85149",
      "--stMB": "rgba(240,136,62,0.15)",
      "--stMT": "#F0A35E",
      "--stAB": "rgba(86,211,100,0.15)",
      "--stAT": "#56D364",
      "--stDB": "rgba(248,81,73,0.14)",
      "--stDT": "#F85149",
      "--auAS": "#3FB950",
      "--auASb": "rgba(63,185,80,0.16)",
      "--auMD": "#58A6FF",
      "--auMDb": "rgba(88,166,255,0.16)",
      "--auLF": "#F0883E",
      "--auLFb": "rgba(240,136,62,0.16)",
    },
    accents: [
      ["Verde", "#3FB950", "#04160A"],
      ["Azul", "#58A6FF", "#051020"],
      ["Laranja", "#F0883E", "#1A0D02"],
      ["Branco", "#E6EDF3", "#0D1117"],
    ],
  },
  nipon: {
    name: "Nipon",
    hint: "branco & sakura",
    canopy: ["#E9D3DA", "#F0DEE4", "#F5E7EB"],
    vivid: ["#E0468F", "#8A63D9"],
    vars: {
      "--desk": "radial-gradient(120% 90% at 50% 0%, #F8F2F1 0%, #ECE2E1 70%)",
      "--win": "#FFFFFF",
      "--winB": "rgba(60,30,40,0.12)",
      "--shadow": "0 24px 70px rgba(90,50,65,0.16)",
      "--panel": "#FBF7F6",
      "--panel2": "#F6EFEE",
      "--border": "#EDE1E1",
      "--bsoft": "rgba(90,50,65,0.05)",
      "--text": "#241D1E",
      "--text2": "#6B5D5F",
      // Darker than the prototype's #A08F92 so small labels pass AA on warm white.
      "--muted": "#877479",
      "--danger": "#B24D60",
      "--dangerT": "#FFFFFF",
      "--sel": "rgba(201,108,147,0.10)",
      "--hover": "rgba(201,108,147,0.055)",
      "--btn": "#FFFFFF",
      "--btnB": "#E4D4D6",
      "--btnT": "#4A3C3F",
      "--badge": "#F2E6E8",
      "--badgeT": "#6B5D5F",
      "--input": "#FFFFFF",
      "--leaf": "#D983A8",
      "--l0": "#C96C93",
      "--l0bg": "rgba(201,108,147,0.12)",
      "--l0bd": "rgba(201,108,147,0.32)",
      "--l1": "#7E96C4",
      "--l1bg": "rgba(126,150,196,0.12)",
      "--l1bd": "rgba(126,150,196,0.30)",
      "--l2": "#C0A05E",
      "--l2bg": "rgba(192,160,94,0.14)",
      "--l2bd": "rgba(192,160,94,0.34)",
      "--tagbd": "#E0D0D2",
      "--dhB": "rgba(126,150,196,0.10)",
      "--dhT": "#5A76A8",
      "--dcT": "#7D6F71",
      "--daB": "rgba(93,158,110,0.11)",
      "--daT": "#3F7B52",
      "--ddB": "rgba(190,86,100,0.10)",
      "--ddT": "#AD4C5E",
      "--stMB": "rgba(192,160,94,0.16)",
      "--stMT": "#8F7433",
      "--stAB": "rgba(93,158,110,0.14)",
      "--stAT": "#3F7B52",
      "--stDB": "rgba(190,86,100,0.13)",
      "--stDT": "#AD4C5E",
      "--auAS": "#C96C93",
      "--auASb": "rgba(201,108,147,0.14)",
      "--auMD": "#7E96C4",
      "--auMDb": "rgba(126,150,196,0.14)",
      "--auLF": "#8F7433",
      "--auLFb": "rgba(192,160,94,0.16)",
    },
    accents: [
      ["Rosa", "#C96C93", "#FFFFFF"],
      ["Carvão", "#241D1E", "#FFFFFF"],
      ["Índigo", "#7E96C4", "#FFFFFF"],
      ["Dourado", "#B98A3E", "#FFFFFF"],
    ],
  },
};

export const FONTS: Record<FontKey, { name: string; desc: string; stack: string }> = {
  inter: { name: "Inter", desc: "Padrão do GitSylva", stack: "'Inter', sans-serif" },
  sistema: {
    name: "Sistema",
    desc: "Segoe UI / San Francisco",
    stack: "-apple-system, 'Segoe UI', 'Helvetica Neue', Helvetica, sans-serif",
  },
  atkinson: {
    name: "Atkinson Hyperlegible",
    desc: "Máxima legibilidade",
    stack: "'Atkinson Hyperlegible', 'Inter', sans-serif",
  },
};

// Branch color palettes recolor the lines leaving main (lanes 1 and 2).
// Each entry is [dark pair, light pair].
const BRANCH_PALETTES: Record<
  Exclude<BranchColorKey, "auto">,
  { dark: [string, string]; light: [string, string] }
> = {
  oceano: { dark: ["#4EA8FF", "#3DD6D0"], light: ["#1F78E0", "#0E9E93"] },
  sunset: { dark: ["#FF8A4E", "#FF6FB5"], light: ["#E06A2B", "#D8478E"] },
  fogo: { dark: ["#FF5D4E", "#FFC531"], light: ["#E03B30", "#DFA400"] },
  neon: { dark: ["#3BE477", "#F45FE3"], light: ["#0FA958", "#C339B5"] },
  outono: { dark: ["#D97757", "#D9A94B"], light: ["#B85C3F", "#A8802E"] },
  uva: { dark: ["#A48FD9", "#FF6FB5"], light: ["#7E64B8", "#D8478E"] },
};

export type TreeDef = { name: string; desc: string };

/** Tree style metadata for the settings picker (theme independent). */
export const TREE_META: Record<TreeStyleKey, TreeDef> = {
  normal: { name: "Clássica", desc: "Folhas de carvalho" },
  sakura: { name: "Sakura", desc: "Flores de cerejeira" },
  tropical: { name: "Tropical", desc: "Palmeiras e cocos" },
  grafo: { name: "Ramificação", desc: "Git clássico: só nós" },
};

export const BRANCH_COLOR_META: { key: BranchColorKey; name: string; swatch: string }[] = [
  { key: "auto", name: "Auto", swatch: "linear-gradient(90deg, var(--l1), var(--l2))" },
  { key: "oceano", name: "Oceano", swatch: "linear-gradient(90deg, #4EA8FF, #3DD6D0)" },
  { key: "sunset", name: "Pôr-do-sol", swatch: "linear-gradient(90deg, #FF8A4E, #FF6FB5)" },
  { key: "fogo", name: "Fogo", swatch: "linear-gradient(90deg, #FF5D4E, #FFC531)" },
  { key: "neon", name: "Neon", swatch: "linear-gradient(90deg, #3BE477, #F45FE3)" },
  { key: "outono", name: "Outono", swatch: "linear-gradient(90deg, #D97757, #D9A94B)" },
  { key: "uva", name: "Uva", swatch: "linear-gradient(90deg, #A48FD9, #FF6FB5)" },
];

/**
 * The leaf color a tree style would have under a given theme — used by the
 * pickers so each option previews with ITS OWN color (sakura pink, tropical
 * green…), not whatever the currently applied style painted onto --leaf.
 */
export function treeLeafColor(theme: ThemeKey, style: TreeStyleKey): string {
  const dark = theme !== "claro" && theme !== "nipon";
  if (style === "sakura") return dark ? "#E8A0BF" : "#D983A8";
  if (style === "tropical") return dark ? "#4FCE6B" : "#3FA45C";
  if (style === "grafo") return PALETTES[theme].vars["--text"];
  return PALETTES[theme].vars["--leaf"];
}

// ── Localized display labels ─────────────────────────────────────────────────
// The PALETTES/FONTS/TREE_META/BRANCH_COLOR_META objects above keep their
// original names as stable identifiers/fallbacks; the UI reads display text
// through these helpers so the picker follows the active language. Keys live in
// the i18n "theme.*" catalog namespace; the cast is safe because the sets are
// finite and covered by the catalog-parity test.
import { t, type MessageKey } from "../i18n";

const tk = (key: string): string => t(key as MessageKey);

export const themeName = (k: ThemeKey): string => tk(`theme.name.${k}`);
export const themeHint = (k: ThemeKey): string => tk(`theme.hint.${k}`);
export const accentName = (theme: ThemeKey, idx: number): string => tk(`theme.accent.${theme}.${idx}`);
export const fontName = (k: FontKey): string => tk(`theme.font.${k}.name`);
export const fontDesc = (k: FontKey): string => tk(`theme.font.${k}.desc`);
export const treeName = (k: TreeStyleKey): string => tk(`theme.tree.${k}.name`);
export const treeDesc = (k: TreeStyleKey): string => tk(`theme.tree.${k}.desc`);
export const branchColorName = (k: BranchColorKey): string => tk(`theme.branch.${k}`);

export type ThemePrefs = {
  theme: ThemeKey;
  treeStyle: TreeStyleKey;
  branchColor: BranchColorKey;
  accentIdx: number;
  fontKey: FontKey;
};

/**
 * Fold theme + tree style + branch color + accent + font into a flat CSS
 * variable map, replicating the design's renderVals() theme logic.
 */
export function computeThemeVars(prefs: ThemePrefs): Vars {
  const pal = PALETTES[prefs.theme] ?? PALETTES.escuro;
  const themeKey = prefs.theme;
  const vars: Vars = { ...pal.vars };

  // Accent.
  const accents = pal.accents;
  const accIdx = Math.min(Math.max(prefs.accentIdx, 0), accents.length - 1);
  const [, accHex, accText] = accents[accIdx];
  vars["--accent"] = accHex;
  vars["--accentT"] = accText;
  vars["--sel"] = hexAlpha(accHex, themeKey === "claro" ? 0.08 : 0.1);

  // Font.
  vars["--font"] = (FONTS[prefs.fontKey] ?? FONTS.inter).stack;

  // Tree style (semi-theme): recolors leaf/trunk. dark = not a light theme.
  const dark = themeKey !== "claro" && themeKey !== "nipon";
  let leaf = vars["--leaf"];
  let trunk = "#8A5A33";
  if (prefs.treeStyle === "sakura") {
    leaf = dark ? "#E8A0BF" : "#D983A8";
    trunk = dark ? "#9C6B5E" : "#7E564B";
  } else if (prefs.treeStyle === "tropical") {
    leaf = dark ? "#4FCE6B" : "#3FA45C";
    trunk = dark ? "#A5754A" : "#8A5A33";
  } else if (prefs.treeStyle === "grafo") {
    leaf = vars["--l0"];
  }
  vars["--leaf"] = leaf;
  vars["--trunk"] = trunk;

  // Branching style: main becomes neutral (git classic look).
  if (prefs.treeStyle === "grafo") {
    const mono = vars["--text"];
    vars["--l0"] = mono;
    vars["--l0bg"] = hexAlpha(mono, 0.1);
    vars["--l0bd"] = hexAlpha(mono, 0.32);
    vars["--leaf"] = mono;
  }

  // Branch color: recolor lanes 1 and 2 (main keeps trunk color).
  const defaultPair: [string, string] = pal.vivid ?? [vars["--l1"], vars["--l2"]];
  const bp =
    prefs.branchColor === "auto"
      ? defaultPair
      : dark
        ? BRANCH_PALETTES[prefs.branchColor].dark
        : BRANCH_PALETTES[prefs.branchColor].light;
  vars["--l1"] = bp[0];
  vars["--l1bg"] = hexAlpha(bp[0], 0.12);
  vars["--l1bd"] = hexAlpha(bp[0], 0.28);
  vars["--l2"] = bp[1];
  vars["--l2bg"] = hexAlpha(bp[1], 0.13);
  vars["--l2bd"] = hexAlpha(bp[1], 0.3);

  return vars;
}
