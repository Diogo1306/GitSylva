# Anexo 5 — Cópia de trabalho · Commits · Stashes (3.7, 3.8, 3.9)

Área de RISCO DE PERDA DE DADOS. Backend: `git status --porcelain=v2 -z` (boa escolha para espaços/acentos).

## P0/P1 — perda de dados e conflitos invisíveis
- **W1 🔴 P0** — `discardAll` da WorkingCopy destrói também alterações PREPARADAS de ficheiros parcialmente staged: itera `unstaged` e chama `discard_file` → `git restore --staged --worktree` (`WorkingCopy.tsx:151-156` + `stage.rs:26`). Um `AM`/`MM` perde a parte staged; a confirmação só fala de "não preparadas". Correção: `restore --worktree` sem `--staged`, ou usar o comando `discard_all` (que já é correto).
- **W2 🔴 P0** — Entradas `u` (conflito) silenciosamente descartadas pelo parser (`status.rs:29-64`, braço `_ => {}` na :63): ficheiros UU invisíveis nas listas. Fora de merge/rebase (stash apply, cherry-pick, revert) o `conflict_state` não deteta (`conflict.rs:20-21` só MERGE_HEAD/rebase-*) → conflito totalmente invisível. Correção: tratar `'u'` no parser + estado visual `conflicted`.
- **W3 🔴 P0** — Drop de stash SEM confirmação (`Stashes.tsx:51-62` → `git stash drop` irreversível num clique). Correção: ConfirmDialog.
- **W4 🟠 P1** — Stash apply com conflito: aplica COM marcadores mas a UI diz "não foi possível aplicar" (falso), nada é invalidado (só onSuccess invalida), ficheiros invisíveis (W2) — `stashes.rs:62`, `Stashes.tsx:39-50`, `queries.ts:172`. Correção: distinguir exit-code de conflito, invalidar queries, mostrar unmerged.

## P2
- **W5 🟠** — Duas implementações divergentes de "Descartar tudo": Titlebar usa `discard_all` Rust (correto: `restore --worktree .` + `clean -fd`, mantém staged); WorkingCopy usa loop por-ficheiro (destrói staged + `clean -f` sem `-d`). Unificar na WorkingCopy → `discard_all`.
- **W6 🟠** — `discard_file(untracked)` usa `clean -f` sem `-d` (`stage.rs:22-24`): diretórios untracked ficam.
- **W7 🟡** — Sem descarte individual por ficheiro na UI (o `actions.discard` só é usado no loop).
- **W8 🟠** — Ações de ficheiro ausentes: abrir, mostrar no explorador (sem comando Rust reveal), copiar path, refresh local (FileRow sem onContextMenu).
- **W9 🟡** — Diff de untracked vem vazio (`diff.rs:5-13` — git diff não mostra novos): "Sem alterações textuais." para ficheiro novo com conteúdo. Correção: `git diff --no-index /dev/null file`.
- **W10 🟠** — Amend não pré-carrega a mensagem anterior (`WorkingCopy.tsx:109,253`): reescrever obrigatório; corpo do commit anterior descartado silenciosamente por `--amend -m`.
- **W11 🟠** — Amend sem aviso se o commit já foi pushed (sem verificação de `@{u}` no fluxo).
- **W12 🟠** — `create_stash` sem `-u` (`stashes.rs:39-58`): untracked ficam fora do stash sem indicação. Modal só oferece "Incluir preparadas" (`--keep-index` — mapeamento correto).
- **W13 🟡** — Lista de ficheiros sem virtualização + `fileIn` por linha (`WorkingCopy.tsx:51,203-230`): jank com 1000+ ficheiros.
- **W14 🟡** — Em erro de stage/discard nada é invalidado → stale (`queries.ts:274-283`); loop discardAll dispara N invalidações (thundering herd).

## P3
- **W15** — Sem "descartar hunk" na UI (Rust suporta `cached:false, reverse:true`; `WorkingCopy.tsx:329` só chama cached).
- **W16** — Sem `git stash pop` (só apply+drop); sem preview do conteúdo do stash.
- **W17** — Deteção "No local changes to save" frágil a git localizado (`stashes.rs:51-56`).
- **W18** — Empty state da working copy pobre ("NÃO PREPARADAS · 0" sem mensagem "Tudo limpo").
- **W19** — Confirmações não enumeram untracked que serão APAGADOS do disco (`WorkingCopy.tsx:341`, `Titlebar.tsx:311`).
- **W20** — Com `confirmDiscard` off, discard sem qualquer diálogo (default é seguro=true).
- **W21** — Erros de hook/identidade mostrados crus (inglês) — mapear para PT + link Settings.

## ✅ Sólidos
Parser de renames/copies correto ('2' com orig_path do campo NUL seguinte — `status.rs:41-52`); parcialmente staged nas duas listas com diff certo (`WorkingCopy.tsx:132-133`); per-hunk staging válido via `git apply --cached` stdin, testado (`hunks.ts:7-22`, `hunk.rs:51-95`); validações de commit (msg vazia frontend+backend, sem staged exceto amend); invalidação pós-commit; keep-index mapping correto; empty state de stashes amigável; parse de `stash@{N}` correto.
