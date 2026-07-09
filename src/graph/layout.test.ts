import { describe, it, expect } from "vitest";
import { layoutGraph } from "./layout";
import type { Commit } from "../lib/types";

function c(hash: string, parents: string[]): Commit {
  return { hash, parents, author: "", email: "", date: "", subject: "", refs: "" };
}

describe("layoutGraph", () => {
  it("puts a linear history in a single lane", () => {
    const commits = [c("c", ["b"]), c("b", ["a"]), c("a", [])];
    const rows = layoutGraph(commits);
    expect(rows.map((r) => r.lane)).toEqual([0, 0, 0]);
  });

  it("assigns a second lane on a branch", () => {
    // m merges b and a. b and a are separate lines.
    const commits = [c("m", ["a", "b"]), c("b", ["root"]), c("a", ["root"]), c("root", [])];
    const rows = layoutGraph(commits);
    expect(rows[0].lane).toBe(0);
    // b takes a new lane because it is the second parent branch
    expect(rows.find((r) => r.commit.hash === "b")!.lane).toBeGreaterThan(0);
  });
});
