// Split a unified diff for a single file into individually-applicable patches.
// Each hunk patch = the file header (everything before the first @@) plus one
// @@ block, which `git apply` accepts on its own.

export type Hunk = { header: string; patch: string };

export function parseHunks(diff: string): Hunk[] {
  if (!diff.trim()) return [];
  const lines = diff.replace(/\n$/, "").split("\n");
  const fileHeader: string[] = [];
  const blocks: string[][] = [];
  for (const line of lines) {
    if (line.startsWith("@@")) blocks.push([line]);
    else if (blocks.length === 0) fileHeader.push(line);
    else blocks[blocks.length - 1].push(line);
  }
  const head = fileHeader.join("\n");
  return blocks.map((block) => ({
    header: block[0],
    patch: `${head}\n${block.join("\n")}\n`,
  }));
}
