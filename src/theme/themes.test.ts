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
    expect(v["--font"]).toContain("Inter");
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
