import { useEffect, useRef } from "react";
import { useShallow } from "zustand/react/shallow";
import { useThemeStore } from "../state/themeStore";
import { computeThemeVars, type ThemeKey } from "./themes";
// Inlined (data URLs) instead of fetched: the strict CSP has no 'self' in
// connect-src, and 2.5KB × 4 is nothing.
import iconEscuro from "./appicons/escuro.png?inline";
import iconClaro from "./appicons/claro.png?inline";
import iconNipon from "./appicons/nipon.png?inline";
import iconGitclassic from "./appicons/gitclassic.png?inline";

const THEME_ICONS: Record<ThemeKey, string> = {
  escuro: iconEscuro,
  claro: iconClaro,
  nipon: iconNipon,
  gitclassic: iconGitclassic,
};

function dataUrlBytes(url: string): Uint8Array {
  const bin = atob(url.slice(url.indexOf(",") + 1));
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

/**
 * Writes the computed theme variables onto :root whenever any theme preference
 * changes, reflects the decorative-animations toggle as a data attribute
 * (`[data-anims="off"]`), and plays a brief cross-fade on the app root when the
 * theme changes (unless decorative animations are off).
 */
export function useApplyTheme() {
  // Shallow-selected: this hook lives on <App/>, so subscribing to the whole
  // store would re-render the entire tree on ANY preference change (e.g.
  // pullMode or confirmDiscard, which don't affect theming).
  const { theme, treeStyle, branchColor, accentIdx, fontKey, anims } = useThemeStore(
    useShallow((s) => ({
      theme: s.theme,
      treeStyle: s.treeStyle,
      branchColor: s.branchColor,
      accentIdx: s.accentIdx,
      fontKey: s.fontKey,
      anims: s.anims,
    })),
  );
  const prevTheme = useRef<string | null>(null);

  useEffect(() => {
    const vars = computeThemeVars({ theme, treeStyle, branchColor, accentIdx, fontKey });
    const root = document.documentElement;
    for (const [k, v] of Object.entries(vars)) {
      root.style.setProperty(k, v);
    }
    root.setAttribute("data-theme", theme);
    root.setAttribute("data-anims", anims ? "on" : "off");

    // Soft flash on theme change (not on first paint, and only when enabled).
    const app = document.getElementById("root");
    if (app && prevTheme.current && prevTheme.current !== theme && anims) {
      app.style.animation = "none";
      // Force reflow so the animation restarts even on rapid switches.
      void app.offsetWidth;
      app.style.animation = "themeSwapA 0.4s ease";
    }
    prevTheme.current = theme;
  }, [theme, treeStyle, branchColor, accentIdx, fontKey, anims]);

  // The window/taskbar icon follows the theme (user request R5.3). Best
  // effort: outside Tauri (browser preview) the import fails and the default
  // icon simply stays.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { getCurrentWindow } = await import("@tauri-apps/api/window");
        if (cancelled) return;
        await getCurrentWindow().setIcon(dataUrlBytes(THEME_ICONS[theme] ?? THEME_ICONS.escuro));
      } catch {
        /* not in a Tauri window (or icon feature unavailable) */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [theme]);
}
