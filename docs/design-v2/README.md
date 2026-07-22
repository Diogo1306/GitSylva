# GitSylva — Guia de Implementação

> **Para quem é este documento:** um agente (Claude Code) ou programador que vai implementar o GitSylva como app nativa de desktop. O protótipo de referência — e **fonte de verdade** — é `GitSylva Floresta v2.dc.html` (abrir no browser — todos os fluxos, temas e animações estão funcionais). Os logótipos estão em `GitSylva Logos.dc.html`.
>
> **Regra de ouro:** em caso de dúvida sobre qualquer valor (cor, timing, espaçamento), o protótipo é a fonte de verdade. Inspeciona-o.

---

## 1. O que é o GitSylva

Cliente de Git para desktop (macOS + Windows + Linux) com uma identidade visual de **árvore viva**: o histórico de commits é desenhado como uma vinha/árvore que cresce, folhas caem quando há atividade, e toda a app respira com micro-animações orgânicas. Interface em português. Concorrentes de referência: SourceTree, GitKraken, Fork — mas com alma.

**Pilares:**
1. O grafo de commits É uma árvore (tronco = branch principal, ramos = branches, folhas = commits).
2. Animações orgânicas em toda a atividade Git (commit, fetch, merge) — ver §9, a secção mais importante.
3. 4 temas completos + 4 estilos de árvore, combináveis livremente.
4. A app ocupa a janela inteira (sem moldura decorativa). A "floresta" decorativa aparece apenas nos ecrãs de entrada: splash, onboarding e Adicionar repositório.

---

## 2. Stack recomendada

- **Shell:** Tauri 2 (preferido: leve, Rust) ou Electron se a equipa preferir Node.
- **UI:** React 18 + Vite. CSS: variáveis CSS nativas para temas (a app inteira troca de tema trocando um bloco de CSS vars — ver §6). Sem Tailwind: os estilos do protótipo são explícitos e devem ser portados como estão.
- **Git:** `git2-rs` (libgit2) no backend Tauri, ou execução do CLI `git` com parsing de `--porcelain`. Nunca bloquear a UI: todos os comandos em worker/backend, com estados `pending` que alimentam as animações (§9.6).
- **Janela:** frameless com titlebar custom (o protótipo já desenha semáforos macOS à esquerda e botões min/max/close Windows à direita, escolhidos por `isMac`/`isWin`). Altura da titlebar: **50px**, com `-webkit-app-region: drag`.
- **Fontes (bundle local):** Instrument Sans (UI), Space Grotesk (logótipo/marca), JetBrains Mono (hashes, branches, paths, diffs), Atkinson Hyperlegible (opção de acessibilidade).

---

## 3. Fluxo de ecrãs

```
Splash (2.05s, auto)
  → Onboarding (1ª execução): login → personalização (tema + estilo de árvore) → "floresta plantada"
  → Adicionar repositório (tabs: Local | Remoto | Clonar | Adicionar | Criar) ← tem a floresta decorativa de fundo
  → Vista principal do repositório
       ├─ Histórico (grafo-árvore + detalhe do commit à direita)
       ├─ Nó "Alterações por commitar" no topo do histórico (staging + diff)
       ├─ Ações Git contextuais (NÃO existe barra inferior): Commit na Cópia de trabalho · Tag/Revert/«Branch daqui» no detalhe do commit · Checkout/«Merge em [atual]» na branch selecionada · Stash na Cópia de trabalho e no ecrã Stashes
       ├─ Titlebar (1 linha): wordmark + seletor de repositório (ABERTOS · FIXADOS · RECENTES) + «+» + Pull/Push/Fetch (agrupam em Sync <1100px) + Pesquisa Ctrl+K/⌘K + Terminal + Definições
       └─ Definições (11 categorias, ver §12)
```

- A app preenche **100% da janela** — não há fundo decorativo atrás da app.
- Multi-repo: NÃO existe barra permanente de tabs nem rail lateral. O seletor de repositório no header preserva o contexto dos repositórios abertos (secções ABERTOS/FIXADOS/RECENTES, menu «…» por repositório). Fechar o repositório ativo muda para o último usado.
- Breakpoints internos: `narrow < 1180px`, `tiny < 980px`, `micro < 880px` (colapsam progressivamente painel de detalhe, painel de working copy e sidebar).

