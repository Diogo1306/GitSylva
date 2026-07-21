// Folder grouping for the working-copy file lists (user request R5.4): when a
// directory holds MORE THAN `min` changed entries, they gather under a folder
// header row (whose checkbox stages/unstages the whole folder) and indent;
// smaller directories stay as flat rows, in their original order.

export type FolderGroup<T> = { kind: "file"; item: T } | { kind: "folder"; dir: string; items: T[] };

export function groupFilesByFolder<T>(items: T[], pathOf: (t: T) => string, min = 4): FolderGroup<T>[] {
  const dirOf = (p: string) => p.split("/").slice(0, -1).join("/");
  const counts = new Map<string, number>();
  for (const it of items) {
    const dir = dirOf(pathOf(it));
    counts.set(dir, (counts.get(dir) ?? 0) + 1);
  }
  const out: FolderGroup<T>[] = [];
  const folders = new Map<string, Extract<FolderGroup<T>, { kind: "folder" }>>();
  for (const it of items) {
    const dir = dirOf(pathOf(it));
    // Root files ("" dir) never fold — there is no folder to name.
    if (dir && (counts.get(dir) ?? 0) > min) {
      let g = folders.get(dir);
      if (!g) {
        g = { kind: "folder", dir, items: [] };
        folders.set(dir, g);
        out.push(g);
      }
      g.items.push(it);
    } else {
      out.push({ kind: "file", item: it });
    }
  }
  return out;
}
