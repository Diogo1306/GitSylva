import { useState } from "react";
import { DiffLines } from "./DiffLines";
import { DiffSplit } from "./DiffSplit";

// Diff with a unified/side-by-side toggle. The mode is remembered per session
// (sessionStorage) so switching files keeps the chosen view.
type DiffMode = "unified" | "split";
const MODE_KEY = "gitsylva-diff-mode";

export function DiffView({
  patch,
  fontSize,
  onStageHunk,
  stageLabel,
}: {
  patch: string;
  fontSize?: number;
  onStageHunk?: (hunkPatch: string) => void;
  stageLabel?: string;
}) {
  const [mode, setMode] = useState<DiffMode>(() =>
    sessionStorage.getItem(MODE_KEY) === "split" ? "split" : "unified",
  );
  const set = (m: DiffMode) => {
    sessionStorage.setItem(MODE_KEY, m);
    setMode(m);
  };

  const tab = (m: "unified" | "split", label: string) => (
    <div
      onClick={() => set(m)}
      style={{ padding: "3px 10px", borderRadius: 6, fontSize: 11.5, fontWeight: 600, cursor: "pointer", background: mode === m ? "var(--win)" : "transparent", color: mode === m ? "var(--text)" : "var(--muted)" }}
    >
      {label}
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: 0 }}>
      <div style={{ display: "flex", justifyContent: "flex-end", padding: "0 10px 6px" }}>
        <div style={{ display: "inline-flex", gap: 3, padding: 3, borderRadius: 8, background: "var(--panel2)", border: "1px solid var(--border)" }}>
          {tab("unified", "Unificado")}
          {tab("split", "Lado a lado")}
        </div>
      </div>
      {mode === "split" ? <DiffSplit patch={patch} /> : <DiffLines patch={patch} fontSize={fontSize} onStageHunk={onStageHunk} stageLabel={stageLabel} />}
    </div>
  );
}
