import { describe, it, expect } from "vitest";
import { parseHunks } from "./hunks";

const diff = `diff --git a/a.txt b/a.txt
index 111..222 100644
--- a/a.txt
+++ b/a.txt
@@ -1,2 +1,3 @@
 a
+ADDED
 b
@@ -10,2 +11,3 @@
 j
+ALSO
 k
`;

describe("parseHunks", () => {
  it("returns one patch per @@ block", () => {
    const hunks = parseHunks(diff);
    expect(hunks).toHaveLength(2);
    expect(hunks[0].header).toContain("@@ -1,2 +1,3 @@");
    expect(hunks[1].header).toContain("@@ -10,2 +11,3 @@");
  });

  it("each patch carries the file header and exactly one hunk", () => {
    const [first] = parseHunks(diff);
    expect(first.patch).toContain("--- a/a.txt");
    expect(first.patch).toContain("+++ b/a.txt");
    expect(first.patch).toContain("+ADDED");
    expect(first.patch).not.toContain("+ALSO");
    expect(first.patch.endsWith("\n")).toBe(true);
  });

  it("handles an empty diff", () => {
    expect(parseHunks("")).toEqual([]);
    expect(parseHunks("   ")).toEqual([]);
  });
});
