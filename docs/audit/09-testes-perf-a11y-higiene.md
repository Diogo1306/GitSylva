# Anexo 9 — Testes · Performance · Acessibilidade · Higiene (fases 1 e 4)

## Testes existentes
Vitest (7 ficheiros, 33 testes): appStore (grupos), layout (linear/merge/janela), status, hunks, format, themes, Button. Cargo (17 módulos, 29 testes): **todos com repos git temporários reais** (init + commits reais; sync.rs monta remote bare + 2 clones). Sem mocks irrelevantes. ✅

## Lacunas de teste (priorizadas)
- **X1 P1** — `parse_status`: ramos '2' (rename/copy) e 'D' nunca exercitados (`status.rs:21`); adicionar `git mv` + delete + paths com espaços. (E depois: entradas 'u' quando o fix W2 entrar.)
- **X2 P1** — `themeStore` sem QUALQUER teste (reset do accent na troca de tema, persistência round-trip — `themeStore.ts:66`).
- **X3 P1** — CommandPalette sem teste (filtro multi-grupo + activeIdx/teclado frágil).
- **X4 P1** — DiffLines/DiffSplit/highlight sem teste (classify, split, tokenizer).
- **X5 P1** — Nenhum teste exercita react-query/mutations (WorkingCopy com invoke mockado: select→stage→commit→discard).
- **X6 P2** — `commit_detail`: binário ("-" → 0) e renames não testados; `reset_to` só "soft"; `discard_file` sem teste; graphRows octopus (3+ pais); appStore switchRepo/closeRepo fallback; recentsStore dedupe/cap; onboardStore; fluxos destrutivos frontend (confirmDiscard gating).

## Performance (causas prováveis do "muito pesada e estranha")
1. **X7 P1** — `CommitRow` memo quebrado por `onContext` inline (`History.tsx:316`) → 200 rows re-renderizam a cada clique/tecla. `docs/performance-audit.md:15` afirma o contrário (incorreto).
2. **X8 P1** — `highlight()` por linha a cada render sem memo (`DiffLines.tsx:67`, `DiffSplit.tsx:65`); content-visibility não evita o custo JS.
3. **X9 P2** — `parseHunks` recalculado por render (`DiffLines.tsx:36`); DiffSplit sem content-visibility; BlameView sem contenção.
4. **X10 P2** — `useApplyTheme` subscreve a store INTEIRA (`useApplyTheme.ts:12` sem seletor) → qualquer pref re-renderiza App+AppShell inteiros. Onboarding (`:52`) e Appearance (`:73`) idem (menor).
5. **X11 P2** — `commit_detail` 3× git show em série (`detail.rs:27,42,72`).
6. **X12 P2** — Grafo SVG inteiro sem virtualização + re-animação (= H4/H5); refetchOnWindowFocus rajadas (= N4).
7. **X13 P3** — TreeLogo (~300 linhas SVG) não memoizado no Titlebar (re-render a cada mudança de status).

**✅ positivos:** sem polling; queries deduplicadas por key; code-splitting real + prefetch idle; highlight dependency-free; FallingLeaves fora do shell.

## Acessibilidade
- **X14 P2** — Modal sem Escape/focus-trap/restauro de foco/role dialog (`Modal.tsx:4`); ConfirmDialog idem (ações destrutivas! — `ConfirmDialog.tsx:12`).
- **X15 P2** — Toaster sem `role="status"`/`aria-live` (`Toaster.tsx:7`).
- **X16 P2** — Controlos `<div onClick>` pervasivos (Sidebar:48, ActionBar:25, Titlebar, WorkingCopy, History:184, ContextMenu:40, DiffView:27) — não focáveis/operáveis por teclado; focus-visible existe mas divs não recebem foco.
- **X17 P3** — ContextMenu sem role menu/setas; tabs sem role tab/aria-selected (DiffView:26, RepoPicker:96, Settings:57); CommandPalette sem role listbox/aria-activedescendant (teclado ✅).
- **X18 P2/P3** — Contraste `--muted` (= T2).
- **✅** lang="pt"; prefers-reduced-motion; focus-visible global.

## Higiene
- **X19 🧹 P2** — `layoutGraph` + `GraphRow` código morto (só o teste os usa — `layout.ts:3,57`); History usa `graphRows`.
- **X20 🧹 P2** — `App.css` morto (não importado, template Vite); assets template (`react.svg`, `vite.svg`, `hero.png`) não usados.
- **X21 🧹 P2** — Gate CSS `data-decor-anim` sem uso (= N1); ~10 keyframes mortos (= N5); prefs mortas `density`/`language` (= S10).
- **X22 P3** — `eslint-disable exhaustive-deps` em `Modals.tsx:214` (PullModal fetch on-mount) — frágil.
- **✅** Sem console.log/TODO/FIXME/@ts-ignore/any; sem dados fictícios em produção (fixtures só em testes; placeholders legítimos; stubs marcados "Em breve").
