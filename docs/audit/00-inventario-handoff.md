# Anexo 0 — Inventário do handoff de design (base de comparação)

> Extraído integralmente de `docs/design/GitSylva-Floresta.dc.html` (3312 linhas),
> `GitSylva-Logos.dc.html` (388 linhas), `README.md` e os 5 PNGs de uploads/.
> Todos os valores são literais do código-fonte do protótipo, não estimativas.

## 0. Ficheiros e arquitetura

**PNGs em `docs/design/uploads/`:**
- `pasted-1783510861528-0.png` — **referência externa (SourceTree)**: toolbar Commit/Pull/Push/Fetch/Branch/Merge/Stash/Discard/Tag. Inspiração, não é o produto.
- `pasted-1783531137746-0.png` — **hero do logo**: ícone S-árvore verde + wordmark "git S ylva".
- `pasted-1783537038373-0.png` — recorte do painel de detalhe do Histórico.
- `pasted-1783537397669-0.png` — **ecrã Histórico completo** no tema Batman — screenshot canónico do produto.
- `pasted-1783538859747-0.png` — **referência externa (SourceTree)**: "Local repositories" — inspiração do ecrã "Adicionar repositório".

**Motor:** ficheiros `.dc.html` (DesignCraft) com `<x-dc>` + React. O produto é a **janela da app 1440×880** sobre uma secretária decorativa. Persistência em `localStorage` chave `gitsylva-floresta-prefs`.

## 1. Tokens visuais globais

### 1.1 Tipografia
**Fontes (Floresta):** Instrument Sans (400–700, itálico), Instrument Serif, JetBrains Mono (400/500/600), Atkinson Hyperlegible, Space Grotesk (400/500/600).

**Papéis:**
- **UI corrente:** `var(--font)` = Instrument Sans (padrão). Alternáveis em Definições → Avançado: Instrument Sans / Sistema / Atkinson Hyperlegible.
- **Código, hashes, caminhos, chips, kbd, branches:** JetBrains Mono.
- **Wordmark e nome:** Space Grotesk 600.

**Escala de tamanhos (px):** 10 / 10.5 / 11 / 11.5 / 12 / 12.5 / 13 / 13.5 / 14 / 14.5 / 15 / 16 / 17 / 20 / 21 / 22 / 24 / 26 / 52. Pesos: 400/500/600/700/800. Letter-spacing de secções: 1.2–1.4px; headers de nav 2px; wordmark 0.3–0.5px.

### 1.2 Espaçamento, raios, densidade
- **Raios:** botões/inputs 8–9px; cartões 10–12px; janela/modais/painéis 14px; pills 999px; badges de status 4–5px; avatares 50%; ícone-app 18–26px.
- **Gaps:** 2px (listas densas), 6–12px (controlos), 16px (secções internas), 20–32px (blocos de definições).
- **Densidade da linha de commit:** `rowH` = **52px** (conforto) / **40px** (compacta) — token `state.density`.
- **Sombras:** `--shadow` por tema (escuro: `0 0 0 1px rgba(0,0,0,0.55), 0 24px 80px rgba(0,0,0,0.55)`); modais `0 24px 80px rgba(0,0,0,0.35/0.4)`; notificação `0 16px 50px rgba(0,0,0,0.3)`; toast `0 8px 30px rgba(0,0,0,0.3)`.

### 1.3 Sistema de cor por tokens
Grupos: superfícies (`--desk, --win, --panel, --panel2`), bordas (`--border, --bsoft, --winB, --tagbd`), texto (`--text, --text2, --muted`), interação (`--sel, --hover`), botões (`--btn, --btnB, --btnT`), badges/input (`--badge, --badgeT, --input`), lanes (`--l0/l1/l2` + `bg`/`bd`), diff (`--dhB/dhT, --dcT, --daB/daT, --ddB/ddT`), status de arquivo (`--stMB/stMT`, `--stAB/stAT`, `--stDB/stDT`), avatares (`--auAS/--auMD/--auLF` + `b`), `--leaf`, `--trunk`, `--accent/--accentT`.

## 2. Temas (4) — paletas exatas

Chaves: `escuro` (Batman, **padrão**), `claro` (Clássico), `nipon`, `gitclassic`. (O enum de props lista `harbor` — vestígio; o 4.º tema real é `gitclassic`.) Troca com flash suave (`themeSwapA/B` 0.4s, desativável).

