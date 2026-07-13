# Anexo 8 — Janela/Layout · Temas · Animações (3.3, 3.14, 3.15)

## Layout (3.3)
- **✅** Controlos de janela reais (`lib/window.ts` + `Titlebar.tsx:35-37`, permissões em `capabilities/default.json`); drag region presente (`Titlebar.tsx:127`, decorations:false); overflow/scroll dos painéis ok; tabs com ellipsis e ✕ com stopPropagation; hover consistente via `.gs-row/.gs-lift/.gs-press`.
- **L1 🔴 P2** — NÃO existem divisores redimensionáveis: todas as larguras fixas (Sidebar 230 — `Sidebar.tsx:76`; RepoRail 176 — `RepoRail.tsx:54`; detalhe History 360 — `History.tsx:323`; WorkingCopy 42% — `WorkingCopy.tsx:174`; Settings nav 192 — `Settings.tsx:53`). O design define arrastável+persistido (sidebar 180-340, detalhe 300-560, wc 320-540). Sem persistência de tamanhos.
- **L2 🟠 P2** — Controlos de janela estilo macOS à ESQUERDA com cores fixas `#FF5F57/#FEBC2E/#28C840` numa app Windows (`Titlebar.tsx:14-39`); glifos só em hover (`shell.css:51-61`). Decidir: mover/tematizar ou assumir estilo macOS.
- **L3 🟡 P2** — Duplo-clique para maximizar não explícito (Tauri v2 trata nativamente no drag region — verificar em runtime; senão `onDoubleClick`).
- **L4 🟡 P2** — Sem media queries de app; a 880px (minWidth) em modo rail: 176+230+360=766px fixos → lista de commits espremida/clipada. Design tinha breakpoints narrow<1180/tiny<980/micro<880.
- **L5 🟡 P2** — ActionBar sem flex-wrap/overflow: 7 botões + status cortados em janelas pequenas (`ActionBar.tsx:77-108`).
- **L6 🟡 P2** — Modal/ConfirmDialog sem Escape (ContextMenu e CommandPalette têm — inconsistente). Duplicado de S11.
- **L7 🟡 P3** — Controlos `<div onClick>` sem foco/teclado (transversal — ver anexo 9 a11y).

## Temas (3.14)
- **✅** Sistema derivado coerente: `computeThemeVars()` (4 temas × paletas × accents × fontes) → `:root` via `useApplyTheme`; fallback em tokens.css; helpers todos com `var(--...)`; diffs derivados do tema; scrollbars tematizadas; focus ring com `--accent`; cross-fade sem leaks (gated por anims).
- **T1 🟠 P2** — Botão destrutivo do ConfirmDialog ILEGÍVEL no Batman: `background: var(--ddT)` + `color:#fff` (`ConfirmDialog.tsx:21`) — no escuro `--ddT=#E4A3A3` (rosa-claro pensado como TEXTO) → branco sobre rosa ≈ 1.9:1. Correção: token `--danger` sólido (o design usa `#C25555` nos modais destrutivos).
- **T2 🟡 P2** — `--muted` falha WCAG AA nos temas claros (claro `#90968F`, nipon `#A08F92` ≈ 2.9:1 sobre panel) e no escuro `#61686E` ≈ 3.3:1 — usado em texto 10-12px por toda a app.
- **T3 🟡 P3** — Pétalas sakura do TreeLogo com rosa fixo `#E8A6C0` (`TreeLogo.tsx:87`) vs grafo tematizado (`CommitGraphSvg.tsx:166` usa var).
- **T4 🟡 P3** — Knob do Toggle branco fixo (`misc.tsx:57`) quase invisível OFF nos temas claros.
- **T5 🧹 P3** — Sombras rgba literais tokenizáveis (`Modal.tsx:8`, `ConfirmDialog.tsx:13`, `CommandPalette.tsx:139,154`, `Toaster.tsx:15`, `misc.tsx:57`) → `var(--shadow-1)`; scrims podem ficar.
- **T6 🧹 P2** — `App.css` é template Vite morto (não importado; vars inexistentes; únicas media queries da app em código morto). Apagar.

## Animações (3.15)
- **✅** Sem trabalho contínuo em background: zero requestAnimationFrame/setInterval; timers com cleanup; FallingLeaves só onboarding/welcome (null com anims off); listeners únicos e limpos; prefers-reduced-motion global (`tokens.css:173-181`); gating JS correto em CommitGraphSvg/FallingLeaves/TreeLogo/splash/flash. Sem blur/filter animados. **As animações decorativas NÃO são a causa do peso.**
- **N1 🟡 P2** — Gate CSS `[data-anims="off"] [data-decor-anim]` MORTO (0 usos de `data-decor-anim`): animações de entrada (fadeIn/fadeUp/popIn/fileIn/toastIn em Settings/History/WorkingCopy/RepoRail/Stashes/RepoPicker/Modal/ContextMenu/Toaster) ignoram a setting (só reduced-motion as trava). Marcar elementos ou remover o gate.
- **N2 🟡 P3** — "Floresta a balançar" prometida na copy mas `sway` nunca aplicado (= B8).
- **N3 🟡 P2 (perf)** — Grafo SVG: rajada de ~200 keyframes escalonadas ao abrir History + re-animação a cada refetch (= H4/H5).
- **N4 🟡 P2 (perf)** — `refetchOnWindowFocus` default true: cada foco da janela relança rajada de processos git (status/branches/stashes/tags/sync). Considerar desativar ou staleTime maior.
- **N5 🧹 P3** — ~10 keyframes mortos em tokens.css (fadeUp2, winIn, toastUp, lineGrow, recPulse, obFade, themeSwapB, fxFall, notifIn, sway); transição `filter` no-op em `.gs-lift` (`shell.css:6`).
