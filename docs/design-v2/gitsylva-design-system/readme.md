# GitSylva Design System

The reusable design foundation behind **GitSylva** — a Git desktop client with a
**living-tree** identity (the commit history renders as a growing tree; ambient forest art
drifts behind the window). Use this system to build other GitSylva surfaces or on-brand
tools/prototypes.

> **Sources:** derived from the GitSylva prototype in this org — `GitSylva Floresta.dc.html`
> (the app) and `GitSylva Logos.dc.html` (logo/icon exploration). A full implementation
> handoff also exists in `design_handoff_gitsylva/`.

## How to consume
Link the single entry stylesheet and set a theme on your root:
```html
<link rel="stylesheet" href="gitsylva-design-system/styles.css">
<body data-theme="classic"> … </body>   <!-- classic | batman | gitclassic | nipon -->
```
Everything is driven by CSS custom properties, so components restyle across all four themes
for free. React components live under `components/` and mount from the compiled bundle.

---

## CONTENT FUNDAMENTALS
- **Language:** UI copy is **European Portuguese**; code identifiers, branch names, commit
  messages and file paths stay in English (real dev artifacts). Mixed by design.
- **Tone:** calm, plain, friendly-competent. Short and concrete. No hype, no exclamation
  spam. Confirmations read like quiet reassurance: "Push concluído", "A tua floresta está
  plantada · bom código".
- **Person:** addresses the user informally as **tu** ("A tua floresta…").
- **Casing:** Section labels are UPPERCASE, letter-spaced (ESPAÇO DE TRABALHO, BRANCHES).
  Titles are sentence case. Buttons are Title-case single words where possible (Commit, Pull).
- **Separators:** middot ` · ` between meta bits (never em-dash "—"), e.g. `a41f9c2 · Ana Souza`.
- **Emoji:** none in product chrome. Iconography is line glyphs + the leaf/tree motif.
- **Vibe:** a code tool that feels like tending a garden — precise but unhurried.

## VISUAL FOUNDATIONS
- **Themes (4):** `classic` (light, black/white, default), `batman` (graphite dark),
  `gitclassic` (near-black + vivid green/blue, GitHub-like), `nipon` (white + sakura pink).
  All exact values in `tokens/colors.css`.
- **Color roles:** surfaces `--desk/--win/--panel/--panel2/--input`; text `--text/--text2/--muted`;
  interactive `--accent/--btn/--sel/--hover`; graph lanes `--l0` (main/trunk), `--l1`,`--l2`
  (branches) each with `bg`/`bd` tints; diff `--da*/--dd*/--dh*`; file status `--st{A,M,D}*`;
  `--trunk` (woody trunk) and `--leaf` (foliage) carry the nature motif.
- **Branch-color palettes** (recolor `--l1/--l2`, main keeps trunk): auto, oceano, sunset,
  fogo, neon, outono, uva — each a light+dark pair.
- **Type:** **Space Grotesk** 600 (wordmark), **Instrument Sans** (UI), **JetBrains Mono**
  (hashes/paths/diffs/branch names), Instrument Serif (serif accents), Atkinson Hyperlegible
  (a11y option). Scale 22→10.5px. Uppercase section labels at 10.5px / +1.3px tracking.
- **Spacing:** 4-based (`--sp-1`=4 … `--sp-12`=36). Fixed chrome: titlebar 50, action bar 52,
  sidebar 232, rail 176, detail panel 372.
- **Radius:** 5/7/8 (controls), 12 (cards/modals), 14 (window), 999 (pills).
- **Backgrounds:** app sits on a soft radial `--desk`; behind the window, an ambient
  **ForestBackdrop** (SVG boughs that sway + slow falling leaves). No gradients on UI
  surfaces, no glass/backdrop-blur in chrome (kept flat for 60 FPS on desktop).
- **Cards:** 1px `--border`, radius 12, `--panel` fill, no/low shadow inside the window;
  floating layers (modals, notifications) use `--shadow` / soft drop shadows.
- **Borders:** hairline `--border`; `--bsoft` for row dividers.
- **Motion (functional, not decoration):** entrances use `--ease-pop`
  `cubic-bezier(0.2,0.9,0.3,1)`; exits `--ease-out`. Buttons **lift** on hover
  (translateY −1.5px) and **press** to scale .97. Feedback carries the metaphor: a leaf falls
  on fetch, the graph grows a node on commit, toasts get a small vine flourish. Notifications
  slide in from the right and slide out on dismiss. **Animate only transform/opacity**; pause
  ambient loops when hidden; respect `prefers-reduced-motion` (see `tokens/motion.css` and
  `design_handoff_gitsylva/animation-specs/`).
- **Hover/press:** hover = `--hover` bg (or brightness 1.06 on filled) + lift; press = scale
  down; selected = `--sel` bg.

## ICONOGRAPHY
- The product uses **line glyphs drawn inline as SVG** (window controls, gear, carets) plus
  a few unicode marks in the prototype (`⟳` fetch, `>_` terminal, `↑/↓` push/pull, `✕`, `▸`).
  There is **no bundled icon font**. When building new surfaces, prefer a thin-stroke SVG set
  (e.g. Lucide via CDN) to match; document any substitution.
- The signature mark is the **leaf** and the **S-as-tree** wordmark — reuse `--leaf`/`--trunk`
  tokens and the shapes in `prototype/`(handoff)/`GitSylva Logos.dc.html`. **No emoji** in chrome.
- **Logo:** the `S` in *gitSylva* is a branching tree. The mark is the user's own creation and
  lives as SVG in the Logos prototype — export final icon sizes from there rather than
  redrawing it.

---

## Index / manifest
- `styles.css` — global entry (imports only).
- `tokens/` — `colors.css` (4 themes), `typography.css`, `spacing.css`, `radius.css`,
  `motion.css` (+ keyframes: `gs-pop`, `gs-fade-up`, `gs-notif-in/out`, `gs-spin`, `gs-leaf-pop`).
- `components/`
  - `forms/` — **Button**, **IconButton**, **Input**, **Toggle**, **Segmented**
  - `display/` — **Badge**, **Chip**, **StatusBadge**, **Avatar**, **Card**, **EmptyState**
  - `feedback/` — **Toast**, **Notification**, **Modal**
  - `git/` — **CommitRow**, **BranchItem**, **DiffLine**
- `guidelines/` — foundation specimen cards (Colors, Type, Spacing, Brand).
- `references/` — theme screenshots from the live app.

## Intentional additions
This system was distilled from a single-file prototype, so the component split is authored
(the prototype had no separate component files). The `git/` group (CommitRow, BranchItem,
DiffLine) is GitSylva-specific and central to the product; the rest are standard primitives
sized to the exact prototype values.

## Caveats
- The DS **namespace** for the compiled bundle wasn't verifiable when authoring; component
  card HTML auto-detects the global that holds the exports. If a card shows blank, check the
  generated `_ds_bundle.js` global name.
- Fonts load from Google Fonts CDN; for an offline Tauri build, bundle them locally and update
  `tokens/typography.css`.
- Components cover the core inventory; the full window chrome (TitleBar, RepoTabs, Toolbar,
  BottomActionBar, Sidebar, BranchGraph, CommandPalette) is documented in
  `design_handoff_gitsylva/` and can be added as a UI kit on request.