### 2.1 Batman / `escuro` (padrão)
- desk `radial-gradient(120% 90% at 50% 0%, #1B1D1F 0%, #0B0C0D 62%)` · win `#141618` · winB `rgba(255,255,255,0.08)`
- panel `#101214` · panel2 `#0C0E10` · border `#272B2E` · bsoft `rgba(255,255,255,0.05)`
- text `#EAECEE` · text2 `#A5ACB2` · muted `#61686E`
- sel `rgba(234,236,238,0.08)` · hover `rgba(234,236,238,0.05)`
- btn `#1B1E21` · btnB `#2D3134` · btnT `#C8CDD2` · badge `#262A2E` · badgeT `#AEB5BB` · input `#181B1D`
- leaf/l0 `#82C99B` · l1 `#7FA6D9` · l2 `#D9A96B` · tagbd `#31363A`
- diff: dhT `#7FA6D9`, daT `#A9DDBC`, ddT `#E4A3A3`, dcT `#8C9399`
- **Accents:** Branco `#EAECEE`, Amarelo `#E8C55A`, Azul `#7FA6D9`, Roxo `#B79AE0` (texto sobre accent `#111315`)
- vivid (Auto): `['#4EA8FF','#FFA13F']` · canopy `['#1E211F','#252927','#2D332F']`

### 2.2 Clássico / `claro`
- desk `radial-gradient(...#F7F7F3 0%, #E8E8E3 70%)` · win `#FFFFFF` · winB `rgba(0,0,0,0.12)` · shadow `0 24px 70px rgba(0,0,0,0.16)`
- panel `#FAFAF7` · panel2 `#F5F5F1` · border `#E7E7E0` · bsoft `rgba(0,0,0,0.05)`
- text `#191C1A` · text2 `#59605A` · muted `#90968F`
- btn `#FFFFFF` · btnB `#DDDDD5` · btnT `#363C37` · badge `#EDEDE7` · input `#FFFFFF`
- leaf `#7BA083` · l0 `#3B7A57` · l1 `#4E76A8` · l2 `#B08540` · tagbd `#DCDCD4`
- diff: dhT `#40628C`, daT `#2F6B4F`, ddT `#A34D4D`, dcT `#6F766E`
- **Accents:** Preto `#191C1A`, Verde `#3B7A57`, Azul `#4E76A8`, Âmbar `#8A6A33` (texto `#FFFFFF`)
- vivid `['#1F78E0','#E06A2B']` · canopy `['#C6CFC1','#D3DCCE','#DEE6D9']`
*(estes valores são também o `:root` de fallback do CSS)*

### 2.3 Nipon / `nipon`
- desk `radial-gradient(...#F8F2F1 0%, #ECE2E1 70%)` · win `#FFFFFF` · winB `rgba(60,30,40,0.12)` · shadow `0 24px 70px rgba(90,50,65,0.16)`
- panel `#FBF7F6` · panel2 `#F6EFEE` · border `#EDE1E1`
- text `#241D1E` · text2 `#6B5D5F` · muted `#A08F92`
- btn `#FFFFFF` · btnB `#E4D4D6` · btnT `#4A3C3F` · badge `#F2E6E8` · input `#FFFFFF`
- leaf `#D983A8` · l0 `#C96C93` · l1 `#7E96C4` · l2 `#C0A05E` · tagbd `#E0D0D2`
- diff: dhT `#5A76A8`, daT `#3F7B52`, ddT `#AD4C5E`, dcT `#7D6F71`
- **Accents:** Rosa `#C96C93`, Carvão `#241D1E`, Índigo `#7E96C4`, Dourado `#B98A3E` (texto `#FFFFFF`)
- vivid `['#E0468F','#8A63D9']` · canopy `['#E9D3DA','#F0DEE4','#F5E7EB']`

