# Anexo 1 — Branding + Splash/Onboarding (3.1, 3.2)

## Branding

- **B1 🧹/🟡 P2** — Wordmark "git🌳ylva" recriado à mão em 3+ sítios com números mágicos (`Titlebar.tsx:141-157` fontSize 17/size 14; `OpenRepo.tsx:38-45` fontSize 30/size 26; `Onboarding.tsx:34-45` splash 52px). Correção: extrair componente `Wordmark` partilhado.
- **B2 🟠 P3** — No onboarding o nome é texto puro "gitsylva" sem a marca árvore-S (`Onboarding.tsx:90`), inconsistente com titlebar/welcome.
- **B3 🔴 P2 (P1 pré-release)** — Ícone da app Tauri é o DEFAULT do template (teal/amarelo) — `src-tauri/icons/*` referenciados em `tauri.conf.json:32-38`. Gerar ícones da árvore-S (`tauri icon`).
- **B4 🔴 P2** — `public/favicon.svg` é placeholder roxo (`#863bff`), não a marca (referenciado em `index.html:6`).
- **B5 ⚠️ P1 (pré-distribuição)** — `identifier` Tauri ainda é `com.tauri.dev` (`tauri.conf.json:5`). Afeta paths de dados, updater, assinatura.
- **B6 ✅** — `TreeLogo` centralizado e theme-aware (`TreeLogo.tsx:212` params size/animated/crop/xScale/treeStyle; usa `--l0/--leaf/--trunk/--win`; morfa por estilo `:109-171`). Ponto forte.
- **B7 🧹 P3** — Glifos de folha/nó re-desenhados fora do TreeLogo (`Appearance.tsx:39-70` TreeIcon; `FallingLeaves.tsx:20-36` Mark). 3 sítios com a forma por estilo.
- **B8 🧹 P3** — Animação "floresta a balançar" anunciada mas inexistente: keyframe `sway` (`tokens.css:156`) e gating `data-decor-anim` (`tokens.css:170`) mortos — nenhum componente os usa. A copy do toggle promete 3 efeitos, só 2 existem (`Appearance.tsx:151`).

## Onboarding

Fluxo real: splash → login → setup (tema/árvore/branches) → grow → finish (`Onboarding.tsx:9`).

- **O1 ✅** — Splash existe e auto-avança 2050ms (`Onboarding.tsx:54-61`); sem anims arranca em login (intencional).
- **O2 ✅/🟠 P3** — OAuth honesto: badge "Em breve" + toast, sem fingir sucesso (`Onboarding.tsx:101-115`) — o protótipo é que fingia (`Floresta.dc.html:2716`). Melhorar: cartões continuam com cursor:pointer, parecem funcionais.
- **O3 🔴 P2** — Passo "NOVIDADES" do design ausente (design `Floresta.dc.html:1110-1131`: 3 cartas empilhadas + dots + "próximo →"). Implementação salta da paleta de branches para os botões (`Onboarding.tsx:122-190`).
- **O4 🟠 P3** — Sem "voltar atrás" entre passos (transições só forward, `Onboarding.tsx:116,182,185`).
- **O5 🧹/🟠 P3** — "Saltar" e "Plantar e entrar" são funcionalmente idênticos (ambos `setPhase("grow")`, `:182,185`).
- **O6 🟡 P3** — Personalização aplica-se global e imediatamente via `savePrefs` sem caminho de reverter/cancelar (`Onboarding.tsx:136,156-158,172`).
- **O7 ✅** — Persistência correta: `gitsylva-prefs` + `gitsylva-onboard` (`onboardStore.ts:12-20`; `App.tsx:13,16`); não reaparece.
- **O8 🟡 P3** — "Rever ecrã de boas-vindas" só faz `set({onboarded:false})` (`onboardStore.ts:17`), não faz reset das prefs (`resetPrefs` existe em `themeStore.ts:74` mas não é chamado). Decidir semântica.
- **O9 ✅** — Sem spinners/erros falsos; caminho local real → OpenRepo.
