// File-type icon table: maps a path to a small colored tile so lists read by
// language at a glance (the VS Code habit). Pure data here — the tile itself
// is rendered by components/FileIcon. Colors are fixed mid-tones that hold up
// on every theme (the tile background is the color at low alpha).

export type FileGlyph = "image" | "lock" | "git" | "doc";

export type FileIconDef = {
  color: string;
  /** 1–2 characters drawn in the tile (mono, bold). */
  label?: string;
  /** Non-letter glyph, mutually exclusive with label. */
  glyph?: FileGlyph;
};

const DOC: FileIconDef = { color: "#8A93A6", glyph: "doc" };
const IMAGE: FileIconDef = { color: "#A874D4", glyph: "image" };
const SHELL_GREEN: FileIconDef = { color: "#6BAA64", label: ">_" };
const CONFIG: FileIconDef = { color: "#8A8F98", label: "≡" };

const BY_EXT: Record<string, FileIconDef> = {
  ts: { color: "#3E8FD0", label: "TS" },
  mts: { color: "#3E8FD0", label: "TS" },
  cts: { color: "#3E8FD0", label: "TS" },
  tsx: { color: "#3E8FD0", label: "TS" },
  js: { color: "#C9A83A", label: "JS" },
  mjs: { color: "#C9A83A", label: "JS" },
  cjs: { color: "#C9A83A", label: "JS" },
  jsx: { color: "#C9A83A", label: "JS" },
  json: { color: "#B58F3E", label: "{}" },
  jsonc: { color: "#B58F3E", label: "{}" },
  html: { color: "#E06B3C", label: "<>" },
  htm: { color: "#E06B3C", label: "<>" },
  xml: { color: "#C08A3E", label: "<>" },
  css: { color: "#5D8DD6", label: "#" },
  scss: { color: "#CD6799", label: "#" },
  sass: { color: "#CD6799", label: "#" },
  less: { color: "#5D8DD6", label: "#" },
  md: { color: "#6A9FB5", label: "MD" },
  mdx: { color: "#6A9FB5", label: "MD" },
  rs: { color: "#CE7A3E", label: "RS" },
  rb: { color: "#D14748", label: "RB" },
  py: { color: "#4573A8", label: "PY" },
  go: { color: "#3FB4C4", label: "GO" },
  java: { color: "#E76F51", label: "J" },
  kt: { color: "#A263C9", label: "KT" },
  c: { color: "#6699CC", label: "C" },
  h: { color: "#6699CC", label: "C" },
  cpp: { color: "#6699CC", label: "C+" },
  cc: { color: "#6699CC", label: "C+" },
  cxx: { color: "#6699CC", label: "C+" },
  hpp: { color: "#6699CC", label: "C+" },
  cs: { color: "#A163C9", label: "C#" },
  php: { color: "#8A8FD0", label: "P" },
  swift: { color: "#E8823E", label: "SW" },
  sh: SHELL_GREEN,
  bash: SHELL_GREEN,
  zsh: SHELL_GREEN,
  ps1: { color: "#4273B8", label: ">_" },
  psm1: { color: "#4273B8", label: ">_" },
  bat: { color: "#8A8F98", label: ">_" },
  cmd: { color: "#8A8F98", label: ">_" },
  yml: { color: "#C08A3E", label: "Y" },
  yaml: { color: "#C08A3E", label: "Y" },
  toml: CONFIG,
  ini: CONFIG,
  cfg: CONFIG,
  conf: CONFIG,
  properties: CONFIG,
  env: CONFIG,
  svg: IMAGE,
  png: IMAGE,
  jpg: IMAGE,
  jpeg: IMAGE,
  gif: IMAGE,
  webp: IMAGE,
  ico: IMAGE,
  bmp: IMAGE,
  avif: IMAGE,
  lock: { color: "#8A8F98", glyph: "lock" },
  sql: { color: "#C48A3F", label: "DB" },
  db: { color: "#C48A3F", label: "DB" },
  sqlite: { color: "#C48A3F", label: "DB" },
  vue: { color: "#42B883", label: "V" },
  svelte: { color: "#E96B44", label: "S" },
  txt: DOC,
  log: DOC,
  pdf: { color: "#D14748", glyph: "doc" },
  zip: { color: "#A78050", label: "Z" },
  gz: { color: "#A78050", label: "Z" },
  tar: { color: "#A78050", label: "Z" },
  rar: { color: "#A78050", label: "Z" },
  "7z": { color: "#A78050", label: "Z" },
  ttf: { color: "#7F8A9A", label: "Aa" },
  otf: { color: "#7F8A9A", label: "Aa" },
  woff: { color: "#7F8A9A", label: "Aa" },
  woff2: { color: "#7F8A9A", label: "Aa" },
};

const GIT_FILES = new Set([".gitignore", ".gitattributes", ".gitmodules", ".gitkeep"]);

/** Icon for a repo-relative path (either separator). Unknown types → doc. */
export function iconFor(path: string): FileIconDef {
  const base = (path.split(/[/\\]/).pop() ?? path).toLowerCase();
  if (GIT_FILES.has(base)) return { color: "#F0643C", glyph: "git" };
  if (base.startsWith("dockerfile")) return { color: "#4273B8", label: "D" };
  if (base === "makefile") return { color: "#8A8F98", label: "MK" };
  if (base === "license" || base === "licence" || base === "copying") return { color: "#C9A227", label: "§" };
  const dot = base.lastIndexOf(".");
  const ext = dot >= 0 ? base.slice(dot + 1) : "";
  return BY_EXT[ext] ?? DOC;
}
