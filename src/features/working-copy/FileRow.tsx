import { useState } from "react";
import { statusStyle, statusTitle } from "../../lib/status";
import { FileIcon } from "../../components/FileIcon";
import { useT } from "../../i18n";
import type { FileChange } from "../../lib/types";

const mono = "'JetBrains Mono', monospace";

function splitPath(p: string): { name: string; dir: string } {
  const parts = p.split("/");
  const name = parts.pop() ?? p;
  return { name, dir: parts.join("/") };
}

export function FileRow({
  file,
  letter,
  checked,
  selected,
  conflicted,
  stagger = 0,
  inFolder = false,
  onToggle,
  onSelect,
  onContext,
}: {
  file: FileChange;
  letter: string;
  checked: boolean;
  selected: boolean;
  conflicted?: boolean;
  /** Row index for the entrance stagger (animation spec §File stage/unstage). */
  stagger?: number;
  /** Nested under a folder header: indent and drop the dir subtitle. */
  inFolder?: boolean;
  onToggle: () => void;
  onSelect: () => void;
  onContext?: (x: number, y: number) => void;
}) {
  const t = useT();
  const st = statusStyle(letter);
  const { name, dir } = splitPath(file.path);
  // Frozen at mount: if the delay tracked the live index, staging a row above
  // would change this style and RESTART the entrance of every row below it.
  const [entranceDelay] = useState(() => Math.min(stagger * 22, 220));
  return (
    <div
      onClick={onSelect}
      onContextMenu={(e) => {
        e.preventDefault();
        onContext?.(e.clientX, e.clientY);
      }}
      className="gs-row"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 9,
        padding: inFolder ? "6px 8px 6px 30px" : "7px 8px",
        borderRadius: 8,
        cursor: "pointer",
        // Only set when selected — an inline "transparent" would beat the
        // .gs-row:hover background and kill the hover entirely.
        background: selected ? "var(--sel)" : undefined,
        // Small per-row stagger, capped so long lists never feel sluggish.
        animation: `fileIn 0.22s cubic-bezier(0.2, 0.9, 0.3, 1) ${entranceDelay}ms both`,
      }}
    >
      <div
        onClick={(e) => {
          e.stopPropagation();
          if (!conflicted) onToggle();
        }}
        title={conflicted ? t("workingCopy.file.conflictedTitle") : checked ? t("workingCopy.file.unstageTitle") : t("workingCopy.file.stageTitle")}
        style={
          checked
            ? { width: 17, height: 17, borderRadius: 5, background: "var(--accent)", flexShrink: 0, display: "grid", placeItems: "center", color: "var(--accentT)", fontSize: 11, fontWeight: 800, cursor: "pointer" }
            : { width: 17, height: 17, borderRadius: 5, border: "1.5px solid var(--btnB)", boxSizing: "border-box", flexShrink: 0, cursor: "pointer" }
        }
      >
        {checked ? "✓" : ""}
      </div>
      <FileIcon path={file.path} />
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
        <span style={{ fontSize: 13, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</span>
        {dir && !inFolder && (
          <span style={{ fontFamily: mono, fontSize: 10.5, color: "var(--muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{dir}</span>
        )}
      </div>
      <span
        title={statusTitle(letter)}
        style={{ fontFamily: mono, fontSize: 10.5, fontWeight: 700, color: st.color, width: 12, textAlign: "center", flexShrink: 0 }}
      >
        {letter}
      </span>
    </div>
  );
}