### 2.4 Git Classic / `gitclassic`
- desk `radial-gradient(...#10151B 0%, #010409 62%)` · win `#0D1117` · shadow `0 0 0 1px rgba(0,0,0,0.6), 0 24px 80px rgba(0,0,0,0.6)`
- panel `#090C10` · panel2 `#06080B` · border `#21262D`
- text `#E6EDF3` · text2 `#9DA7B1` · muted `#6E7681`
- sel `rgba(63,185,80,0.12)` · btn `#161B22` · btnB `#30363D` · btnT `#C9D1D9` · badge `#21262D` · input `#0D1117`
- leaf/l0 `#3FB950` · l1 `#58A6FF` · l2 `#F0883E` · tagbd `#30363D`
- diff: dhT `#58A6FF`, daT `#56D364`, ddT `#F85149`, dcT `#8B949E`
- **Accents:** Verde `#3FB950`, Azul `#58A6FF`, Laranja `#F0883E`, Branco `#E6EDF3`
- vivid `['#58A6FF','#F0883E']` · canopy `['#12241A','#16301F','#1C3E26']`

**Regra de accent:** 4 cores próprias por tema; `--sel` recalcula-se como accent a 8% (claro) / 10% (restantes).

## 3. Estilos de árvore (4)

Token `treeStyle`. Afeta: folhas do grafo, floresta do fundo (`deskArt`), vinha das notificações, remate dos galhos do logo.

| Estilo | chave | leaf (dark/light) | trunk (dark/light) | Copa no grafo | Canopy floresta |
|---|---|---|---|---|---|
| **Clássica** | `normal` | `--leaf` do tema | — | folha de carvalho (`M0,0 Q5,-4.5 10.5,-1 Q5.5,3.5 0,0 Z`) + nervura | canopy do tema |
| **Sakura** | `sakura` | `#E8A0BF` / `#D983A8` | `#9C6B5E` / `#7E564B` | flor 5 pétalas + miolo `--win`; tronco/lanes usam `--trunk` | dark `['#2B2228','#3B2A35','#48303F']` / light `['#E3CDD8','#EDD9E2','#F3E3EA']` |
| **Tropical** | `tropical` | `#4FCE6B` / `#3FA45C` | `#A5754A` / `#8A5A33` | palmeira: leque de 5 frondes + 2 cocos; linhas mais grossas | dark `['#14281C','#1A3624','#21452D']` / light `['#CBE2CE','#D9ECDB','#C1DCC6']` |
| **Ramificação** | `grafo` | `--l0` | — | grafo limpo sem folhas; **main neutra**: `--l0`/`--leaf` = `--text` | canopy do tema |

Descrições dos cartões: "Folhas de carvalho" / "Flores de cerejeira, tronco de cerejeira" / "Palmeiras, tronco de madeira e cocos" / "Git clássico: só nós de commit".

Espessura das linhas do grafo (lane 0 / outras): tropical 4.2/2.8 · sakura 3.8/2.4 · normal e grafo 3.4/2.2.

## 4. Cor das branches (7 paletas) — recoloca lanes 1 e 2; main mantém o tronco

Token `branchColor`. Swatch = `linear-gradient(135deg, cor1 50%, cor2 50%)`.

| Nome | chave | dark | light |
|---|---|---|---|
| **Auto** | `auto` | par `vivid` do tema | idem |
| **Oceano** | `oceano` | `#4EA8FF` / `#3DD6D0` | `#1F78E0` / `#0E9E93` |
| **Pôr-do-sol** | `sunset` | `#FF8A4E` / `#FF6FB5` | `#E06A2B` / `#D8478E` |
| **Fogo** | `fogo` | `#FF5D4E` / `#FFC531` | `#E03B30` / `#DFA400` |
| **Neon** | `neon` | `#3BE477` / `#F45FE3` | `#0FA958` / `#C339B5` |
| **Outono** | `outono` | `#D97757` / `#D9A94B` | `#B85C3F` / `#A8802E` |
| **Uva** | `uva` | `#A48FD9` / `#FF6FB5` | `#7E64B8` / `#D8478E` |

`--l1bg`=12%, `--l1bd`=28%, `--l2bg`=13%, `--l2bd`=30% (via `hexAlpha`).

## 5. Logos (GitSylva-Logos.dc.html)

**Conceito:** o "S" de gitSylva é uma **árvore desenhada como branch de git** — tronco afilado (logo `w0=2.6→w1=9`), raízes na baseline, copa no topo com folhas e nós de commit. viewBox `0 0 46 62` (ou `52` cropped). Cor base GREEN `#7BC896`, BG `#14181B`.

