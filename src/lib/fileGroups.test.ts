import { describe, expect, it } from "vitest";
import { groupFilesByFolder } from "./fileGroups";

const id = (p: string) => p;

describe("groupFilesByFolder", () => {
  it("folds a directory with more than 4 entries, keeping order of first appearance", () => {
    const files = ["a.txt", "src/1.ts", "src/2.ts", "src/3.ts", "src/4.ts", "src/5.ts", "docs/x.md"];
    const out = groupFilesByFolder(files, id);
    expect(out.map((g) => (g.kind === "folder" ? `${g.dir}(${g.items.length})` : g.item))).toEqual([
      "a.txt",
      "src(5)",
      "docs/x.md",
    ]);
  });

  it("exactly 4 entries stay flat", () => {
    const files = ["src/1.ts", "src/2.ts", "src/3.ts", "src/4.ts"];
    expect(groupFilesByFolder(files, id).every((g) => g.kind === "file")).toBe(true);
  });

  it("root files never fold, whatever their count", () => {
    const files = ["1.ts", "2.ts", "3.ts", "4.ts", "5.ts", "6.ts"];
    expect(groupFilesByFolder(files, id).every((g) => g.kind === "file")).toBe(true);
  });

  it("nested dirs count separately", () => {
    const files = ["src/a/1.ts", "src/a/2.ts", "src/a/3.ts", "src/a/4.ts", "src/a/5.ts", "src/b/1.ts"];
    const out = groupFilesByFolder(files, id);
    expect(out[0]).toMatchObject({ kind: "folder", dir: "src/a" });
    expect(out[1]).toMatchObject({ kind: "file", item: "src/b/1.ts" });
  });
});
