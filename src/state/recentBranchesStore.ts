import { create } from "zustand";
import { persist } from "zustand/middleware";

// Recently checked-out branches (Task 10 — sidebar scaling): a small
// persisted MRU list surfaced at the top of the sidebar's branch area so the
// branches you actually work with stay easy to find without hunting through
// a folder that may hold hundreds of entries. Keyed by repo path (branch
// names collide across repos; recents from one repo are noise in another).

type RecentBranchesState = {
  byRepo: Record<string, string[]>;
  /** Pushes `name` to the front of `repoPath`'s list, de-duplicated, capped. */
  record: (repoPath: string, name: string) => void;
  clear: (repoPath: string) => void;
};

// Small on purpose — this is a quick-access shortcut, not a full history.
const MAX_RECENT = 5;

export const useRecentBranchesStore = create<RecentBranchesState>()(
  persist(
    (set) => ({
      byRepo: {},
      record: (repoPath, name) =>
        set((s) => {
          const rest = (s.byRepo[repoPath] ?? []).filter((n) => n !== name);
          return { byRepo: { ...s.byRepo, [repoPath]: [name, ...rest].slice(0, MAX_RECENT) } };
        }),
      clear: (repoPath) => set((s) => ({ byRepo: { ...s.byRepo, [repoPath]: [] } })),
    }),
    { name: "gitsylva-recent-branches", version: 0 },
  ),
);
