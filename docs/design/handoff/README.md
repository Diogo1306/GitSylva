# GitSylva — Handoff Package

A Git desktop client with a **living-tree** identity: the commit history is rendered as a
growing tree (trunk, branches, leaves) and ambient forest art drifts behind the window.
This package documents the existing high-fidelity design so it can be reimplemented in a
**Tauri + React + Vite + TypeScript** desktop app.

---

## 0. About these files (read first)

- The files in `prototype/` are **design references written in HTML** (a live, clickable
  prototype), **not** production code to ship. The task is to **recreate this design in the
  target Tauri + React + TS codebase** using its own patterns and libraries.
- **Fidelity: high (hifi).** Colors, spacing, typography, radii, states and animations are
  final and should be matched closely. Exact token values are in `tokens/`.
- All data in the prototype is **mock data** (repos, commits, diffs, stashes). Every real Git
  operation is **visually represented only** — it updates local component state to *show* the
  result. Section 12 lists exactly what still needs real logic.

### How to open the prototype
Open `prototype/GitSylva Floresta.dc.html` in a Chromium browser. It restores state from
`localStorage['gitsylva-floresta-prefs']`. To re-see onboarding, clear that key.
`prototype/GitSylva Logos.dc.html` is the logo/branding exploration (wordmark + icon).

---

## 1. Overview

GitSylva reframes a Sourcetree/GitKraken-style client around a calm, natural metaphor. The
core value: the **branch graph is the hero** and it reads as a tree — `main` is the woody
trunk, branches curve off as limbs, each commit sprouts a leaf. Four themes and four tree
styles let the user tune the mood without changing the layout. Motion is a **functional
requirement**, not decoration: transitions confirm what happened (a leaf falls on fetch, the
tree "grows" a node on commit, toasts are wrapped by a small vine flourish).

Primary surfaces: repository tabs/rail, History (graph + commit detail), Working Copy
(staging + diff + commit), Stashes, Add Repository, Settings, and a global Command Palette.

---

## 2. Screens

| # | Screen | Purpose | Reference |
|---|--------|---------|-----------|
| 1 | **Splash** | App launch; wordmark draws in, letters hop away leaving the `S`-tree | — (animation) |
| 2 | **Onboarding** | First run: connect GitHub/GitLab, pick name/email, theme, tree style, see "what's new" cards | — |
| 3 | **History** | Default working screen: branch graph + commit list (left), commit detail with files + diff (right) | `references/01-history.png` |
| 4 | **Working Copy** | Unstaged/staged file lists, per-file diff, commit message + commit button | `references/05-working-copy.png` |
| 5 | **Stashes** | List of stashes with Apply / Discard; empty state | `references/03-stashes.png` |
| 6 | **Add Repository** | Tabs: Local / Remote / Clone / Add / Create; searchable recents | `references/07-add-repository.png` |
| 7 | **Settings** | Left section nav + scrollable content (Appearance, Accounts, Git, Commits, Push & Pull, Shortcuts, SSH, Notifications, Language, Advanced, Cleanup) | `references/04-settings.png` |
| 8 | **Command Palette** | ⌘K overlay: fuzzy jump to repos, branches, commits, actions | `references/06-command-palette.png` |
| — | **Theme variants** | Same layout, different tokens | `references/08-theme-gitclassic.png`, `references/09-theme-nipon-sakura.png` |

Overlays that sit on top of any screen: **Modals** (New branch, Stash, Push, Pull, Merge,
Tag, Discard confirm, Connect account, Generate SSH key, Reset settings), **branch context
menu**, and **toasts/notifications** — merged into a single bottom-right stack in the shipped
app (this spec's original toasts-bottom-center / notifications-top-right split was changed by
a later product decision; see `docs/GITSYLVA_FINAL_AUDIT.md` §10, Ronda 5.1/5.2).

---

## 3. Navigation map

