import { useThemeStore } from "../state/themeStore";
import type { ThemeKey } from "../theme/themes";
import wmEscuro from "../theme/marks/wordmark-escuro.png";
import wmClaro from "../theme/marks/wordmark-claro.png";
import wmGitclassic from "../theme/marks/wordmark-gitclassic.png";
import wmNipon from "../theme/marks/wordmark-nipon.png";

// The OFFICIAL git[S]ylva wordmark from the design kit (transparent exports,
// R5.21), one per theme so letters and the S always sit on-palette.
const WORDMARK_BY_THEME: Record<ThemeKey, string> = {
  escuro: wmEscuro,
  claro: wmClaro,
  gitclassic: wmGitclassic,
  nipon: wmNipon,
};

export function Wordmark({ size = 17 }: { size?: number }) {
  const theme = useThemeStore((s) => s.theme);
  return (
    <img
      src={WORDMARK_BY_THEME[theme] ?? wmEscuro}
      alt="GitSylva"
      // The lockup is ~2.7:1 with the S overshooting the letters; 2.1× the
      // old font size keeps the letters at roughly their previous height.
      style={{ display: "block", height: Math.round(size * 2.1) }}
    />
  );
}
