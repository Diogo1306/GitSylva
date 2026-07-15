# Anexo 6 — Operações Git + Conflitos (3.10, 3.11)

Base: `run_git` com `GIT_TERMINAL_PROMPT=0` + `GIT_EDITOR=true` (sem hangs ✅); stderr verbatim ao utilizador ✅; `code` sempre `"git_failed"` (não distingue conflito — P2).

## P0/P1
- **G1 ⚠️ P0** — `reset --hard` SEM confirmação: item de menu dispara imediato (`History.tsx:336`, `danger:true` só pinta vermelho). Perde working tree + commits sem aviso. Correção: ConfirmDialog obrigatório.
- **G2 🔴 P1 (#C2)** — Conflito de CHERRY-PICK totalmente invisível: `CHERRY_PICK_HEAD` não é detetado (`conflict.rs:20-21`), banner `null`, UU invisíveis (W2), sem `cherry-pick --continue/--abort` (`conflict.rs:49-65` só merge|rebase). Idem `REVERT_HEAD`.
- **G3 🟠 P1 (#C5)** — Nada é invalidado quando uma operação conflitua (merge/cherry-pick/rebase só têm `onSuccess: refresh` — `queries.ts:124,149-150`): pós-conflito a UI fica congelada até focus.
- **G4 🟠 P1** — Fetch automático do PullModal engole erros (`Modals.tsx:213` sem onError) → mostra **"Nada para integrar. Estás em dia."** com rede/auth em baixo. Falso positivo.

## P2
- **G5 🟠 (#C4)** — Banner de conflito só existe na Working Copy (`WorkingCopy.tsx:169`): merge em curso invisível nos outros ecrãs. Elevar ao AppShell/ActionBar.
- **G6 🟠 (#C6)** — Query `"conflict"` fora dos `refresh` de branch/rewrite/sync actions (`queries.ts:99-103,139-143,244-248`): banner não reavalia após operações.
- **G7 🟠** — Duplo-submit: Branch/Tag/Pull/Push modais sem guarda `isPending` (`Modals.tsx:36,69,77,227-236,258-267`); Merge tem (`:169`). Dois cliques = duas operações.
- **G8 🟠** — Sem lock/serialização de operações de escrita por repo (`mod.rs:27`): colisões `index.lock` possíveis.
- **G9 🟠** — Apagar branch: ✕ imediato sem confirmação (`Sidebar.tsx:187-199`); usa `-d` seguro (não-merged falha) mas sem caminho `-D` com aviso.
- **G10 ⚠️** — Rebase sem confirmação (`Sidebar.tsx:290`, `History.tsx:339`).
- **G11 🟡** — Checkout via CommandPalette silencioso em falha (`CommandPalette.tsx:73` sem onError).
- **G12 🟡** — `code` único `git_failed` impede distinguir conflito de erro (`mod.rs:43`); mensagens "conflito ou erro no merge" assumem.

## P3
- **G13** — Validação de nomes de ref só "vazio" (sem `git check-ref-format` — `branches.rs:65`, `Modals.tsx:54`).
- **G14** — `push -u origin HEAD` com remote `origin` hardcoded (`sync.rs:61`).
- **G15** — `delete_tag` existe (backend + hook) mas sem gatilho na UI (`Sidebar.tsx:253-258` tags read-only).
- **G16** — "Continuar" do ConflictBanner clicável com conflitos por resolver (disabled só cosmético — `ConflictBanner.tsx:30-33`).
- **G17** — Mensagens de auth cruas em inglês (mapear para PT acionável).
- **G18** — ahead/behind não é "ao vivo" (sem polling — positivo para perf; badges podem ficar stale até fetch manual).

## ✅ Sólidos
Merge/rebase honestos: deteção `MERGE_HEAD`/`rebase-*` + lista `diff --diff-filter=U` + resolve/continue/abort testados (`conflict.rs:96-121`); sem sucesso otimista em nenhuma operação; pull mode mapeado corretamente (ff→--ff-only default seguro / merge / rebase, lido em call-time); push cria upstream automático (`push -u origin HEAD`); `sync_status` correto sem upstream (zeros); previews Pull/Push com commits reais e honestos sem upstream; rename inline de branch com validação; sem polling (não contribui para o peso).
