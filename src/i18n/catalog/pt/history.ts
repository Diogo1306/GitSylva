import type { MessageValue } from "../../types";

// History view: commit list, working-copy row, commit detail, clean diff and
// its collapsible/close controls, filter bar, context menu, confirm dialogs and
// the branch/tag modals. Namespace: "history.*".
export const ptHistory = {
  // ── screen states ──────────────────────────────────────────────────────────
  "history.loading": "A carregar histórico…",
  "history.readError": "não foi possível ler o histórico",
  "history.noCommits": "Sem commits ainda.",
  "history.commitsCount": { one: "{count} commit", other: "{count} commits" },
  "history.listAriaLabel": "Histórico de commits",
  "history.loadMore": "Carregar mais commits",
  "history.dragPanel": "Arrastar para ajustar o painel",
  "history.row.title": "1 clique: ver · 2 cliques: ir para este commit · botão direito: opções",

  // ── working-copy row (top of the list) ─────────────────────────────────────
  "history.wcRow.label": "Alterações por commitar",
  "history.wcRow.title": "Abrir a cópia de trabalho para preparar e fazer commit",

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
  "history.detail.closeTitle": "Fechar painel de detalhe",
  "history.detail.actionBranch": "Branch daqui",
  "history.detail.actionTag": "Tag",
  "history.detail.actionRevert": "Revert",
  "history.detail.moreActions": "Mais ações",
  "history.detail.diffSection": "DIFF",
  "history.detail.hideDiff": "Ocultar diff",
  "history.detail.showDiff": "Mostrar diff",
  "history.detail.diffEmpty": "Sem alterações para mostrar — seleciona um ficheiro acima.",

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
} satisfies Record<string, MessageValue>;

export type HistoryKey = keyof typeof ptHistory;
