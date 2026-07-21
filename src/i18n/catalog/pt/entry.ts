import type { MessageValue } from "../../types";

// First-run + repo entry + shared low-level components: Onboarding, RepoPicker,
// useOpenRepo, and src/components/* (ConfirmDialog, DiffView, ErrorBoundary,
// Notifications, UpdatePrompt, ui/Modal, ui/PanelResize).
// Namespaces: "onboarding.*", "repo.*", "components.*".
export const ptEntry = {
  // ── onboarding: step captions ──────────────────────────────────────────────
  "onboarding.caption.login": "ENTRAR",
  "onboarding.caption.setup": "PERSONALIZAR",
  "onboarding.caption.grow": "PLANTADO",

  // ── onboarding: login phase ────────────────────────────────────────────────
  "onboarding.login.welcome": "Bem-vindo",
  "onboarding.login.subtitle": "Trabalha já nos teus repositórios locais.",
  "onboarding.login.continueLocally": "Continuar localmente",
  "onboarding.login.integrationsSoonLabel": "INTEGRAÇÕES: EM BREVE",
  "onboarding.login.integrationsGroup": "Integrações: em breve",
  "onboarding.login.continueWith": "Continuar com {provider}",
  "onboarding.login.accountSoon": "Login com conta chega na fase de sincronização",

  // ── onboarding: setup phase ────────────────────────────────────────────────
  "onboarding.setup.title": "Personaliza o teu jardim",
  "onboarding.setup.subtitle": "Tudo isto muda depois nas Definições.",
  "onboarding.setup.themeLabel": "TEMA",
  "onboarding.setup.themeGroup": "Tema",
  "onboarding.setup.treeStyleLabel": "ESTILO DA ÁRVORE",
  "onboarding.setup.treeStyleGroup": "Estilo da árvore",
  "onboarding.setup.repoLayoutLabel": "REPOSITÓRIOS ABERTOS",
  "onboarding.setup.repoLayoutGroup": "Repositórios abertos",
  "onboarding.setup.layoutTabs": "Abas (browser)",
  "onboarding.setup.layoutRail": "Barra lateral",
  "onboarding.setup.plant": "Plantar e entrar",

  // ── onboarding: grow phase (rich text kept as inline <strong> segments) ─────
  "onboarding.grow.title": "A tua floresta está plantada",
  "onboarding.grow.descPre": "A ",
  "onboarding.grow.workingCopy": "Cópia de trabalho",
  "onboarding.grow.descMid1": " mostra o que mudou, a ",
  "onboarding.grow.commitTree": "árvore de commits",
  "onboarding.grow.descMid2": " é o teu histórico, e ",
  "onboarding.grow.descPost": " abre a Palete de Comandos a qualquer momento.",
  "onboarding.grow.goodCode": "bom código.",

  // ── repo picker: chrome + tabs ─────────────────────────────────────────────
  "repo.screenLabel": "Adicionar repositório",
  "repo.tab.local": "Local",
  "repo.tab.remote": "Remoto",
  "repo.tab.clone": "Clonar",
  "repo.tab.add": "Adicionar",
  "repo.choose": "Escolher…",

  // ── repo picker: local (recents) ───────────────────────────────────────────
  "repo.local.title": "Repositórios recentes",
  "repo.local.searchLabel": "Procurar repositórios recentes",
  "repo.local.removeTitle": "Remover dos recentes",
  "repo.local.removeAria": "Remover {name} dos recentes",
  "repo.local.empty": "Ainda sem repositórios recentes.",
  "repo.local.noMatch": "Nenhum recente corresponde. Abrir ou clonar um repositório?",
  "repo.local.openFolder": "Abrir pasta…",
  "repo.local.cloneEllipsis": "Clonar…",
  "repo.local.browseFolder": "Procurar pasta…",

  // ── repo picker: add existing ──────────────────────────────────────────────
  "repo.add.title": "Adicionar repositório existente",
  "repo.add.pathLabel": "Caminho da pasta (com .git)",
  "repo.add.pathPlaceholder": "C:/projetos/o-meu-repo",
  "repo.add.opening": "A abrir…",

  // ── repo picker: create new ────────────────────────────────────────────────
  "repo.create.title": "Criar repositório novo",
  "repo.create.nameLabel": "Nome",
  "repo.create.namePlaceholder": "o-meu-projeto",
  "repo.create.parentLabel": "Pasta raiz",
  "repo.create.runs": "Corre",
  "repo.create.runsIn": "em {path} com branch main.",
  "repo.create.defaultName": "nome",
  "repo.create.creating": "A criar…",
  "repo.create.submit": "Criar repositório",

  // ── repo picker: clone ─────────────────────────────────────────────────────
  "repo.clone.title": "Clonar repositório",
  "repo.clone.urlLabel": "URL de origem",
  "repo.clone.destLabel": "Pasta de destino",
  "repo.clone.into": "Clona para {path}.",
  "repo.clone.doneTitle": "Clone concluído",
  "repo.clone.cloning": "A clonar…",

  // ── repo picker: remote (soon) ─────────────────────────────────────────────
  "repo.remote.title": "Repositórios remotos",
  "repo.remote.body":
    "Listar repositórios da tua conta (GitHub/GitLab/Bitbucket) chega quando o backend suportar autenticação. Entretanto, usa a aba Clonar com o URL.",

  // ── repo: open error (useOpenRepo) ─────────────────────────────────────────
  "repo.openError": "não foi possível abrir o repositório",

  // ── components: ConfirmDialog ──────────────────────────────────────────────
  "components.confirm.discard": "Descartar",

  // ── components: DiffView ───────────────────────────────────────────────────
  "components.diff.unified": "Unificado",
  "components.diff.split": "Lado a lado",
  "components.diff.showMoreLines": {
    one: "Mostrar mais {count} linha",
    other: "Mostrar mais {count} linhas",
  },
  "components.diff.hiddenCount": { one: "({count} oculta)", other: "({count} ocultas)" },
  "components.diff.tooLarge": "Diff demasiado grande — mostrada apenas a primeira parte.",
  "components.diff.loadFull": "Carregar diff completo",

  // ── components: ErrorBoundary ──────────────────────────────────────────────
  "components.error.title": "Algo correu mal",
  "components.error.body":
    "Ocorreu um erro inesperado ao desenhar este ecrã. Os teus repositórios não foram afetados.",
  "components.error.retry": "Tentar novamente",
  "components.error.home": "Voltar ao início",
  "components.error.reload": "Recarregar aplicação",

  // ── components: Notifications ──────────────────────────────────────────────
  "components.notif.dismiss": "Fechar notificação",

  // ── components: UpdatePrompt ───────────────────────────────────────────────
  "components.update.message":
    "Está disponível a versão {version} do GitSylva (tens a {current}). Transferir e instalar agora? A app reinicia sozinha no fim.",
  "components.update.confirm": "Atualizar agora",
  "components.update.downloading": "A transferir a atualização…",
  "components.update.failed": "não foi possível atualizar",

  // ── components: PanelResize ────────────────────────────────────────────────
  "components.panel.resizeTitle": "Arrastar para redimensionar",
} satisfies Record<string, MessageValue>;

export type EntryKey = keyof typeof ptEntry;
