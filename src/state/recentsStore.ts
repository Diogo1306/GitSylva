import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { RepoInfo } from "../lib/types";

export type RecentRepo = {
  path: string;
  name: string;
  branch: string;
};

type RecentsState = {
  recents: RecentRepo[];
  record: (repo: RepoInfo) => void;
  remove: (path: string) => void;
  clear: () => void;
};

function repoName(path: string): string {
  return path.replace(/[/\\]$/, "").split(/[/\\]/).pop() ?? path;
}

export const useRecentsStore = create<RecentsState>()(
  persist(
    (set) => ({
      recents: [],
      record: (repo) =>
        set((s) => {
          const entry: RecentRepo = {
            path: repo.path,
            name: repoName(repo.path),
            branch: repo.current_branch,
          };
          // Most-recent first, de-duplicated by path, capped.
          const rest = s.recents.filter((r) => r.path !== repo.path);
          return { recents: [entry, ...rest].slice(0, 12) };
        }),
      remove: (path) => set((s) => ({ recents: s.recents.filter((r) => r.path !== path) })),
      clear: () => set({ recents: [] }),
    }),
    { name: "gitsylva-recents" },
  ),
);