---

## 4. Identidade — logótipo

- Wordmark: `git` + **árvore-S** + `ylva` em Space Grotesk 600. A árvore-S é um S desenhado como tronco com espessura variável (mais grosso na base) e copa de folhas no topo. Implementação de referência: funções `obBez`/árvore-S no protótipo e `GitSylva Logos.dc.html` (todas as variantes: horizontal, ícone, mono, por tema).
- A árvore-S do onboarding cresce por 3 estágios: 172×229 → 208×277 → 250×333 px (login → personalização → plantada).

---

## 5. Medidas de layout (defaults)

- Titlebar: 50px, linha única. Não existe barra de ações inferior.
- Sidebar (branches/tags/remotes/stashes): default **232px**, redimensionável, máx. 340px (196px em `narrow`).
- Painel de detalhe do commit: default **372px**, redimensionável.
- Painel de working copy: default **400px**, layouts `side` ou `bottom`.
- Linha do grafo (`rowH`): ~44px (densidade `default`); densidade `compacta` reduz.
- Raios: janelas/modais 14px, cartões 11px, botões 8-9px, chips/badges 999px.
- Botões: padding 6-7px × 11-14px, font 12.5-13px, peso 600.

---

## 6. Design tokens — 4 temas

Trocar de tema = trocar o bloco inteiro de CSS custom properties no elemento raiz (+ flash de 0.4s, ver §9.8). O tema `auto` segue o SO. **Accent** é escolhido à parte (4 opções por tema) e sobrepõe `--accent`/`--accentT`/`--sel`.

Significado das vars principais: `--win` fundo da app · `--panel`/`--panel2` painéis · `--border`/`--bsoft` contornos · `--text`/`--text2`/`--muted` texto · `--sel`/`--hover` estados · `--btn`/`--btnB`/`--btnT` botões · `--input` campos · `--badge`/`--badgeT` chips · `--leaf` folha da árvore · `--l0/--l1/--l2` cores das lanes do grafo (com `bg`/`bd` a 11-13% e 30% de alpha) · `--st*` estados de ficheiro (M/A/D) · `--au*` avatares de autor · `--dh/--da/--dd` linhas de diff (header/add/del) · `--desk` gradiente usado APENAS nos ecrãs de entrada (splash/onboarding).

### 6.1 Clássico (claro, default) — canopy `#C6CFC1 #D3DCCE #DEE6D9`
```css
--leaf:#7BA083; --desk:radial-gradient(120% 90% at 50% 0%, #F7F7F3 0%, #E8E8E3 70%);
--win:#FFFFFF; --panel:#FAFAF7; --panel2:#F5F5F1; --border:#E7E7E0; --bsoft:rgba(0,0,0,0.05);
--text:#191C1A; --text2:#59605A; --muted:#90968F;
--sel:rgba(25,28,26,0.07); --hover:rgba(25,28,26,0.045);
--btn:#FFFFFF; --btnB:#DDDDD5; --btnT:#363C37; --badge:#EDEDE7; --badgeT:#59605A; --input:#FFFFFF;
--l0:#3B7A57; --l0bg:rgba(59,122,87,0.11); --l0bd:rgba(59,122,87,0.30);
--l1:#4E76A8; --l1bg:rgba(78,118,168,0.11); --l1bd:rgba(78,118,168,0.30);
--l2:#B08540; --l2bg:rgba(176,133,64,0.13); --l2bd:rgba(176,133,64,0.32);
--tagbd:#DCDCD4; --dhB:rgba(78,118,168,0.10); --dhT:#40628C; --dcT:#6F766E;
--daB:rgba(59,122,87,0.10); --daT:#2F6B4F; --ddB:rgba(179,80,80,0.10); --ddT:#A34D4D;
--stMB:rgba(176,133,64,0.15); --stMT:#8A6A33; --stAB:rgba(59,122,87,0.14); --stAT:#2F6B4F;
--stDB:rgba(179,80,80,0.13); --stDT:#A34D4D;
--auAS:#3B7A57; --auASb:rgba(59,122,87,0.14); --auMD:#4E76A8; --auMDb:rgba(78,118,168,0.14);
--auLF:#8A6A33; --auLFb:rgba(176,133,64,0.16);
```
Accents: Preto `#191C1A`, Verde `#3B7A57`, Azul `#4E76A8`, Âmbar `#8A6A33` (texto `#FFFFFF`).

