# GitSylva Floresta V2 — Redesign Design Spec (2026-07-22)

Status: approved (brainstorming) — ready for implementation planning.

## Goal

Re-skin the GitSylva desktop app to the **GitSylva Floresta V2** design, screen by
screen, applying the V2 design system (tokens, fonts, components, chrome, menus/tabs)
to the existing, fully-functional app **without losing any behavior**. The onboarding /
first-run flow is explicitly **out of scope** (stays exactly as-is).

This is sub-project 1 of 4 the user planned:
1. **V2 app redesign** (this spec).
2. "GitSylva Story" website (later, own spec).
3. README + presentation GIF (later).
4. New release (later, after user sign-off).

## Source of truth

The single source of truth for the V2 look and behavior is the prototype
`GitSylva Floresta v2.dc.html` (a Claude Design prototype), delivered in
`C:\Users\diogo.esteves\Documents\Design system\GitSylva design tool.zip`. Supporting
material in the same zip:
- `gitsylva-design-system/` — structured design system: `tokens/` (colors.css [4 themes],
  typography.css, spacing.css, radius.css, motion.css), `styles.css`, `components/`
  (forms/display/feedback/git) each with a `.prompt.md` spec + `.jsx`, `guidelines/`,
  `readme.md`, `SKILL.md`.
- `design_handoff_gitsylva/` — tokens/themes.css + themes.json, animation-specs/,
  interaction-specs/, prototype, reference PNGs.
- `exports/` — icons, wordmarks, onboarding trees, app icons per theme, promo assets.
- `GitSylva Story.dc.html` (sub-project 2), `GitSylva Promo.dc.html` + `gitsylva-promo.gif`
  (sub-project 3), `GitSylva UX Proposta.dc.html`, `uploads/` reference images.

The zip contents will be vendored into the repo under `docs/design-v2/` as the first
implementation task so implementers and reviewers have a stable, versioned reference.

## Principles

- **Re-skin in place.** Apply V2 styling/structure to the current components; do NOT
  rebuild the UI from scratch. Preserve all logic, state, queries, and the backlog work
  (accessibility/keyboard, i18n PT/EN, History filters, sync flows, graph fixes, load-more,
  proactive preload).
- **Two-way reconciliation.** For each screen, compare the V2 prototype against the current
  app: ADD what V2 introduces that the app lacks (new menus/tabs/affordances/styles); KEEP
  what the app has that the V2 prototype does not show (real features must not regress).
  Where the two genuinely conflict, the V2 prototype wins on visuals; the app wins on
  behavior — flag any conflict that changes behavior for a decision.
- **Preserve, do not break:** onboarding/first-run untouched; i18n PT/EN kept (V2 styling is
  applied to the already-translated strings, the language selector stays, the
  no-hardcoded-strings gate stays green); all tests stay green; persisted store keys
  unchanged (migrate if a shape must change); window min 900x560; ActionBar stays.
- **Faithfulness with verification.** Every screen is verified visually (CDP screenshot of
  the running app vs the V2 prototype reference) per theme before it is considered done.

## The V2 design system (foundations to adopt)

Exact values live in the vendored `docs/design-v2/gitsylva-design-system/tokens/*` and
`design_handoff_gitsylva/tokens/*`; summary of what changes vs the current app:

- **Themes (4):** `classic` (light, black/white — the V2 default), `batman` (graphite dark),
  `gitclassic` (near-black + vivid green/blue), `nipon` (white + sakura pink). Map to the
  current internal keys (claro↔classic, escuro↔batman, gitclassic, nipon) — keep the
  internal keys stable so persisted prefs survive; only values + display labels change.
  New-user default becomes `classic` (light) per V2; existing users keep their persisted
  theme.
- **Color roles:** surfaces `--desk/--win/--panel/--panel2/--input`; text
  `--text/--text2/--muted`; interactive `--accent/--btn/--sel/--hover`; graph lanes
  `--l0` (main/trunk), `--l1/--l2` (branches) each with bg/bd tints; diff `--da*/--dd*/--dh*`;
  file status `--st{A,M,D}*`; `--trunk` + `--leaf` nature motif.
- **Branch-color palettes (7):** auto, oceano, sunset, fogo, neon, outono, uva (each a
  light+dark pair recoloring `--l1/--l2`; main keeps trunk). Wire into the existing
  branch-color setting.
- **Typography:** Space Grotesk 600 (wordmark), **Instrument Sans** (UI — replaces Inter),
  JetBrains Mono (hashes/paths/diffs/branch names), Instrument Serif (serif accents),
  Atkinson Hyperlegible (a11y font option). Scale 22->10.5px; uppercase section labels
  10.5px / +1.3px tracking. **Bundle the fonts locally** (Tauri offline) rather than the
  Google Fonts CDN.
- **Spacing:** 4-based `--sp-1`=4 … `--sp-12`=36. Fixed chrome: titlebar 50, action bar 52,
  sidebar 232, rail 176, detail panel 372.
