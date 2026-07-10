import { useEffect, useRef } from "react";
import { useThemeStore } from "../state/themeStore";
import { computeThemeVars } from "./themes";

/**
 * Writes the computed theme variables onto :root whenever any theme preference
 * changes, reflects the decorative-animations toggle as a data attribute
 * (`[data-anims="off"]`), and plays a brief cross-fade on the app root when the
 * theme changes (unless decorative animations are off).
 */
export function useApplyTheme() {
  const { theme, treeStyle, branchColor, accentIdx, fontKey, anims } = useThemeStore();
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
}