```
Splash ──▶ Onboarding (first run only) ──▶ Add Repository ──▶ History
                                              │
main window (persistent chrome: titlebar + toolbar + bottom action bar)
  ├─ Sidebar / Rail nav ──▶ Working Copy · History · Stashes
  ├─ Titlebar tabs (or left Rail) ──▶ switch repository · groups collapse/close
  ├─ Toolbar ──▶ Fetch · Discard · Terminal · Search(⌘K) · Settings
  ├─ Bottom bar ──▶ Commit · Pull · Push · Branch · Merge · Stash · Tag
  ├─ "+" ──▶ Add Repository (Local/Remote/Clone/Add/Create)
  └─ Settings ──▶ "← Voltar" returns to prevView (History/Working/…)

Command Palette (⌘K) is modal over any screen and can jump to any repo/branch/commit/action.
```

State model (single component today; see §9 for the React split):
`view ∈ {history, working, stashes, settings, picker}`, plus `splash`, `onboard`,
`modal`, `palette`, `menu`, `repoIdx`, `repoLayout ∈ {tabs, rail}`.

---

## 4. Component map

Reusable, data-driven components to build (names are the semantic handoff names):

**Chrome**
- `TitleBar` (drag region; macOS traffic-lights left / Windows controls right — see §5)
- `RepoTabs` + `RepoTabGroup` (Chrome-style groups: named, colored, collapsible, closable)
- `RepoRail` (VS Code-style left project list; alternative to tabs)
- `Toolbar` (Fetch, Discard, Terminal, Search, Settings)
- `BottomActionBar` (Commit, Pull, Push, Branch, Merge, Stash, Tag + repo/ahead/behind status)
- `Sidebar` (Workspace nav, Branches, Remotes, Tags)

**History**
- `BranchGraph` (SVG: trunk/limbs as bézier paths, `GraphNode` circles, per-commit leaves)
- `CommitRow` (message, branch/tag `Chip`s, author `Avatar`, hash, relative time)
- `CommitDetailPanel` (author, date, hash pill, message, +add/−del, changed files, diff)
- `FileStatusRow` + `StatusBadge` (A/M/D)
- `DiffView` (mono, colored hunk header / context / add / delete lines)

**Working Copy**
- `StageList` (unstaged/staged, checkbox toggle, "Preparar tudo" / "Descartar")
- `CommitBox` (message textarea + primary commit button with staged count)

**Overlays & primitives**
- `Modal` (shared shell: title, close, body, cancel + primary action; danger variant)
- `ContextMenu`, `CommandPalette`, `Toast`, `Notification`, `Tooltip` (native `title` today)
- `Button` / `IconButton`, `Input`, `Textarea`, `Segmented`, `Toggle` (pill 38×22),
  `Checkbox`, `RadioCard`, `SwatchPicker`, `ThemePreviewCard`, `Badge`, `Chip`, `EmptyState`
- `SettingsSectionNav` + `SettingsSection` (scroll-spy highlights active section)
- `ForestBackdrop` (ambient boughs + falling leaves; see performance notes §11)
- `NewsCardDeck` (onboarding: 3 stacked, shuffled cards)

---

## 5. Desktop / Tauri behavior

- **Window chrome is drawn by the app**, not the OS. `TitleBar` shows macOS traffic-lights on
  the left when `platform = mac`, and Windows min/max/close on the right when `platform = win`.
  Wire the buttons to Tauri window APIs (`appWindow.minimize/toggleMaximize/close`). The
  titlebar (and empty toolbar areas) must be a **drag region** (`data-tauri-drag-region`);
  buttons inside must stop drag.
- **Min window size:** ~900×560. Below the responsive breakpoints, panels collapse (see §8).
- Use a real desktop font stack fallback; the prototype loads Google Fonts (see §6) — bundle
  them locally in Tauri (`fonts/`) rather than CDN.
- No SSR, no Next.js, no server routes, no browser-only APIs for rendering. Everything is
  local. Credentials/SSH keys must use the OS keychain via Tauri, never localStorage.

Layout regions:
- **Fixed:** TitleBar (50px), BottomActionBar (~52px).
- **Flexible:** body row = Sidebar/Rail (fixed width) + main content (flex).
- **Scroll containers:** commit list, diff panes, settings content, stage lists, sidebar.
- **Resizable panels:** History graph list ⇔ CommitDetailPanel; Working Copy stage column ⇔
  diff; each has a min width (see §8). Persist sizes in prefs.