- **Radius:** 5/7/8 (controls), 12 (cards/modals), 14 (window), 999 (pills).
- **Motion:** entrances `--ease-pop` cubic-bezier(0.2,0.9,0.3,1); exits `--ease-out`; buttons
  lift on hover (translateY -1.5px) + press scale .97; feedback carries the metaphor (leaf on
  fetch, node grows on commit, vine flourish on toasts); notifications slide in/out from the
  right; animate only transform/opacity; pause ambient loops when hidden; respect
  prefers-reduced-motion. Keyframes: gs-pop, gs-fade-up, gs-notif-in/out, gs-spin, gs-leaf-pop.
- **ForestBackdrop:** ambient SVG boughs that sway + slow falling leaves behind the window,
  flat surfaces (no gradients/blur on chrome), 60fps budget.
- **Iconography:** thin-stroke line SVG glyphs + leaf/tree motif; no emoji in chrome; the S
  wordmark is a branching tree. Export final icons from the V2 logo exports, do not redraw.
- **Content:** section labels UPPERCASE letter-spaced; sentence-case titles; Title-case single
  word buttons; middot ` · ` separators (never em-dash); informal "tu". These are already the
  app's conventions (kept, refined via tokens).

## Components to restyle (shared primitives in `src/components/ui/`)

Button, IconButton, Input/Textarea, Toggle, **Segmented** (new primitive), Card, Chip,
Badge, StatusBadge, EmptyState, Modal, Toast/Notification, Tooltip, Tabs, SelectableRow,
Toolbar, FormField — each to the V2 `*.prompt.md` spec and token values. Keep their
accessibility contract (roles, keyboard, focus ring) from the backlog work.

Git-specific: CommitRow, BranchItem, DiffLine per the V2 `components/git/*` specs, mapped
onto the existing History/Sidebar/WorkingCopy subcomponents.

## Per-screen scope (each restyled to the V2 reference, reconciling deltas)

Titlebar + repo tabs; Sidebar (workspace nav, branches with folders, remotes, settings
entry); ActionBar; History (commit graph lanes/nodes/leaves, rows, detail panel, filter
bar, Diff toggle, unified/side-by-side); Working Copy (file list/rows, diff pane, blame,
commit box); Stashes; Settings + all sections; Command Palette; Modals (branch/tag/stash/
merge, pull/push, confirm, group edit, shortcuts, update); Notifications/Toasts stack;
RepoPicker (the add/clone/create surfaces — but NOT the onboarding flow).

## Preservation constraints (hard)

- Onboarding / first-run: **no changes**.
- i18n PT/EN: kept; no new hardcoded user-facing strings (the enforcement gate stays green);
  any new label goes through both catalogs.
- All existing tests stay green (vitest + cargo + lint + build); add tests only where a new
  primitive (e.g. Segmented) or a genuinely new behavior warrants one.
- Persisted store keys/shape unchanged (gitsylva-prefs/-open-repos/-shortcuts/-onboard/
  -locale/-recents/-recent-branches/-history-detail); migrate with a version bump if a shape
  must change (e.g. new branch-palette values).
- Window min 900x560; the responsive layout work from Task 6 is kept.
- ActionBar stays at the bottom.
- No em-dashes / emoji in commit messages; English commit messages; feature-branch +
  --no-ff workflow; milestone merges to master.

## Verification

Per screen and per theme: build the app, launch with remote debugging, capture a CDP
screenshot of the running screen, and compare against the V2 prototype reference for that
screen/theme. A screen is done only when it matches the reference (allowing for real-data
differences) with all functionality intact and tests green.

## Decomposition (implementation phases — detailed in the plan)

1. **Vendor + reference:** copy the zip contents into `docs/design-v2/`; render the V2
   prototype for all 4 themes and capture reference screenshots per screen.
2. **Foundation / tokens:** bundle fonts locally; bring V2 colors (4 themes), typography,
   spacing, radius, motion tokens into `src/theme/` (themes.ts + tokens.css); add the 7
   branch palettes; keep internal theme keys stable.
3. **ForestBackdrop:** ambient backdrop component behind the window (gated by anims +
   reduced-motion, paused when hidden).
4. **Primitives:** restyle `components/ui/*` to V2 (incl. the new Segmented), preserving the
   a11y contract.
5. **Chrome:** Titlebar + tabs, Sidebar, ActionBar.
6. **History:** graph (lanes/nodes/leaves), rows, detail panel, filter bar, diff toggle.
7. **Working Copy + Stashes:** file list/rows, diff/blame, commit box; stashes.
8. **Settings + Command Palette + Modals + Notifications.**
9. **Assets:** icons, wordmark, favicon, per-theme app icons from the V2 exports.
10. **Final visual + functional pass:** per-theme CDP verification of every screen; full
    test/lint/build; milestone merge to master.

Each phase is one or more feature branches executed via subagent-driven-development
(implementer + task review + fix loop), mirroring the backlog execution. Coherent blocks
merge to master as milestones with the user's sign-off before a release.

## Out of scope (later sub-projects)

- "GitSylva Story" website (`GitSylva Story.dc.html`) — own spec, hosted on GitHub later.
- README update + presentation GIF (`gitsylva-promo.gif`).
- New release/version (after user sign-off).
