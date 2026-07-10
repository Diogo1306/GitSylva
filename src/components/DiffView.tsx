import { useState } from "react";
import { DiffLines } from "./DiffLines";
import { DiffSplit } from "./DiffSplit";

// Diff with a unified/side-by-side toggle. The mode is remembered per session
// via a module-level default so switching files keeps the chosen view.
let lastMode: "unified" | "split" = "unified";

export function DiffView({ patch, fontSize }: { patch: string; fontSize?: number }) {
  const [mode, setMode] = useState<"unified" | "split">(lastMode);
  const set = (m: "unified" | "split") => {
    lastMode = m;
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
      {mode === "split" ? <DiffSplit patch={patch} /> : <DiffLines patch={patch} fontSize={fontSize} />}
    </div>
  );
}
