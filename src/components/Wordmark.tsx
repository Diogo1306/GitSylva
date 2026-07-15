import { useThemeStore } from "../state/themeStore";
import type { ThemeKey } from "../theme/themes";
import sEscuro from "../theme/marks/escuro.png";
import sClaro from "../theme/marks/claro.png";
import sGitclassic from "../theme/marks/gitclassic.png";
import sNipon from "../theme/marks/nipon.png";

// The git[S]ylva lockup. The S is the OFFICIAL mark from the design kit
// (R5.20), themed to match the active palette; the letters stay live text so
// they keep the theme color and stay crisp at any size.
const S_BY_THEME: Record<ThemeKey, string> = {
  escuro: sEscuro,
  claro: sClaro,
  gitclassic: sGitclassic,
  nipon: sNipon,
};

export function Wordmark({ size = 17 }: { size?: number }) {
  const theme = useThemeStore((s) => s.theme);
  return (
    <div
      style={{
        display: "flex",
        alignItems: "baseline",
        fontFamily: "'Space Grotesk', sans-serif",
        fontWeight: 600,
        fontSize: size,
        letterSpacing: "0.3px",
      }}
    >
      <span>git</span>
      <img
        src={S_BY_THEME[theme] ?? sEscuro}
        alt=""
        style={{ display: "inline-block", height: Math.round(size * 1.5), margin: "0 2px", alignSelf: "center", transform: `translateY(${Math.round(size * 0.1)}px)` }}
      />
      <span>ylva</span>
    </div>
  );
}
