import { describe, it, expect } from "vitest";
import { classifyDiffLine, parseHunkHeader, gutterDigits, splitDiffByFile, patchForFile } from "./diffLine";

describe("classifyDiffLine", () => {
  it("classifies git file headers as meta", () => {
    expect(classifyDiffLine("--- a/src/x.ts")).toBe("meta");
    expect(classifyDiffLine("+++ b/src/x.ts")).toBe("meta");
    expect(classifyDiffLine("--- /dev/null")).toBe("meta");
    expect(classifyDiffLine("diff --git a/x b/x")).toBe("meta");
    expect(classifyDiffLine("index abc123..def456 100644")).toBe("meta");
    expect(classifyDiffLine("rename from old.txt")).toBe("meta");
    expect(classifyDiffLine("\\ No newline at end of file")).toBe("meta");
  });

  it("does NOT mistake removed/added content starting with --/++ for headers", () => {
    // A removed Markdown rule / CLI flag line is a deletion, not a header.
    expect(classifyDiffLine("--- título")).toBe("del");
    expect(classifyDiffLine("--force was removed")).toBe("del");
    expect(classifyDiffLine("+++x")).toBe("add");
    expect(classifyDiffLine("-- comentário SQL")).toBe("del");
  });

  it("classifies ordinary lines", () => {
    expect(classifyDiffLine("@@ -1,3 +1,4 @@")).toBe("hunk");
    expect(classifyDiffLine("+nova linha")).toBe("add");
    expect(classifyDiffLine("-linha antiga")).toBe("del");
    expect(classifyDiffLine(" contexto")).toBe("ctx");
  });
});

describe("parseHunkHeader", () => {
  it("reads starts and counts", () => {
    expect(parseHunkHeader("@@ -10,5 +12,7 @@ fn main()")).toEqual({ oldStart: 10, oldCount: 5, newStart: 12, newCount: 7 });
  });
  it("defaults omitted counts to 1", () => {
    expect(parseHunkHeader("@@ -3 +4 @@")).toEqual({ oldStart: 3, oldCount: 1, newStart: 4, newCount: 1 });
  });
  it("rejects non-headers", () => {
    expect(parseHunkHeader("+++ b/x")).toBeNull();
  });
});

describe("gutterDigits", () => {
  it("sizes the gutter for the largest line number", () => {
    expect(gutterDigits(["@@ -998,5 +1200,7 @@"])).toBe(4);
    expect(gutterDigits([" ctx only"])).toBe(2);
  });
});

describe("splitDiffByFile / patchForFile", () => {
  const combined =
    "diff --git a/src/a.ts b/src/a.ts\n" +
    "index 111..222 100644\n" +
    "--- a/src/a.ts\n" +
    "+++ b/src/a.ts\n" +
    "@@ -1 +1 @@\n" +
    "-a\n" +
    "+A\n" +
    "diff --git a/src/b.rs b/src/b.rs\n" +
    "new file mode 100644\n" +
    "index 0000000..333\n" +
    "--- /dev/null\n" +
    "+++ b/src/b.rs\n" +
    "@@ -0,0 +1 @@\n" +
    "+fn main() {}\n";

  it("splits a combined commit diff into one patch per file, keyed by the new path", () => {
    const files = splitDiffByFile(combined);
    expect(files.map((f) => f.path)).toEqual(["src/a.ts", "src/b.rs"]);
    expect(files[0].patch).toContain("+A");
    expect(files[0].patch).not.toContain("b.rs");
    expect(files[1].patch).toContain("fn main() {}");
  });

  it("returns a single file's patch by path (creation via /dev/null too)", () => {
    expect(patchForFile(combined, "src/a.ts")).toContain("+A");
    expect(patchForFile(combined, "src/b.rs")).toContain("fn main() {}");
    expect(patchForFile(combined, "does/not/exist")).toBe("");
  });

  it("returns [] for an empty diff", () => {
    expect(splitDiffByFile("")).toEqual([]);
  });
});
