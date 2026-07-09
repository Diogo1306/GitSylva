import { useAppStore } from "../../state/appStore";
import { useStatus } from "../../state/queries";
import { FileRow } from "../../components/FileRow";

export function WorkingCopy() {
  const repo = useAppStore((s) => s.repo)!;
  const selectedFile = useAppStore((s) => s.selectedFile);
  const setSelectedFile = useAppStore((s) => s.setSelectedFile);
  const { data, isLoading, error } = useStatus(repo.path);

  if (isLoading) return <div style={{ padding: 16 }}>Loading changes...</div>;
  if (error) return <div style={{ padding: 16, color: "var(--danger)" }}>{String(error)}</div>;

  const files = data ?? [];
  const staged = files.filter((f) => f.index_status !== "." && f.index_status !== "?");
  const unstaged = files.filter((f) => f.worktree_status !== ".");

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, padding: 12 }}>
      <section>
        <h3>Staged</h3>
        {staged.map((f) => (
          <FileRow key={f.path} path={f.path} status={f.index_status}
            selected={selectedFile === f.path} onSelect={() => setSelectedFile(f.path)} />
        ))}
      </section>
      <section>
        <h3>Changes</h3>
        {unstaged.map((f) => (
          <FileRow key={f.path} path={f.path} status={f.worktree_status}
            selected={selectedFile === f.path} onSelect={() => setSelectedFile(f.path)} />
        ))}
      </section>
    </div>
  );
}
