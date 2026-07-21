import type { usePanelHeight } from "../../lib/usePanelWidth";
import { groupFilesByFolder } from "../../lib/fileGroups";
import { isConflict } from "../../lib/status";
import { useT } from "../../i18n";
import type { FileChange } from "../../lib/types";
import { FileRow } from "./FileRow";
import { FolderRow } from "./FolderRow";
import type { Sel } from "./WorkingCopy";

export type Ghost = { id: number; file: FileChange; letter: string; list: "u" | "s"; idx: number };

function SectionHead({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: "1.2px", color: "var(--muted)", flex: 1 }}>{children}</div>
  );
}

// One renderer for both lists (R5.4): directories with >4 changed entries
// fold under a folder header whose checkbox stages/unstages them all; the
// files keep individual rows (indented) so single picks still work. Ghosts
// (rows animating out) are injected at their original index BEFORE grouping
// so they leave from inside their folder.
type Entry = { f: FileChange; ghost?: Ghost };

export function FileList({
  unstaged,
  staged,
  ghosts,
  hiddenPaths,
  effSel,
  stageAllPending,
  onStageAll,
  onDiscardAllClick,
  onToggle,
  onSelect,
  onContext,
  unstagedH,
}: {
  unstaged: FileChange[];
  staged: FileChange[];
  ghosts: Ghost[];
  hiddenPaths: ReadonlySet<string>;
  effSel: Sel;
  stageAllPending: boolean;
  onStageAll: () => void;
  onDiscardAllClick: () => void;
  onToggle: (f: FileChange, listKey: "u" | "s") => void;
  onSelect: (path: string, staged: boolean) => void;
  onContext: (x: number, y: number, file: FileChange) => void;
  unstagedH: ReturnType<typeof usePanelHeight>;
}) {
  const t = useT();

  function fileList(listKey: "u" | "s") {
    const src = listKey === "u" ? unstaged : staged;
    const entries: Entry[] = src.filter((f) => !hiddenPaths.has(f.path)).map((f) => ({ f }));
    for (const g of ghosts.filter((x) => x.list === listKey))
      entries.splice(Math.min(g.idx, entries.length), 0, { f: g.file, ghost: g });
    let rowIdx = 0;
    const rowEl = (e: Entry, inFolder: boolean) => {
      const conflicted = listKey === "u" && isConflict(e.f.index_status, e.f.worktree_status);
      const letter = e.ghost ? e.ghost.letter : listKey === "u" ? (conflicted ? "U" : e.f.worktree_status) : e.f.index_status;
      const el = (
        <FileRow
          key={listKey + e.f.path}
          file={e.f}
          letter={letter}
          checked={listKey === "s"}
          selected={!e.ghost && effSel?.path === e.f.path && effSel.staged === (listKey === "s")}
          conflicted={conflicted}
          stagger={rowIdx++}
          inFolder={inFolder}
          onToggle={() => {
            if (!e.ghost) onToggle(e.f, listKey);
          }}
          onSelect={() => {
            if (!e.ghost) onSelect(e.f.path, listKey === "s");
          }}
          onContext={e.ghost ? undefined : (x, y) => onContext(x, y, e.f)}
        />
      );
      return e.ghost ? (
        <div key={`ghost${e.ghost.id}`} style={{ animation: "fileOut 200ms var(--ease-out) both", pointerEvents: "none" }}>
          {el}
        </div>
      ) : (
        el
      );
    };
    return groupFilesByFolder(entries, (e) => e.f.path).map((g) => {
      if (g.kind === "file") return rowEl(g.item, false);
      const real = g.items.filter((e) => !e.ghost && !(listKey === "u" && isConflict(e.f.index_status, e.f.worktree_status)));
      return (
        <div key={`dir-${listKey}-${g.dir}`} style={{ display: "flex", flexDirection: "column", gap: 1 }}>
          <FolderRow
            dir={g.dir}
            count={g.items.filter((e) => !e.ghost).length}
            checked={listKey === "s"}
            title={
              listKey === "u"
                ? t("workingCopy.folder.stageTitle", { count: real.length, dir: g.dir })
                : t("workingCopy.folder.unstageTitle", { count: real.length, dir: g.dir })
            }
            onToggle={() => {
              for (const e of real) onToggle(e.f, listKey);
            }}
          />
          {g.items.map((e) => rowEl(e, true))}
        </div>
      );
    });
  }

  return (
    <div style={{ flex: "1 1 0%", minHeight: 0, display: "flex", flexDirection: "column", overflowY: "auto" }}>
      {/* R5.4: each list scrolls inside its own pane too, the split between
          the two is draggable. */}
      <div style={{ height: unstagedH.height, minHeight: 96, flexShrink: 0, display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "12px 16px 8px", display: "flex", alignItems: "center", flexShrink: 0 }}>
          <SectionHead>{t("workingCopy.unstagedSection")} · {unstaged.length}</SectionHead>
          <div
            onClick={() =>
              // Double-click must not queue the same operation twice, and a
              // failure has to surface (it was silent before).
              !stageAllPending && onStageAll()
            }
            className="gs-row"
            style={{ fontSize: 12, color: "var(--l0)", cursor: stageAllPending ? "default" : "pointer", opacity: stageAllPending ? 0.6 : 1, padding: "3px 8px", borderRadius: 6, fontWeight: 600 }}
          >
            {stageAllPending ? t("workingCopy.staging") : t("workingCopy.stageAll")}
          </div>
          <div
            onClick={onDiscardAllClick}
            className="gs-row"
            style={{ fontSize: 12, color: "var(--ddT)", cursor: unstaged.length ? "pointer" : "default", opacity: unstaged.length ? 1 : 0.5, padding: "3px 8px", borderRadius: 6, fontWeight: 600 }}
          >
            {t("workingCopy.discard")}
          </div>
        </div>
        <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "0 10px 8px", display: "flex", flexDirection: "column", gap: 1 }}>
          {fileList("u")}
        </div>
      </div>

      {/* Draggable split between the two lists (R5.4). */}
      <div
        {...unstagedH.handleProps}
        className="gs-resize"
        title={t("workingCopy.dragLists")}
        style={{ height: 9, flexShrink: 0, cursor: "ns-resize", display: "flex", alignItems: "center", padding: "0 10px", touchAction: "none", boxSizing: "border-box" }}
      >
        <div style={{ height: 1, width: "100%", background: "var(--border)" }} />
      </div>

      <div style={{ flex: 1, minHeight: 96, display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "6px 16px 8px", display: "flex", alignItems: "center", flexShrink: 0 }}>
          <SectionHead>{t("workingCopy.stagedSection")} · {staged.length}</SectionHead>
        </div>
        <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "0 10px 10px", display: "flex", flexDirection: "column", gap: 1 }}>
          {fileList("s")}
        </div>
      </div>
    </div>
  );
}
