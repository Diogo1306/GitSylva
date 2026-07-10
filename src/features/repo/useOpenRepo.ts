import { useState } from "react";
import { openRepo } from "../../lib/api";
import type { RepoInfo } from "../../lib/types";
import { useAppStore } from "../../state/appStore";
import { useRecentsStore } from "../../state/recentsStore";

// Opens a repository, sets it as current, and records it in recents. Shared by
// the welcome screen, the titlebar "+", and the repo picker (open / init / clone).
export function useOpenRepo() {
  const setRepo = useAppStore((s) => s.setRepo);
  const record = useRecentsStore((s) => s.record);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Adopt an already-resolved RepoInfo (e.g. from init/clone).
  function adopt(info: RepoInfo) {
    setRepo(info);
    record(info);
  }

  async function open(path: string): Promise<boolean> {
    return run(() => openRepo(path));
  }

  // Runs a producer of RepoInfo, adopting it on success.
  async function run(producer: () => Promise<RepoInfo>): Promise<boolean> {
    setError(null);
    setBusy(true);
    try {
      adopt(await producer());
      return true;
    } catch (e: unknown) {
      setError((e as { message?: string })?.message ?? "não foi possível abrir o repositório");
      return false;
    } finally {
      setBusy(false);
    }
  }

  return { open, run, busy, error, setError };
}
