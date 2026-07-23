import { create } from "zustand";
import { persist } from "zustand/middleware";

// Pinned repos (V2 titlebar — repo dropdown's FIXADOS section): a small
// persisted set of repo paths the user pinned via the row's `…` menu. A
// pinned repo shows in FIXADOS while closed, or with a ★ in ABERTOS while
// open — RepoSelect decides which, this store only tracks membership.

type PinnedState = {
  pinned: string[];
  pin: (path: string) => void;
  unpin: (path: string) => void;
  isPinned: (path: string) => boolean;
};

export const usePinnedStore = create<PinnedState>()(
  persist(
    (set, get) => ({
      pinned: [],
      pin: (path) => set((s) => (s.pinned.includes(path) ? s : { pinned: [...s.pinned, path] })),
      unpin: (path) => set((s) => ({ pinned: s.pinned.filter((p) => p !== path) })),
      isPinned: (path) => get().pinned.includes(path),
    }),
    { name: "gitsylva-pinned", version: 0 },
  ),
);
