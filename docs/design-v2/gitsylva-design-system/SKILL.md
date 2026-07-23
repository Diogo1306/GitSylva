---
name: gitsylva-design
description: Use this skill to generate well-branded interfaces and assets for GitSylva (a living-tree Git desktop client), either for production or throwaway prototypes/mocks. Contains design guidelines, 4 themes, color/type/spacing tokens, fonts, and reusable UI kit components.
user-invocable: true
---

Read the `readme.md` file within this skill, and explore the other available files
(`styles.css`, `tokens/`, `components/`, `guidelines/`, `references/`).

Link `styles.css` and set `data-theme` on the root (`classic` | `batman` | `gitclassic` |
`nipon`). Everything is driven by CSS custom properties, so components restyle across all four
themes automatically. Components are React and mount from the compiled bundle; each has a
`.prompt.md` with usage.

If creating visual artifacts (slides, mocks, throwaway prototypes), copy assets out and create
static HTML files for the user to view. If working on production code, copy assets and read the
rules here to become an expert in designing with this brand. Honor the motion rules
(animate transform/opacity only; entrances `--ease-pop`, button hover-lift; the leaf/tree
feedback motif) and the calm, plain, informal-Portuguese content tone.

If the user invokes this skill without other guidance, ask them what they want to build, ask a
few questions, and act as an expert designer who outputs HTML artifacts or production code.
