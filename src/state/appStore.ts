import { create } from "zustand";
import type { RepoInfo } from "../lib/types";

export type View = "working" | "history" | "stashes" | "settings" | "picker";

type AppState = {
  repo: RepoInfo | null;
  view: View;
  // The view to return to when leaving settings.
  prevView: View;
  selectedFile: string | null;
  // Commit selected from the palette; History reads and clears it.
  focusCommit: string | null;
  paletteOpen: boolean;
  setRepo: (repo: RepoInfo | null) => void;
  setView: (view: View) => void;
  setSelectedFile: (file: string | null) => void;
  setFocusCommit: (hash: string | null) => void;
  setPaletteOpen: (open: boolean) => void;
};

export const useAppStore = create<AppState>((set) => ({
  repo: null,
  view: "history",
  prevView: "history",
  selectedFile: null,
  focusCommit: null,
  paletteOpen: false,
  setRepo: (repo) => set({ repo, selectedFile: null }),
  setView: (view) =>
    set((s) => ({
      view,
      prevView: view !== "settings" ? view : s.prevView,
    })),
  setSelectedFile: (selectedFile) => set({ selectedFile }),
  setFocusCommit: (focusCommit) => set({ focusCommit }),
  setPaletteOpen: (paletteOpen) => set({ paletteOpen }),
}));
