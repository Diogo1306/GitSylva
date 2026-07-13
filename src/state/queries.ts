import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useAppStore } from "./appStore";
import { useThemeStore } from "./themeStore";
import {
  getStatus,
  stageFile,
  unstageFile,
  stageAll,
  discardFile,
  discardAll as discardAllApi,
  commit,
  getLog,
  getDiff,
  applyHunk,
  commitDetail,
  listBranches,
  checkoutBranch,
  createBranch,
  mergeBranch,
  deleteBranch,
  renameBranch,
  resetTo,
  cherryPick,
  rebase,
  listStashes,
  createStash,
  applyStash,
  dropStash,
  listTags,
  createTag,
  deleteTag,
  fetchRemote,
  syncStatus,
  pull,
  push,
  outgoing,
  incoming,
  getIdentity,
  setIdentity,
  blame,
  conflictState,
  resolveUse,
  markResolved,
  continueOp,
  abortOp,
} from "../lib/api";
import type { ConflictKind } from "../lib/types";

export const queryKeys = {
  status: (path: string) => ["status", path] as const,
  log: (path: string) => ["log", path] as const,
  diff: (path: string, file: string, staged: boolean) =>
    ["diff", path, file, staged] as const,
  commit: (path: string, hash: string) => ["commit", path, hash] as const,
  branches: (path: string) => ["branches", path] as const,
  stashes: (path: string) => ["stashes", path] as const,
  tags: (path: string) => ["tags", path] as const,
  sync: (path: string) => ["sync", path] as const,
  identity: (path: string) => ["identity", path] as const,
};

export function useStatus(path: string) {
  return useQuery({
    queryKey: queryKeys.status(path),
    queryFn: () => getStatus(path),
  });
}

export function useLog(path: string, limit = 200) {
  return useQuery({
    // The limit is part of the key ("load more" grows it); invalidations use
    // the ["log", path] prefix and still hit every limit.
    queryKey: [...queryKeys.log(path), limit],
    queryFn: () => getLog(path, limit),
    // Keep showing the previous page while a bigger one loads.
    placeholderData: (prev) => prev,
  });
}

export function useDiff(path: string, file: string | null, staged: boolean) {
  return useQuery({
    queryKey: queryKeys.diff(path, file ?? "", staged),
    queryFn: () => getDiff(path, file as string, staged),
    enabled: file !== null,
  });
}

export function useCommitDetail(path: string, hash: string | null) {
  return useQuery({
    queryKey: queryKeys.commit(path, hash ?? ""),
    queryFn: () => commitDetail(path, hash as string),
    enabled: hash !== null,
  });
}

export function useBranches(path: string) {
  return useQuery({
    queryKey: queryKeys.branches(path),
    queryFn: () => listBranches(path),
  });
}

export function useBranchActions(path: string) {
  const qc = useQueryClient();
  const refresh = () => {
    for (const key of ["branches", "status", "log", "conflict"]) {
      qc.invalidateQueries({ queryKey: [key, path] });
    }
  };
  // Reflect the new HEAD branch in app state after a switch.
  const setCurrent = (name: string) => {
    const s = useAppStore.getState();
    if (s.repo) s.setRepo({ ...s.repo, current_branch: name });
  };
  return {
    checkout: useMutation({
      mutationFn: (name: string) => checkoutBranch(path, name),
      onSuccess: (_res, name) => {
        setCurrent(name);
        refresh();
      },
    }),
    create: useMutation({
      mutationFn: (v: { name: string; checkout: boolean }) => createBranch(path, v.name, v.checkout),
      onSuccess: (_res, v) => {
        if (v.checkout) setCurrent(v.name);
        refresh();
      },
    }),
    // A failed merge can still leave the repo mid-conflict, so refresh on error too.
    merge: useMutation({ mutationFn: (name: string) => mergeBranch(path, name), onSettled: refresh }),
    remove: useMutation({
      mutationFn: (v: { name: string; force: boolean }) => deleteBranch(path, v.name, v.force),
      onSuccess: refresh,
    }),
    rename: useMutation({
      mutationFn: (v: { old: string; name: string }) => renameBranch(path, v.old, v.name),
      onSuccess: refresh,
    }),
  };
}

// History rewrite operations (reset/cherry-pick/rebase). They refresh on
// settle (not just success): a conflicting cherry-pick/rebase leaves the repo
// mid-operation and the UI must reflect that.
export function useRewriteActions(path: string) {
  const qc = useQueryClient();
  const refresh = () => {
    for (const key of ["status", "log", "branches", "conflict"]) {
      qc.invalidateQueries({ queryKey: [key, path] });
    }
  };
  return {
    reset: useMutation({
      mutationFn: (v: { target: string; mode: "soft" | "mixed" | "hard" }) => resetTo(path, v.target, v.mode),
      onSettled: refresh,
    }),
    cherryPick: useMutation({ mutationFn: (hash: string) => cherryPick(path, hash), onSettled: refresh }),
    rebase: useMutation({ mutationFn: (onto: string) => rebase(path, onto), onSettled: refresh }),
  };
}

export function useStashes(path: string) {
  return useQuery({
    queryKey: queryKeys.stashes(path),
    queryFn: () => listStashes(path),
  });
}

