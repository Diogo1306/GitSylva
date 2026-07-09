import { useMemo, useState } from "react";
import { useAppStore } from "../../state/appStore";
import { useLog } from "../../state/queries";
import { layoutGraph } from "../../graph/layout";
import { CommitGraph } from "../../components/CommitGraph";

export function History() {
  const repo = useAppStore((s) => s.repo)!;
  const setSelectedFile = useAppStore((s) => s.setSelectedFile);
  const { data, isLoading, error } = useLog(repo.path);
  const [selectedHash, setSelectedHash] = useState<string | null>(null);

  const rows = useMemo(() => layoutGraph(data ?? []), [data]);

  if (isLoading) return <div style={{ padding: 16 }}>Loading history...</div>;
  if (error) return <div style={{ padding: 16, color: "var(--danger)" }}>{String(error)}</div>;
  if (rows.length === 0) return <div style={{ padding: 16, color: "var(--text-muted)" }}>No commits yet.</div>;

  const selected = rows.find((r) => r.commit.hash === selectedHash)?.commit ?? null;

  return (
    <div style={{ display: "flex", height: "100%" }}>
      <div style={{ flex: 1, overflow: "auto", padding: 12 }}>
        <CommitGraph
          rows={rows}
          selected={selectedHash}
          onSelect={(hash) => {
            setSelectedHash(hash);
            setSelectedFile(null);
          }}
        />
      </div>
      {selected && (
        <div
          style={{
            width: 320,
            borderLeft: "1px solid var(--border)",
            padding: 16,
            background: "var(--bg-panel)",
            overflow: "auto",
          }}
        >
          <div style={{ fontWeight: 600, marginBottom: 8 }}>{selected.subject}</div>
          <div style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)", fontSize: 12 }}>
            {selected.hash}
          </div>
          <div style={{ marginTop: 12, fontSize: 13 }}>
            {selected.author} &lt;{selected.email}&gt;
          </div>
          <div style={{ color: "var(--text-muted)", fontSize: 12, marginTop: 4 }}>{selected.date}</div>
          {selected.refs && (
            <div style={{ marginTop: 8, color: "var(--accent)", fontSize: 12 }}>{selected.refs}</div>
          )}
        </div>
      )}
    </div>
  );
}
