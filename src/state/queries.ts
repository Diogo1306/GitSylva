import { useQuery } from "@tanstack/react-query";
import { getStatus } from "../lib/api";

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