export function useStashActions(path: string) {
  const qc = useQueryClient();
  const refresh = () => {
    for (const key of ["stashes", "status", "conflict"]) {
      qc.invalidateQueries({ queryKey: [key, path] });
    }
  };
  return {
    create: useMutation({
      mutationFn: (v: { message: string; keepIndex: boolean }) => createStash(path, v.message, v.keepIndex),
      onSuccess: refresh,
    }),
    // A conflicting apply still writes to the worktree — refresh on error too.
    apply: useMutation({ mutationFn: (index: number) => applyStash(path, index), onSettled: refresh }),
    drop: useMutation({ mutationFn: (index: number) => dropStash(path, index), onSuccess: refresh }),
  };
}

export function useTags(path: string) {
  return useQuery({
    queryKey: queryKeys.tags(path),
    queryFn: () => listTags(path),
  });
}

export function useSyncStatus(path: string) {
  return useQuery({
    queryKey: queryKeys.sync(path),
    queryFn: () => syncStatus(path),
  });
}

export function useIdentity(path: string) {
  return useQuery({
    queryKey: queryKeys.identity(path),
    queryFn: () => getIdentity(path),
  });
}

export function useConflictState(path: string) {
  return useQuery({ queryKey: ["conflict", path], queryFn: () => conflictState(path) });
}

export function useConflictActions(path: string) {
  const qc = useQueryClient();
  const refresh = () => {
    for (const key of ["conflict", "status", "log", "branches"]) {
      qc.invalidateQueries({ queryKey: [key, path] });
    }
  };
  return {
    resolve: useMutation({ mutationFn: (v: { file: string; side: "ours" | "theirs" }) => resolveUse(path, v.file, v.side), onSuccess: refresh }),
    markResolved: useMutation({ mutationFn: (file: string) => markResolved(path, file), onSuccess: refresh }),
    continue: useMutation({ mutationFn: (kind: ConflictKind) => continueOp(path, kind), onSettled: refresh }),
    abort: useMutation({ mutationFn: (kind: ConflictKind) => abortOp(path, kind), onSettled: refresh }),
  };
}

export function useBlame(path: string, file: string | null, enabled: boolean) {
  return useQuery({
    queryKey: ["blame", path, file ?? ""],
    queryFn: () => blame(path, file as string),
    enabled: enabled && file !== null,
  });
}

export function useSetIdentity(path: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { name: string; email: string }) => setIdentity(path, v.name, v.email),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.identity(path) }),
  });
}

export function useOutgoing(path: string, enabled: boolean) {
  return useQuery({ queryKey: ["outgoing", path], queryFn: () => outgoing(path), enabled });
}

export function useIncoming(path: string, enabled: boolean) {
  return useQuery({ queryKey: ["incoming", path], queryFn: () => incoming(path), enabled });
}

export function useSyncActions(path: string) {
  const qc = useQueryClient();
  // After a network op, everything local may have moved.
  const refresh = () => {
    for (const key of ["status", "log", "branches", "sync", "tags", "outgoing", "incoming", "conflict"]) {
      qc.invalidateQueries({ queryKey: [key, path] });
    }
  };
  return {
    fetch: useMutation({ mutationFn: () => fetchRemote(path), onSuccess: refresh }),
    // Pull uses the mode chosen in Settings (read at call time). A conflicting
    // pull (merge/rebase mode) leaves the repo mid-operation: refresh on error too.
    pull: useMutation({ mutationFn: () => pull(path, useThemeStore.getState().pullMode), onSettled: refresh }),
    push: useMutation({ mutationFn: () => push(path), onSuccess: refresh }),
  };
}

export function useTagActions(path: string) {
  const qc = useQueryClient();
  const refresh = () => {
    qc.invalidateQueries({ queryKey: queryKeys.tags(path) });
    qc.invalidateQueries({ queryKey: queryKeys.log(path) });
  };
  return {
    create: useMutation({
      mutationFn: (v: { name: string; message: string }) => createTag(path, v.name, v.message),
      onSuccess: refresh,
    }),
    remove: useMutation({ mutationFn: (name: string) => deleteTag(path, name), onSuccess: refresh }),
  };
}

export function useStageActions(path: string) {
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: queryKeys.status(path) });
    qc.invalidateQueries({ queryKey: ["diff", path] });
  };
  return {
    stage: useMutation({ mutationFn: (file: string) => stageFile(path, file), onSuccess: invalidate }),
    unstage: useMutation({ mutationFn: (file: string) => unstageFile(path, file), onSuccess: invalidate }),
    stageAll: useMutation({ mutationFn: () => stageAll(path), onSuccess: invalidate }),
    discard: useMutation({
      mutationFn: (v: { file: string; untracked: boolean }) => discardFile(path, v.file, v.untracked),
      onSettled: invalidate,
    }),
    // One backend call: reverts tracked worktree edits (keeps staged) and
    // removes untracked files/dirs. Never touches the index.
    discardAll: useMutation({ mutationFn: () => discardAllApi(path), onSettled: invalidate }),
  };
}

// Stage / unstage / discard a single hunk. `patch` comes from parseHunks; the
// diff (of the same file+staged combo) and status are refreshed afterwards.
export function useHunkActions(path: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { patch: string; cached: boolean; reverse: boolean }) =>
      applyHunk(path, v.patch, v.cached, v.reverse),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.status(path) });
      qc.invalidateQueries({ queryKey: ["diff", path] });
    },
  });
}

export function useCommit(path: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { message: string; amend: boolean }) => commit(path, v.message, v.amend),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.status(path) });
      qc.invalidateQueries({ queryKey: queryKeys.log(path) });
    },
  });
}
