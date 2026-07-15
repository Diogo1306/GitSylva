# Anexo 3 — Pesquisa ⌘K · Definições · Atalhos · Notificações · Idioma (3.12, 3.13, 3.18-3.20)

## Pesquisa ⌘K (`CommandPalette.tsx`)
- **✅** Abrir/fechar/teclado OK (`CommandPalette.tsx:164-169`, `AppShell.tsx:43`); dados REAIS (useLog/useBranches/useStatus) e ações reais (checkout, selectedFile, focusCommit, switchRepo); empty state (`:207-209`); limite slice(0,6) + scroll (`:184`).
- **S1 🔴 P2** — Pesquisa NÃO insensível a diacríticos (`:15,45` — `toLowerCase().includes`): "historia" não encontra "Histórico". Correção: `.normalize("NFD").replace(/\p{Diacritic}/gu,"")` em ambos os lados + em `markMatch`.
- **S2 🟠 P2** — Falta grupo de AÇÕES git na paleta (commit/push/pull/fetch/stash/branch/tag — design `Floresta.dc.html:2621-2624`). Hoje só REPOSITÓRIOS/BRANCHES/FICHEIROS/COMMITS/IR PARA (`:117-122`).
- **S3 🟡 P3** — Highlight só no `label` e 1.ª ocorrência; match por caminho/hash/autor mostra resultado sem realce (`:13-24,88-105,200`).
- **S4 🟡 P3** — Query vazia num repo vazio mostra `Sem resultados para ""`.
- **S5 🟡 P3** — ⌘K não faz toggle (abre sempre — `AppShell.tsx:43-46`).

## Definições
**Ligados de verdade:** Aparência completa (tema/árvore/branches/anims/accent/layout/fonte → `savePrefs` + `useApplyTheme`; export/import com validação), GitIdentity (real, com useIdentity inicial + botão disabled sem alteração), Commits→confirmDiscard (consumido em `WorkingCopy.tsx:193`/`Titlebar.tsx:110`), PushPull→pullMode (lido em call-time `queries.ts:252`), Limpeza (clearRecents + resetPrefs com ConfirmDialog). Scroll-spy OK (`Settings.tsx:34-49`). Stubs honestos "Em breve": Contas, Git·Editor, SSH, Avançado.

- **S6 🔴 P1** — Secções **Notificações** e **Idioma** NÃO existem (nem stub) — NAV `Settings.tsx:14-24`. Design previa ambas (README:63; Floresta:3210).
- **S7 🟠 P2** — GitIdentity sem validação de email (`GitIdentity.tsx:36,42`) e sem `onError` no save.
- **S8 🟡 P3** — Secção órfã `set-git-extra` fora do NAV/scroll-spy (`Settings.tsx:92`).
- **S9 🟠 P3** — Sem pesquisa de definições (inexistente).
- **S10 🟡 P3** — Prefs persistidas mortas: `density` (`themeStore.ts:22,38`) e `language` (`:24,40`) — nenhum componente as lê.

## Atalhos (`Shortcuts.tsx`)
- **✅** Cheat-sheet honesto ("Regravar em breve", `:3-5,55,57`); plataforma correta (Ctrl no Windows, `:6-7`); atalhos listados batem com os implementados (⌘K `AppShell.tsx:43`; palette `CommandPalette.tsx:165-168`; setas History `History.tsx:248-254`); setas filtram INPUT/TEXTAREA (`History.tsx:241-244`); não há atalhos de uma letra → sem risco ao escrever mensagens.
- **S11 🟠 P2** — Cheat-sheet promete "Esc fechar" em diálogos mas `Modal.tsx`/`ConfirmDialog.tsx` NÃO tratam Escape (só menus — `ContextMenu.tsx:9-11`). Adicionar handler Escape.

## Notificações/Toasts (`toastStore.ts`, `Toaster.tsx`)
- **S12 🔴 P1** — Sem dismiss manual; TUDO desaparece em 2,6s (`toastStore.ts:19`; `Toaster.tsx:8` pointerEvents:none). `dismiss` do store é código morto. Erros de conflito somem antes de lidos.
- **S13 🟠 P2** — Sem variantes success/warning/error/progress (`toastStore.ts:3` só `{id,text}`) — erro e sucesso idênticos.
- **S14 🔴 P2** — Sem `aria-live`/`role` (0 ocorrências no projeto) — leitores de ecrã não anunciam.
- **S15 🔴 P2** — Sem secção/preview de notificações nas definições (parte de S6).
- **S16 🟡 P3** — Comentário do Toaster diz gated por anims mas falta `data-decor-anim` no div (`Toaster.tsx:4-5`).

## Idioma/i18n
- **S17 🔴 P2 (esforço grande)** — Sem infraestrutura i18n (0 grep i18next/useTranslation); ~120 ocorrências de acentos PT em 24 ficheiros + 67 literais UI PT em 16 .tsx. Estratégia: catálogo central, provider, ligar ao seletor. NÃO fazer traduções parciais.
- **S18 🔴 P2** — Pref `language` totalmente inerte (persistida, nunca lida, sem UI, sem "Em breve") — `themeStore.ts:12,24,40,55`. No mínimo: StubSection "Idioma — Em breve" ou remover a chave.