- **Hero:** ícone-app 108×108 radius 26px `#14181B`; wordmark `git`+S+`ylva`, S com escala ~80% do corpo, assente na baseline.
- **Fonte do wordmark selecionada:** **Space Grotesk (fator 0.97, "Técnica — lado dev da marca")**.
- **Escalas do ícone:** contentores 72/46/28px (radius 18/12/8px), árvore a 46/30/18px — "os nós mantêm-se legíveis até 20px" (Dock · barra de menus · favicon).
- **Variações A–F** (`els`): **B usada no app** (S + 3 galhos + 4 nós + 1 folha na raiz). Estilos de copa em `mkTree`: `nodes` / `leaves` / `blossom` / `palm` / `crown`.
- **Por tema:** Clássica·Batman (nodes, `#7BC896`) · Sakura (blossom, tronco `#9C6B5E`, flor `#E8A0BF`) · Tropical (palm, `#A5754A`/`#4FCE6B`) · Clássico claro (nodes, `#191C1A` sobre branco) · Nipon (blossom, `#7E564B`/`#D983A8`) · Git Classic (nodes, `#3FB950` sobre `#0D1117`).
- **Uso:** hero/app-icon = `crown`/variação B; titlebar e splash = `buildLogoS({crop, xScale:1.22})` a 14px e 37px; onboarding = `buildOnboardTree` (S cresce por estágios).

## 6. Ecrãs da app

### 6.1 Splash (2.05s)
Overlay z-90 sobre `--desk`, `splashSeq`. Wordmark **Space Grotesk 600, 52px**. Letras `g,i,t` entram por `letterL` e `y,l,v,a` por `letterR` (delays 0.68–0.98s), depois saltam para fora (`letterHop` 1.5–1.68s), ficando só o S. Timeout 2100ms.

### 6.2 Onboarding — Login
Esquerda: árvore-S (172×229px) + "gitsylva" (Space Grotesk 600 20px) + "O TEU JARDIM DE COMMITS" (11px ls 1.8px muted). Direita (card 336px): "Bem-vindo" (21px 700). 3 provedores (inicial em círculo 26px, "Continuar com X" + domínio mono 11px); no protótipo, clicar mostra spinner "A ligar a X…" (1100ms) e **finge** ligação → setup. Link "continuar sem conta" (dashed underline) → setup. Hover `translateY(-1.5px)`.

### 6.3 Onboarding — Setup
Árvore cresce (208×277px, "A ÁRVORE CRESCE CONTIGO"). Card 360px: "Personaliza o teu jardim" + "Tudo isto muda depois nas Definições."
- **TEMA:** 4 mini-cartões 76×52px (mock janela), anel accent no selecionado.
- **ESTILO DA ÁRVORE:** pills com ícone SVG.
- **COR DAS BRANCHES:** 7 círculos 26px, hover `translateY(-2px)`.
- **NOVIDADES:** baralho de 3 cartas empilhadas (rotação ±3.5°, opacidade 0.5), pontos indicadores e "próximo →": (1) "Grupos de separadores", (2) "Pesquisa total ⌘K", (3) "Árvore viva".
- Botões: **"Plantar e entrar"** (accent, flex:1) + **"Saltar"** (btn).

### 6.4 Onboarding — Plantada
Árvore completa (250×333px, "FLORESTA PLANTADA"). "A tua floresta está plantada" + "bom código." Após 1900ms `obFade`, 2450ms → done, abre **picker** e notifica "Bem-vindo ao GitSylva". Revisitável em Definições → Contas.

### 6.5 Titlebar (50px, `--panel`)
- Semáforos macOS: 3 círculos 12px — `#FF5F57`, `#FEBC2E`, `#28C840`, gap 8px.
- Wordmark: Space Grotesk 600 17px, `logoSTiny` 14px.
- Modo abas (padrão) OU modo rail: em rail, a titlebar mostra o breadcrumb `repoName / branch` (mono 12px, branch em `--l0` 600).
- Botões à direita (radius 8px, 12.5px, hover `--hover` + `translateY(-1.5px)`): **Fetch** "⟳" (a girar: "A buscar…", `spin` 0.8s) · **Descartar** "↩" + badge unstaged (desativa a opacity 0.55 sem alterações) · **Terminal** ">_" (30×30 mono) · **Pesquisar ⌘K** (kbd) · **Definições** (círculo pontilhado 2.5px dotted).

