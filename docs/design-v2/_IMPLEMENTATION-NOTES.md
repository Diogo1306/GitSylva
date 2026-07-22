# GitSylva Floresta V2 — implementation reference notes

Vendored contents of the GitSylva Floresta **V2** design handoff (from
`GitSylva design tool.zip`). Single source of truth for the V2 re-skin implemented per
`docs/superpowers/plans/2026-07-22-gitsylva-v2-redesign.md`. (The design's own docs are in
`README.md` and `gitsylva-design-system/readme.md` / `SKILL.md`.)

## Master reference
- **`GitSylva Floresta v2.dc.html`** — the full V2 app prototype (all screens, 4 themes).
  THE reference. Claude Design prototype; render with its sibling `support.js`, or read its
  source for exact structure.

## Where the exact values live
- Tokens: `gitsylva-design-system/tokens/` — `colors.css` (4 themes), `typography.css`,
  `spacing.css`, `radius.css`, `motion.css`; plus `design_handoff_gitsylva/tokens/themes.{css,json}`.
- Component specs: `gitsylva-design-system/components/{forms,display,feedback,git}/*.prompt.md`.
- Guidelines: `gitsylva-design-system/guidelines/*` (colors/type/spacing/radius/brand).
- Animation/interaction: `design_handoff_gitsylva/animation-specs/`, `interaction-specs/`.
- Rendered screens: `design_handoff_gitsylva/references/*.png`,
  `gitsylva-design-system/references/*.png`, `uploads/gitsylva-app/screenshot.png`.
- Brand assets: `exports/{classic,batman,gitclassic,nipon}/*`, `exports/transparent/*`,
  `uploads/gitsylva-app/{favicon.svg,icon.png}`.

## Theme name mapping (internal key -> V2 label)
claro -> classic (light, new-user default); escuro -> batman (dark); gitclassic; nipon.
Keep internal keys stable so persisted prefs survive.

## For later sub-projects (not this plan)
- `GitSylva Story.dc.html` — website (sub-project 2).
- `GitSylva Promo.dc.html` + `exports/gitsylva-promo.gif` — presentation GIF (sub-project 3).

## reference/
Holds screenshots captured from the V2 prototype per theme/screen for pixel comparison.
When incomplete, render the prototype or compare the running app directly against it.
