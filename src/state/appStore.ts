import { create } from "zustand";
import type { RepoInfo } from "../lib/types";

export type View = "working" | "history" | "stashes" | "settings" | "picker";

type AppState = {
  repo: RepoInfo | null;
  view: View;
  // The view to return to when leaving settings.
  prevView: View;
  selectedFile: string | null;
  setRepo: (repo: RepoInfo | null) => void;
  setView: (view: View) => void;
  setSelectedFile: (file: string | null) => void;
};

export const useAppStore = create<AppState>((set) => ({
  repo: null,
  view: "history",
  prevView: "history",
  selectedFile: null,
  setRepo: (repo) => set({ repo, selectedFile: null }),
  setView: (view) =>
    set((s) => ({
      view,
      prevView: view !== "settings" ? view : s.prevView,
    })),
  setSelectedFile: (selectedFile) => set({ selectedFile }),
}));
