import { describe, it, expect } from "vitest";
import { computeThemeVars, hexAlpha, PALETTES } from "./themes";

const base = {
  theme: "escuro" as const,
  treeStyle: "normal" as const,
  branchColor: "auto" as const,
  accentIdx: 0,
  fontKey: "inter" as const,
};

describe("hexAlpha", () => {
  it("expands a hex colour to rgba", () => {
    expect(hexAlpha("#141618", 0.5)).toBe("rgba(20,22,24,0.5)");
  });
});

describe("computeThemeVars", () => {
  it("applies the Batman base palette", () => {
    const v = computeThemeVars(base);
    expect(v["--win"]).toBe("#141618");
    expect(v["--text"]).toBe("#EAECEE");
    expect(v["--font"]).toContain("Instrument Sans");
  });

  it("applies the selected accent for the theme", () => {
    const v = computeThemeVars({ ...base, accentIdx: 3 });
    // Batman accent index 3 is Roxo.
    expect(v["--accent"]).toBe("#B79AE0");
  });

  it("clamps an out-of-range accent index", () => {
    const v = computeThemeVars({ ...base, accentIdx: 99 });
    const accents = PALETTES.escuro.accents;
    expect(v["--accent"]).toBe(accents[accents.length - 1][1]);
  });

  it("makes main neutral in the branching (grafo) tree style", () => {
    const v = computeThemeVars({ ...base, treeStyle: "grafo" });
    expect(v["--l0"]).toBe(v["--text"]);
    expect(v["--leaf"]).toBe(v["--text"]);
  });

  it("recolours branch lanes with a branch palette (dark variant)", () => {
    const v = computeThemeVars({ ...base, branchColor: "oceano" });
    expect(v["--l1"]).toBe("#4EA8FF");
    expect(v["--l2"]).toBe("#3DD6D0");
  });

  it("uses the light branch variant on a light theme", () => {
    const v = computeThemeVars({ ...base, theme: "claro", branchColor: "oceano" });
    expect(v["--l1"]).toBe("#1F78E0");
  });
});

// WCAG 2.x relative-luminance contrast ratio, used only to pin the AA intent
// documented in PALETTES' --muted comments (see docs/design-v2/.../tokens/colors.css
// for the raw V2 values these deliberately diverge from).
function contrast(hexA: string, hexB: string): number {
  const luminance = (hex: string) => {
    const h = hex.replace("#", "");
    const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
    const f = (c: number) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  };
  const [l1, l2] = [luminance(hexA), luminance(hexB)].sort((a, b) => b - a);
  return (l1 + 0.05) / (l2 + 0.05);
}

describe("PALETTES: V2 color-role values (tokens/colors.css)", () => {
  it("claro matches the V2 classic palette value-for-value", () => {
    const v = PALETTES.claro.vars;
    expect(v["--win"]).toBe("#FFFFFF");
    expect(v["--panel"]).toBe("#FAFAF7");
    expect(v["--border"]).toBe("#E7E7E0");
    expect(v["--text"]).toBe("#191C1A");
    expect(v["--l0"]).toBe("#3B7A57");
    expect(v["--l1"]).toBe("#4E76A8");
    expect(v["--l2"]).toBe("#B08540");
  });

  it("escuro (batman), gitclassic and nipon match their V2 palettes value-for-value", () => {
    expect(PALETTES.escuro.vars["--win"]).toBe("#141618");
    expect(PALETTES.escuro.vars["--l0"]).toBe("#82C99B");
    expect(PALETTES.gitclassic.vars["--win"]).toBe("#0D1117");
    expect(PALETTES.gitclassic.vars["--l1"]).toBe("#58A6FF");
    expect(PALETTES.nipon.vars["--win"]).toBe("#FFFFFF");
    expect(PALETTES.nipon.vars["--l0"]).toBe("#C96C93");
  });

  it("keeps --muted more accessible than the raw V2 spec value in every theme (AA intent)", () => {
    // Raw V2 --muted values (tokens/colors.css) measure ~3.0-4.1:1 against
    // --win, below the 4.5:1 small-text AA target; V1 deliberately
    // darkened/lightened them (see the per-theme comments in PALETTES) and
    // that adjustment must survive the V2 token adoption.
    const rawV2Muted = { claro: "#90968F", escuro: "#61686E", gitclassic: "#6E7681", nipon: "#A08F92" } as const;
    for (const key of ["claro", "escuro", "gitclassic", "nipon"] as const) {
      const win = PALETTES[key].vars["--win"];
      const kept = contrast(PALETTES[key].vars["--muted"], win);
      const raw = contrast(rawV2Muted[key], win);
      expect(kept).toBeGreaterThan(raw);
      expect(kept).toBeGreaterThanOrEqual(4.2);
    }
  });
});
