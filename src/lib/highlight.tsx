import { type ReactNode } from "react";

// Tiny dependency-free, language-agnostic highlighter for diff/blame content.
// Recognizes comments, strings, numbers and a common keyword set. Good enough to
// give code structure without a full grammar; colors come from theme tokens.

const KEYWORDS = new Set([
  "const", "let", "var", "function", "return", "if", "else", "for", "while", "do", "switch", "case", "break",
  "continue", "import", "export", "from", "default", "class", "extends", "new", "this", "super", "async", "await",
  "try", "catch", "finally", "throw", "typeof", "instanceof", "in", "of", "void", "null", "true", "false", "undefined",
  "fn", "pub", "use", "mod", "struct", "enum", "impl", "match", "type", "interface", "public", "private", "static",
  "def", "end", "self", "None", "True", "False", "and", "or", "not", "int", "str", "bool",
]);

// Ordered alternation: comments, strings, numbers, identifiers, other.
const TOKEN = /(\/\/[^\n]*|#[^\n]*|\/\*[\s\S]*?\*\/)|("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)|(\b\d[\d_.]*\b)|([A-Za-z_$][A-Za-z0-9_$]*)|([^A-Za-z0-9_$]+)/g;

export function highlight(text: string): ReactNode {
  if (!text) return text;
  const out: ReactNode[] = [];
  let m: RegExpExecArray | null;
  TOKEN.lastIndex = 0;
  let key = 0;
  while ((m = TOKEN.exec(text)) !== null) {
    if (m[1]) out.push(<span key={key++} style={{ color: "var(--muted)", fontStyle: "italic" }}>{m[1]}</span>);
    else if (m[2]) out.push(<span key={key++} style={{ color: "var(--stMT)" }}>{m[2]}</span>);
    else if (m[3]) out.push(<span key={key++} style={{ color: "var(--l1)" }}>{m[3]}</span>);
    else if (m[4]) out.push(KEYWORDS.has(m[4]) ? <span key={key++} style={{ color: "var(--l2)" }}>{m[4]}</span> : m[4]);
    else out.push(m[5]);
    if (m.index === TOKEN.lastIndex) TOKEN.lastIndex++;
  }
  return out;
}
