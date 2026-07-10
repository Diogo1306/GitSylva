import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { RepoInfo } from "../lib/types";

export type View = "working" | "history" | "stashes" | "settings" | "picker";
export type Modal = "branch" | "stash" | "tag" | "merge" | null;

type AppState = {
  // All open repositories and the active one. `repo` mirrors the active repo so
  // existing code that reads `s.repo` keeps working; multi-repo tabs (B2) build
  // on `repos` / switchRepo / closeRepo.
  repos: RepoInfo[];
  repo: RepoInfo | null;
  view: View;
  // The view to return to when leaving settings/picker.
  prevView: View;
  selectedFile: string | null;
  // Commit selected from the palette; History reads and clears it.
  focusCommit: string | null;
  paletteOpen: boolean;
  modal: Modal;
  // Open a repo (adds it if new, updates it if already open) and make it active.
  setRepo: (repo: RepoInfo | null) => void;
  switchRepo: (path: string) => void;
  closeRepo: (path: string) => void;
  setView: (view: View) => void;
  setSelectedFile: (file: string | null) => void;
  setFocusCommit: (hash: string | null) => void;
  setPaletteOpen: (open: boolean) => void;
  setModal: (modal: Modal) => void;
};

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
  repos: [],
  repo: null,
  view: "history",
  prevView: "history",
  selectedFile: null,
  focusCommit: null,
  paletteOpen: false,
  modal: null,
  setRepo: (repo) =>
    set((s) => {
      if (!repo) return { repo: null, selectedFile: null };
      const exists = s.repos.some((r) => r.path === repo.path);
      const repos = exists ? s.repos.map((r) => (r.path === repo.path ? repo : r)) : [...s.repos, repo];
      return { repos, repo, selectedFile: null };
    }),
  switchRepo: (path) =>
    set((s) => {
      const found = s.repos.find((r) => r.path === path);
      return found ? { repo: found, selectedFile: null } : {};
    }),
  closeRepo: (path) =>
    set((s) => {
      const repos = s.repos.filter((r) => r.path !== path);
      const wasActive = s.repo?.path === path;
      return {
        repos,
        repo: wasActive ? repos[repos.length - 1] ?? null : s.repo,
        selectedFile: wasActive ? null : s.selectedFile,
      };
    }),
  setView: (view) =>
    set((s) => ({
      view,
      prevView: view !== "settings" && view !== "picker" ? view : s.prevView,
    })),
  setSelectedFile: (selectedFile) => set({ selectedFile }),
  setFocusCommit: (focusCommit) => set({ focusCommit }),
  setPaletteOpen: (paletteOpen) => set({ paletteOpen }),
  setModal: (modal) => set({ modal }),
    }),
    {
      name: "gitsylva-open-repos",
      // Only the open repos and the active one survive a restart; transient UI
      // state (view, selection, palette, modal) resets.
      partialize: (s) => ({ repos: s.repos, repo: s.repo }),
    },
  ),
);
