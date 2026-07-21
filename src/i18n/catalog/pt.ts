import type { MessageValue } from "../types";

// Portuguese catalog — the source-of-truth for the key set. Keys are namespaced
// by feature/area ("history.*", "sidebar.*", …). `en.ts` is typed against the
// keys derived here, so every key added below must gain an English counterpart
// or the build fails. Keep entries alphabetical-ish within each namespace block.
//
// Placeholders use `{name}`; a value with plural forms is `{ one, other, zero? }`
// and is selected by the `count` param (see translate.ts).
export const pt = {
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

/** The catalog key union — every `t()` call and the English catalog are typed
 * against this, so keys stay in sync at compile time. */
export type MessageKey = keyof typeof pt;
