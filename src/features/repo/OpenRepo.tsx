import { useState } from "react";
import { EmptyState } from "../../components/EmptyState";
import { pickFolder, openRepo } from "../../lib/api";
import { useAppStore } from "../../state/appStore";

export function OpenRepo() {
  const setRepo = useAppStore((s) => s.setRepo);
  const [error, setError] = useState<string | null>(null);

  async function handleOpen() {
    setError(null);
    const path = await pickFolder();
    if (!path) return;
    try {
      const info = await openRepo(path);
      setRepo(info);
    } catch (e: any) {
      setError(e?.message ?? "could not open repository");
    }
  }

  return (
    <>
      <EmptyState onOpen={handleOpen} />
      {error && (
        <div style={{ position: "fixed", bottom: 16, left: 16, color: "var(--danger)" }}>
          {error}
        </div>
      )}
    </>
  );
}
