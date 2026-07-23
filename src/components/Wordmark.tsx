import { useThemeStore } from "../state/themeStore";
import type { ThemeKey } from "../theme/themes";
import s0Escuro from "../theme/marks/onboard/s0-escuro.svg?raw";
import s0Claro from "../theme/marks/onboard/s0-claro.svg?raw";
import s0Git from "../theme/marks/onboard/s0-gitclassic.svg?raw";
import s0Nipon from "../theme/marks/onboard/s0-nipon.svg?raw";

const S_MARK: Record<ThemeKey, string> = {
  escuro: s0Escuro,
  claro: s0Claro,
  gitclassic: s0Git,
  nipon: s0Nipon,
};

// The clean S mark cropped to its glyph, drawn STATICALLY: the growth SVG hides
// its strokes (stroke-dashoffset:1) and reveals them via a gsDraw animation, so
// for a static logo we strip the animation and set the strokes fully drawn.
function staticS(svg: string): string {
  return svg
    .replace('viewBox="0 0 84 112"', 'viewBox="11 44 47 65"')
    .replace(/animation:[^;"']*/g, "")
    .replace(/stroke-dashoffset:\s*1/g, "stroke-dashoffset:0")
    .replace(/<svg /, '<svg width="100%" height="100%" preserveAspectRatio="xMidYMid meet" ');
}

// git[S]ylva lockup for the titlebar/picker: real Space Grotesk letters with the
// clean S mark inline between them (theme-aware), sized to the text — matches
// the V2 titlebar (a small inline S, not the oversized full-logo lockup).
export function Wordmark({ size = 17 }: { size?: number }) {
  const theme = useThemeStore((s) => s.theme);
  const h = size;
  const w = Math.round(h * 0.72);
  return (
    <div
      role="img"
      aria-label="GitSylva"
      style={{ display: "flex", alignItems: "center", fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: size, letterSpacing: "0.3px", color: "var(--text)", lineHeight: 1, whiteSpace: "nowrap" }}
    >
      <span>git</span>
      <span
        aria-hidden
        style={{ display: "inline-flex", width: w, height: h, margin: `0 ${Math.max(1, Math.round(size * 0.05))}px`, ["--gs-bg" as never]: "var(--panel)" }}
        dangerouslySetInnerHTML={{ __html: staticS(S_MARK[theme] ?? s0Escuro) }}
      />
      <span>ylva</span>
    </div>
  );
}
