import { create } from "zustand";
import type { RepoInfo } from "../lib/types";

type View = "working" | "history";

type AppState = {
  repo: RepoInfo | null;
  view: View;
  selectedFile: string | null;
  setRepo: (repo: RepoInfo | null) => void;
  setView: (view: View) => void;
  setSelectedFile: (file: string | null) => void;
};

export const useAppStore = create<AppState>((set) => ({
  repo: null,
  view: "working",
  selectedFile: null,
  setRepo: (repo) => set({ repo, selectedFile: null }),
  setView: (view) => set({ view }),
  setSelectedFile: (selectedFile) => set({ selectedFile }),
}));
