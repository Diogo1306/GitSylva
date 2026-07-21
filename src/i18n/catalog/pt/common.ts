import type { MessageValue } from "../../types";

// Shared vocabulary, relative-time units and git/sync error copy. Reused across
// every area — feature namespaces should prefer these keys over redefining a
// word like "Cancelar". Do not add feature-specific copy here.
export const ptCommon = {
  // ── common / shared vocabulary ─────────────────────────────────────────────
  "common.cancel": "Cancelar",
  "common.confirm": "Confirmar",
  "common.save": "Guardar",
  "common.close": "Fechar",
  "common.back": "Voltar",
  "common.open": "Abrir",
  "common.remove": "Remover",
  "common.delete": "Apagar",
  "common.create": "Criar",
  "common.rename": "Mudar o nome",
  "common.copy": "Copiar",
  "common.search": "Procurar",
  "common.searchEllipsis": "Procurar…",
  "common.loading": "A carregar…",
  "common.retry": "Tentar de novo",
  "common.yes": "Sim",
  "common.no": "Não",
  "common.soon": "Em breve",

  // ── relative time (format.ts) ──────────────────────────────────────────────
  "time.now": "agora",
  "time.minutesAgo": "há {count} min",
  "time.hoursAgo": "há {count} h",
  "time.daysAgo": { one: "há {count} dia", other: "há {count} dias" },
  "time.weeksAgo": "há {count} sem",

  // ── sync / git errors (errors.ts) ──────────────────────────────────────────
  "error.generic": "ocorreu um erro",
  "error.fetchFailedFallback": "não foi possível fazer fetch",
  "error.authTitle": "Autenticação necessária",
  "error.authFetchHint": "Configura as credenciais Git para origin (credential manager ou uma chave SSH).",
  "error.networkTitle": "Sem ligação ao remoto",
  "error.fetchFailedTitle": "Fetch falhou",
} satisfies Record<string, MessageValue>;

export type CommonKey = keyof typeof ptCommon;
