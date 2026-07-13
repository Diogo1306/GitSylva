import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { RepoInfo } from "../lib/types";

export type View = "working" | "history" | "stashes" | "settings" | "picker";
export type Modal = "branch" | "stash" | "tag" | "merge" | "pull" | "push" | null;

export type RepoGroup = { id: string; name: string; color: number; collapsed: boolean };

type AppState = {
  // All open repositories and the active one. `repo` mirrors the active repo so
  // existing code that reads `s.repo` keeps working; multi-repo tabs (B2) build
  // on `repos` / switchRepo / closeRepo.
  repos: RepoInfo[];
  repo: RepoInfo | null;
  // Optional grouping of the open repos (name + color), shown in the rail.
  groups: RepoGroup[];
  groupOf: Record<string, string | undefined>;
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
  // Refresh an open repo's info in place (never changes which repo is active).
  updateRepo: (oldPath: string, repo: RepoInfo) => void;
  switchRepo: (path: string) => void;
  closeRepo: (path: string) => void;
  addGroup: (name: string) => string;
  renameGroup: (id: string, name: string) => void;
  removeGroup: (id: string) => void;
  toggleGroupCollapsed: (id: string) => void;
  setRepoGroup: (path: string, groupId: string | undefined) => void;
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
  groups: [],
  groupOf: {},
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
  updateRepo: (oldPath, repo) =>
    set((s) => ({
      repos: s.repos.map((r) => (r.path === oldPath ? repo : r)),
      repo: s.repo?.path === oldPath ? repo : s.repo,
    })),
  switchRepo: (path) =>
    set((s) => {
      const found = s.repos.find((r) => r.path === path);
      return found ? { repo: found, selectedFile: null } : {};
    }),
  closeRepo: (path) =>
    set((s) => {
      const repos = s.repos.filter((r) => r.path !== path);
      const wasActive = s.repo?.path === path;
      const groupOf = { ...s.groupOf };
      delete groupOf[path];
      return {
        repos,
        groupOf,
        repo: wasActive ? repos[repos.length - 1] ?? null : s.repo,
        selectedFile: wasActive ? null : s.selectedFile,
      };
    }),
  addGroup: (name) => {
    const id = (globalThis.crypto?.randomUUID?.() ?? String(performance.now())).slice(0, 12);
    set((s) => ({ groups: [...s.groups, { id, name, color: s.groups.length % 3, collapsed: false }] }));
    return id;
  },
  renameGroup: (id, name) => set((s) => ({ groups: s.groups.map((g) => (g.id === id ? { ...g, name } : g)) })),
  removeGroup: (id) =>
    set((s) => {
      const groupOf = { ...s.groupOf };
      for (const k of Object.keys(groupOf)) if (groupOf[k] === id) groupOf[k] = undefined;
      return { groups: s.groups.filter((g) => g.id !== id), groupOf };
    }),
  toggleGroupCollapsed: (id) => set((s) => ({ groups: s.groups.map((g) => (g.id === id ? { ...g, collapsed: !g.collapsed } : g)) })),
  setRepoGroup: (path, groupId) => set((s) => ({ groupOf: { ...s.groupOf, [path]: groupId } })),
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
      // Only the open repos, grouping and the active one survive a restart;
      // transient UI state (view, selection, palette, modal) resets.
      partialize: (s) => ({ repos: s.repos, repo: s.repo, groups: s.groups, groupOf: s.groupOf }),
    },
  ),
);
