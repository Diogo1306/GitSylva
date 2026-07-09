import { useState } from "react";
import { useAppStore } from "../../state/appStore";
import { useStatus, useStageActions } from "../../state/queries";
import { FileRow } from "../../components/FileRow";
import { Button } from "../../components/Button";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { CommitBox } from "../commit/CommitBox";

export function WorkingCopy() {
  const repo = useAppStore((s) => s.repo)!;
  const selectedFile = useAppStore((s) => s.selectedFile);
  const setSelectedFile = useAppStore((s) => s.setSelectedFile);
  const { data, isLoading, error } = useStatus(repo.path);
  const actions = useStageActions(repo.path);
  const [pendingDiscard, setPendingDiscard] = useState<{ file: string; untracked: boolean } | null>(null);

  if (isLoading) return <div style={{ padding: 16 }}>Loading changes...</div>;
  if (error) return <div style={{ padding: 16, color: "var(--danger)" }}>{String(error)}</div>;

  const files = data ?? [];
  const staged = files.filter((f) => f.index_status !== "." && f.index_status !== "?");
  const unstaged = files.filter((f) => f.worktree_status !== ".");

  // Small buttons stop propagation so a click acts without also selecting the row.
  const rowButton = (label: string, onClick: () => void) => (
    <Button
      style={{ padding: "2px 8px", fontSize: 12 }}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
    >
      {label}
    </Button>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 12,
          padding: 12,
          flex: 1,
          overflow: "auto",
        }}
      >
        <section>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h3>Staged</h3>
        </div>
        {staged.map((f) => (
          <FileRow
            key={f.path}
            path={f.path}
            status={f.index_status}
            selected={selectedFile === f.path}
            onSelect={() => setSelectedFile(f.path)}
            action={rowButton("Unstage", () => actions.unstage.mutate(f.path))}
          />
        ))}
      </section>
      <section>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h3>Changes</h3>
          <Button style={{ padding: "2px 8px", fontSize: 12 }} onClick={() => actions.stageAll.mutate()}>
            Stage all
          </Button>
        </div>
        {unstaged.map((f) => (
          <FileRow
            key={f.path}
            path={f.path}
            status={f.worktree_status}
            selected={selectedFile === f.path}
            onSelect={() => setSelectedFile(f.path)}
            action={
              <div style={{ display: "flex", gap: 6 }}>
                {rowButton("Stage", () => actions.stage.mutate(f.path))}
                {rowButton("Discard", () =>
                  setPendingDiscard({ file: f.path, untracked: f.worktree_status === "?" })
                )}
              </div>
            }
          />
        ))}
      </section>
      </div>

      <CommitBox />

      {pendingDiscard && (
        <ConfirmDialog
          message={`Discard changes to ${pendingDiscard.file}? This cannot be undone.`}
          onCancel={() => setPendingDiscard(null)}
          onConfirm={() => {
            actions.discard.mutate(pendingDiscard);
            setPendingDiscard(null);
          }}
        />
      )}
    </div>
  );
}
