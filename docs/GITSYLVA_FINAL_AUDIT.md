# GitSylva — Auditoria Final

> Auditoria completa do produto contra o handoff de design (`docs/design/GitSylva-Floresta.dc.html`,
> `GitSylva-Logos.dc.html`, `README.md`), realizada em 2026-07-13 na branch `feature/final-audit`.
> Detalhe por área nos anexos `docs/audit/00-09`. O inventário exaustivo do handoff (tokens,
> paletas exatas, ecrãs, animações) está em `docs/audit/00-inventario-handoff.md`.
>
> Legenda: ✅ Completo e correto · 🟡 Existe, precisa correções · 🟠 Apenas UI / parcial ·
> 🔴 Em falta · ⚠️ Regressão / perigoso · 🧹 Limpeza técnica

## 0. Baseline (antes de qualquer alteração)

Executado em 2026-07-13, working tree limpa, `develop` @ 8d4d823:

| Validação | Comando | Resultado |
|---|---|---|
| Typecheck | `npx tsc -b` | ✅ exit 0 |
| Lint | `npm run lint` | ❌ **7 erros, 1 warning** — `react-hooks/set-state-in-effect` (GitIdentity, WorkingCopy, +), `react-refresh/only-export-components` (`settings/sections/_shared.tsx`) |
| Testes frontend | `npm test` (vitest) | ✅ 33/33, 7 ficheiros |
| Build | `npm run build` | ✅ 477ms — vendor 221KB (gzip 69KB), index 95KB (gzip 26KB) |
| Testes Rust | `cargo test` | ✅ 29/29 (repos git temporários reais) |

## 1. Matriz de auditoria por área

| Área (handoff) | Estado | Resumo | Anexo |
|---|---|---|---|
| 3.1 Identidade/branding in-app | 🟡 | TreeLogo centralizado e theme-aware ✅; wordmark duplicado à mão em 3 sítios; onboarding sem a marca no nome | 01 |
| 3.1 Identidade SO (ícone/favicon/id) | 🔴 | Ícone Tauri = default do template; favicon placeholder roxo; `identifier: com.tauri.dev` | 01 |
| 3.2 Splash/Onboarding | 🟡 | Fluxo real e honesto (OAuth "Em breve", persistência ✅); falta passo NOVIDADES; "Saltar" redundante; sem voltar atrás | 01 |
| 3.3 Janela/layout | 🟡 | Controlos de janela reais ✅; **sem divisores redimensionáveis** (design define-os); traffic lights macOS à esquerda no Windows; sem responsivo <980px | 08 |
| 3.4 Repositórios/tabs/grupos | 🟡 | Abrir/fechar/alternar/persistir ✅; **estado amend/msg vaza entre repos (⚠️)**; erros `[object Object]`; sem revalidação no arranque; grupos invisíveis no modo tabs | 02 |
| 3.5 Histórico/árvore | 🟡 | Topologia com pais reais ✅; 4 estilos de árvore ✅; **limite fixo 200 commits**; memo quebrado (re-render total); grafo re-anima a cada operação | 07 |
| 3.6 Detalhe do commit | 🟠 | **Merges mostram 0 arquivos**; renames errados; corpo da mensagem nunca mostrado; 3 git show em série | 07 |
| 3.6 Diff | 🟡 | 5 tipos de linha tematizados ✅; **sem números de linha**; highlight sem memo (peso); classify confunde `--`/`++` de conteúdo | 07 |
| 3.7 Cópia de trabalho | 🟡 | Staging/hunks/parcial ✅; **discardAll destrói staged (⚠️ P0)**; conflitos UU invisíveis (⚠️); sem ações de ficheiro (abrir/explorador/copiar) | 05 |
| 3.8 Commits | 🟡 | Validações e invalidação ✅; amend não pré-carrega mensagem nem avisa de pushed | 05 |
| 3.9 Stashes | 🟡 | CRUD real ✅; **drop sem confirmação (⚠️)**; apply com conflito = mensagem falsa + estado invisível; sem pop/preview/untracked | 05 |
| 3.10 Operações git | 🟡 | Cadeias completas, sem sucesso otimista ✅; **reset --hard sem confirmação (⚠️ P0)**; duplo-submit nos modais; PullModal engole erro de fetch (falso "em dia") | 06 |
| 3.11 Conflitos | 🟠 | Merge/rebase honestos com banner+abort/continue testados ✅; **cherry-pick/revert/stash-apply invisíveis**; nada invalida no caminho de conflito | 06 |
| 3.12 Pesquisa ⌘K | 🟡 | Dados e ações reais, teclado ✅; sem diacríticos; sem grupo AÇÕES | 03 |
| 3.13 Definições | 🟡 | Aparência/Git/Commits/PushPull/Limpeza reais ✅; stubs honestos (Contas/SSH/Avançado); **Notificações e Idioma nem existem**; prefs mortas (density/language) | 03 |
| 3.14 Temas | 🟡 | Sistema derivado coerente nos 4 temas ✅; ConfirmDialog ilegível no Batman; `--muted` falha AA; poucos hardcoded (TreeLogo sakura, Toggle knob) | 08 |
| 3.15 Animações | 🟡 | Gating JS + reduced-motion ✅; sem trabalho contínuo ✅; gate CSS morto (setting não trava animações de entrada); "sway" prometido e inexistente | 08 |
| 3.16 Contas/OAuth | 🟠 | Stub honesto em 3 sítios ("Em breve") ✅; sem credenciais armazenadas ✅ | 04 |
| 3.17 SSH | 🔴 | Inexistente, anunciado honestamente ✅; sem paths Unix hardcoded ✅ | 04 |
| 3.18 Atalhos | ✅/🟡 | Cheat-sheet honesto, plataforma correta, sem atalhos de 1 letra ✅; promete "Esc" que os modais não honram | 03 |
| 3.19 Notificações | 🟠 | Toasts empilham ✅; **sem variantes/dismiss/aria-live; erros somem em 2,6s**; sem secção de settings | 03 |
| 3.20 Idioma | 🔴 | Sem i18n; ~120+ strings PT hardcoded; pref `language` inerte; sem seletor (nem stub) | 03 |
| 3.21 Estados globais | 🟡 | History/WorkingCopy/modais completos ✅; **sem Error Boundary (crash total)**; Stashes/detalhe mascaram erro; repo apagado sem aviso | 04 |
| Segurança | ✅/🟡 | Sem P0: sem credenciais, sem injection (args array), sem XSS ✅; hardening: falta `--`, CSP null | 04 |
| Testes | 🟡 | 33 vitest + 29 cargo (repos reais) ✅; lacunas: parse_status renames, themeStore, palette, diffs | 09 |
| Performance | 🟠 | Sem polling, code-split ✅; **memo quebrado + highlight sem memo + grafo re-anima + stores sem seletor** = causas do "pesado/estranho" | 09 |
| Acessibilidade | 🟠 | lang/focus-visible/reduced-motion ✅; divs-como-botões pervasivos; modais sem focus trap/Escape; toasts sem aria-live | 09 |

