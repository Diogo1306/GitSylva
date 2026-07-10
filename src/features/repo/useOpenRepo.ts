import { useState } from "react";
import { openRepo } from "../../lib/api";
import { useAppStore } from "../../state/appStore";
import { useRecentsStore } from "../../state/recentsStore";

// Opens a repository by path, sets it as current, and records it in recents.
// Shared by the welcome screen, the titlebar "+", and the repo picker.
export function useOpenRepo() {
  const setRepo = useAppStore((s) => s.setRepo);
  const record = useRecentsStore((s) => s.record);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function open(path: string): Promise<boolean> {
    setError(null);
    setBusy(true);
    try {
      const info = await openRepo(path);
      setRepo(info);
      record(info);
      return true;
    } catch (e: unknown) {
      setError((e as { message?: string })?.message ?? "não foi possível abrir o repositório");
      return false;
    } finally {
      setBusy(false);
    }
  }

  return { open, busy, error, setError };
}
