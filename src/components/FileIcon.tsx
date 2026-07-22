import { iconFor, type FileGlyph } from "../lib/fileIcons";
import { hexAlpha } from "../theme/themes";

// Small SVG glyphs for the types whose icon isn't letters. Drawn with
// currentColor so the tile decides the tone.
function Glyph({ kind }: { kind: FileGlyph }) {
  if (kind === "image")
    return (
      <svg width="72%" height="72%" viewBox="0 0 16 16" aria-hidden>
        <circle cx={10.8} cy={5.2} r={1.7} fill="currentColor" />
        <path d="M2.5 13 L6.5 7 L9.2 10.4 L10.9 8.5 L13.5 13 Z" fill="currentColor" />
      </svg>
    );
  if (kind === "lock")
    return (
      <svg width="66%" height="66%" viewBox="0 0 16 16" aria-hidden>
        <rect x={4} y={7} width={8} height={6.5} rx={1.5} fill="currentColor" />
        <path d="M5.5 7 V5.4 a2.5 2.5 0 0 1 5 0 V7" fill="none" stroke="currentColor" strokeWidth={1.6} />
      </svg>
    );
  if (kind === "git")
    return (
      <svg width="72%" height="72%" viewBox="0 0 16 16" aria-hidden>
        <circle cx={4.6} cy={3.8} r={1.7} fill="currentColor" />
        <circle cx={4.6} cy={12.2} r={1.7} fill="currentColor" />
        <circle cx={11.4} cy={6.2} r={1.7} fill="currentColor" />
        <path d="M4.6 5.5 V10.5 M4.6 9 C4.6 7.4 11.4 9.4 11.4 7.9" fill="none" stroke="currentColor" strokeWidth={1.4} />
      </svg>
    );
  // doc: sheet with a folded corner and two text lines.
  return (
    <svg width="66%" height="66%" viewBox="0 0 16 16" aria-hidden>
      <path d="M4 2.5 h5 l3.5 3.5 v7.5 h-8.5 z" fill="none" stroke="currentColor" strokeWidth={1.4} strokeLinejoin="round" />
      <path d="M9 2.5 v3.5 h3.5" fill="none" stroke="currentColor" strokeWidth={1.2} strokeLinejoin="round" />
      <path d="M6 9 h4 M6 11 h3" stroke="currentColor" strokeWidth={1.2} strokeLinecap="round" />
    </svg>
  );
}

/** Colored file-type tile (16px by default) keyed by the path's extension. */
export function FileIcon({ path, size = 16 }: { path: string; size?: number }) {
  const d = iconFor(path);
  return (
    <span
      aria-hidden
      style={{
        width: size,
        height: size,
        borderRadius: "var(--r-xs)",
        background: hexAlpha(d.color, 0.16),
        color: d.color,
        display: "grid",
        placeItems: "center",
        flexShrink: 0,
        fontFamily: "var(--font-mono)",
        fontWeight: 800,
        lineHeight: 1,
        fontSize: d.label && d.label.length > 1 ? size * 0.44 : size * 0.58,
        boxSizing: "border-box",
        userSelect: "none",
      }}
    >
      {d.glyph ? <Glyph kind={d.glyph} /> : d.label}
    </span>
  );
}
