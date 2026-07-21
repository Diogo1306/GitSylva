import type { MessageValue } from "../../types";

// Labels for shared config data modules that several areas render through
// helpers: theme/tree/accent/font/branch names (theme/themes.ts), keyboard
// shortcut labels (state/shortcutsStore.ts) and pull-mode hints (lib/pullModes.ts).
// Proper nouns (Batman, Nipon, Sakura, Neon, Inter…) intentionally read the same
// in both languages.
export const ptConfig = {
  // theme names / hints
  "theme.name.escuro": "Batman",
  "theme.name.claro": "Clássico",
  "theme.name.gitclassic": "Git Classic",
  "theme.name.nipon": "Nipon",
  "theme.hint.escuro": "grafite escuro",
  "theme.hint.claro": "preto & branco",
  "theme.hint.gitclassic": "preto, cores vivas",
  "theme.hint.nipon": "branco & sakura",

  // accent names, indexed per theme
  "theme.accent.claro.0": "Preto",
  "theme.accent.claro.1": "Verde",
  "theme.accent.claro.2": "Azul",
  "theme.accent.claro.3": "Âmbar",
  "theme.accent.escuro.0": "Branco",
  "theme.accent.escuro.1": "Amarelo",
  "theme.accent.escuro.2": "Azul",
  "theme.accent.escuro.3": "Roxo",
  "theme.accent.gitclassic.0": "Verde",
  "theme.accent.gitclassic.1": "Azul",
  "theme.accent.gitclassic.2": "Laranja",
  "theme.accent.gitclassic.3": "Branco",
  "theme.accent.nipon.0": "Rosa",
  "theme.accent.nipon.1": "Carvão",
  "theme.accent.nipon.2": "Índigo",
  "theme.accent.nipon.3": "Dourado",

  // fonts
  "theme.font.inter.name": "Inter",
  "theme.font.inter.desc": "Padrão do GitSylva",
  "theme.font.sistema.name": "Sistema",
  "theme.font.sistema.desc": "Segoe UI / San Francisco",
  "theme.font.atkinson.name": "Atkinson Hyperlegible",
  "theme.font.atkinson.desc": "Máxima legibilidade",

  // tree styles
  "theme.tree.normal.name": "Clássica",
  "theme.tree.normal.desc": "Folhas de carvalho",
  "theme.tree.sakura.name": "Sakura",
  "theme.tree.sakura.desc": "Flores de cerejeira",
  "theme.tree.tropical.name": "Tropical",
  "theme.tree.tropical.desc": "Palmeiras e cocos",
  "theme.tree.grafo.name": "Ramificação",
  "theme.tree.grafo.desc": "Git clássico: só nós",

  // branch colors
  "theme.branch.auto": "Auto",
  "theme.branch.oceano": "Oceano",
  "theme.branch.sunset": "Pôr-do-sol",
  "theme.branch.fogo": "Fogo",
  "theme.branch.neon": "Neon",
  "theme.branch.outono": "Outono",
  "theme.branch.uva": "Uva",

  // keyboard shortcut labels
  "shortcut.palette": "Pesquisa rápida",
  "shortcut.commit": "Commit (na Cópia de trabalho)",
  "shortcut.push": "Push",
  "shortcut.pull": "Pull",
  "shortcut.fetch": "Fetch",
  "shortcut.branch": "Nova branch",
  "shortcut.stash": "Guardar stash",

  // pull-mode inline hints (names Fast-forward/Merge/Rebase read the same)
  "pullMode.ff.hint": "Só avança se possível; falha se divergir (sem merge surpresa).",
  "pullMode.merge.hint": "Integra com um commit de merge quando divergir.",
  "pullMode.rebase.hint": "Reaplica os teus commits por cima dos remotos.",

  // git status letter → human title (lib/status.ts, file-list tooltips)
  "status.added": "Adicionado",
  "status.untracked": "Não rastreado",
  "status.deleted": "Apagado",
  "status.conflict": "Em conflito",
  "status.renamed": "Renomeado",
  "status.copied": "Copiado",
  "status.modified": "Modificado",

  // tab-group color names (lib/groupColors.ts, GroupEditModal swatches)
  "groupColor.0": "Verde",
  "groupColor.1": "Azul",
  "groupColor.2": "Âmbar",
  "groupColor.3": "Rosa",
  "groupColor.4": "Roxo",
  "groupColor.5": "Ciano",
  "groupColor.6": "Vermelho",
  "groupColor.7": "Cinza",
} satisfies Record<string, MessageValue>;

export type ConfigKey = keyof typeof ptConfig;
