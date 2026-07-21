import { describe, it, expect } from "vitest";
import * as ts from "typescript";

// ─────────────────────────────────────────────────────────────────────────────
// Completion gate for Task 16 (i18n). Scans the component/feature source for
// user-facing string literals that are still hardcoded (Portuguese) instead of
// going through t(). It FAILS listing every offender so the list is a worklist.
//
// What counts as "user-facing" (see brief):
//   • JSX text nodes                              → visible copy
//   • string props: title, placeholder,           → visible copy
//     aria-label, alt, label
//   • arguments to toast()/notify()/…push()       → toast/notification copy
//   • ANY string/template literal                 → flagged only if it contains
//                                                    an accented Latin letter
//
// A literal is an offender when it either contains an accented Latin character
// (á, ã, ç, é, …) OR — in a visible context — matches a curated Portuguese word.
// Genuinely non-translatable literals live in the allowlist below.
//
// Source is read via Vite's import.meta.glob (?raw) so the test stays browser-
// typed and needs no node types — see the *.test.* exclusion in the patterns.
// ─────────────────────────────────────────────────────────────────────────────

// Scans the UI (features/components) AND the lib/state/theme data modules the
// brief named (relative dates, git errors, status labels, group colors, pull
// modes, shortcut labels all live there). `src/i18n/**` is intentionally NOT
// scanned — the catalogs legitimately hold PT. `src/perf/**` (dev-only mock
// data) is out of scope per the brief.
const sources = import.meta.glob(
  [
    "../features/**/*.{ts,tsx}",
    "../components/**/*.{ts,tsx}",
    "../lib/**/*.{ts,tsx}",
    "../state/**/*.{ts,tsx}",
    "../theme/**/*.{ts,tsx}",
    "!../**/*.test.{ts,tsx}",
    "!../**/*.d.ts",
  ],
  { query: "?raw", import: "default", eager: true },
) as Record<string, string>;

/** Exact (trimmed) literals that are allowed to stay hardcoded: brand/tech
 * tokens, git refs, symbols and punctuation. Documented, intentionally small. */
const ALLOWLIST = new Set<string>([
  // brand / product
  "GitSylva",
  // git / tech tokens and remotes
  "origin", "HEAD", "main", "master", "SSH", "OAuth", "HTTPS", "URL", "LFS",
  "GitHub", "GitLab", "Bitbucket", "Git", "git", "README", "gitignore",
  // symbols / punctuation used as visible glyphs
  "·", "→", "←", "↵", "⌘", "⇧", "⌥", "✕", "×", "—", "…", "•", "/", "#",
]);

/** Attributes/props whose string value is visible or announced text. Kept broad
 * so PT passed through a custom prop (content/message/…) is caught too, not only
 * the standard DOM attributes. */
const TEXT_ATTRS = new Set([
  "title", "placeholder", "aria-label", "alt", "label",
  "content", "tooltip", "message", "subtitle", "hint", "sub", "badge", "empty",
  "confirmLabel", "cancelLabel", "text", "heading", "caption",
]);

/** High-signal Portuguese words (mostly the un-accented ones the accent test
 * would miss). Matched case-insensitively on word boundaries in visible text. */
const PT_WORDS = [
  "para", "com", "sem", "por", "como", "nao", "não", "sim", "este", "esta", "estes", "estas",
  "isto", "ramo", "ramos", "ficheiro", "ficheiros", "pasta", "pastas", "guardar", "guardado",
  "guardadas", "cancelar", "procurar", "pesquisar", "fechar", "abrir", "voltar", "enviar",
  "receber", "desfazer", "apagar", "criar", "clonar", "comparar", "mudar", "novo", "nova",
  "novos", "novas", "nenhum", "nenhuma", "todos", "todas", "ultimo", "último", "ultima", "última",
  "proximo", "próximo", "anterior", "escolher", "selecionar", "selecionado", "selecionada",
  "alteracoes", "alterações", "alteracao", "alteração", "confirmar", "descartar", "remover",
  "adicionar", "mostrar", "esconder", "ocultar", "ativar", "desativar", "carregar", "gerir",
  "ligar", "repositorio", "repositório", "repositorios", "repositórios", "recentes", "favoritos",
  "atalhos", "aparencia", "aparência", "definicoes", "definições", "preferencias", "preferências",
  "idioma", "seccao", "secção", "seccoes", "secções", "obrigatorio", "obrigatório", "opcional",
  "copiado", "copiar", "colar", "atualizar", "limpar", "mensagem", "mensagens", "etiqueta",
  "etiquetas", "corrente", "atual", "sucesso", "falhou", "erro", "aviso", "conflito", "conflitos",
  "guardados", "descartadas", "descartados", "enviadas", "recebidas",
  // un-accented verbs/words that plain JSX text can otherwise sneak past
  "ver", "ir", "sair", "entrar", "ler", "aplicar", "repor", "saltar", "continuar", "feito",
  "pronto", "obter", "seguir", "integrar", "reescrever", "verificar", "instalar", "transferir",
  "reiniciar", "preparar", "retirar", "reverter", "regravar", "regravado", "reposto", "repostos",
  "repostas", "concluido", "concluído", "concluida", "concluída",
];
const PT_WORD_RE = new RegExp(`(^|[^\\p{L}])(${PT_WORDS.join("|")})([^\\p{L}]|$)`, "iu");

