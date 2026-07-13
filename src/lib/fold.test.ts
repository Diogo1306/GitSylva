import { describe, it, expect } from "vitest";
import { fold, foldChars } from "./fold";

describe("fold", () => {
  it("is case-insensitive", () => {
    expect(fold("HISTÓRICO")).toBe(fold("histórico"));
  });

  it("ignores diacritics both ways", () => {
    expect(fold("Histórico")).toBe("historico");
    expect(fold("tradução")).toBe("traducao");
    expect(fold("historia")).toBe("historia");
  });

  it("matches accented text with unaccented queries", () => {
    expect(fold("Histórico").includes(fold("historic"))).toBe(true);
    expect(fold("Cópia de trabalho").includes(fold("copia"))).toBe(true);
  });
});

describe("foldChars", () => {
  it("keeps indexes aligned so highlights land correctly", () => {
    const label = "Histórico";
    const i = foldChars(label).indexOf(fold("torico"));
    expect(i).toBe(3);
    expect(Array.from(label).slice(i, i + 6).join("")).toBe("tórico");
  });
});