### 6.2 Batman (grafite escuro) — canopy `#1E211F #252927 #2D332F`
```css
--leaf:#82C99B; --desk:radial-gradient(120% 90% at 50% 0%, #1B1D1F 0%, #0B0C0D 62%);
--win:#141618; --panel:#101214; --panel2:#0C0E10; --border:#272B2E; --bsoft:rgba(255,255,255,0.05);
--text:#EAECEE; --text2:#A5ACB2; --muted:#61686E;
--sel:rgba(234,236,238,0.08); --hover:rgba(234,236,238,0.05);
--btn:#1B1E21; --btnB:#2D3134; --btnT:#C8CDD2; --badge:#262A2E; --badgeT:#AEB5BB; --input:#181B1D;
--l0:#82C99B; --l0bg:rgba(130,201,155,0.12); --l0bd:rgba(130,201,155,0.28);
--l1:#7FA6D9; --l1bg:rgba(127,166,217,0.12); --l1bd:rgba(127,166,217,0.28);
--l2:#D9A96B; --l2bg:rgba(217,169,107,0.13); --l2bd:rgba(217,169,107,0.30);
--tagbd:#31363A; --dhB:rgba(127,166,217,0.08); --dhT:#7FA6D9; --dcT:#8C9399;
--daB:rgba(130,201,155,0.10); --daT:#A9DDBC; --ddB:rgba(228,122,122,0.10); --ddT:#E4A3A3;
--stMB:rgba(217,169,107,0.14); --stMT:#DCBE93; --stAB:rgba(130,201,155,0.14); --stAT:#A9DDBC;
--stDB:rgba(228,122,122,0.14); --stDT:#E4A3A3;
--auAS:#82C99B; --auASb:rgba(130,201,155,0.15); --auMD:#7FA6D9; --auMDb:rgba(127,166,217,0.15);
--auLF:#D9A96B; --auLFb:rgba(217,169,107,0.15);
```
Accents: Branco `#EAECEE`, Amarelo `#E8C55A`, Azul `#7FA6D9`, Roxo `#B79AE0` (texto `#111315`).

### 6.3 Git Classic (preto + cores GitHub) — canopy `#12241A #16301F #1C3E26`
```css
--leaf:#3FB950; --desk:radial-gradient(120% 90% at 50% 0%, #10151B 0%, #010409 62%);
--win:#0D1117; --panel:#090C10; --panel2:#06080B; --border:#21262D; --bsoft:rgba(255,255,255,0.045);
--text:#E6EDF3; --text2:#9DA7B1; --muted:#6E7681;
--sel:rgba(63,185,80,0.12); --hover:rgba(230,237,243,0.05);
--btn:#161B22; --btnB:#30363D; --btnT:#C9D1D9; --badge:#21262D; --badgeT:#9DA7B1; --input:#0D1117;
--l0:#3FB950; --l0bg:rgba(63,185,80,0.13); --l0bd:rgba(63,185,80,0.34);
--l1:#58A6FF; --l1bg:rgba(88,166,255,0.13); --l1bd:rgba(88,166,255,0.32);
--l2:#F0883E; --l2bg:rgba(240,136,62,0.13); --l2bd:rgba(240,136,62,0.32);
--tagbd:#30363D; --dhB:rgba(88,166,255,0.09); --dhT:#58A6FF; --dcT:#8B949E;
--daB:rgba(86,211,100,0.11); --daT:#56D364; --ddB:rgba(248,81,73,0.11); --ddT:#F85149;
--stMB:rgba(240,136,62,0.15); --stMT:#F0A35E; --stAB:rgba(86,211,100,0.15); --stAT:#56D364;
--stDB:rgba(248,81,73,0.14); --stDT:#F85149;
--auAS:#3FB950; --auASb:rgba(63,185,80,0.16); --auMD:#58A6FF; --auMDb:rgba(88,166,255,0.16);
--auLF:#F0883E; --auLFb:rgba(240,136,62,0.16);
```
Accents: Verde `#3FB950`/`#04160A`, Azul `#58A6FF`/`#051020`, Laranja `#F0883E`/`#1A0D02`, Branco `#E6EDF3`/`#0D1117`.

