# Anexo 2 — Repositórios: abrir/tabs/grupos/persistência (3.4)

Fluxo verificado: UI → `useOpenRepo` → `lib/api.ts` → Rust `git::repo::{open_repo,init_repo,clone_repo}` → `run_git`. Estado: `appStore` (`gitsylva-open-repos`), `recentsStore` (`gitsylva-recents`), `themeStore` (`gitsylva-prefs`: repoLayout).

## P1
- **R1 🟠 P1** — Estado transitório da WorkingCopy vaza entre repos: `<Screen/>`/`<WorkingCopy/>` sem `key={repo.path}` (`AppShell.tsx:78`), logo `msg`, `amend`, `sel` (useState em `WorkingCopy.tsx:107-109`) sobrevivem à troca. Cenário destrutivo: amend ativado no repo A + switch para B + commit → **reescreve HEAD do repo B com a mensagem do A**. Correção: `key={repo.path}` no Screen. (Nota: `switchRepo` limpa `selectedFile` no store `appStore.ts:66`, mas não o estado local.)

## P2
- **R2 🟠 P2** — Erros renderizam `[object Object]`: `String(error)` sobre `{code,message}` do invoke (`History.tsx:270`, `WorkingCopy.tsx:129`). Repo vazio (`git log` falha "does not have any commits yet") cai neste ramo em vez do empty state "Sem commits ainda." — `is_empty` existe no backend (`repo.rs:28-29`) mas o frontend não o usa.
- **R3 🟠 P2** — Repos persistidos não revalidados no arranque (`App.tsx:22` + `appStore.ts:105-110`): repo apagado do disco → painéis com erro cru, tab permanece sem indicação. Correção: revalidar com `open_repo` no rehydrate.
- **R4 🟡 P2** — `open_repo` não normaliza para o toplevel (`repo.rs:14-36`): abrir subpasta passa a validação, nome errado, repo duplicado (raiz vs subpasta). Correção: `rev-parse --show-toplevel`.
- **R5 🟡 P2** — Grupos só existem no modo rail; no modo tabs ficam invisíveis e ingeríveis (`Titlebar.tsx:170-220` lista plana vs `RepoRail.tsx:55-112`).

## P3
- **R6 🟡** — `setCurrent` patcha o repo ATIVO em vez do repo da operação (`queries.ts:104-108`) — checkout do repo A a resolver depois de alternar para B sobrescreve a branch do B. Correção: resolver por `path`.
- **R7 🟡** — Tabs do Titlebar `overflow:hidden` sem scroll (`Titlebar.tsx:170`) — com muitos repos, tabs inacessíveis.
- **R8 🟡** — Nomes duplicados indistinguíveis (basename sem `title`/path — `Titlebar.tsx:173`, `RepoRail.tsx:34`).
- **R9 🟡** — Sem normalização de path (`\` vs `/`, trailing slash, case Windows) → dedup falha, repo duplicado (`repo.rs:65-68` join com `/`; dialog Windows devolve `\`).
- **R10 🟡** — Bare repo: mensagem enganadora "not a git repository" (`repo.rs:16-22`); detetar `--is-bare-repository`.
- **R11 🟡** — `current_branch` do RepoInfo obsoleto após reinício (tab/rail mostram branch antiga se mudou externamente — `Titlebar.tsx:166,196`, `RepoRail.tsx:46`).
- **R12 🧹** — Stores persistidos sem `version`/`migrate` (`appStore.ts:105`, `recentsStore.ts:41`, `themeStore.ts:76`).
- **R13 ⚠️ P3** — Sem tratamento de caminho longo Windows >260 (`mod.rs:27-38`); limitação a documentar.
- **R14 🧹 P3** — Sem DnD/reordenação/cor escolhível de grupos (auto `length % 3`, `appStore.ts:83`); menus funcionam.
- **R15 🟡 P3** — Cor do dot do repo usa índice global (`RepoRail.tsx:43` `var(--l${i%3})`), não a cor do grupo.
- **R16 🟡 P3** — Recente inexistente: tratado sem crash (`useOpenRepo.ts:26-38`), mas podia auto-remover/assinalar.
- **R17 🟡 P3** — Seleção de commit da History persiste ao trocar de repo (`History.tsx:225,273`) — fallback seguro ao 1.º commit, sem fuga.

## ✅ Sólidos
react-query keyed por `path` (sem race A→B — `queries.ts:47-58`); fechar/reabrir/alternar corretos (`appStore.ts:63-80`, reativa em vez de duplicar); remover recente não toca no disco (`recentsStore.ts:37`); CRUD de grupos + persistência de collapse testado (`appStore.test.ts:12-45`); clone/init validados; `GIT_TERMINAL_PROMPT=0` evita hangs.
