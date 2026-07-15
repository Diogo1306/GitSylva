import { describe, it, expect } from "vitest";
import { statusStyle, isConflict } from "./status";

describe("statusStyle", () => {
  it("colours added and untracked green", () => {
    expect(statusStyle("A").color).toBe("var(--stAT)");
    expect(statusStyle("?").color).toBe("var(--stAT)");
  });
  it("colours deleted and conflicted red", () => {
    expect(statusStyle("D").color).toBe("var(--stDT)");
    expect(statusStyle("U").color).toBe("var(--stDT)");
  });
  it("colours modified/other amber", () => {
    expect(statusStyle("M").color).toBe("var(--stMT)");
    expect(statusStyle("R").color).toBe("var(--stMT)");
  });
});

describe("isConflict", () => {
  it("flags every porcelain unmerged combination", () => {
    expect(isConflict("U", "U")).toBe(true);
    expect(isConflict("A", "U")).toBe(true);
    expect(isConflict("U", "D")).toBe(true);
    expect(isConflict("A", "A")).toBe(true);
    expect(isConflict("D", "D")).toBe(true);
  });
  it("does not flag ordinary states", () => {
    expect(isConflict("M", ".")).toBe(false);
    expect(isConflict(".", "M")).toBe(false);
    expect(isConflict("A", ".")).toBe(false);
    expect(isConflict(".", "?")).toBe(false);
    expect(isConflict("D", ".")).toBe(false);
  });
});
