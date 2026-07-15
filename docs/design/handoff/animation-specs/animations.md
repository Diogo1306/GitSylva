# GitSylva — Animation Specification

Motion is a **functional requirement** in GitSylva: it confirms actions and carries the
living-tree identity. Below, every animation with trigger → start → end, timing, easing,
delay, interruption, exit and reduced-motion behavior.

## Global rules
- **Animate only** `transform` (translate/scale/rotate) and `opacity`. Never animate
  width/height/top/left/box-shadow/filter for interaction feedback.
- **Standard easings:** entrance `cubic-bezier(0.2, 0.9, 0.3, 1)` ("pop"); UI transitions
  `ease` / `ease-in-out`; loading `linear`.
- **Standard durations:** micro (hover/press) 120–150ms · UI transition 150–250ms · panel/
  screen 250–450ms · ambient (sway/fall) 7–22s.
- **`prefers-reduced-motion: reduce`:** disable ambient motion (forest, falling leaves,
  sway, splash sequence), replace enter/exit transforms with a ≤120ms opacity fade, keep
  spinners as a static state, and render graph leaves/nodes at final state instantly.
- **Pause ambient loops** when the window is blurred/minimized or the element is offscreen
  (page visibility + `IntersectionObserver`); this protects 60 FPS and battery.

## Keyframes present in the prototype (source of truth)
`vineDraw, nodePop, leafPop, fadeUp, fadeUp2, fadeIn, popIn, winIn, toastUp, splashSeq,
logoIn, lineGrow, recPulse, letterHop, obFade, themeSwapA/B, fxFall, toastIn, fileIn,
letterL, letterR, spin, notifIn, sway, leafFall, winMinimize`.

## Table

| Animation | Component | Trigger | Start → End | Duration | Easing | Delay | Interruption | Exit | Reduced-motion |
|-----------|-----------|---------|-------------|----------|--------|-------|--------------|------|----------------|
| App launch splash | Splash | app open / window "close" btn | wordmark opacity 0→1, scale .9→1; underline width 0→120px; letters hop up & fade, `S` remains | ~2.1s seq (`splashSeq`, `logoIn`, `lineGrow`, `letterHop`) | pop / ease | staggered per letter | non-interruptible; auto-dismiss | fade out (`splashSeq` 72→100%) | show static logo ~300ms then continue |
| Onboarding enter | Onboarding | after splash | panel `popIn` (opacity+scale .94→1, y8→0) | 300ms | pop | — | — | `obFade` (opacity→0, scale→1.05) then unmount | opacity only |
| S-tree growth | Onboarding/logo | onboarding progress | trunk/branch `vineDraw` (stroke-dashoffset 1→0), nodes `nodePop` (scale 0→1), leaves `leafPop` | 400–600ms each | pop | staggered by depth | restart on replay | — | final state instantly |
| News card cycle | NewsCardDeck | click card / "próximo" | front card centered; others translateX ±30, y9, rotate ±3.5°, scale .96, opacity .5; on advance they reflow | 450ms | pop | — | re-trigger allowed (state-driven) | — | instant reorder, no transform |
| Screen switch | main content | sidebar/tab nav change | body `fadeUp` (opacity 0→1, y7→0) | 250ms | ease | — | latest wins (key on `view`) | previous unmounts | opacity ≤120ms |
| Tab bar appear | RepoTabs | switch to tabs layout | `fadeUp` | 250ms | ease | — | — | — | opacity |
| Rail appear | RepoRail | switch to rail layout | `fadeUp` | 250ms | ease | — | — | — | opacity |
| Repo tab group collapse | RepoTabGroup | click group chip | caret rotate 0↔90°; members mount/unmount | 150ms (caret) | ease | — | toggle | members fade | caret snaps |
| Modal open | Modal | open any modal | scrim opacity 0→1; dialog `winIn`/`popIn` (opacity+scale .965→1, y14→0) | 250ms | pop | — | close cancels | reverse fade+scale | opacity only |
| Command palette | CommandPalette | ⌘K / search btn | scrim + `popIn` panel | 250ms | pop | — | Esc closes | fade | opacity |
| Context menu | ContextMenu | right-click branch | `popIn` at cursor | 150ms | pop | — | outside-click/scroll closes | instant | opacity |
| Toast | Toast | git action result | `toastIn`/`toastUp` (y10→0, opacity 0→1), bottom-center; small vine flourish frames it | in 250ms, hold ~2.6s, out | ease | — | new toast replaces | fade+y down | opacity, no vine |
| Notification | Notification | push/fetch/CI result | `notifIn` (x28→0, scale .97→1, opacity), top-right stack | 300ms | pop | stagger if multiple | auto-dismiss ~4s / manual | slide+fade right | opacity |
| Button hover | Button/IconButton | pointer enter | translateY 0→-1.5px; bg → `--hover` | 150ms | ease | — | pointer leave reverses | translateY→0 | bg change only |
| Button press | primary buttons | active | scale 1→0.97 | 120ms | ease | — | release reverses | — | none |
| Fetch spinner | Toolbar Fetch | click Fetch | `⟳` rotate 0→360 loop; label "Fetch"→"A buscar…"; leaf `fxFall` on completion | `spin` 0.8s/loop; fall 2.4s | linear / ease-in | — | stops when fetch resolves | stop at 0° | static icon, no fall |
| Commit → node grows | BranchGraph | commit created | new `GraphNode` `nodePop` + leaf `leafPop` added at top of graph | 500ms | pop | — | — | — | appears instantly |
| File stage/unstage | StageList row | toggle/stage-all/discard | row `fileIn` on enter (x-8→0, scale .98→1, opacity); leaves list on remove | 200ms | ease-out | small per-row stagger | — | fade+shift out | opacity |
| Ephemeral leaf | window body | tab switch / fetch / commit | leaf `fxFall` from top (translateY 0→340, x→-18, rotate→230°, opacity pulse) | 2.4s | ease-in | — | — | fades at end | disabled |
| Forest sway | ForestBackdrop | ambient (always) | boughs `sway` rotate -1.1°↔1.4° alternate | 7–9.6s | ease-in-out | per-bough offset | pause when hidden | — | disabled |
| Falling leaves | ForestBackdrop | ambient | `leafFall` top→bottom, drift + rotate, opacity in/out | 15–22s | linear | staggered | pause when hidden | loop | disabled |
| Theme swap | app root | change theme | cross-fade `themeSwapA/B` (opacity .45→1) | ~250ms | ease | — | latest wins | — | instant |
| Window minimize | app window | min button | `winMinimize` (y0→64, scale→.86, opacity→0, back) | ~600ms | ease | — | — | — | instant |
| Settings scroll-spy | SettingsSectionNav | scroll content | active section item highlights (bg `--sel`) as its section crosses the top | 150ms | ease | — | continuous | — | keep (color only) |
| Recording shortcut pulse | Shortcuts row | click to rebind | input border → accent, opacity `recPulse` 1↔0.45 loop until key/Esc | 1s loop | ease-in-out | — | key captured / Esc stops | — | static accent border |