- **Overlays:** modals/palette are centered fixed layers with a scrim; toasts and
  notifications share one stack, bottom-right, in the shipped app (see the note in §2 —
  updated from this spec's original toasts-bottom-center / notifications-top-right split).

---

## 6. Typography

Load weights 400–700. Bundle locally for Tauri.

| Role | Family | Notes |
|------|--------|-------|
| Wordmark / logo | **Space Grotesk** 600, letter-spacing 0.3px | `git`+S-tree+`ylva` |
| UI (default) | **Instrument Sans** | body, labels, buttons |
| Serif accents | **Instrument Serif** | occasional headings in branding |
| Monospace | **JetBrains Mono** 400/500/600 | hashes, file paths, diffs, kbd, branch names |
| A11y option | **Atkinson Hyperlegible** | selectable in Settings → Advanced → UI font |

Type scale in use (px): 22 (settings title), 17 (wordmark), 15, 14.5, 13.5 (body/nav),
13, 12.5 (buttons), 12, 11.5, 11, 10.5 (badges/section labels). Section labels are
uppercase, weight 600–700, letter-spacing 1.2–1.4px, color `--muted`.

---

## 7. Design tokens

Full, exact values live in **`tokens/themes.css`** (CSS custom properties, one block per
theme via `[data-theme]`) and **`tokens/themes.json`**. Set `data-theme` on the app root to
switch. Summary of the token families:

- **Surfaces:** `--desk` (behind window), `--win`, `--panel`, `--panel2`, `--input`
- **Lines/borders:** `--border`, `--bsoft`, `--winB`, `--btnB`, `--tagbd`
- **Text:** `--text`, `--text2`, `--muted`
- **Interactive:** `--accent` / `--accentT`, `--btn`/`--btnB`/`--btnT`, `--sel`, `--hover`,
  `--badge`/`--badgeT`
- **Graph lanes:** `--l0/1/2` (+ `bg`/`bd` tints). `--l0` = main/trunk color, `--l1`/`--l2` =
  branch lanes. `--trunk` is the woody trunk color; `--leaf` the foliage color.
- **Diff:** `--dhB/dhT` (hunk), `--dcT` (context), `--daB/daT` (added), `--ddB/ddT` (deleted)
- **File status:** `--stAB/stAT` (added), `--stMB/stMT` (modified), `--stDB/stDT` (deleted)
- **Avatars:** `--auAS`, `--auMD`, `--auLF` (+ `b` tints)
- **Shadow:** `--shadow`

Themes: **Clássico** (light, black/white), **Batman** (graphite dark), **Git Classic**
(near-black + vivid green/blue, GitHub-like), **Nipon** (white + sakura pink).

Non-token scales:
- **Radius:** 5, 6, 7, 8 (buttons/inputs), 9–12 (cards/modals), 14 (window), 999 (pills).
- **Spacing:** 4-based; common gaps 4/6/7/8/10/12/14/16/20; page padding 28–36.
- **Z-index:** base 1 · toolbar overlays 40 · context menu 60 · palette/modals 50 · toast 70.
- **Icon sizes:** 11 (window glyphs), 14–15 (toolbar), 16 (status), 22 avatar, 30 icon-button.

Branch-color palettes (recolor lanes `--l1/--l2`, main keeps trunk color): `auto` (theme's
vivid pair), `oceano`, `sunset`, `fogo`, `neon`, `outono`, `uva` — each has a light+dark pair
(values in the prototype, `branchPalettes` map). `grafo` tree style forces monochrome lanes
(classic Git look).

---

## 8. Responsive & resizing rules

Content adapts to window width (the prototype measures the container, not the viewport):

- **≥ ~1180px:** full layout — tabs show branch name, CommitDetailPanel ~372px, both stage
  columns visible.
- **~980–1180px:** tab branch labels hide (`respTabBr`), CommitDetailPanel narrows toward its
  min; sidebar stays.
- **< ~980px:** Working Copy switches from side-by-side (stage list | diff) to **stacked** —
  selecting a file reveals its diff below; the bottom bar drops lower-priority buttons
  (Tag/Merge) into an overflow. CommitDetailPanel can collapse to a toggle.
- **Rail mode** (`repoLayout='rail'`): repositories move to a 176px left project list (VS
  Code style) so the titlebar frees up horizontal space for small windows.
- **Truncation:** repo names, branch names, commit messages and file paths all
  `text-overflow: ellipsis`. File paths use `direction: rtl` trick to keep the filename
  visible.
- Panel min widths: graph list ≈ 360px, CommitDetailPanel ≈ 300px, stage column ≈ 300px.

Implement with container queries / a `ResizeObserver` on the window body, not fixed pixel
screens.

---

## 9. Implementation notes for React

- Split the single prototype component into the components in §4. Keep graph + list + detail
  as **data-driven** (`commits[]`, `branches[]`, `files[]`, `stashes[]`, `repos[]`) — never
  hand-place rows.
- `BranchGraph` is SVG generated from commit data (lane assignment → bézier path per parent
  edge + a node circle + a leaf per commit). It's the one place `React.createElement`/SVG
  generation is appropriate; memoize per `(commits, rowH, theme)`.
- Avoid: hundreds of absolutely-positioned layers, deep wrapper nesting, per-frame React state
  for ambient motion (drive `ForestBackdrop` with CSS animations only).
- Persist prefs (theme, treeStyle, branchColor, font, layout, panel sizes, git identity,
  toggles) in a store; in Tauri back it with a config file, not localStorage.

---

## 10. Interaction rules
See **`interaction-specs/interactions.md`** — every clickable, keyboard, selection, drag,
scroll, open/close, focus and loading/error behavior, per component.

## 11. Animation rules
See **`animation-specs/animations.md`** — a full table (trigger, start, end, duration,
easing, delay, interruption, exit, reduced-motion) plus the performance ruleset
(transform/opacity only, pause ambient motion when hidden/blurred, respect
`prefers-reduced-motion`).

---

## 12. What is real vs. mock (be honest during implementation)

**Fully designed & interactive in the prototype (state-only, mock data):**
switch repo/tab, tab groups collapse/close, sidebar nav, select commit → detail+diff,
stage/unstage/stage-all/discard, type + create commit (adds a node to the graph),
push/pull/fetch (updates ahead/behind + chips), branch/merge/tag creation, stash
apply/discard, command palette jump, theme / tree / branch-color / font / layout changes,
onboarding flow, add-repository flow, toasts & notifications, window min/max/close animations.

**Visually represented only (no real effect):** terminal button, SSH "test connection",
account connect, CI/pipeline notifications, LFS sizes, cache size / cleanup.

**Requires real application logic on implementation (Tauri + git2/CLI):**
reading the working tree & real diffs, real staging/commit/push/pull/fetch/merge/rebase/
tag/stash, branch checkout, credential + SSH key storage (OS keychain), OAuth to
GitHub/GitLab, opening a real terminal, file-system repo discovery & clone.

---

## 13. Known limitations / notes
- Prototype is a single large component (by design for the prototyping tool); §4/§9 define the
  intended component decomposition.
- Tooltips use native `title`; replace with a styled `Tooltip` component in React.
- Diffs are short mock hunks; real syntax highlighting is out of scope for the design.
- The `S`-as-tree logo is drawn in SVG (see `prototype/GitSylva Logos.dc.html`); export final
  icon sizes from there.

## 14. Package contents
```
design_handoff_gitsylva/
├── README.md                     ← this file
├── prototype/                    ← live HTML references (source of truth)
│   ├── GitSylva Floresta.dc.html ← the app
│   ├── GitSylva Logos.dc.html    ← logo / icon exploration
│   └── support.js                ← runtime for the .dc.html files
├── tokens/
│   ├── themes.css                ← all 4 themes as [data-theme] CSS vars
│   └── themes.json               ← same, machine-readable
├── animation-specs/animations.md
├── interaction-specs/interactions.md
└── references/                   ← screenshots of key screens & themes
```
