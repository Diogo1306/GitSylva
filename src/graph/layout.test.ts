import { describe, it, expect } from "vitest";
import { graphRows } from "./layout";
import type { Commit } from "../lib/types";

function c(hash: string, parents: string[]): Commit {
  return { hash, parents, author: "", email: "", date: "", subject: "", refs: "" };
}

describe("graphRows", () => {
  it("assigns a second lane on a branch", () => {
    // m merges a and b; b's line gets its own lane.
    const commits = [c("m", ["a", "b"]), c("b", ["root"]), c("a", ["root"]), c("root", [])];
    const rows = graphRows(commits);
    expect(rows[0].lane).toBe(0);
    expect(rows.find((r) => r.commit.hash === "b")!.lane).toBeGreaterThan(0);
  });

  it("handles octopus merges (3+ parents)", () => {
    const commits = [
      c("m", ["a", "b", "x"]),
      c("x", ["root"]),
      c("b", ["root"]),
      c("a", ["root"]),
      c("root", []),
    ];
    const rows = graphRows(commits);
    expect(rows[0].merge).toBe(true);
    expect(rows[0].parentRows.sort()).toEqual([1, 2, 3]);
    // The three parent lines occupy three distinct lanes.
    const lanes = new Set(rows.slice(1, 4).map((r) => r.lane));
    expect(lanes.size).toBe(3);
  });
  it("keeps linear history in lane 0 with parent row links", () => {
    const commits = [c("c", ["b"]), c("b", ["a"]), c("a", [])];
    const rows = graphRows(commits);
    expect(rows.map((r) => r.lane)).toEqual([0, 0, 0]);
    expect(rows[0].parentRows).toEqual([1]);
    expect(rows[1].parentRows).toEqual([2]);
    expect(rows[0].merge).toBe(false);
  });

  it("flags merges and resolves both parents to rows", () => {
    const commits = [c("m", ["a", "b"]), c("b", ["root"]), c("a", ["root"]), c("root", [])];
    const rows = graphRows(commits);
    expect(rows[0].merge).toBe(true);
    // both parents (a at row 2, b at row 1) are resolved
    expect(rows[0].parentRows.sort()).toEqual([1, 2]);
  });

  it("drops parents that fall outside the loaded window", () => {
    const commits = [c("c", ["missing"])];
    const rows = graphRows(commits);
    expect(rows[0].parentRows).toEqual([]);
  });

  it("a fork keeps the child's lane reserved down to the fork row", () => {
    // f branches from root (which main's line also reaches); a NEW tip (t)
    // appearing between them must NOT be given f's lane — the renderer draws
    // f's line all the way down to root.
    const commits = [
      c("m2", ["m1"]), // main tip, lane 0
      c("f", ["root"]), // fork child, lane 1 (line runs down to root)
      c("t", ["m1"]), // another fork child appearing later
      c("m1", ["root"]),
      c("root", []),
    ];
    const rows = graphRows(commits);
    const laneOf = (h: string) => rows.find((r) => r.commit.hash === h)!.lane;
    expect(laneOf("m2")).toBe(0);
    expect(laneOf("f")).toBe(1);
    // t must take a THIRD lane: lane 1 is still occupied by f's line.
    expect(laneOf("t")).toBe(2);
    // The fork point lands on the lowest waiting lane (the trunk).
    expect(laneOf("root")).toBe(0);
    expect(laneOf("m1")).toBe(0);
  });

  it("two children of the same commit keep distinct lines until the fork", () => {
    const commits = [c("a", ["root"]), c("b", ["root"]), c("root", [])];
    const rows = graphRows(commits);
    expect(rows[0].lane).toBe(0);
    expect(rows[1].lane).toBe(1);
    expect(rows[2].lane).toBe(0);
  });
});
