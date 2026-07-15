// Case- and accent-insensitive folding for search ("Histórico" ⇄ "historico").

export function fold(s: string): string {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

// Char-wise fold that keeps indexes aligned with the original code points, so
// a match highlight computed on the folded string lands on the right chars.
export function foldChars(text: string): string {
  return Array.from(text)
    .map((c) => {
      const f = fold(c);
      return f.length === 1 ? f : c.toLowerCase();
    })
    .join("");
}
