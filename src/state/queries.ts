import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { getStatus, stageFile, unstageFile, stageAll, discardFile, commit, getLog, getDiff } from "../lib/api";

export const queryKeys = {
  status: (path: string) => ["status", path] as const,
  log: (path: string) => ["log", path] as const,
  diff: (path: string, file: string, staged: boolean) =>
    ["diff", path, file, staged] as const,
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
