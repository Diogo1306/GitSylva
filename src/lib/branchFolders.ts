import type { BranchInfo } from "./types";

// Folder-style grouping for branch lists: names with a "/" group under the
// segment before the first slash (feature/x, feature/y → pasta "feature"),
// like the big git clients. Order is preserved by first appearance, so the
// backend's most-recent-activity sort still decides what shows up first.

export type BranchGroup =
  | { kind: "branch"; branch: BranchInfo }
  | { kind: "folder"; name: string; members: BranchInfo[] };

export function groupBranches(branches: BranchInfo[]): BranchGroup[] {
  const out: BranchGroup[] = [];
  const folders = new Map<string, Extract<BranchGroup, { kind: "folder" }>>();
  for (const b of branches) {
    const slash = b.name.indexOf("/");
    // No slash (or a degenerate leading slash): plain row.
    if (slash <= 0 || slash === b.name.length - 1) {
      out.push({ kind: "branch", branch: b });
      continue;
    }
    const prefix = b.name.slice(0, slash);
    let folder = folders.get(prefix);
    if (!folder) {
      folder = { kind: "folder", name: prefix, members: [] };
      folders.set(prefix, folder);
      out.push(folder);
    }
    folder.members.push(b);
  }
  return out;
}