### 6.4 Nipon (branco + sakura) — canopy `#E9D3DA #F0DEE4 #F5E7EB`
```css
--leaf:#D983A8; --desk:radial-gradient(120% 90% at 50% 0%, #F8F2F1 0%, #ECE2E1 70%);
--win:#FFFFFF; --panel:#FBF7F6; --panel2:#F6EFEE; --border:#EDE1E1; --bsoft:rgba(90,50,65,0.05);
--text:#241D1E; --text2:#6B5D5F; --muted:#A08F92;
--sel:rgba(201,108,147,0.10); --hover:rgba(201,108,147,0.055);
--btn:#FFFFFF; --btnB:#E4D4D6; --btnT:#4A3C3F; --badge:#F2E6E8; --badgeT:#6B5D5F; --input:#FFFFFF;
--l0:#C96C93; --l0bg:rgba(201,108,147,0.12); --l0bd:rgba(201,108,147,0.32);
--l1:#7E96C4; --l1bg:rgba(126,150,196,0.12); --l1bd:rgba(126,150,196,0.30);
--l2:#C0A05E; --l2bg:rgba(192,160,94,0.14); --l2bd:rgba(192,160,94,0.34);
--tagbd:#E0D0D2; --dhB:rgba(126,150,196,0.10); --dhT:#5A76A8; --dcT:#7D6F71;
--daB:rgba(93,158,110,0.11); --daT:#3F7B52; --ddB:rgba(190,86,100,0.10); --ddT:#AD4C5E;
--stMB:rgba(192,160,94,0.16); --stMT:#8F7433; --stAB:rgba(93,158,110,0.14); --stAT:#3F7B52;
--stDB:rgba(190,86,100,0.13); --stDT:#AD4C5E;
--auAS:#C96C93; --auASb:rgba(201,108,147,0.14); --auMD:#7E96C4; --auMDb:rgba(126,150,196,0.14);
--auLF:#8F7433; --auLFb:rgba(192,160,94,0.16);
```
Accents: Rosa `#C96C93`, Carvão `#241D1E`, Índigo `#7E96C4`, Dourado `#B98A3E` (texto `#FFFFFF`).

**Cores de branch:** modo `auto` usa `--l0/--l1/--l2` do tema; modo `vivid` substitui l1/l2 pelos pares `vivid` de cada tema (Clássico `#1F78E0/#E06A2B`, Batman `#4EA8FF/#FFA13F`, Git Classic `#58A6FF/#F0883E`, Nipon `#E0468F/#8A63D9`). Lanes >2 geram cores harmoniosas rodando o hue em OKLCH.

---

## 7. Tipografia

- **UI:** Instrument Sans. Corpo 13-13.5px, secundário 12-12.5px, títulos de ecrã 24px/700, títulos de secção 10-10.5px/700/letter-spacing 0.8-1.2px/UPPERCASE.
- **Mono:** JetBrains Mono — hashes (10.5-11px), branches, paths, diffs (11.5px), atalhos.
- **Marca:** Space Grotesk 600 — splash 52px, titlebar wordmark ~15px.
- Opções do utilizador: fonte da UI (Instrument/Sistema/Atkinson) e densidade (default/compacta).

---

## 8. Iconografia e desenho

Sem icon font. Ícones são SVG inline de traço fino (stroke 1-1.6, `currentColor`) ou glifos simples (⟳ ✕ →). O ícone de Definições é um anel pontilhado (`border: 2.5px dotted`). Semáforos macOS: 12px, `#FF5F57 #FEBC2E #28C840`.

---

## 9. ★ ANIMAÇÕES — especificação completa

**Esta é a secção mais importante do documento.** As animações são a identidade do produto. Implementar TODAS. 

### 9.0 Regras globais

- **Easing de assinatura:** `cubic-bezier(0.2, 0.9, 0.3, 1)` (saída rápida, assentamento suave — usado em pops, entradas de painéis, cartões). Fades usam `ease`; crescimento de traço usa `ease-out`.
- **Durações:** micro-interações 0.12-0.25s · entradas de conteúdo 0.22-0.5s · sequências (splash, onboarding) 2-2.5s · ambiente (floresta) 7-23s em loop.
- **Só compor `transform` e `opacity`** (GPU). Nunca animar layout (width/height/top) exceto `lineGrow` no splash.
- **Toggle global:** Definições → Aparência → «Animações decorativas» (estado `anims`). Quando OFF: floresta estática (sem sway, sem folhas a cair), sem folhas efémeras, sem flash de tema, sem letterHop. Entradas/fades funcionais mantêm-se. Respeitar também `prefers-reduced-motion` do SO como default inicial.
- Em React: animações de entrada disparam por montagem (`animation … both`); re-disparo em re-render evita-se mantendo `key` estável. O flash de tema usa o truque A/B (§9.8).

