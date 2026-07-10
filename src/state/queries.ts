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
} from "../lib/api";

export const queryKeys = {
  status: (path: string) => ["status", path] as const,
  log: (path: string) => ["log", path] as const,
  diff: (path: string, file: string, staged: boolean) =>
    ["diff", path, file, staged] as const,
  commit: (path: string, hash: string) => ["commit", path, hash] as const,
  branches: (path: string) => ["branches", path] as const,
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
