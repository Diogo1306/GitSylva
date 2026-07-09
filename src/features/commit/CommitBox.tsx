import { useState } from "react";
import { useAppStore } from "../../state/appStore";
import { useCommit } from "../../state/queries";
import { Button } from "../../components/Button";

export function CommitBox() {
  const repo = useAppStore((s) => s.repo)!;
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const commit = useCommit(repo.path);

  function handleCommit() {
    setError(null);
    commit.mutate(message, {
      onSuccess: () => setMessage(""),
      onError: (e: any) => setError(e?.message ?? "could not commit"),
    });
  }

  return (
    <div
      style={{
        borderTop: "1px solid var(--border)",
        padding: 12,
        display: "grid",
        gap: 8,
        background: "var(--bg-panel)",
      }}
    >
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Commit message"
        rows={3}
        style={{
          resize: "vertical",
          padding: 10,
          borderRadius: "var(--radius-sm)",
          border: "1px solid var(--border)",
          background: "var(--bg)",
          color: "var(--text)",
          font: "inherit",
          fontFamily: "var(--font-mono)",
          fontSize: 13,
        }}
      />
      {error && <div style={{ color: "var(--danger)", fontSize: 13 }}>{error}</div>}
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <Button
          variant="primary"
          disabled={commit.isPending || message.trim() === ""}
          onClick={handleCommit}
        >
          {commit.isPending ? "Committing..." : "Commit"}
        </Button>
      </div>
    </div>
  );
}