### 9.1 Biblioteca de keyframes (copiar tal e qual)

```css
/* crescimento da árvore do grafo */
@keyframes vineDraw { from { stroke-dashoffset: 1; } to { stroke-dashoffset: 0; } }   /* com pathLength:1 + stroke-dasharray:1 */
@keyframes nodePop  { from { transform: scale(0); } to { transform: scale(1); } }
@keyframes leafPop  { 0% { transform: scale(0) rotate(-50deg); } 70% { transform: scale(1.15) rotate(3deg); } 100% { transform: scale(1) rotate(0deg); } }

/* entradas genéricas */
@keyframes fadeIn  { from { opacity: 0; } to { opacity: 1; } }
@keyframes fadeUp  { from { opacity: 0; transform: translateY(7px); } to { opacity: 1; transform: none; } }
@keyframes popIn   { from { opacity: 0; transform: scale(0.94) translateY(8px); } to { opacity: 1; transform: none; } }
@keyframes winIn   { from { opacity: 0; transform: scale(0.965) translateY(14px); } to { opacity: 1; transform: none; } }
@keyframes fileIn  { from { opacity: 0; transform: translateX(-8px) scale(0.98); } to { opacity: 1; transform: none; } }

/* splash */
@keyframes splashSeq { 0% { opacity: 1; } 72% { opacity: 1; } 100% { opacity: 0; } }
@keyframes logoIn    { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: none; } }
@keyframes letterL   { from { opacity: 0; transform: translateX(16px) scale(0.85); } to { opacity: 1; transform: none; } }
@keyframes letterR   { from { opacity: 0; transform: translateX(-16px) scale(0.85); } to { opacity: 1; transform: none; } }
@keyframes letterHop { 0% { opacity: 1; transform: none; } 45% { transform: translateY(-14px); opacity: 1; } 100% { transform: translateY(10px); opacity: 0; } }
@keyframes lineGrow  { from { width: 0; } to { width: 120px; } }

/* onboarding */
@keyframes obFade { from { opacity: 1; transform: scale(1); } to { opacity: 0; transform: scale(1.05); } }

/* tema */
@keyframes themeSwapA { 0% { opacity: 0.45; } 100% { opacity: 1; } }
@keyframes themeSwapB { 0% { opacity: 0.45; } 100% { opacity: 1; } }

/* folhas */
@keyframes fxFall { 0% { transform: translateY(0) rotate(0deg); opacity: 0; } 12% { opacity: 0.9; }
                    100% { transform: translateY(340px) translateX(-18px) rotate(230deg); opacity: 0; } }
@keyframes sway     { from { transform: rotate(-1.1deg); } to { transform: rotate(1.4deg); } }
@keyframes leafFall { 0% { transform: translate(0, -6vh) rotate(0deg); opacity: 0; } 10% { opacity: 0.75; }
                      55% { transform: translate(26px, 48vh) rotate(160deg); } 88% { opacity: 0.65; }
                      100% { transform: translate(-14px, 106vh) rotate(330deg); opacity: 0; } }

/* feedback */
@keyframes toastIn  { from { opacity: 0; transform: translateX(-50%) translateY(10px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }
@keyframes notifIn  { from { opacity: 0; transform: translateX(28px) scale(0.97); } to { opacity: 1; transform: none; } }
@keyframes spin     { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
@keyframes recPulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.45; } }
@keyframes winMinimize { 0% { transform: none; opacity: 1; } 45% { transform: translateY(64px) scale(0.86); opacity: 0; }
                         60% { transform: translateY(64px) scale(0.86); opacity: 0; } 100% { transform: none; opacity: 1; } }
```

### 9.2 Crescimento da árvore do grafo (a animação central)

Quando o histórico monta (abrir repo, mudar de tab, voltar ao Histórico) a árvore **desenha-se de cima para baixo**:

