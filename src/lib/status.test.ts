import { describe, it, expect } from "vitest";
import { statusStyle } from "./status";

describe("statusStyle", () => {
  it("colours added and untracked green", () => {
    expect(statusStyle("A").color).toBe("var(--stAT)");
    expect(statusStyle("?").color).toBe("var(--stAT)");
  });
  it("colours deleted red", () => {
    expect(statusStyle("D").color).toBe("var(--stDT)");
  });
  it("colours modified/other amber", () => {
    expect(statusStyle("M").color).toBe("var(--stMT)");
    expect(statusStyle("R").color).toBe("var(--stMT)");
  });
});
