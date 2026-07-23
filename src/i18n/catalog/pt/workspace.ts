import type { MessageValue } from "../../types";

// Repository workspace views: WorkingCopy, ConflictBanner, Stashes.
// History (+ commit detail/diff) lives in its own namespace (pt/history.ts).
// Namespaces here: "workingCopy.*", "stashes.*".
export const ptWorkspace = {
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
  "stashes.createStash": "Criar stash",
  "stashes.readError": "não foi possível ler os stashes",
  "stashes.empty": "Ainda não existem stashes.",
  "stashes.emptyAction": "Guardar alterações num stash",
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
