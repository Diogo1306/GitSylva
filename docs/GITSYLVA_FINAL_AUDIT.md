# GitSylva — Auditoria Final

> **Ronda 2 (2026-07-14):** chegou um handoff atualizado com specs formais
> (`docs/design/handoff/`: animations.md, interactions.md, tokens/themes.{css,json},
> references/*.png e protótipo novo com notificações + winMinimize). Matriz delta em §7,
> execução na branch `feature/design-v2-motion`.

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

## 3. Comparação visual por ecrã (fase 5)

Base de comparação: `docs/audit/00-inventario-handoff.md`. Estado após as correções:

| Ecrã | Diferenças encontradas | Ação |
|---|---|---|
| Splash | Fiel (Space Grotesk 52px, letterL/R + letterHop, 2.05s) | ✅ sem alterações |
| Login (onboarding) | Wordmark era texto simples sem a árvore-S; OAuth honesto (melhor que o protótipo, que fingia login) | Corrigido: `Wordmark` partilhado |
| Setup (onboarding) | **Faltava o passo NOVIDADES** (3 cartas ±3.5° + dots + "próximo →"); "Saltar" idêntico a "Plantar" | Corrigido: deck implementado; Saltar entra com defaults |
| Histórico | Grafo/estilos/chips/avatares fiéis; painel de detalhe fixo (design: arrastável 300–560); sem corpo da mensagem | Corrigido: divisor arrastável persistido; corpo multi-linha no painel; "Carregar mais" |
| Detalhe/diff | Sem números de linha (pendente, ver §6); merges e renames errados | Corrigidos merges/renames/mensagem |
| Cópia de trabalho | Painel fixo (design: 320–540 arrastável); sem menu de contexto de ficheiro | Corrigidos ambos |
| Stashes | Fiel; faltava confirmação no drop e opção untracked | Corrigidos |
| Pesquisa ⌘K | Fiel; sem diacríticos; sem grupo de ações | Corrigidos |
| Definições | Scroll-spy fiel; faltavam Notificações/Idioma | Corrigidas (Notificações com preview real; Idioma stub honesto) |
| Sidebar | Fixa (design: 180–340 arrastável) | Corrigido |
| Temas | 4 temas fiéis às paletas exatas; `--muted` desviado de propósito p/ AA (documentado); ConfirmDialog ilegível no Batman | Corrigidos (`--danger` novo, valores documentados nos comentários) |
| Ícone/favicon | Placeholders do template | Favicon = árvore-S real; ícones Tauri pendentes (ver §6) |
| Traffic lights | macOS à esquerda, cores fixas — **fiel ao design** (o protótipo é assim); mantido como decisão de design | ✅ mantido |
| Notificação com vinha | O design define um cartão de notificação com vinha decorativa (além dos toasts) | Não implementado (ver §6) |

## 4. Correções aplicadas (um registo por commit)

| Commit | Findings | Descrição |
|---|---|---|
| `166801b` | — | support.js do handoff para os protótipos renderizarem |
| `196f9fd` | — | Matriz de auditoria + anexos 00-09 |
| `ddbf9fc` | **W2 (P0)** | Parser de status trata entradas `u`: conflitos visíveis na working copy (letra U, checkbox bloqueado) + teste |
| `cc8c686` | **G2/W4 (P0)**, G3/G6 | Deteção de cherry-pick/revert (CHERRY_PICK_HEAD/REVERT_HEAD) com continue/abort; stash apply em conflito reporta `code:"conflict"` honestamente; invalidação em `onSettled` + query `conflict` nos refresh; banner suporta conflitos sem operação (stash) + testes |
| `36c5a8a` | **W1 (P0)**, W5/W6 | `discard_file` preserva staged (`restore --worktree`); `clean -fd` remove dirs untracked; WorkingCopy usa o `discard_all` único; confirmações enumeram untracked + 2 testes |
| `eccefe1` | **G1/W3 (P0)** | ConfirmDialog antes de `reset --hard` e de drop de stash |
| `b903e17` | **R1 (P0), G4 (P0)** | `key={repo.path}` no ecrã (amend/msg não vazam entre repos); PullModal mostra falha de fetch em vez de "Estás em dia" |
| `4878dea` | lint×7, H2, H3 | Zero erros de lint; estado derivado em vez de setState-em-effect; diff memoizado (highlight 1× por patch); callbacks estáveis → memo das 200 rows real |
| `69916c6` | A7, R2, S12-14, S11/L6, X10 | ErrorBoundary; `errMsg` (fim do `[object Object]`); toasts com variantes + dismiss + 8s para erros + aria-live; Escape fecha Modal/ConfirmDialog; useApplyTheme com seletores |
| `ecb819f` | G7, G11 | Guards de duplo-submit; checkout da paleta reporta erros |
| `e4cebba` | H6/H7/H8/H15, H14, H12, H1 | `commit_detail`: merges via `-m --first-parent`, renames via `-z`, mensagem completa, patch em thread paralela; `parse_log` seguro; repo vazio → log vazio; paginação `skip` + "Carregar mais" + 3 testes |
| `595ccab` | S6, S8, S10 | Secção Notificações real (preview) + stub Idioma; secção órfã no nav; prefs mortas removidas |
| `f8cf168` | S1, S2, S4 | Pesquisa sem acentos com highlight alinhado; grupo AÇÕES; empty state neutro |
| `ca9a7c7` | T1, T2, G9, G10, G13 | Token `--danger`; `--muted` AA nos 4 temas; confirmação apagar branch (+ caminho -D com aviso); confirmação rebase; validação `check-ref-format` |
| `545a04a` | W7/W8/W9/W10/W11/W12, G5 | Menu de contexto de ficheiro (abrir/explorador/copiar/descartar); diff de untracked sintetizado; amend pré-carrega mensagem e avisa se pushed; stash `-u`; banner de conflito global + 2 testes |
| `5166362`+`e5325f3` | R4, R10, A3, A4, B5, R3/A8, R6, R11 | `open_repo` → toplevel + bare detection; `clone --`; CSP estrita; `com.gitsylva.app`; revalidação de repos no arranque (fecha os inexistentes com aviso); `setCurrent` por path + teste |
| `9aa0226` | N1, B8, N5, T6, X19/X20, H13, N3 | Toggle de animações é interruptor mestre real; copy corrigida; 10 keyframes + App.css + assets + layoutGraph mortos removidos; scroll-into-view nas setas; cap de animação do grafo >120 rows; teste octopus |
| `3184074` | A9, A10, A2/G17, T3, T4, X13, R7, L5 | Estados de erro em Stashes/detalhe; hints PT para erros de auth/lock; pétala sakura e knob tematizados; TreeLogo memo; tabs e ActionBar com scroll |
| `0f63fa2`+`e2c5242` | **L1** | Divisores arrastáveis persistidos: sidebar 180-340, detalhe 300-560, working copy 320-540 (spec do design) |
| `26fec50` | B4, O3, O5 | Favicon árvore-S real; passo NOVIDADES; "Saltar" com semântica real |
| `f616d67`+`0bea54f` | B1, B2 | Componente `Wordmark` partilhado (titlebar, welcome, onboarding) |
| `9caa22e` | X1, X2, + | Testes: renames/deletes com paths unicode, isConflict, fold, themeStore |

## 5. Validação final

Executada em 2026-07-13 no fecho da branch `feature/final-audit`, com exit codes explícitos
(nota de método: pipes bash mascaram exit codes — dois falsos "verdes" foram apanhados e
corrigidos durante a sessão por esta via):

| Validação | Comando | Resultado |
|---|---|---|
| Typecheck | `npx tsc -b` | ✅ exit 0 |
| Lint | `npx eslint .` | ✅ exit 0 (baseline: 7 erros + 1 warning) |
| Testes frontend | `npm test` | ✅ exit 0 — **43/43** em 9 ficheiros (baseline: 33/33 em 7) |
| Build produção | `npm run build` | ✅ exit 0 — 771ms; vendor 222KB (gzip 69.5KB), index 104KB (gzip 28.5KB), screens code-split |
| Testes Rust | `cargo test` | ✅ exit 0 — **42/42** (baseline: 29/29), todos com repositórios git temporários REAIS (init/commit/merge/conflito/stash/remote bare+clones) |
| Build release Rust | `cargo build --release` | ✅ exit 0 em 3m19s |
| Packaging (`tauri build` bundle) | — | Não executado nesta passagem (instalador NSIS/MSI); o binário release compila. Antes de empacotar, gerar os ícones reais (§6). |

Cobertura nova de testes nesta passagem (+13 Rust, +10 frontend): conflitos no parser de status,
cherry-pick conflict/abort, stash apply em conflito, stash com untracked, discard parcial-staged,
discard de dir untracked, diff de untracked, renames/merges/mensagem no commit_detail, log de repo
vazio + paginação, toplevel normalization, renames/deletes com paths unicode, isConflict, fold de
acentos, themeStore, octopus merges.

## 6. Dívida restante

### Fechada na passagem seguinte (branch `feature/audit-followups`)
- ✅ **Ícones Tauri reais** — a marca árvore-S foi rasterizada sem dependências (`scripts/make-icon.js`: stamping + encoder PNG com zlib nativo) e expandida com `tauri icon` para todo o set (ico/icns/Store/android/ios). O favicon foi alinhado com a mesma geometria.
- ✅ **Números de linha no diff** (H9) — gutters old/new nas duas vistas (unificada e lado-a-lado), não selecionáveis.
- ✅ **Classify correto** (H10) — conteúdo removido a começar por `--` já não é tratado como cabeçalho; partilhado em `lib/diffLine.ts` + testes.
- ✅ **content-visibility no split** (H11 parcial) + memoização do parse.
- ✅ **`git stash pop`** (W16) com tratamento honesto de conflito (stash mantido) + teste.
- ✅ **Preview de ficheiros nos cartões de stash** (linha meta do design) via `stash_files` + teste.
- ✅ **Apagar tags na UI** (G15) — menu de contexto + confirmação.
- ✅ **Pesquisa de definições** (S9) — filtro do nav, insensível a acentos.
- ✅ **`version` explícita nos 4 stores persistidos** (R12) — versão 0 = forma atual; futuras mudanças de schema levam `migrate`.

### Ainda em aberto
- O `identifier` novo (`com.gitsylva.app`) **muda a pasta de dados do WebView2**: na primeira execução após esta mudança, as preferências/tabs locais reiniciam (uma vez).
- Alinhamento LCS no split (H11 completo); virtualização real para históricos/working copies ≥1000 (mitigado com memo + content-visibility + cap de animação + paginação).
- **i18n** (S17): sem infraestrutura; ~120+ strings PT hardcoded; Idioma marcado "Em breve". Não fazer traduções parciais.
- **Contas/OAuth, SSH, terminal integrado, editor 3-way** — grandes, dependem de decisões externas (apps OAuth, keyring — usar Windows Credential Manager, nunca localStorage).
- **Lock de escrita por repo** (G8) — operações concorrentes podem colidir em `index.lock` (o erro traz hint acionável).
- Gravatar/email (H20), DnD/cor de grupos (R14), caminho longo Windows >260 (R13), packaging (`tauri build` bundle) por executar.

## 7. Ronda 2 — matriz delta contra o handoff v2 (2026-07-14)

Tokens de cor (`handoff/tokens/themes.{css,json}`) conferidos valor a valor contra
`src/theme/themes.ts`: **CORRETO** (mantém-se o desvio deliberado de `--muted` para AA e o
token extra `--danger`, ambos documentados). O delta é sobretudo **motion, overlays e desktop**:

| Área | Esperado no handoff v2 | Estado | Prioridade | Ação |
|---|---|---|---|---|
| Tokens de motion | `--motion-*`/`--ease-*` centrais | EM FALTA | P1 | Criar |
| Notifications | Top-right stack, severidade, ~4s, hover-pausa, saída `notifOut`, vinha, aria | EM FALTA | P1 | Criar |
| Toasts | Saída animada, limpeza de timer no dismiss, vinha opcional | PARCIAL | P1 | Corrigir |
| Modal | Focus trap, autofocus, devolver foco, saída animada | PARCIAL (Esc/scrim/danger ok) | P1 | Corrigir |
| Command Palette | Saída animada | PARCIAL | P2 | Corrigir |
| Atalhos globais | ⌘Enter/⌘P/⌘⇧L/⌘R/⌘B/⌘S + regravação com `recPulse` | EM FALTA (só ⌘K) | P1 | Implementar |
| Controlos de janela | Windows: min/max/✕ à direita, ✕ hover `#E81123`; mac: traffic lights | INCORRETO (mac sempre) | P1 | Corrigir |
| Fechar último repo | Bloquear com toast | INCORRETO (fecha p/ welcome) | P1 | Corrigir |
| Grupos nas tabs | Idênticos a rail (chip, collapse, right-click fecha grupo) | EM FALTA (só rail) | P1 | Implementar |
| Folha efémera | `fxFall` em fetch/commit/switch | EM FALTA (keyframe removido na R1 como morto) | P1 | Repor+ligar |
| Pausa de ambiente | Parar loops em blur/hidden | EM FALTA | P1 | Implementar |
| winMinimize | Animação ~600ms no minimizar | EM FALTA | P2 | Implementar |
| Min janela | ~900×560 | PARCIAL (880) | P3 | Ajustar |
| Densidade | Segmented conforto/compacta (rowH 52/40) | EM FALTA (removida na R1 por morta; v2 torna-a real) | P2 | Implementar |
| NewsCardDeck | translateX ±30, y9, rot ±3.5°, scale .96, op .5, 450ms | PARCIAL | P2 | Ajustar |
| Onboarding exit | `obFade` antes de desmontar | EM FALTA | P2 | Implementar |
| Detalhe→ficheiro | Clique no ficheiro foca o seu diff | EM FALTA | P2 | Implementar |
| Working Copy <980px | Stacked automático | PARCIAL (toggle manual) | P2 | Auto via ResizeObserver |
| Settings Notificações | Toggles a gatear emissão + onde + preview | PARCIAL (preview) | P2 | Implementar |
| Terminal (toolbar) | Botão com mock honesto | EM FALTA | P3 | Adicionar |
| Saída de rows do StageList | fade+shift ao remover | EM FALTA | P3 | Documentado (não implementado) |
| Commit→node único anima | só o novo nó | PARCIAL (grafo ≤120 re-anima inteiro) | P3 | Documentado |
| Splash/screen-switch/tema/scroll-spy/context menu/fileIn/spinner/graph growth/resizable/truncation | conforme spec | CORRETO | — | Preservar |

### Resultado da Ronda 2 (branch `feature/design-v2-motion`, 2026-07-14)

Todos os P1 e P2 da matriz acima foram implementados e validados; os dois P3 marcados
"Documentado" ficam como dívida consciente (saída de rows do StageList; re-animação do grafo
≤120 rows em vez de só o nó novo). Entregas principais:

- **Tokens de motion** (`--motion-micro/fast/normal/slow`, `--ease-pop/standard/out`) + keyframes
  do spec repostos (notifIn/notifOut, toastOut, modalOut, fadeOut, winMinimize, fxFall, recPulse,
  obFade, sway).
- **Notifications top-right** (`notificationStore` + `Notifications`): severidade, ~4s com pausa
  no hover, saída `notifOut` antes de desmontar, cap de stack, vinha decorativa por estilo de
  árvore, `aria-live`/`role=alert`, ✕ acessível. Roteado: push/pull/fetch/merge/clone/conflitos,
  com **gating real** pelos toggles em Settings → Notificações (+ preview ao vivo).
- **Toasts** com saída animada e timers limpos no dismiss manual.
- **Modal shell**: focus trap, autofocus, foco devolvido ao abridor, Esc/scrim/✕/Cancelar com
  saída animada (contexto `useModalClose`), `role=dialog`, scroll interno; ConfirmDialog
  (danger) foca Cancelar por omissão; palette com fade de saída (lingering render).
- **Atalhos regraváveis** (`shortcutsStore` persistido): ⌘K/⌘Enter/⌘P/⌘⇧L/⌘R/⌘B/⌘S com mod
  obrigatório, gravação por clique com `recPulse` (Esc cancela), swap em conflito, repor;
  ⌘Enter funciona dentro da caixa de commit.
- **Desktop**: controlos Windows à direita com ✕ hover `#E81123` (mac mantém traffic lights),
  animação `winMinimize` antes de minimizar, min 900×560, folha efémera `fxFall` após
  fetch/commit/troca de repo, **loops ambientais pausam** em blur/hidden (`data-win-hidden`).
- **Grupos nas tabs** iguais ao rail (chip colorido, collapse, right-click fecha o grupo,
  menu de mover/novo grupo por tab); **último repo não fecha** (toast, testado).
- **Densidade real** (conforto 52 / compacta 40) a comandar as linhas e o grafo do histórico.
- **Responsivo do spec**: tempos escondem <1180px, branch das tabs <980px, Working Copy
  empilha automaticamente <980px (matchMedia).
- Clique num ficheiro do detalhe **rola o diff** até à sua secção; NewsCardDeck com os
  transforms exatos do spec; Settings → Notificações com toggles reais + "onde" honesto.
- Testes: 61 frontend (11 novos p/ notification timers/gating e bindings de atalhos) + 43 Rust.

Validação final R2: `tsc` ✅ · `eslint` ✅ · vitest **61/61** ✅ · `cargo test` **43/43** ✅ ·
`vite build` ✅.

## 8. Ronda 3 — validação de performance em produção (2026-07-14, branch `perf/runtime-audit-r3`)

**Build testada:** `npx tauri build --no-bundle` → `src-tauri/target/release/app.exe`
(frontend Vite em produção embebido via tauri-codegen; sem servidor dev, sem devtools, React
em produção). Medições por `scripts`-PS (árvore de processos completa incl. WebView2, 9
processos; CPU normalizada a 16 cores; janela minimizada via `ShowWindow`).

### A. Métricas antes (exe @ 6c7ea7a) / depois (exe com fixes R3)

| Cenário | Antes | Depois | Objetivo |
|---|---:|---:|---:|
| Janela visível | 523 ms | 424 ms | sem atraso claro ✅ |
| CPU arranque (5s, máx) | 0,98% | 0,98% | sem pico ✅ |
| CPU idle 60s (média) | **0,04%** | **0,04%** | ~0 ✅ |
| CPU idle 60s (máx) | 0,98% | 1,27% | ~0 ✅ |
| CPU minimizado 30s (média) | 0,08% | 0,18% | ~0 ✅ |
| GPU (soma engines) | 0% | 0% | ~0 ✅ |
| RAM estabilizada | 384 MB | 374 MB | estável ✅ |
| RAM após 60s idle | 390 MB | 380 MB | estável ✅ |

**Conclusão central e honesta:** a app de produção **não está pesada em idle** — CPU ~0 com
as animações ambientais visíveis, GPU 0%. A sensação de peso reportada vinha (a) do modo dev
(`tauri dev`: Rust debug + JS sem minificar, 3-10× mais pesado) e (b) dos problemas de
re-render corrigidos na R1/R2 (memo do CommitRow quebrado, highlight por render, subscrição
total da store no tema). Nota: a RAM sobe ~55 MB ao minimizar em AMBAS as runs (contabilidade
do WebView2/processo utilitário — consistente, não é fuga introduzida).

### B. Causas encontradas (com evidência)

1. **Nenhum trabalho contínuo**: grep + medição — 0 `setInterval`, 0 `requestAnimationFrame`,
   0 `backdrop-filter`/`blur()`/`will-change`; sombras estáticas tokenizadas.
2. **Listeners equilibrados**: add/removeEventListener 1:1 nos 9 ficheiros com listeners; o
   único observer (scroll-spy) desliga no cleanup.
3. **setTimeout**: todos os repetíveis têm clear; os 5 sem clear são one-shots ≤400ms de
   stores singleton (remoção pós-animação de toast/notificação; minimize) — sem órfãos.
4. **DOM no History** (bundle prod + harness, capturado antes de parar os testes de browser a
   pedido do utilizador): 26 904 nós com 200 commits+grafo; heap JS 21,7 MB.

### C. Correções aplicadas nesta ronda

- **Grafo incremental** (`CommitGraphSvg.tsx`): keys por hash (antes por índice) + conjunto
  de hashes "vistos" — nós existentes mantêm o MESMO nó DOM e `animation: none`; só o commit
  novo anima. Teste `CommitGraphSvg.test.tsx` prova identidade do DOM e a não-reanimação.
- **StageList exit** (`WorkingCopy.tsx` + keyframe `fileOut`): a row sai com fade/translate
  APÓS o sucesso real da operação (ghost em posição, sweeper único com cleanup); erro não
  esconde nada; reduced-motion colapsa para remoção quase-imediata.
- **"Sistema" nas notificações**: continua indisponível de forma explícita (desativado,
  "em breve", tooltip a documentar a dependência: `tauri-plugin-notification` oficial + no
  Windows identidade de app instalada). Sem toggle enganador.
- **Harness de perf** (`src/perf/mockGit.ts`): só com `VITE_PERF_MOCK=1` (dead-code no build
  normal — verificado no dist); 2 000 commits/200 ficheiros/diff ~3 000 linhas.

### D. Deixado para o teste manual do utilizador (a pedido)

Interações (React Profiler, scroll, seleção, ciclos de memória) ficam para a passagem manual.
Harness pronto:

```bash
VITE_PERF_MOCK=1 npm run build && npm run preview   # bundle de PRODUÇÃO com dados grandes
# abre http://localhost:4173 — arranca direto no History com 2000 commits
```

Cenários sugeridos: seleção rápida de commits (Profiler: só 2 rows + painel devem commitar),
scroll do histórico, ⌘K ×50, Settings ×20, tema ×20, heap antes/depois (DevTools → Memory).

### E. Validação R3

`tsc` ✅ · `eslint` ✅ · vitest **63/63** ✅ · `cargo test` **43/43** ✅ · build normal ✅
(mock ausente do dist, verificado) · `tauri build --no-bundle` ✅ (exe medido acima).

### F. Aceleração de hardware (hipótese do utilizador, medida)

Comparação no exe de produção, ~20s no ecrã com folhas ambientais, processos filtrados por
linha de comando (app.exe + msedgewebview2 do `com.gitsylva.app`):

| | HW accel ON (default) | HW accel OFF (`--disable-gpu`) |
|---|---:|---:|
| CPU média / máx | 0,51% / 2,26% | 0,18% / 1,68% |
| GPU média / máx | 0,21% / 1,33% | 0,01% / 0,1% |
| RAM | 421 MB | 396 MB |

**Nesta máquina** a aceleração não é a causa de peso (ambos os modos ≈ idle). A hipótese
mantém-se válida para máquinas com drivers de GPU problemáticos — o WebView2 respeita:

```powershell
# Diagnóstico noutro PC: correr a app sem aceleração de hardware
$env:WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS = "--disable-gpu"
.\app.exe
```

Se com o flag o "estranho/pesado" desaparecer nesse PC, o problema é o driver/GPU — atualizar
o driver ou considerar expor `additionalBrowserArgs` na config Tauri por instalação.

## 9. Ronda 4 — estabilidade, crashes e responsividade em utilização real (2026-07-14, branch `fix/runtime-stability-r4`)

Premissa da ronda: as métricas de idle da R3 estavam certas **e eram irrelevantes** — o
problema relatado ("lenta durante utilização real e já apresentou crashes") acontece durante
interação. A investigação começou pela arquitetura, não pelos sintomas.

### A. Causa-raiz principal (confirmada na fonte)

**Todos os 45 comandos `#[tauri::command]` eram `fn` síncronos.** Em Tauri 2, um comando
síncrono executa dentro do handler IPC do wry, ou seja, **na thread do event loop da
janela**. Prova: `tauri-macros-2.6.3/src/command/wrapper.rs` — sem `async`, o comando é
`ExecutionContext::Blocking`, corpo executado inline no closure do IPC (kind `"sync"`).

Consequências diretas, todas reportadas pelo utilizador:

| Sintoma reportado | Mecanismo |
|---|---|
| "lenta durante utilização real" | cada `get_status`/`get_log`/`get_diff` bloqueava o repaint e os cliques |
| "crashes" | um `fetch`/`pull` lento (>5s) congela o message pump → Windows marca "não responde" → utilizador mata a app. **Não havia crash de processo: havia janela pendurada** |
| "abrir repositório grande congela" | comandos grandes + arranque a revalidar todos os repos por comandos bloqueantes |
| idle impecável (R3) | em idle não há comandos — a main thread nunca era tocada |

Um panic num comando síncrono na main thread também **abortava o processo** (crash real).
Depois da correção, um panic vira `JoinError` no `spawn_blocking` → convertido em `GitError`
→ toast de erro; o processo sobrevive (teste `run_blocking_converts_panic_into_error`).

### B. Crashes — tabela §20

| Crash | Reprodução | Causa | Stack trace | Correção | Estado |
|---|---|---|---|---|---|
| Janela "não responde" (percebido como crash) | fetch/pull com rede lenta; status/log em repo grande; qualquer operação demorada | comandos síncronos na main thread (ver A) | n/a (não é exceção — é starvation do message pump) | todos os comandos → `async fn` + `tauri::async_runtime::spawn_blocking`; mutações serializadas por repo | **corrigido** (ebe1db0) |
| Abort por panic num comando | output git malformado num parser com indexação direta (`parts[8]`, `xy[0..1]` em status.rs) | panic atravessava o handler síncrono e matava o processo | agora capturado: panic hook regista ficheiro:linha:coluna + mensagem + backtrace + operação em curso no log | panics em comandos viram `GitError { code: "internal_panic" }`; hook instalado em `lib.rs` | **mitigado** (processo sobrevive; parsers ficam para endurecer — ver G) |
| Janela branca / OOM do renderer (risco) | navegar por vários commits com diffs de MBs (cache 5 min + DOM gigante) | diffs inteiros no IPC + renderização completa + gcTime default | n/a | cap de 1,5MB no backend, paginação de 1500 linhas, gcTime 30s nos pesados | **corrigido** (2f6d1ad) |
| Sem rasto de crashes em release | qualquer crash em produção | logging só existia em debug | — | tauri-plugin-log em release (ficheiro rodado 2MB em `%LOCALAPPDATA%/com.gitsylva.app/logs`), panic hook, `frontend_log` para window.onerror/unhandledrejection/error boundaries | **corrigido** |

Commits da ronda: `ebe1db0` (main thread), `dd92cd5` (captura de erros/telemetria),
`af34700` (guards), `2f6d1ad` (diffs), `c76926b` (janela do History/grafo), `b2ebdf7`
(timeout/arranque), `cf8c468` (harness §18).

### C. Lentidão — antes/depois medidos (render React da pipeline real, esta máquina)

| Fluxo | Antes | Depois | Causa | Correção |
|---|---:|---:|---|---|
| Abrir diff 3.000 linhas | 345ms (unificado) / 381ms (split) | ≤237ms | render + highlight de tudo | página de 1.500 linhas |
| Abrir diff 20.000 linhas | 1.764ms / 2.691ms | **136ms** | idem | paginação + cap backend |
| Abrir diff 50.000 linhas | 4.555ms / 6.593ms | **114ms** | idem | idem (primeira página constante) |
| Grafo 2.000 commits | 238ms de render, **11.639 elementos SVG**, 1,6MB markup, layer de 104.000px | **19ms, 242 elementos, 32KB** | SVG inteiro sem janela | `visibleRange` no CommitGraphSvg |
| Lista History 2.000 commits | 2.000 divs no DOM | ~60 divs (janela + overscan 10) | lista sem virtualização | windowing acima de 300 rows (altura uniforme) |
| Qualquer operação git durante interação | bloqueava a UI inteira | 0ms de main thread (blocking pool) | ver A | ver A |
| `graphRows()` (cálculo de lanes) | 1,2ms @ 2000 | igual | nunca foi problema | — (medido para excluir) |

highlight(): 474ms por 50k linhas — agora salta linhas >400 chars e patches >8.000 linhas
renderizadas.

### D. Comandos Tauri — instrumentação (§6)

Ambos os lados medem agora:
- **Rust**: `run_blocking` loga cada comando (duração; warn ≥500ms) e `run_git` cada processo
  git (subcomando + ms; warn ≥1s). Só o subcomando é registado — nunca args completos
  (mensagens de commit, URLs com credenciais).
- **Frontend**: `src/lib/telemetry.ts` mede o round-trip completo de cada `invoke` (nome,
  duração, sucesso/erro, tamanho aproximado do resultado) num ring de 300 entradas com
  buckets >100ms/500ms/1s/5s. **Consultar na app: `window.__gsPerf()` (resumo) e
  `window.__gsPerfDump()` (bruto).** Erros vão para o ficheiro de log via `frontend_log`.

A tabela por comando (média/máxima em uso real) preenche-se na tua passagem manual com
`__gsPerf()` — os valores dependem do repo e do disco. Thread anterior de TODOS: main thread.
Solução de todos: blocking pool.

### E. Concorrência e estados de erro (§8, §9, §16)

- **Lock por repositório no Rust** (`run_mutating`): stage/commit/checkout/merge/pull/push/
  fetch/stash/tag/reset/rebase entram em fila em vez de disputar `.git/index.lock`. Teste:
  12 `git add` concorrentes → todos passam, 12 ficheiros staged.
- **Leituras continuam concorrentes** (status/log/diff/detail/branches/…).
- **Guards de duplo clique/fire** onde faltavam: Preparar tudo, toggles de row (ignora se em
  saída animada), stashes apply/pop/drop mutuamente exclusivos, checkout na sidebar (1 de
  cada vez), ⟳ da titlebar, Fetch da palette, atalho global de fetch (ref — closure do
  keydown lia isPending obsoleto).
- **Falhas silenciosas eliminadas**: stage/unstage/stageAll/discardAll/hunk/resolve/abort
  mostravam nada em erro — agora toast com a mensagem do git.
- **Respostas obsoletas**: já estavam corretas por construção (react-query com keys por
  path/file/hash/staged — resposta antiga cai na entrada antiga da cache, nunca no ecrã
  atual). Auditado, sem alterações.
- **Timeout**: `fetch` é morto aos 120s (idempotente; rede em buraco negro não deixa
  "A verificar origin…" eterno). Pull/clone deliberadamente SEM kill — matá-los a meio pode
  deixar estado parcial; com a main thread livre, ficam canceláveis pelo utilizador fechar o
  modal e a UI nunca prende. Teste determinístico: `hash-object --stdin` pendurado morto a 1s.
- **Arranque**: revalidação dos repos persistidos passou a sequencial, repo ativo primeiro.

### F. React e memória (§10, §14)

- Error boundary por ecrã (além do topo): um crash de render num ecrã mantém titlebar/
  sidebar/navegação vivas, com "Tentar novamente" + "Ir para o Histórico"; o erro vai para o
  log (componentDidCatch → frontend_log).
- Correção de bug real da virtualização: o `scrollIntoView` por ref na row selecionada
  refazia-se em cada remount da janela e sequestrava o scroll — substituído por um efeito que
  só corre quando a SELEÇÃO muda (teclado/palette).
- Caches: diffs/commit-detail/blame com `gcTime` 30s (antes 5min — megabytes presos por
  commit visitado). Ring de telemetria capado a 300; relatórios de erro capados a 40/sessão.
- Leaks: auditados todos os `addEventListener`/`setTimeout`/`matchMedia`/`ResizeObserver`/
  `subscribe` de src/ — todos com cleanup; zero listeners de eventos Tauri (nada a unlisten);
  timers de toasts/notificações com bookkeeping e clear no dismiss.
- Trabalho em render: o pesado (highlight/parse de diff) já era memoizado por patch; agora
  além disso é paginado e com limites. `graphRows` medido como irrelevante (1,2ms @ 2000).

### G. Problemas restantes (honestos)

- **Parsers Rust com indexação direta** (`status.rs` `parts[8]`/`xy[0..2]`, etc.): um output
  git inesperado já não mata a app (vira erro + log com backtrace), mas o parser devia ser
  defensivo e devolver erro estruturado por entrada. Endurecer na próxima ronda.
- **Pull/push/clone sem timeout de kill** — decisão deliberada (estado parcial); um buraco
  negro de rede pode mantê-los pendurados no blocking pool até o SO desistir. A UI continua
  utilizável e o fetch (o caso comum de "verificar") tem timeout.
- **Repo em unidade de rede morta**: `git status` pode demorar dezenas de segundos ao nível
  do SO. Já não congela a UI (fica "A carregar…" nesse ecrã) mas não há cancelamento.
- **Working Copy com centenas de ficheiros não é virtualizada** (500 no harness renderizam
  500 rows). Leve na prática; virtualizar se a tua passagem manual mostrar custo real.
- **Stage de hunk na cauda paginada**: o último hunk visível de um diff paginado/capado não
  recebe botão (o patch podia estar cortado) — carregar mais páginas resolve.
- **Métricas de interação ao vivo (§17)**: tempo-até-resposta/longest task/renders por
  interação dependem da tua passagem manual (instruções em §8-D e `__gsPerf()`); os números
  de render/DOM acima são medidos, mas não substituem o Profiler na app real.
- Dívidas antigas mantêm-se (§6/§7): i18n, OAuth/SSH, virtualização adicional, packaging.

### H. Validação R4

| Verificação | Resultado |
|---|---|
| TypeScript (`tsc -b`) | ✅ 0 erros |
| ESLint (`--max-warnings=0`) | ✅ 0 |
| Vitest | ✅ **68/68** (novos: paginação DiffView ×4, janela do grafo, cleanup entre testes) |
| Cargo tests | ✅ **48/48** (novos: lock por repo com 12 adds concorrentes, panic→erro, cap_patch UTF-8/linha, timeout mata processo pendurado, passthrough) |
| Build frontend | ✅ |
| `tauri build --no-bundle` | ✅ (exe release, 1m28s) |
| Exe manual (3 arranques, 8–15s cada) | ✅ vivo e responsivo em todos; log ativo em `%LOCALAPPDATA%/com.gitsylva.app/logs/gitsylva.log` |
| Event Viewer (14 dias) | sem crashes de `app.exe`/`msedgewebview2`; **1× `AppHangTransient`** no primeiro arranque do exe acabado de compilar (ver abaixo) — 2 arranques quentes seguintes: zero |

**O logging pagou-se logo no smoke test.** No arranque, ~10–15 processos git disparam em
simultâneo (queries do ecrã ativo + revalidação) e, com o WebView2 a inicializar e o Defender
a inspecionar o exe recém-compilado, cada git demorou 1,3–4,1s (`open_repo: 4147ms`,
`commit_detail: 3651ms`) — **tudo fora da main thread** (a janela pintou e respondeu; antes
desta ronda isto era ecrã congelado). As entradas lentas agrupam-se exclusivamente nos
primeiros ~5s de cada arranque; depois, zero warnings (comandos <500ms são invisíveis no
nível INFO de release). Controlo: git puro nesta máquina = 37–53ms; 10 gits concorrentes via
PowerShell = ~40ms cada — a rajada só é lenta dentro do contexto arranque+Defender.

O `AppHangTransient` (WER 1001, sem crash, janela recuperou) coincidiu com essa rajada fria
no primeiro arranque pós-build e não se reproduziu em 2 arranques quentes de 15s. Fica em
observação na passagem manual — se reaparecer, o log + `__gsPerf()` dizem exatamente o que
estava em curso.

### I. R4.1 — pós-teste do utilizador: terminais a piscar + animações "mortas"

Reporte do utilizador no exe: "toda vez que acontece 1 ação vários terminais aparecem" e
"animações e coisas de design morreram". **Uma só causa para as duas queixas**: no Windows,
uma app de subsistema *windows* (sem consola) que faz spawn de `git.exe` cria uma janela de
consola visível por processo. Cada ação invalida várias queries → vários spawns → vários
terminais; e cada consola **rouba o foco à janela**, o que ativa `data-win-hidden` (pausa
das animações ambientais no blur, feature da R2) — as folhas congelavam a cada ação. As
animações em si nunca foram removidas; estavam pausadas pelo mecanismo de blur.

Correção: `CREATE_NO_WINDOW` (0x08000000) em TODOS os spawns (`run_git`, `run_git_stdin`,
`run_git_timeout`, `open_path`, `reveal_path` — helper `hide_console` em git/mod.rs).

Verificação medida (EnumWindows a cada 250ms durante 10s de arranque, que dispara 10–15
gits): **0 janelas de consola novas visíveis**; exe vivo e responsivo. cargo test 48/48.

### J. R4.2 — "falta animações": a entrada do grafo estava silenciada desde a R3

`git diff d34ede1..HEAD` confirmou que a R4 não removeu uma única linha de animação. O que
faltava era pré-existente: o cap da R3 era tudo-ou-nada (`rows.length <= 120`) e o log
carrega 200 — **a entrada-assinatura do grafo (vinhas a crescer) nunca tocava num repo
real**. O orçamento passou a ser POR ROW: as primeiras 120 rows animam (vários ecrãs), o
resto renderiza estático — a mesma razão de perf do cap antigo (abaixo da dobra não se vê),
sem matar o momento. Guarda de modo janela: no fim da entrada (1,6s) todos os hashes ficam
"vistos", para o scroll (que remonta elementos) nunca a repetir; a troca é invisível porque
todos os keyframes terminam na pose estática. vitest 69/69 (novo teste: row 0 anima, row
150 estática num log de 200). develop @ d9d4287.

Verificado AO VIVO no exe (CDP no WebView2, amostragem 300ms desde o arranque): aos ~0,9s o
grafo monta com **129 vinhas em vineDraw + 120 nós em nodePop**; a 2,5s a limpeza pós-entrada
troca os estilos para estático sem alteração visual; sem re-animações em scroll. Também
verificado ao vivo: reduced-motion=false, data-anims=on, path do repo ativo estável.

### K. R4.3 — sweep completo do spec de animações (animations.md linha a linha)

A pedido do utilizador ("mete todas as outras animações que faltam"), cada linha da tabela do
handoff foi confrontada com o código. Já implementado e confirmado: splash/onboarding/S-tree,
news deck, modais, palette, context menu, notifications (com vinha), botões hover/press,
spinner do fetch (+fxFall), commit→nó incremental, folha efémera, sway/leafFall ambiente,
theme swap, winMinimize, scroll-spy, recPulse, caret do rail, saídas de rows. Lacunas
encontradas e fechadas:

| Spec | Estava | Agora |
|---|---|---|
| Screen switch = `fadeUp` 250ms | History/WorkingCopy/Settings/RepoPicker usavam `fadeIn` | `fadeUp` em todos (Stashes já estava) |
| Toast: "small vine flourish frames it" | toast sem vinha (só as notifications tinham) | `Vine` partilhada do Notifications, gated por anims |
| File stage/unstage: "small per-row stagger" | todas as rows entravam ao mesmo tempo | stagger 22ms/row (cap 220ms), congelado no mount — o delay não pode seguir o índice vivo ou remover uma row reiniciava a entrada das seguintes |
| Tab bar appear = `fadeUp` | barra de tabs montava sem entrada | `fadeUp` 250ms |

vitest 69/69, tsc+eslint limpos, exe reconstruído e árvore re-verificada ao vivo via CDP.

## 10. Ronda 5 — polimento de UI e primeira release (2026-07-15, branch `feat/ui-polish-r5`)

Pedidos do utilizador nesta ronda, todos entregues e verificados ao vivo no exe via CDP:

| Pedido | Entrega |
|---|---|
| Notificações todas em baixo à direita, "de forma igual" | Toaster + Notifications fundidos num só stack (bottom 66 / right 16, por cima da ActionBar), mesmo cartão/vinha/dot/animações (`notifIn`/`notifOut`). Bónus: a camada passou para o App root — durante o onboarding e o picker os toasts nunca tinham aparecido (bug latente). |
| Ícones por tipo de ficheiro em vez de letras | `lib/fileIcons.ts` (~60 extensões + nomes especiais: Dockerfile, Makefile, LICENSE, .gitignore…) + `components/FileIcon.tsx` (tile 16px, cor de marca com alpha). A letra de estado git (M/A/D/U) mudou para a margem direita com tooltip PT. Aplicado: rows da Cópia de trabalho, cabeçalho do diff, lista de ficheiros do commit no History. |
| Grupos com nome e cor editáveis | Paleta própria de 8 cores (`lib/groupColors.ts`, independente do tema — antes usava as 3 lanes), `setGroupColor` no appStore, `GroupEditModal` (nome + swatches) via botão direito no chip, em abas E no rail. |
| Mais espaço em cima (arrastar + abas) | Titlebar em 2 filas no modo abas: fila 1 = wordmark + faixa larga arrastável + ferramentas + controlos; fila 2 = largura toda para as abas (espaços vazios também arrastam). Modo rail mantém 1 fila. EphemeralLeaves acompanha a nova altura. |
| Swatches com a cor certa de cada opção | Os ícones de estilo de árvore liam o `--leaf` vivo (todos ficavam da cor do estilo aplicado) → `treeLeafColor(theme, style)` em themes.ts. O swatch "Auto" lia `--l1/--l2` já recoloridos pela paleta ativa → par `vivid` do próprio tema (Settings e onboarding = o bug do "ecrã inicial das cores"). |
| Hover no fundo do painel esquerdo | Causa: `background: "transparent"` inline vence o `.gs-row:hover` da classe. Varridos 9 componentes (Sidebar navRow/branchRow/Definições, FileRow, CommitRow, tabs, rail, Settings nav, RepoPicker) → `undefined` quando não selecionado. |
| Ctrl+K em vez de ⌘K no Windows | `lib/platform.ts` (isMac + comboHint) usado no Titlebar (hint segue o atalho REGRAVÁVEL da palette), rodapé da palette e NOVIDADES do onboarding. |

**Release 0.1.0 + auto-update:** versões alinhadas em 0.1.0; `tauri-plugin-updater` + `tauri-plugin-process` (relaunch); keypair minisign em `%USERPROFILE%\.tauri\gitsylva.key` (privada FORA do git); `createUpdaterArtifacts` + endpoint `github.com/Diogo1306/GitSylva/releases/latest/download/latest.json`; `UpdatePrompt` no arranque (check 5s depois do arranque, nunca bloqueia; diálogo → download → relaunch). ⚠️ O repo é PRIVADO: o auto-update e os downloads públicos só funcionam quando o dono tornar o repo público (decisão do utilizador, não foi alterada).

Validação: tsc 0, eslint 0, vitest 76/76 (+4 fileIcons), cargo check ok; CDP no exe real: hint "Ctrl+K", 3 zonas de arrasto (40/38px), tiles de tipo + letras de estado no detalhe do commit, cartão de notificação a right-gap 16 / bottom-gap 66.
