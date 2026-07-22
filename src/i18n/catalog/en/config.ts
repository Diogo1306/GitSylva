import type { MessageValue } from "../../types";
import type { ConfigKey } from "../pt/config";

export const enConfig: Record<ConfigKey, MessageValue> = {
  // theme names / hints
  "theme.name.escuro": "Batman",
  "theme.name.claro": "Classic",
  "theme.name.gitclassic": "Git Classic",
  "theme.name.nipon": "Nipon",
  "theme.hint.escuro": "dark graphite",
  "theme.hint.claro": "black & white",
  "theme.hint.gitclassic": "black, vivid colors",
  "theme.hint.nipon": "white & sakura",

  // accent names, indexed per theme
  "theme.accent.claro.0": "Black",
  "theme.accent.claro.1": "Green",
  "theme.accent.claro.2": "Blue",
  "theme.accent.claro.3": "Amber",
  "theme.accent.escuro.0": "White",
  "theme.accent.escuro.1": "Yellow",
  "theme.accent.escuro.2": "Blue",
  "theme.accent.escuro.3": "Purple",
  "theme.accent.gitclassic.0": "Green",
  "theme.accent.gitclassic.1": "Blue",
  "theme.accent.gitclassic.2": "Orange",
  "theme.accent.gitclassic.3": "White",
  "theme.accent.nipon.0": "Pink",
  "theme.accent.nipon.1": "Charcoal",
  "theme.accent.nipon.2": "Indigo",
  "theme.accent.nipon.3": "Gold",

  // fonts
  "theme.font.inter.name": "Instrument Sans",
  "theme.font.inter.desc": "GitSylva default",
  "theme.font.sistema.name": "System",
  "theme.font.sistema.desc": "Segoe UI / San Francisco",
  "theme.font.atkinson.name": "Atkinson Hyperlegible",
  "theme.font.atkinson.desc": "Maximum legibility",

  // tree styles
  "theme.tree.normal.name": "Classic",
  "theme.tree.normal.desc": "Oak leaves",
  "theme.tree.sakura.name": "Sakura",
  "theme.tree.sakura.desc": "Cherry blossoms",
  "theme.tree.tropical.name": "Tropical",
  "theme.tree.tropical.desc": "Palms and coconuts",
  "theme.tree.grafo.name": "Branching",
  "theme.tree.grafo.desc": "Git classic: nodes only",

  // branch colors
  "theme.branch.auto": "Auto",
  "theme.branch.oceano": "Ocean",
  "theme.branch.sunset": "Sunset",
  "theme.branch.fogo": "Fire",
  "theme.branch.neon": "Neon",
  "theme.branch.outono": "Autumn",
  "theme.branch.uva": "Grape",

  // keyboard shortcut labels
  "shortcut.palette": "Quick search",
  "shortcut.commit": "Commit (in Working copy)",
  "shortcut.push": "Push",
  "shortcut.pull": "Pull",
  "shortcut.fetch": "Fetch",
  "shortcut.branch": "New branch",
  "shortcut.stash": "Save stash",

  // pull-mode inline hints
  "pullMode.ff.hint": "Only advances when possible; fails if diverged (no surprise merge).",
  "pullMode.merge.hint": "Integrates with a merge commit when diverged.",
  "pullMode.rebase.hint": "Reapplies your commits on top of the remote ones.",

  // git status letter → human title
  "status.added": "Added",
  "status.untracked": "Untracked",
  "status.deleted": "Deleted",
  "status.conflict": "Conflicted",
  "status.renamed": "Renamed",
  "status.copied": "Copied",
  "status.modified": "Modified",

  // tab-group color names
  "groupColor.0": "Green",
  "groupColor.1": "Blue",
  "groupColor.2": "Amber",
  "groupColor.3": "Pink",
  "groupColor.4": "Purple",
  "groupColor.5": "Cyan",
  "groupColor.6": "Red",
  "groupColor.7": "Gray",
};