1. **Ramos (`vineDraw`)** — cada aresta é um `<path>` SVG com `pathLength: 1; stroke-dasharray: 1` animado com `vineDraw 0.8s ease-out {delay}s both`. Delay por linha: `min(i * 0.045, 0.6)` s (i = índice do commit, cap a 0.6s). Segmentos de merge/fork ganham `+0.1s`.
2. **Nós (`nodePop`)** — círculo por commit: `nodePop 0.35s cubic-bezier(0.2,0.9,0.3,1) {delay+0.25}s both`, `transform-origin: center` (`transform-box: fill-box`). Commits normais r=4.5 contorno 2px preenchimento `--win`; merges r=3.3 preenchidos.
3. **Folhas (`leafPop`)** — nas pontas de branch e espalhadas: `leafPop 0.5s {delay+~0.3}s both`, `transform-origin: left center`. No estilo Sakura são flores de 5 pétalas com `nodePop`; no Tropical folhas de palmeira compridas + cocos (`nodePop` com +0.3/+0.38s).
4. **Forma orgânica dos ramos:** troços verticais são Béziers ondulados (amplitude ±2.6px alternante por segmento, período = rowH); merges enrolam-se para dentro do tronco com curva S.

**Novo commit:** o novo nó entra no topo com a mesma cascata (vine + pop + folha) e cai uma folha efémera (§9.6). **Estilos de árvore:** Clássica (folha simples), Sakura (flores, tronco `--trunk` rosado), Tropical (palmeira + cocos), Ramificação (grafo git puro: círculos `nodePop`, sem folhas).

### 9.3 Splash (2.05s, timeline exata)

Overlay `position: fixed`, fundo `--desk`, floresta decorativa (§9.5) atrás.

| t (s) | evento |
|---|---|
| 0 | wrapper `logoIn 0.4s` (scale 0.9→1 + fade) |
| 0 → ~0.9 | árvore-S do logo desenha-se (troncos com `vineDraw`, folhas `leafPop` em cascata) |
| 0.68/0.78/0.88(/0.98) | letras entram para os lados: `t←`,`y→` 0.68 · `i←`,`l→` 0.78 · `g←`,`v→` 0.88 · `a→` 0.98 — `letterL/letterR 0.32s ease both` |
| ~1.1 | linha `lineGrow 0.35s` (0→120px) + tagline `fadeUp` |
| 1.5-1.68 | letras saltam e caem: `letterHop 0.42s` staggered de fora para dentro (t/y 1.5 · i/l 1.56 · g/v 1.62 · a 1.68) — fica só a árvore-S |
| 2.05 | overlay some: `splashSeq 2.05s` (opacity 1 até 72%, depois →0); desmontar no fim |

### 9.4 Onboarding

- Painel esquerdo: árvore-S que **cresce por estágios** com o progresso (172×229 → 208×277 → 250×333). Cada estágio redesenha com `vineDraw`/`leafPop` em cascata (~0.9s). Legendas: «o teu jardim de commits» → «a árvore cresce contigo» → «floresta plantada».
- Ecrãs à direita entram com `fadeUp 0.45s ease 0.25s both`.
- Botões de login: estado `connecting` com spinner `spin 0.8s linear infinite` (~1.2s simulado).
- Saída: `obFade 0.55s` (fade + scale 1.05) aos 1.9s do estágio final; aos 2.45s navega para «Adicionar repositório» + notificação de boas-vindas.

### 9.5 Floresta decorativa (ecrãs de entrada: splash, onboarding, Adicionar repositório)

Camada `position: absolute; inset: 0; z-index: 0; pointer-events: none; overflow: hidden` DENTRO do ecrã (a app já não tem fundo atrás da janela).