### 6.6 Abas de repositórios e grupos (modo tabs)
- **Grupo:** contentor radius 10px border `--l{cor}bd`; chip (11.5px 700, `--l{cor}bg`/`--l{cor}`) com contagem. Clique colapsa; botão direito fecha todas as abas do grupo. Colapsado: fundo `--l{cor}bg`.
- **Aba:** dot 7px `--l{i%3}`, nome 12.5px (600 ativa/400), branch mono 10.5px muted (some em estreito), close ✕ 16×16. Ativa: `--sel` + border `--btnB`.
- **"+"** 26×26 → picker.

### 6.7 Rail de repositórios (modo rail, 176px)
"PROJETOS"; grupos com caret ▶ (rot 0/90°) + nome maiúsculo + contagem; abas empilhadas. Rodapé "+ Abrir repositório" (dashed).

### 6.8 Sidebar de navegação (232px, min 180 / max 340; arrastável)
- **ESPAÇO DE TRABALHO:** Cópia de trabalho (dot quadrado 7px `--l2` + badge), Histórico (dot redondo `--l0`), Stashes (dot losango `--l1` + badge). Ativo `--sel`.
- **BRANCHES:** mono 13px, dot 6px (preenchido na atual), 600 na atual. Clique = checkout; botão direito = menu.
- **REMOTOS:** origin (caret ▸). **TAGS:** losango muted 6px.
- Rodapé: Definições (círculo bordado 9px).

### 6.9 Histórico
- Topo: input "Filtrar histórico…" + "{n} commits" (mono muted).
- **Grafo SVG** (left 14px): `laneX(l)=10+l*18`; ligações como **vinha ondulada** (cúbicas alternadas amp ±2.6); merges com gavinha em S; nós r 4.5 (3.3 merge), `fill:--win` stroke `--l{lane}` 2px (merge preenchido); folhas/flores/palmas nas pontas conforme treeStyle. Animações `vineDraw`/`nodePop`/`leafPop`.
- **Linha "Alterações por commitar"** no topo (quando há mudanças): 13.5px 600 itálico + badge "{n} arquivos" (stM, border `--l2bd`) + nó tracejado → seleciona detalhe da working copy.
- **Linhas** (rowH 52/40): mensagem 13.5px (500 normal / 400+text2 merge), chips, avatar 22px (iniciais, cor auto), hash mono 12px (66px), tempo 12px muted (96px, some em estreito). Entrada `fadeUp` escalonada.
- **Chips:** tags `v*` = transparente/`--text2`/border `--tagbd`; `origin/*` = `--l0` transparente; `feature*`=l1, `fix*`=l2, resto l0.

**Painel de detalhe** (372px, min 300 / max 560, arrastável, `--panel`):
- Commit: avatar 34px + autor 13.5px 600 + data 12px muted + chip hash (mono 12px, `--l0`/`--l0bg`/`--l0bd`, radius 7px). Mensagem 14.5px lh 1.45. Stats `+{add}` (daT) `−{del}` (ddT) `{n} arquivos`. "ARQUIVOS ALTERADOS" (10.5px 600 ls 1.2px) → badge status 16×16 (A/M/D) + caminho mono rtl-ellipsis. "DIFF" → radius 10px `--panel2`, mono 11.5px lh 1.75.
- Working copy: "{n} por preparar · {n} preparadas · abrir cópia de trabalho" (link l0); NÃO PREPARADAS (checkbox vazio) / PREPARADAS (checkbox accent ✓); mini-diff; textarea + "Commit em {branch} · {n} arq.".

**Diff — 5 tipos de linha:** header `@@` bg `--dhB`/`--dhT`; contexto transparente/`--dcT`; adição `--daB`/`--daT`; remoção `--ddB`/`--ddT`.

### 6.10 Cópia de trabalho
- Layout lado a lado (painel 400px min 320/max 540, arrastável) ou em baixo (236px). Botão "Lado a lado" ↔ "Diff a toda a largura".
- Painel: "NÃO PREPARADAS · {n}" + "Preparar tudo" (l0) e "Descartar" (ddT); checkbox 17×17 (vazio radius 5px / accent ✓ 800), badge status, nome 13px + dir mono 10.5px muted. "PREPARADAS · {n}".
- Caixa de commit: textarea 64px (placeholder "feat: mensagem…" se conventional), botão "Commit em {branch} · {n} arq." (accent se staged; senão muted op. 0.7). Commit em main com aviso (modal).
- Diff: `--panel2`, mono 12.5px lh 1.8.

