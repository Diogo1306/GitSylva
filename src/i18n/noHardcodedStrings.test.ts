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

const sources = import.meta.glob(
  ["../features/**/*.{ts,tsx}", "../components/**/*.{ts,tsx}", "!../**/*.test.{ts,tsx}", "!../**/*.d.ts"],
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

/** Attributes whose string value is visible/announced text. */
const TEXT_ATTRS = new Set(["title", "placeholder", "aria-label", "alt", "label"]);

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
];
const PT_WORD_RE = new RegExp(`(^|[^\\p{L}])(${PT_WORDS.join("|")})([^\\p{L}]|$)`, "iu");

/** Accented Latin-1 letters used by Portuguese (á à â ã ç é ê í ó ô õ ú ü …). */
const ACCENT_RE = /[À-ÖØ-öø-ÿ]/;

function isAllowed(trimmed: string): boolean {
  return trimmed === "" || ALLOWLIST.has(trimmed);
}

function isSuspect(raw: string, visible: boolean): boolean {
  const trimmed = raw.trim();
  if (isAllowed(trimmed)) return false;
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
      if (isSuspect(node.text, true)) record(node, node.text);
    } else if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
      if (isSuspect(node.text, inVisibleContext(node, sf))) record(node, node.text);
    } else if (ts.isTemplateExpression(node)) {
      const visible = inVisibleContext(node, sf);
      const parts = [node.head.text, ...node.templateSpans.map((s) => s.literal.text)];
      if (parts.some((p) => isSuspect(p, visible))) record(node, parts.join("…"));
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);
  return offenders;
}

describe("no hardcoded user-facing strings in components", () => {
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
