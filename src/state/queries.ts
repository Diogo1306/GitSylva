import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useAppStore } from "./appStore";
import {
  getStatus,
  stageFile,
  unstageFile,
  stageAll,
  discardFile,
  commit,
  getLog,
  getDiff,
  commitDetail,
  listBranches,
  checkoutBranch,
  createBranch,
  mergeBranch,
  deleteBranch,
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
  getIdentity,
  setIdentity,
} from "../lib/api";

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
    queryKey: queryKeys.log(path),
    queryFn: () => getLog(path, limit),
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
    qc.invalidateQueries({ queryKey: queryKeys.branches(path) });
    qc.invalidateQueries({ queryKey: queryKeys.status(path) });
    qc.invalidateQueries({ queryKey: queryKeys.log(path) });
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
    merge: useMutation({ mutationFn: (name: string) => mergeBranch(path, name), onSuccess: refresh }),
    remove: useMutation({
      mutationFn: (v: { name: string; force: boolean }) => deleteBranch(path, v.name, v.force),
      onSuccess: refresh,
    }),
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
    qc.invalidateQueries({ queryKey: queryKeys.stashes(path) });
    qc.invalidateQueries({ queryKey: queryKeys.status(path) });
  };
  return {
    create: useMutation({
      mutationFn: (v: { message: string; keepIndex: boolean }) => createStash(path, v.message, v.keepIndex),
      onSuccess: refresh,
    }),
    apply: useMutation({ mutationFn: (index: number) => applyStash(path, index), onSuccess: refresh }),
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

export function useSetIdentity(path: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { name: string; email: string }) => setIdentity(path, v.name, v.email),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.identity(path) }),
  });
}

export function useSyncActions(path: string) {
  const qc = useQueryClient();
  // After a network op, everything local may have moved.
  const refresh = () => {
    for (const key of ["status", "log", "branches", "sync", "tags"]) {
      qc.invalidateQueries({ queryKey: [key, path] });
    }
  };
  return {
    fetch: useMutation({ mutationFn: () => fetchRemote(path), onSuccess: refresh }),
    pull: useMutation({ mutationFn: () => pull(path), onSuccess: refresh }),
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
  const invalidate = () => qc.invalidateQueries({ queryKey: queryKeys.status(path) });
  return {
    stage: useMutation({ mutationFn: (file: string) => stageFile(path, file), onSuccess: invalidate }),
    unstage: useMutation({ mutationFn: (file: string) => unstageFile(path, file), onSuccess: invalidate }),
    stageAll: useMutation({ mutationFn: () => stageAll(path), onSuccess: invalidate }),
    discard: useMutation({
      mutationFn: (v: { file: string; untracked: boolean }) => discardFile(path, v.file, v.untracked),
      onSuccess: invalidate,
    }),
  };
}

export function useCommit(path: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (message: string) => commit(path, message),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.status(path) });
      qc.invalidateQueries({ queryKey: queryKeys.log(path) });
    },
  });
}