### 6.11 Stashes
Cartões (max 620px, radius 12px): losango `--l1` 8px + título 14px 600 + tempo muted; meta mono "{n} arquivos · …"; **Aplicar** (accent) + **Descartar** (btn). Empty: cartão tracejado "Sem stashes…".

### 6.12 Adicionar repositório (estilo SourceTree)
Abas: **Local / Remoto / Clonar / Adicionar / Criar** + "✕ Fechar". Max 720px. Rodapé: "Nova pasta" + "~/dev" (mono).
- **Local:** título 24px 700 + search; cartões (avatar 34px radius 9px, nome 13.5px 600, badges "aberto" (l0) / "{n} alterações" (stM), chip branch (l1), caminho mono 11px, →). Repo em falta → "Repositório movido ou apagado" (ddT). Empty: "Nada encontrado para essa procura."
- **Remoto:** "Conta GitHub · @user". Cartões (nome, badge "privado", desc, "Clonar" → pré-preenche URL).
- **Clonar:** URL (mono) + destino + "Clonar" (spinner).
- **Adicionar:** caminho com .git + Escolher… + "Adicionar".
- **Criar:** Nome + Pasta raiz; hint "Vai correr `git init` em {path}/{name} com branch main".

### 6.13 Definições
Nav esquerda 192px: "← Voltar" + 11 itens com **scroll-spy** e scroll suave. Conteúdo max 720px, padding 28/32/48, gap 32. "Preferências guardadas automaticamente neste dispositivo."

**11 secções:** 1. APARÊNCIA (tema 4 cartões mock janela 88px, estilo árvore 4 cartões, 7 pills branches, toggle animações, 4 pills accent, segmentado tabs/rail) · 2. CONTAS & ACESSO ("Rever ecrã de boas-vindas", 3 contas com estado "Ligado como @user · credenciais no keychain" (daT) / "Não ligado", "Repositórios no disco" detetados em ~/dev) · 3. GIT (nome/email, editor externo VS Code/Cursor/Zed/Vim, toggles auto-fetch 10min / GPG (desativa-se se SSH-sign ativo) / podar branches) · 4. COMMITS (avisar main, preparar modificados auto `git add -u`, sugerir Conventional Commits) · 5. PUSH & PULL (pull: ff/**rebase (padrão)**/merge com hint por opção; enviar tags `--follow-tags`; confirmar force push) · 6. ATALHOS (repor; 7 linhas **regraváveis** com `recPulse`, Esc cancela: ⌘K, ⌘Enter commit, ⌘P push, ⌘⇧L pull, ⌘R fetch, ⌘B branch, ⌘S stash; kbd border 1.5px, border-bottom 2.5px, radius 7px) · 7. CHAVES SSH (chaves com nome mono + badge tipo + fingerprint + data; Copiar pública / Remover; Gerar nova; Testar ligação com spinner → ✓/✗; toggle assinar com SSH) · 8. NOTIFICAÇÕES (4 toggles: push, fetch novos, CI, conflitos pull; onde: app/sistema/ambos; **preview** dinâmico) · 9. IDIOMA (PT/EN segmentado; "Aplica-se após reiniciar") · 10. AVANÇADO (fonte UI 3 rádios com preview "AaBbCc 0123"; Git LFS por repo com toggles; hooks pre-commit + "Ignorar uma vez" + badge "armado") · 11. LIMPEZA (header em `--ddT`; limpar cache "{n} MB"; repor todas → modal).

**Toggles:** track `--accent` (on) / `--btnB` (off); knob 18×18 branco, left 18px/2px; desativados `--badge` op. 0.5.

### 6.14 Pesquisa ⌘K
Overlay z-65 `rgba(0,0,0,0.35)` padding-top 110px; caixa 580px radius 14px, `popIn`. Input autoFocus 15px "Pesquisar commits, branches, repositórios…". Grupos: REPOSITÓRIOS (dot redondo, "{n} branches") · BRANCHES (losango, "checkout") · COMMITS (dot lane, "{hash} · {autor}", máx 6) · IR PARA (Histórico/Cópia/Stashes/Definições). Empty "Sem resultados para «q»". Rodapé "↵ abrir o primeiro · esc fechar · ⌘K / Ctrl+K abre em qualquer ecrã".

