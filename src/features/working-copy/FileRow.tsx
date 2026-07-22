import { useState } from "react";
import { statusStyle, statusTitle } from "../../lib/status";
import { StatusBadge, type FileStatus } from "../../components/ui/StatusBadge";
import { CheckSquare } from "../../components/ui/misc";
import { SelectableRow } from "../../components/ui/SelectableRow";
import { activateOnKeyDown } from "../../components/ui/keys";
import { FileIcon } from "../../components/FileIcon";
import { useT } from "../../i18n";
import type { FileChange } from "../../lib/types";

function splitPath(p: string): { name: string; dir: string } {
  const parts = p.split("/");
  const name = parts.pop() ?? p;
  return { name, dir: parts.join("/") };
}

function isBadgeStatus(s: string): s is FileStatus {
  return s === "A" || s === "M" || s === "D" || s === "U";
}

// StatusBadge only covers A/M/D/U; git porcelain also reports R(enamed),
// C(opied), T(ypechange) and ? (untracked) — those fall back to a badge-shaped
// span built from the same tokens so it never crashes on a real repo.
export function FileStatusMark({ letter }: { letter: string }) {
  const title = statusTitle(letter);
  if (isBadgeStatus(letter)) return <StatusBadge status={letter} title={title} />;
  const st = statusStyle(letter);
  return (
    <span
      title={title}
      style={{ display: "grid", placeItems: "center", width: 16, height: 16, borderRadius: "var(--r-xs)", fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: "var(--fw-bold)", background: st.bg, color: st.color, flexShrink: 0 }}
    >
      {letter}
    </span>
  );
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
  const { name, dir } = splitPath(file.path);
  const toggleTitle = conflicted ? t("workingCopy.file.conflictedTitle") : checked ? t("workingCopy.file.unstageTitle") : t("workingCopy.file.stageTitle");
  // Frozen at mount: if the delay tracked the live index, staging a row above
  // would change this style and RESTART the entrance of every row below it.
  const [entranceDelay] = useState(() => Math.min(stagger * 22, 220));
  return (
    <SelectableRow
      selected={selected}
      onSelect={onSelect}
      onContextMenu={(e) => {
        e.preventDefault();
        onContext?.(e.clientX, e.clientY);
      }}
      style={{
        gap: "var(--sp-3)",
        padding: inFolder ? "6px var(--sp-3) 6px 30px" : "7px var(--sp-3)",
        animation: `fileIn 0.22s var(--ease-pop) ${entranceDelay}ms both`,
      }}
    >
      <button
        type="button"
        role="checkbox"
        aria-checked={conflicted ? undefined : checked}
        aria-label={toggleTitle}
        disabled={conflicted}
        onClick={(e) => {
          e.stopPropagation();
          if (!conflicted) onToggle();
        }}
        onKeyDown={(e) => {
          // Stop the row's own Enter/Space activation (SelectableRow's
          // onKeyDown) from also firing via bubbling; activate this button
          // itself the same explicit way every other migrated control does.
          e.stopPropagation();
          activateOnKeyDown(e);
        }}
        title={toggleTitle}
        className="gs-press-97"
        style={{ display: "grid", placeItems: "center", padding: 0, border: "none", background: "transparent", flexShrink: 0, cursor: conflicted ? "default" : "pointer" }}
      >
        <CheckSquare on={checked} />
      </button>
      <FileIcon path={file.path} />
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
        <span style={{ fontSize: "var(--fs-sm)", color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</span>
        {dir && !inFolder && (
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--fs-label)", color: "var(--muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{dir}</span>
        )}
      </div>
      <FileStatusMark letter={letter} />
    </SelectableRow>
  );
}