- **4 ramos (boughs)** nos cantos: caminhos Bézier com `stroke-width: 7`, cor `canopy[0]`, 11-17 folhas cada distribuídas ao longo da curva com jitter determinístico (seeded random `R(n) = fract(sin(n·127.1+311.7)·43758.5453)` — mesmo layout em todas as execuções). Folhas: escala 0.9-2.4, rotação aleatória, cores `canopy[1..2]` com 1 em cada 5 em `--leaf` a 55% de opacidade.
- Cada ramo **balança**: `sway {7.5|9|8.2|9.6}s ease-in-out infinite alternate` com `transform-origin` na base do ramo (rotação -1.1° → 1.4°).
- **4 folhas a cair** em loop: left 18/40/63/84%, `leafFall {15 + R(i)·8}s linear {i·4.5}s infinite`.
- Posições dos SVGs: top-left 620×360 (-30,-24) · top-right 560×320 (-30,-30) · bottom-left 420×260 (-24,-30). Com `anims` OFF: ramos estáticos, zero folhas a cair.
- No ecrã «Adicionar repositório», o conteúdo (header de tabs e a coluna central) fica em `z-index: 1` por cima da floresta.

### 9.6 Folhas efémeras (feedback de atividade Git)

`spawnLeaf()` — folha SVG 16×12 cai dentro da janela a partir de `top: 52px`, `left: 18-82%` aleatório, `fxFall 2.4s ease-in both`, removida do estado após 2600ms. Ignorada se `anims` OFF. **Disparar em:** commit criado, fetch concluído, mudança de tab de repo, pull/push concluído, stash. É o "batimento cardíaco" da app — cada ação Git faz a natureza reagir.

### 9.7 Fetch / operações remotas

- Ícone ⟳ do botão Fetch: `spin 0.8s linear infinite` enquanto `refreshing`; label muda «Fetch» → «A buscar…». No protótipo o fetch simulado demora 1400ms; na app real, animar enquanto o comando corre.
- Ao concluir: `spawnLeaf()` + notificação (§9.9) + badge de commits behind.

### 9.8 Flash de troca de tema

Ao mudar tema/accent/estilo de árvore/cor de branch: o elemento raiz corre `themeSwap{A|B} 0.4s ease` (opacity 0.45→1). A e B são keyframes idênticos — **alternar entre eles a cada mudança** (via contador `themeTick++`) força o browser a re-disparar a animação. Skip se `anims` OFF.

### 9.9 Entradas de conteúdo e feedback

- Vista principal ao arrancar: `winIn 0.5s cubic-bezier(0.2,0.9,0.25,1)`.
- Troca de vista (Histórico/Definições/Picker): `fadeIn 0.25s` no contentor; blocos internos `fadeUp 0.3-0.45s` com delays 0.05-0.25s.
- Listas de ficheiros/repos: cada linha `fileIn 0.22s cubic-bezier(0.2,0.9,0.3,1) both` (cascata: delay `i·20-30ms`, cap ~0.3s).
- Modais: `popIn 0.25s` + backdrop `fadeIn`; menus/dropdowns `popIn 0.16-0.2s`.
- Toast (rodapé, centrado): `toastIn 0.3s`, auto-dismiss ~2.6s. Notificações (canto sup. direito, título+corpo+cor de acento): `notifIn 0.35s`, empilháveis, dismiss ~5s.
- Minimizar (protótipo): `winMinimize 0.8s` (desce+encolhe+some e volta). Na app nativa usar o minimize do SO; manter como easter egg se frameless.
- Gravação/pulso (ex. REC de screen sharing nas definições): `recPulse 1.6s infinite`.
- Hovers: `transition: background 0.12-0.15s ease`, cartões também `transform 0.15s` (`translateY(-1px)`).

### 9.10 Checklist de QA das animações

- [ ] Árvore desenha-se ao abrir repo e ao voltar ao Histórico; novo commit cresce no topo.
- [ ] Splash: letras entram, saltam e caem; árvore-S fica; fade global aos 2.05s.
- [ ] Onboarding: árvore cresce 3 estágios; saída obFade.
- [ ] Floresta: sway contínuo + folhas em loop nos 3 ecrãs de entrada; determinística.
- [ ] Folha efémera em commit/fetch/pull/push/troca de tab.
- [ ] Flash 0.4s em qualquer mudança de aparência, sempre re-dispara.
- [ ] Toggle «Animações decorativas» OFF mata: sway, folhas (loop + efémeras), flash, letterHop. `prefers-reduced-motion` respeitado.
- [ ] 60fps com repo de 10k commits (virtualizar a lista; animar só as ~30 linhas visíveis).

---

## 10. Ecrãs e componentes (inventário)