### 6.15 Modais
Overlay z-50 `rgba(0,0,0,0.45)`, caixa 460px radius 14px padding 20px, `popIn`. Ação vermelha `#C25555` em discard/resetall. Tipos: branch (nome + a partir de + checkbox checkout) · stash (mensagem `WIP em {branch}` + incluir staged) · account (provedor + user + token + keychain) · merge (rádios) · tag (nome + commit) · sshgen (ficheiro + tipo ED25519/RSA + passphrase + ssh-agent) · resetall · commitwarn · discard ("{n} arquivo(s)… não pode ser desfeita") · push (lista de commits + "Push · {ahead}") · pull (novos commits + estratégia + "Pull · {behind}").

### 6.16 Notificação
Bottom 88px / right 44px, 310px, radius 12px, `notifIn`. **Vinha decorativa** (`buildNotifVine`) que abraça o cartão com folhas/flores/palmas/nós conforme treeStyle. Dot 9px + título 13.5px 600 + sub 12px muted + ✕. Auto-fecha 3800ms. Disparada por push/pull/fetch/merge/clone/conta.

### 6.17 Toast
Bottom 30px centro, pill 999px, bg `--text` cor `--win`, 13px 600, `toastUp`. Auto-fecha 2600ms.

### 6.18 Menu de contexto de branch
No cursor, min 230px radius 11px, `popIn`. Header nome (mono 11px muted). Itens 13px: Checkout, Merge em {branch}…, Rebase sobre origin/main…, Renomear…, Copiar nome, Apagar (ddT). Condicionais se não for a atual.

### 6.19 Barra de ações inferior (54px, `--panel`)
**Commit** (+ badge staged accent) · div · **↓ Pull** (+ badge behind) · **↑ Push** (+ badge ahead accent) · div · **Branch** · **Merge** (some em estreito) · **Stash** · **Tag** (some em estreito) · spacer · status mono: `{repo} / {branch}` + `↑{ahead}` + `↓{behind}`.

## 7. Animações

**Keyframes:** vineDraw, nodePop, leafPop, fadeUp/fadeUp2, fadeIn, popIn, winIn, toastUp/toastIn, splashSeq, logoIn, lineGrow, recPulse, letterHop, obFade, themeSwapA/B, fxFall (folha efémera 2.4s), fileIn, letterL/letterR, spin, notifIn, **sway** (floresta −1.1°→1.4°), **leafFall** (15–23s, 106vh + 330°).

**Efeitos por evento:** folha cai dentro da janela ao trocar de repo, fetch e commit (`spawnLeaf`); grafo cresce; troca de tema flash; modais/toasts/notificações animados.

**deskArt (floresta de fundo):** ramos com folhas nos 4 cantos (sway infinito 7.5–9.6s) + 4 folhas a cair. Cores = canopy do estilo. **Interruptor mestre:** "Animações decorativas" (`anims`).

## 8. Responsivo
- Janela: `winW = min(1440, max(700, vw−76))`, `winH = min(880, max(540, vh−76))`.
- Breakpoints: `narrow < 1180`, `tiny < 980`, `micro < 880`.
- narrow: esconde tempo das linhas, branch nas abas, Merge/Tag; sidebar ≤196px, detalhe ≤330px.
- tiny: esconde painel de detalhe; desativa linha WC. micro: esconde sidebar e handle.
- Painéis arrastáveis com savePrefs: sidebar (180–340), detalhe (300–560), working copy (320–540).

## 9. Dados seed do protótipo
- Ana Souza / ana@sylva.dev / @anasouza; GitHub ligada.
- Autores: Ana Souza→AS, Marco Duarte→MD, Lia Ferraz→LF.
- 13 commits seed; defaults: view history, tema escuro/Batman, treeStyle normal, branchColor auto, fonte instrument, density conforto, accentIdx 0, **pullMode rebase**, editor vscode, layout tabs, wcLayout side, ahead 1 / behind 2, cacheMB 148, língua pt, notifWhere app.

**Notas:** (1) enum de props lista `harbor` mas o 4.º tema real é `gitclassic`. (2) Logo do app = variação B (`crown`). (3) 2 dos PNGs são screenshots do SourceTree (inspiração, não produto).