/** Accented Latin-1 letters used by Portuguese (á à â ã ç é ê í ó ô õ ú ü …). */
const ACCENT_RE = /[À-ÖØ-öø-ÿ]/;

/** File-scoped allowlist: literals that are legitimate NON-UI data in one
 * specific module and must not leak into the global allowlist (which would mask
 * the same string appearing raw elsewhere). `theme/themes.ts` keeps the original
 * PT names as canonical data / React keys; their rendered form comes from the
 * `theme.*` catalog (see the label helpers in themes.ts). A NEW raw PT string in
 * that file — or the same strings anywhere else — is still caught. */
const FILE_ALLOWLIST: { match: string; literals: Set<string> }[] = [
  {
    match: "theme/themes.ts",
    literals: new Set([
      "Clássico", "Âmbar", "Índigo", "Carvão",
      "Padrão do GitSylva", "Máxima legibilidade",
      "Clássica", "Ramificação", "Git clássico: só nós", "Pôr-do-sol",
    ]),
  },
];

function isAllowed(trimmed: string, rel: string): boolean {
  if (trimmed === "" || ALLOWLIST.has(trimmed)) return true;
  return FILE_ALLOWLIST.some((f) => rel.includes(f.match) && f.literals.has(trimmed));
}

function isSuspect(raw: string, visible: boolean, rel: string): boolean {
  const trimmed = raw.trim();
  if (isAllowed(trimmed, rel)) return false;
  if (ACCENT_RE.test(raw)) return true;
  if (visible && PT_WORD_RE.test(raw)) return true;
  return false;
}

type Offender = { file: string; line: number; text: string };

/** Is `node` (a string/template literal) in a visible context: a text prop or a
 * toast/notify/…push() argument? */
function inVisibleContext(node: ts.Node, sf: ts.SourceFile): boolean {
  const parent = node.parent;
  if (!parent) return false;

  // title="…" / placeholder={"…"} …
  let attr: ts.Node | undefined = parent;
  if (ts.isJsxExpression(attr)) attr = attr.parent;
  if (attr && ts.isJsxAttribute(attr) && ts.isIdentifier(attr.name) && TEXT_ATTRS.has(attr.name.text)) {
    return true;
  }

  // toast("…") / notify("…", "…") / useToastStore.getState().push("…")
  if (ts.isCallExpression(parent) && parent.arguments.includes(node as ts.Expression)) {
    return isNotifyCall(parent, sf);
  }
  return false;
}

function isNotifyCall(call: ts.CallExpression, sf: ts.SourceFile): boolean {
  const callee = call.expression;
  if (ts.isIdentifier(callee)) return /^(toast|notify)$/.test(callee.text);
  if (ts.isPropertyAccessExpression(callee)) {
    const method = callee.name.text;
    if (method === "toast" || method === "notify") return true;
    if (method === "push") return /notif|toast/i.test(callee.expression.getText(sf));
  }
  return false;
}

function scanSource(rawPath: string, text: string): Offender[] {
  const sf = ts.createSourceFile(rawPath, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const offenders: Offender[] = [];
  const rel = rawPath.replace(/^\.\.\//, "src/");

  const record = (node: ts.Node, raw: string) => {
    const { line } = sf.getLineAndCharacterOfPosition(node.getStart(sf));
    offenders.push({ file: rel, line: line + 1, text: raw.trim().slice(0, 80) });
  };

  const visit = (node: ts.Node) => {
    if (ts.isJsxText(node)) {
      if (isSuspect(node.text, true, rel)) record(node, node.text);
    } else if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
      if (isSuspect(node.text, inVisibleContext(node, sf), rel)) record(node, node.text);
    } else if (ts.isTemplateExpression(node)) {
      const visible = inVisibleContext(node, sf);
      const parts = [node.head.text, ...node.templateSpans.map((s) => s.literal.text)];
      if (parts.some((p) => isSuspect(p, visible, rel))) record(node, parts.join("…"));
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);
  return offenders;
}

describe("no hardcoded user-facing strings in the UI + data modules", () => {
  it("every user-facing literal goes through t()", () => {
    const offenders: Offender[] = [];
    for (const [path, text] of Object.entries(sources)) offenders.push(...scanSource(path, text));

    if (offenders.length > 0) {
      const byFile = new Map<string, Offender[]>();
      for (const o of offenders) {
        const list = byFile.get(o.file) ?? [];
        list.push(o);
        byFile.set(o.file, list);
      }
      const report = [...byFile.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([file, list]) => `\n  ${file}\n${list.map((o) => `    L${o.line}: ${JSON.stringify(o.text)}`).join("\n")}`)
        .join("");
      throw new Error(`${offenders.length} hardcoded user-facing string(s) still need t():\n${report}\n`);
    }

    expect(offenders).toEqual([]);
  });
});
