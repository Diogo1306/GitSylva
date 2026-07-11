import { describe, it, expect } from "vitest";
import { relativeTime, initials, avatarColor, parseRefs, chipStyle } from "./format";

describe("relativeTime", () => {
  it("says agora for very recent times", () => {
    expect(relativeTime(new Date().toISOString())).toBe("agora");
  });
  it("reports minutes and hours", () => {
    const min = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    expect(relativeTime(min)).toBe("há 10 min");
    const hrs = new Date(Date.now() - 3 * 3600 * 1000).toISOString();
    expect(relativeTime(hrs)).toBe("há 3 h");
  });
  it("is empty for an invalid date", () => {
    expect(relativeTime("not-a-date")).toBe("");
  });
});

describe("initials", () => {
  it("takes first and last initials", () => {
    expect(initials("Ana Souza")).toBe("AS");
    expect(initials("Marco Duarte")).toBe("MD");
  });
  it("handles a single name", () => {
    expect(initials("cher")).toBe("CH");
  });
  it("falls back for empty", () => {
    expect(initials("   ")).toBe("?");
  });
});

describe("avatarColor", () => {
  it("is deterministic and one of the lane slots", () => {
    const a = avatarColor("Ana Souza");
    const b = avatarColor("Ana Souza");
    expect(a).toEqual(b);
    expect(a.color).toMatch(/var\(--l[012]\)/);
  });
});

describe("parseRefs", () => {
  it("classifies head, remote, tag and branch", () => {
    // A slash-less name is a local branch; anything with a slash is treated as
    // remote (parseRefs can't know local names like feature/x without remotes).
    const chips = parseRefs("HEAD -> main, origin/main, tag: v1.0, develop");
    expect(chips).toEqual([
      { label: "main", kind: "head" },
      { label: "origin/main", kind: "remote" },
      { label: "v1.0", kind: "tag" },
      { label: "develop", kind: "branch" },
    ]);
  });
  it("is empty when there are no refs", () => {
    expect(parseRefs("")).toEqual([]);
  });
});

describe("chipStyle", () => {
  it("gives distinct colours per kind", () => {
    expect(chipStyle("head").color).toBe("var(--l0)");
    expect(chipStyle("remote").color).toBe("var(--l1)");
    expect(chipStyle("tag").color).toBe("var(--badgeT)");
    expect(chipStyle("branch").color).toBe("var(--l2)");
  });
});
