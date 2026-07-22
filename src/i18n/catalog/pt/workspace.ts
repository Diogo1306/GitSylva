import type { MessageValue } from "../../types";

// Repository workspace views: History (+ commit detail/diff), WorkingCopy,
// ConflictBanner, Stashes. Namespaces: "history.*", "workingCopy.*", "stashes.*".
export const ptWorkspace = {
  // ═══════════════════════════════════════════════════════════════════════════
  // History
  // ═══════════════════════════════════════════════════════════════════════════

  // ── screen states ──────────────────────────────────────────────────────────
  "history.loading": "A carregar histórico…",
  "history.readError": "não foi possível ler o histórico",
  "history.noCommits": "Sem commits ainda.",
  "history.commitsCount": { one: "{count} commit", other: "{count} commits" },
  "history.listAriaLabel": "Histórico de commits",
  "history.loadMore": "Carregar mais commits",
  "history.dragPanel": "Arrastar para ajustar o painel",
  "history.row.title": "1 clique: ver · 2 cliques: ir para este commit · botão direito: opções",

  // ── detail / diff panel ────────────────────────────────────────────────────
  "history.detail.filesCount": { one: "{count} ficheiro", other: "{count} ficheiros" },
  "history.detail.changedFiles": "ARQUIVOS ALTERADOS",
  "history.detail.viewFileDiff": "Ver o diff deste ficheiro",
  "history.detail.loadingDiff": "A carregar diff…",
  "history.detail.readCommitError": "não foi possível ler o commit",
  "history.detail.noTextChanges": "Sem alterações textuais.",
  "history.detail.hidePanel": "Esconder o painel de detalhe/diff",
  "history.detail.showPanel": "Mostrar o painel de detalhe/diff",
  "history.detail.diffToggle": "Diff",

  // ── filter bar ─────────────────────────────────────────────────────────────
  "history.filter.label": "Filtrar commits",
  "history.filter.placeholder": "Filtrar histórico…",
  "history.filter.applyingInline": "a aplicar filtro…",
  "history.filter.applying": "A aplicar filtro…",
  "history.filter.hideAdvanced": "Esconder filtros avançados",
  "history.filter.showAdvanced": "Mostrar filtros avançados (branch, autor, data, merges, caminho)",
  "history.filter.filters": "Filtros",
  "history.filter.author": "Autor",
  "history.filter.allBranches": "Todas as branches",
  "history.filter.local": "Locais",
  "history.filter.remote": "Remotas",
  "history.filter.dateFrom": "De (data inicial)",
  "history.filter.dateTo": "Até (data final)",
  "history.filter.commitTypeAria": "Tipo de commit",
  "history.filter.commitAll": "Todos",
  "history.filter.commitNormal": "Normais",
  "history.filter.path": "Caminho ou tipo de ficheiro",
  "history.filter.pathPlaceholder": "ex.: src/, *.rs",
  "history.filter.resetAllTitle": "Repor todos os filtros",
  "history.filter.reset": "Repor filtros",
  "history.filter.applyErrorBranch": "Não foi possível aplicar o filtro de branch.",
  "history.filter.applyErrorPath": "Não foi possível aplicar o filtro de caminho.",
  "history.filter.clear": "Limpar filtros",
  "history.filter.noResults": "Sem resultados para os filtros aplicados.",

  // ── commit context menu ────────────────────────────────────────────────────
  "history.menu.gotoCommit": "Ir para este commit…",
  "history.menu.branchFromHere": "Criar branch daqui…",
  "history.menu.tagAtCommit": "Criar tag neste commit…",
  "history.menu.cherryPick": "Cherry-pick para a branch atual",
  "history.menu.cherryPickDone": "Cherry-pick aplicado",
  "history.menu.cherryPickConflict": "conflito no cherry-pick",
  "history.menu.revertCommit": "Reverter este commit…",
  "history.menu.rebaseOnto": "Rebase da atual sobre este commit…",
  "history.menu.resetSoft": "Reset suave para {short}",
  "history.menu.resetMixed": "Reset misto para {short}",
  "history.menu.resetHard": "Reset forçado (hard) para {short}…",
  "history.menu.resetToast": "Reset {mode} para {short}",
  "history.menu.resetError": "erro no reset",
  "history.menu.copyHash": "Copiar hash",
  "history.menu.hashCopied": "Hash copiado",
  "history.menu.copyMessage": "Copiar mensagem",
  "history.menu.messageCopied": "Mensagem copiada",

  // ── confirm dialogs ────────────────────────────────────────────────────────
  "history.rebaseConfirm": "Rebase de {branch} sobre {short}? Os commits locais da branch atual são reescritos.",
  "history.rebaseDone": "Rebase concluído",
  "history.rebaseConflict": "conflito no rebase — vê a Cópia de trabalho",
  "history.hardResetConfirm": "Reset forçado (hard) para {short}? Descarta TODAS as alterações locais (preparadas e não preparadas) e os commits à frente deste. Esta ação não pode ser desfeita.",
  "history.hardResetConfirmLabel": "Reset forçado",
  "history.hardResetToast": "Reset hard para {short}",
  "history.gotoConfirm": 'Ir para o commit {short}? A cópia de trabalho passa a refletir esse ponto em modo solto (detached HEAD). Para continuar trabalho a partir daqui, usa o botão direito → "Criar branch daqui…".',
  "history.gotoConfirmLabel": "Ir para o commit",
  "history.gotoDone": "Em {short} (HEAD solto)",
  "history.gotoError": "não foi possível ir para o commit",
  "history.revertConfirm": "Reverter {short}? Cria um commit novo na branch atual que desfaz as alterações deste (o histórico não é reescrito).",
  "history.revertConfirmLabel": "Reverter",
  "history.revertDone": "Commit {short} revertido",
  "history.revertConflict": "conflito no revert — vê a Cópia de trabalho",

  // ── create-branch modal ────────────────────────────────────────────────────
  "history.branchModal.title": "Criar branch a partir de {short}",
  "history.branchModal.placeholder": "feature/a-minha-branch",
  "history.branchModal.createSwitch": "Criar e mudar",
  "history.branchModal.checkedOut": "Em {name}",
  "history.branchModal.created": "Branch {name} criada em {short}",
  "history.branchModal.createError": "não foi possível criar a branch",

  // ── create-tag modal ───────────────────────────────────────────────────────
  "history.tagModal.title": "Criar tag em {short}",
  "history.tagModal.create": "Criar tag",
  "history.tagModal.created": "Tag {name} criada em {short}",
  "history.tagModal.createError": "não foi possível criar a tag",

  // ═══════════════════════════════════════════════════════════════════════════
  // Working copy
  // ═══════════════════════════════════════════════════════════════════════════

  // ── screen states / errors ─────────────────────────────────────────────────
  "workingCopy.loadingChanges": "A carregar alterações…",
  "workingCopy.statusError": "não foi possível ler o estado do repositório",
  "workingCopy.hunkError": "não foi possível aplicar o hunk",
  "workingCopy.commitError": "não foi possível fazer commit",
  "workingCopy.stageError": "não foi possível preparar {path}",
  "workingCopy.unstageError": "não foi possível retirar {path}",
  "workingCopy.discardError": "não foi possível descartar",
  "workingCopy.discardAllError": "não foi possível descartar as alterações",
  "workingCopy.stageAllError": "não foi possível preparar tudo",

  // ── file row + context menu ────────────────────────────────────────────────
  "workingCopy.file.conflictedTitle": "Em conflito — resolve-o primeiro (painel acima)",
  "workingCopy.file.unstageTitle": "Retirar da preparação",
  "workingCopy.file.stageTitle": "Preparar",
  "workingCopy.folder.stageTitle": "Preparar os {count} ficheiros de {dir}/",
  "workingCopy.folder.unstageTitle": "Retirar os {count} ficheiros de {dir}/",
  "workingCopy.file.reveal": "Mostrar no explorador",
  "workingCopy.file.revealError": "não foi possível abrir o explorador",
  "workingCopy.file.openError": "não foi possível abrir",
  "workingCopy.file.copyPath": "Copiar caminho",
  "workingCopy.file.pathCopied": "Caminho copiado",
  "workingCopy.file.deleteFromDisk": "Apagar do disco…",
  "workingCopy.file.discardChanges": "Descartar alterações…",
  "workingCopy.file.deleted": "{path} apagado",
  "workingCopy.file.discarded": "Alterações de {path} descartadas",

  // ── lists + commit box ─────────────────────────────────────────────────────
  "workingCopy.unstagedSection": "NÃO PREPARADAS",
  "workingCopy.stagedSection": "PREPARADAS",
  "workingCopy.staging": "A preparar…",
  "workingCopy.stageAll": "Preparar tudo",
  "workingCopy.discard": "Descartar",
  "workingCopy.dragLists": "Arrastar para ajustar o tamanho das listas",
  "workingCopy.commitPlaceholder": "Mensagem do commit…",
  "workingCopy.amendLabel": "Emendar último commit (amend)",
  "workingCopy.amendPushedWarning": "O último commit já está no remoto — emendá-lo reescreve história publicada e vai exigir force push.",
  "workingCopy.committing": "A fazer commit…",
  "workingCopy.amendCommit": "Emendar commit",
  "workingCopy.commitTo": "Commit em {branch}",
  "workingCopy.filesShort": "{count} arq.",

  // ── diff / blame panel ─────────────────────────────────────────────────────
  "workingCopy.selectFilePrompt": "Selecione um ficheiro para ver o diff",
  "workingCopy.stagedDiff": "diff preparado",
  "workingCopy.worktreeDiff": "diff da cópia de trabalho",
  "workingCopy.sideBySide": "Lado a lado",
  "workingCopy.stacked": "Empilhado",
  "workingCopy.blame": "Blame",
  "workingCopy.loadingBlame": "A carregar blame…",
  "workingCopy.noBlame": "Sem blame (ficheiro novo?).",
  "workingCopy.loadingDiff": "A carregar diff…",
  "workingCopy.unstage": "Retirar",
  "workingCopy.stage": "Preparar",
  "workingCopy.noTextChanges": "Sem alterações textuais.",

  // ── discard confirmations ──────────────────────────────────────────────────
  "workingCopy.discardAllConfirm": {
    one: "Descartar {count} alteração não preparada?",
    other: "Descartar {count} alterações não preparadas?",
  },
  "workingCopy.discardAllUntracked": {
    one: "{count} ficheiro não rastreado será apagado do disco.",
    other: "{count} ficheiros não rastreados serão apagados do disco.",
  },
  "workingCopy.discardAllTail": "As alterações preparadas mantêm-se. Esta ação não pode ser desfeita.",
  "workingCopy.deleteFileConfirm": "Apagar {path} do disco? Não pode ser desfeito.",
  "workingCopy.discardFileConfirm": "Descartar as alterações não preparadas de {path}? As preparadas mantêm-se.",

  // ── conflict banner ────────────────────────────────────────────────────────
  "workingCopy.conflict.withConflicts": "{kind} com conflitos",
  "workingCopy.conflict.unresolved": "Conflitos por resolver",
  "workingCopy.conflict.remaining": "{count} por resolver",
  "workingCopy.conflict.continue": "Continuar",
  "workingCopy.conflict.continueDone": "{kind} concluído",
  "workingCopy.conflict.stillConflicts": "ainda há conflitos",
  "workingCopy.conflict.abort": "Abortar",
  "workingCopy.conflict.aborting": "A abortar…",
  "workingCopy.conflict.aborted": "Operação abortada",
  "workingCopy.conflict.abortError": "não foi possível abortar",
  "workingCopy.conflict.resolveError": "não foi possível resolver o ficheiro",
  "workingCopy.conflict.useOurs": "Usar meu",
  "workingCopy.conflict.useTheirs": "Usar deles",
  "workingCopy.conflict.resolved": "Resolvido",

  // ═══════════════════════════════════════════════════════════════════════════
  // Stashes
  // ═══════════════════════════════════════════════════════════════════════════
  "stashes.filesCount": { one: "{count} ficheiro", other: "{count} ficheiros" },
  "stashes.saveStash": "Guardar stash",
  "stashes.readError": "não foi possível ler os stashes",
  "stashes.empty": 'Sem stashes. Use "Guardar stash" acima (ou {combo}) para guardar alterações em curso.',
  "stashes.applied": "Stash aplicado",
  "stashes.applyError": "não foi possível aplicar",
  "stashes.applying": "A aplicar…",
  "stashes.apply": "Aplicar",
  "stashes.poppedDone": "Stash aplicado e removido",
  "stashes.popError": "não foi possível fazer pop",
  "stashes.popTitle": "git stash pop — aplica e, se não houver conflitos, remove o stash",
  "stashes.applyRemove": "Aplicar e remover",
  "stashes.discard": "Descartar",
  "stashes.dropConfirm": "Descartar o stash stash@{{index}}? O conteúdo guardado perde-se definitivamente.",
  "stashes.dropped": "Stash descartado",
  "stashes.dropError": "não foi possível descartar",
} satisfies Record<string, MessageValue>;

export type WorkspaceKey = keyof typeof ptWorkspace;
