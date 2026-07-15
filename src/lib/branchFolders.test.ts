import { describe, expect, it } from "vitest";
import { groupBranches } from "./branchFolders";
import type { BranchInfo } from "./types";

const b = (name: string, is_current = false): BranchInfo => ({
  name,
  is_current,
  is_remote: false,
  upstream: null,
  tip: "0123456789abcdef0123456789abcdef01234567",
});

describe("groupBranches", () => {
  it("groups slashed names under their prefix, keeping order of first appearance", () => {
    const groups = groupBranches([b("main", true), b("feature/a"), b("fix/x"), b("feature/b"), b("dev")]);
    expect(groups.map((g) => (g.kind === "folder" ? `${g.name}/ (${g.members.length})` : g.branch.name))).toEqual([
      "main",
      "feature/ (2)",
      "fix/ (1)",
      "dev",
    ]);
    const feature = groups[1];
    if (feature.kind !== "folder") throw new Error("expected folder");
    expect(feature.members.map((m) => m.name)).toEqual(["feature/a", "feature/b"]);
  });

  it("treats degenerate slashes as plain rows", () => {
    const groups = groupBranches([b("/estranha"), b("terminada/")]);
    expect(groups.every((g) => g.kind === "branch")).toBe(true);
  });

  it("empty input → empty output", () => {
    expect(groupBranches([])).toEqual([]);
  });
});