- **Titlebar (50px, 1 linha):** controlos por SO · wordmark · seletor de repositório (ABERTOS/FIXADOS/RECENTES; estrela = fixado; menu «…» por repositório: fixar, mostrar no explorador, copiar caminho, fechar) · «+» abre a página Adicionar · Pull/Push/Fetch com badges ↓/↑ (<1100px agrupam num botão Sync com menu) · Pesquisa (Ctrl+K no Windows/Linux, ⌘K no macOS) · Terminal · Definições.
- **Sidebar:** Branches (com ahead/behind), Tags, Remotes, Stashes; secções colapsáveis; redimensionável.
- **Histórico:** nó fixo «Alterações por commitar» no topo (contagem, mini staging, diff) + grafo-árvore com linhas de commit (hash mono, msg, chips de branch/tag, autor com avatar de iniciais coloridas, tempo relativo, ±adds/dels).
- **Detalhe do commit:** metadados, chips, ficheiros alterados (M/A/D coloridos), diff com linhas +/− coloridas e números de linha. O diff é recolhível («Ocultar diff ▾»/«Mostrar diff ▸», 36px, `aria-expanded`): aberto por defeito ≥980px de janela, fechado abaixo; a escolha manual prevalece na sessão e persiste por repositório; clicar num ficheiro seleciona-o e abre o diff. Um «✕» separado fecha o painel de detalhe inteiro — reabre ao selecionar um commit.
- **Ações contextuais (não existe barra inferior):** Commit vive na Cópia de trabalho e no nó «Alterações por commitar»; Tag, Revert e «Branch daqui» no detalhe do commit (avançadas no menu «…», destrutivas separadas por divisor e a vermelho, com confirmação); Checkout sempre visível na branch selecionada (+hover nas restantes) e «Merge em [atual]» na branch selecionada; «Guardar stash…» no cabeçalho da Cópia de trabalho e «Criar stash» no ecrã Stashes; tudo também acessível pela palette Ctrl+K.
- **Modais:** commit, pull, push, branch (com checkout), merge, stash, tag, discard (destrutivo em vermelho), terminal, palette ⌘K.
- **Adicionar repositório:** tabs Local/Remoto/Clonar/Adicionar/Criar; lista com avatares, badges «aberto»/«N alterações», branch, path; pesquisa; floresta de fundo.
- **Definições (11 categorias):** Aparência (tema, accent, fonte, densidade, estilo de árvore, cor de branches, animações), Git, Commits, Push & Pull, Atalhos (padrões dinâmicos por SO: Ctrl+… no Windows/Linux, ⌘… no macOS), Chaves SSH, Notificações, Idioma, Avançado, Limpeza, Contas.

---

## 11. Estado e persistência

O protótipo persiste em `localStorage` (`gitsylva-floresta-prefs`); na app nativa usar ficheiro de config (JSON) equivalente: `theme, accentIdx, fontKey, density, treeStyle, branchColor, anims, git (name/email/opções), accounts, diffPref (estado aberto/fechado do diff, por repositório), pinned (repositórios fixados), sbW, detailW, wcW, wcLayout, editorKey, onboard`. Estado efémero (nunca persistir): `fxLeaves, refreshing, modal, sel, view, themeTick`.

## 12. Ações UI → Git

Commit → `git commit` (staging por ficheiro: `git add/reset -- <path>`) · Pull → `git pull origin <branch>` · Push → `git push` (badge = ahead) · Fetch → `git fetch origin` (badge = behind) · Branch → `git branch` + checkout opcional · Merge → `git merge <from>` · Stash → `git stash push/pop` · Tag → `git tag <name> <hash>` · Descartar → `git checkout -- <paths>` (confirmação destrutiva) · Clonar → `git clone <url> <path>` com progresso.

Cada operação concluída: notificação + folha efémera (§9.6). Falhas: notificação com cor `--ddT`, sem folha.

## 13. Ordem de implementação sugerida

1. Shell + titlebar custom + sistema de temas (CSS vars) + persistência.
2. Grafo-árvore estático a partir de repo real (lanes, Béziers ondulados) → depois animação de crescimento (§9.2).
3. Histórico + detalhe (com diff recolhível) + staging + ações contextuais + modais.
4. Splash + onboarding + floresta (§9.3-9.5).
5. Folhas efémeras, flash de tema, toasts/notificações (§9.6-9.9).
6. Definições completas + atalhos + ⌘K.
7. QA de animações (§9.10) + performance com repos grandes.
