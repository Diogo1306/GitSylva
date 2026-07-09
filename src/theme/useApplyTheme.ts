import { useEffect } from "react";
import { useThemeStore } from "../state/themeStore";
import { computeThemeVars } from "./themes";

/**
 * Writes the computed theme variables onto :root whenever any theme preference
 * changes, and reflects the decorative-animations toggle as a data attribute
 * so CSS can gate non-essential motion (`[data-anims="off"]`).
 */
export function useApplyTheme() {
  const { theme, treeStyle, branchColor, accentIdx, fontKey, anims } = useThemeStore();

  useEffect(() => {
    const vars = computeThemeVars({ theme, treeStyle, branchColor, accentIdx, fontKey });
    const root = document.documentElement;
    for (const [k, v] of Object.entries(vars)) {
      root.style.setProperty(k, v);
    }
    root.setAttribute("data-theme", theme);
    root.setAttribute("data-anims", anims ? "on" : "off");
  }, [theme, treeStyle, branchColor, accentIdx, fontKey, anims]);
}