## 2. Findings priorizados

### P0 — Crítico (perda de dados · ações git erradas · falso sucesso)
1. **W1** `discardAll` da WorkingCopy destrói alterações STAGED de ficheiros parcialmente staged (`WorkingCopy.tsx:151` → `restore --staged --worktree`). Perda irreversível não anunciada.
2. **G1** `reset --hard` dispara sem confirmação a partir do menu de contexto (`History.tsx:336`).
3. **W3** Drop de stash irreversível sem confirmação (`Stashes.tsx:51`).
4. **R1** Estado `amend`/mensagem vaza entre repos (sem `key={repo.path}` — `AppShell.tsx:78`): amend pode reescrever o HEAD do repo errado.
5. **W2** Ficheiros em conflito (entradas `u`) descartados pelo parser de status (`status.rs:63`) — invisíveis em toda a UI.
6. **G2** Conflitos de cherry-pick/revert não detetados (`conflict.rs:20`) — repo em estado intermédio sem indicação nem abort/continue.
7. **W4** Stash apply com conflito: UI diz "não foi possível aplicar" (falso — aplicou com marcadores) e não atualiza nada.
8. **G4** PullModal com fetch falhado mostra "Nada para integrar. Estás em dia." (falso positivo).

### P1 — Funcional
G3/G6 invalidação no caminho de conflito + query `conflict` nos refresh · A7 Error Boundary inexistente · S12 toasts sem dismiss e erros a desaparecer em 2,6s · H1 limite fixo 200 commits · H2 memo de CommitRow quebrado (perf) · H3 highlight sem memoização (perf) · H6 merges com 0 arquivos no detalhe · H7 renames errados no detalhe · R2 erros `[object Object]` + repo vazio com erro cru (H12) · G7 duplo-submit nos modais · H14 `parse_log` pode fazer panic · 7 erros de lint (set-state-in-effect = cascading renders) · S6 secções Notificações/Idioma ausentes (mínimo: stubs honestos).

### P2 — UX e consistência
S1 diacríticos na pesquisa · S2 grupo AÇÕES na paleta · S11/L6 Escape em Modal/ConfirmDialog · S13/S14 variantes de toast + aria-live · T1 botão destrutivo ilegível no Batman · T2 contraste `--muted` · G5 banner de conflito global · G9/G10 confirmação em delete branch/rebase · G11 checkout da paleta silencioso em erro · W5/W6 unificar discard + `clean -fd` · W8 ações de ficheiro (abrir/explorador/copiar) · W9 diff de untracked · W10/W11 amend (mensagem + aviso pushed) · W12 stash `-u` · R3 revalidação de repos no arranque · R4 toplevel · R5 grupos no modo tabs · A2/G17 mensagens de auth acionáveis · A3 `--` nos comandos git · A4 CSP · A9 estado de erro em Stashes · B3/B4 ícone da app + favicon · O3 passo NOVIDADES · H4/H5 grafo (contenção + não re-animar) · H8 corpo do commit · H9 números de linha no diff · H10/H11 classify/split · H13 scroll-into-view · H15 commit_detail em série · X10 seletores zustand · N1 gate de animações · N4 refetchOnWindowFocus · L1 divisores redimensionáveis · L4/L5 responsivo · X14-X16 a11y (focus trap, aria, botões reais).

### P3 — Visual e polimento
B1/B2 Wordmark partilhado · B7/B8 glifos duplicados + sway morto · O4/O5/O8 onboarding (voltar/saltar/replay) · T3/T4/T5 hardcoded menores + sombras tokenizáveis · H17-H25 detalhes do histórico/diff · R6-R17 detalhes de repos · S3-S5/S8-S10 detalhes de settings/palette · G13-G18 detalhes de git ops · W15-W21 detalhes de working copy · X19-X21 higiene (App.css, layoutGraph, keyframes/prefs mortos, assets template).

## 3. Comparação visual por ecrã

_(fase 5 — após correções funcionais; base = anexo 00)_

## 4. Correções aplicadas

_(um registo por commit — a preencher durante a fase de correções)_

## 5. Validação final

_(a preencher no fim)_
