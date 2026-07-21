import { useCallback, useEffect, useMemo, useState } from "react";
import { useAppStore } from "../../state/appStore";
import { useStatus, useStageActions, useCommit, useDiff, useBlame, useHunkActions, useSyncStatus } from "../../state/queries";
import { useThemeStore } from "../../state/themeStore";
import { DiffView } from "../../components/DiffView";
import { BlameView } from "../../components/BlameView";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { ContextMenu, type MenuItem } from "../../components/ui/ContextMenu";
import { PanelHandle } from "../../components/ui/PanelResize";
import { usePanelWidth, usePanelHeight } from "../../lib/usePanelWidth";
import { groupFilesByFolder } from "../../lib/fileGroups";
import { statusStyle, statusTitle, isConflict } from "../../lib/status";
import { FileIcon } from "../../components/FileIcon";
import { errMsg } from "../../lib/errors";
import { useBreakpoint } from "../../lib/useBreakpoint";
import { headMessage, openPath, revealPath } from "../../lib/api";
import { spawnLeaf } from "../../lib/leaf";
import { toast } from "../../state/toastStore";
import { useT } from "../../i18n";
import type { FileChange } from "../../lib/types";

const mono = "'JetBrains Mono', monospace";

let ghostSeq = 0;

type Sel = { path: string; staged: boolean } | null;

function splitPath(p: string): { name: string; dir: string } {
  const parts = p.split("/");
  const name = parts.pop() ?? p;
  return { name, dir: parts.join("/") };
}

function FileRow({
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

function SectionHead({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: "1.2px", color: "var(--muted)", flex: 1 }}>{children}</div>
  );
}

// Header row for a folded directory (R5.4): its checkbox stages/unstages the
// whole folder in one click; the files keep their own rows below it.
function FolderRow({ dir, count, checked, title, onToggle }: { dir: string; count: number; checked: boolean; title: string; onToggle: () => void }) {
  return (
    <div
      onClick={onToggle}
      title={title}
      className="gs-row"
      style={{ display: "flex", alignItems: "center", gap: 9, padding: "7px 8px", borderRadius: 8, cursor: "pointer" }}
    >
      <div
        style={
          checked
            ? { width: 17, height: 17, borderRadius: 5, background: "var(--accent)", flexShrink: 0, display: "grid", placeItems: "center", color: "var(--accentT)", fontSize: 11, fontWeight: 800 }
            : { width: 17, height: 17, borderRadius: 5, border: "1.5px solid var(--btnB)", boxSizing: "border-box", flexShrink: 0 }
        }
      >
        {checked ? "✓" : ""}
      </div>
      <span aria-hidden style={{ width: 16, height: 16, borderRadius: 4, background: "rgba(201,168,58,0.16)", color: "#C9A83A", display: "grid", placeItems: "center", flexShrink: 0 }}>
        <svg width="72%" height="72%" viewBox="0 0 16 16">
          <path d="M2 5 a1.6 1.6 0 0 1 1.6-1.6 h3 l1.6 1.8 h4.8 A1.6 1.6 0 0 1 14.6 6.8 v4.6 a1.6 1.6 0 0 1-1.6 1.6 H3.6 A1.6 1.6 0 0 1 2 11.4 z" fill="currentColor" />
        </svg>
      </span>
      <span style={{ flex: 1, fontFamily: mono, fontSize: 12, color: "var(--text2)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", direction: "rtl", textAlign: "left" }}>
        {dir}/
      </span>
      <span style={{ background: "var(--badge)", color: "var(--badgeT)", borderRadius: 999, fontSize: 10.5, fontWeight: 600, padding: "0 7px", flexShrink: 0 }}>
        {count}
      </span>
    </div>
  );
}

export function WorkingCopy() {
  const t = useT();
  const repo = useAppStore((s) => s.repo)!;
  const { data, isLoading, error } = useStatus(repo.path);
  const actions = useStageActions(repo.path);
  const hunk = useHunkActions(repo.path);
  const commit = useCommit(repo.path);
  const syncQ = useSyncStatus(repo.path);
  const [sel, setSel] = useState<Sel>(null);
  const [msg, setMsg] = useState("");
  const [amend, setAmend] = useState(false);
  const [commitErr, setCommitErr] = useState<string | null>(null);
  const [confirmDiscardAll, setConfirmDiscardAll] = useState(false);
  const [confirmDiscardFile, setConfirmDiscardFile] = useState<FileChange | null>(null);
  const [fileMenu, setFileMenu] = useState<{ x: number; y: number; file: FileChange } | null>(null);
  const [stacked, setStacked] = useState(false);
  const [blameOn, setBlameOn] = useState(false);
  // Below ~980px the working copy stacks automatically (handoff §8; Task 6:
  // consolidated onto the shared breakpoint hook, same threshold, no more
  // local matchMedia listener); the manual toggle still works on wide windows.
  const bp = useBreakpoint();
  const isStacked = stacked || bp.workingCopyStacked;
  // Design: files panel resizable 320–540, persisted.
  const filesW = usePanelWidth("gitsylva-w-working", 400, 320, 540, "right");
  // R5.4: the unstaged pane's height is user-adjustable (drag the split).
  const unstagedH = usePanelHeight("gitsylva-h-unstaged", 240, 96, 640);

  // Exit animation for rows leaving a list (R3 §9): AFTER the git operation
  // succeeds, the real row is hidden and a non-interactive ghost plays a short
  // fileOut at the same position, then both are dropped. Errors never hide
  // anything — the row simply stays.
  type Ghost = { id: number; file: FileChange; letter: string; list: "u" | "s"; idx: number };
  const [ghosts, setGhosts] = useState<Ghost[]>([]);
  const [hiddenPaths, setHiddenPaths] = useState<ReadonlySet<string>>(new Set());
  // One sweeper timer clears finished ghosts; the effect cleanup guarantees no
  // orphan timeout survives unmount.
  useEffect(() => {
    if (ghosts.length === 0) return;
    const t = window.setTimeout(() => {
      setGhosts([]);
      setHiddenPaths(new Set());
    }, 220);
    return () => window.clearTimeout(t);
  }, [ghosts]);
  function exitRow(f: FileChange, list: "u" | "s", letter: string, idx: number) {
    const id = ++ghostSeq;
    setGhosts((g) => [...g, { id, file: f, letter, list, idx }]);
    setHiddenPaths((s) => new Set(s).add(f.path));
  }

  // Honor a file chosen from the command palette: it stays "selected" (derived,
  // no effect/setState) until the user picks another file, which clears it.
  const paletteFile = useAppStore((s) => s.selectedFile);
  const paletteSel = useMemo<Sel>(() => {
    if (!paletteFile) return null;
    const f = (data ?? []).find((x) => x.path === paletteFile);
    return f ? { path: paletteFile, staged: f.index_status !== "." && f.index_status !== "?" } : null;
  }, [paletteFile, data]);
  const effSel = paletteSel ?? sel;

  // New files aren't in the index yet, so their preview is synthesized backend-side.
  const selUntracked =
    !!effSel && !effSel.staged && (data ?? []).find((f) => f.path === effSel.path)?.worktree_status === "?";
  // "Carregar diff completo" opt-in, reset whenever the selection changes.
  const [fullDiff, setFullDiff] = useState(false);
  const selKey = effSel ? `${effSel.path}|${effSel.staged}` : "";
  const [prevSelKey, setPrevSelKey] = useState(selKey);
  if (selKey !== prevSelKey) {
    setPrevSelKey(selKey);
    setFullDiff(false);
  }
  const diff = useDiff(repo.path, effSel?.path ?? null, effSel?.staged ?? false, selUntracked, fullDiff);
  const blameQ = useBlame(repo.path, effSel?.path ?? null, blameOn);

  // Stable so DiffLines' memoized rows survive re-renders of this screen.
  const stagedSel = effSel?.staged ?? false;
  const onStageHunk = useCallback(
    (p: string) =>
      hunk.mutate(
        { patch: p, cached: true, reverse: stagedSel },
        { onError: (e: unknown) => toast(errMsg(e, t("workingCopy.hunkError")), "error") },
      ),
    [hunk, stagedSel, t],
  );

  // ⌘Enter (rebindable) fires this event from the global shortcut handler.
  // Rebinds every render on purpose: the closure must see fresh msg/amend/data.
  useEffect(() => {
    const onCommitShortcut = () => {
      const all = data ?? [];
      const stagedCount = all.filter((f) => f.index_status !== "." && f.index_status !== "?" && !isConflict(f.index_status, f.worktree_status)).length;
      if (commit.isPending || msg.trim() === "" || (stagedCount === 0 && !amend)) return;
      setCommitErr(null);
      commit.mutate(
        { message: msg, amend },
        {
          onSuccess: () => { spawnLeaf(); setMsg(""); setAmend(false); },
          onError: (e: unknown) => setCommitErr((e as { message?: string })?.message ?? t("workingCopy.commitError")),
        },
      );
    };
    window.addEventListener("gitsylva:commit", onCommitShortcut);
    return () => window.removeEventListener("gitsylva:commit", onCommitShortcut);
  });

  if (isLoading) return <div style={{ padding: 16, color: "var(--muted)" }}>{t("workingCopy.loadingChanges")}</div>;
  if (error) return <div style={{ padding: 16, color: "var(--ddT)" }}>{errMsg(error, t("workingCopy.statusError"))}</div>;

  const files = data ?? [];
  // Conflicted files show once (in the unstaged list, letter "U") — staging them
  // would silently mark the conflict as resolved.
  const unstaged = files.filter((f) => f.worktree_status !== "." || isConflict(f.index_status, f.worktree_status));
  const staged = files.filter((f) => f.index_status !== "." && f.index_status !== "?" && !isConflict(f.index_status, f.worktree_status));
  const branch = repo.current_branch;

  function select(path: string, staged: boolean) {
    setSel({ path, staged });
    if (useAppStore.getState().selectedFile) useAppStore.getState().setSelectedFile(null);
  }

  function doCommit() {
    setCommitErr(null);
    commit.mutate(
      { message: msg, amend },
      {
        onSuccess: () => { spawnLeaf(); setMsg(""); setAmend(false); },
        onError: (e: unknown) => setCommitErr((e as { message?: string })?.message ?? t("workingCopy.commitError")),
      },
    );
  }

  function discardAll() {
    // A failed discard must never look like it worked.
    actions.discardAll.mutate(undefined, {
      onError: (e: unknown) => toast(errMsg(e, t("workingCopy.discardAllError")), "error"),
    });
    setConfirmDiscardAll(false);
  }

  const selStatus = effSel
    ? effSel.staged
      ? files.find((f) => f.path === effSel.path)?.index_status ?? "M"
      : files.find((f) => f.path === effSel.path)?.worktree_status ?? "M"
    : "";
  const selSt = statusStyle(selStatus);

  const commitReady = msg.trim() !== "" && (staged.length > 0 || amend);
  const untrackedCount = unstaged.filter((f) => f.worktree_status === "?").length;
  // Amending a commit that's already on the upstream rewrites published history.
  const amendPushed = amend && !!syncQ.data?.upstream && (syncQ.data?.ahead ?? 0) === 0;

  function toggleAmend() {
    setAmend((v) => !v);
    // Prefill with HEAD's message so amending doesn't silently drop the body.
    if (!amend && !msg.trim()) {
      headMessage(repo.path)
        .then((m) => setMsg((cur) => (cur.trim() ? cur : m)))
        .catch(() => {});
    }
  }

  function fileMenuItems(f: FileChange): MenuItem[] {
    const untracked = f.worktree_status === "?";
    const items: MenuItem[] = [
      { label: t("common.open"), onClick: () => void openPath(repo.path, f.path).catch((e: unknown) => toast(errMsg(e, t("workingCopy.file.openError")), "error")) },
      { label: t("workingCopy.file.reveal"), onClick: () => void revealPath(repo.path, f.path).catch((e: unknown) => toast(errMsg(e, t("workingCopy.file.revealError")), "error")) },
      { label: t("workingCopy.file.copyPath"), onClick: () => void navigator.clipboard?.writeText(f.path).then(() => toast(t("workingCopy.file.pathCopied"))) },
    ];
    if (f.worktree_status !== "." && !isConflict(f.index_status, f.worktree_status)) {
      items.push({ label: "", onClick: () => {}, divider: true });
      items.push({
        label: untracked ? t("workingCopy.file.deleteFromDisk") : t("workingCopy.file.discardChanges"),
        danger: true,
        onClick: () => {
          if (useThemeStore.getState().confirmDiscard) setConfirmDiscardFile(f);
          else discardFileNow(f);
        },
      });
    }
    return items;
  }

  function discardFileNow(f: FileChange) {
    setConfirmDiscardFile(null);
    const idx = unstaged.indexOf(f);
    actions.discard.mutate(
      { file: f.path, untracked: f.worktree_status === "?" },
      {
        onSuccess: () => {
          exitRow(f, "u", f.worktree_status, Math.max(0, idx));
          toast(f.worktree_status === "?" ? t("workingCopy.file.deleted", { path: f.path }) : t("workingCopy.file.discarded", { path: f.path }));
        },
        onError: (e: unknown) => toast(errMsg(e, t("workingCopy.discardError")), "error"),
      },
    );
  }

  // One renderer for both lists (R5.4): directories with >4 changed entries
  // fold under a folder header whose checkbox stages/unstages them all; the
  // files keep individual rows (indented) so single picks still work. Ghosts
  // (rows animating out) are injected at their original index BEFORE grouping
  // so they leave from inside their folder.
  type Entry = { f: FileChange; ghost?: Ghost };
  function stageEntry(f: FileChange, listKey: "u" | "s") {
    // Already animating out of this list — a second trigger would queue a
    // duplicate operation and a duplicate ghost.
    if (hiddenPaths.has(f.path)) return;
    if (listKey === "u") {
      const idx = unstaged.indexOf(f);
      actions.stage.mutate(f.path, {
        onSuccess: () => exitRow(f, "u", f.worktree_status, idx),
        onError: (e: unknown) => toast(errMsg(e, t("workingCopy.stageError", { path: f.path })), "error"),
      });
    } else {
      const idx = staged.indexOf(f);
      actions.unstage.mutate(f.path, {
        onSuccess: () => exitRow(f, "s", f.index_status, idx),
        onError: (e: unknown) => toast(errMsg(e, t("workingCopy.unstageError", { path: f.path })), "error"),
      });
    }
  }
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
            if (!e.ghost) stageEntry(e.f, listKey);
          }}
          onSelect={() => {
            if (!e.ghost) select(e.f.path, listKey === "s");
          }}
          onContext={e.ghost ? undefined : (x, y) => setFileMenu({ x, y, file: e.f })}
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
              for (const e of real) stageEntry(e.f, listKey);
            }}
          />
          {g.items.map((e) => rowEl(e, true))}
        </div>
      );
    });
  }

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, minHeight: 0, animation: "fadeUp 0.25s ease both" }}>
      <div style={{ flex: 1, display: "flex", flexDirection: isStacked ? "column" : "row", minWidth: 0, minHeight: 0 }}>
      {/* Files + commit */}
      <div
        style={{
          width: isStacked ? "auto" : filesW.width,
          // Stacked: split the height with the diff so the list scrolls inside
          // its half instead of growing the page.
          flex: isStacked ? "1 1 0%" : "0 0 auto",
          borderRight: isStacked ? "none" : "1px solid var(--border)",
          borderTop: isStacked ? "1px solid var(--border)" : "none",
          order: isStacked ? 2 : 1,
          display: "flex",
          flexDirection: "column",
          minHeight: 0,
          boxSizing: "border-box",
          position: "relative",
        }}
      >
        {!isStacked && <PanelHandle edge="right" handleProps={filesW.handleProps} />}
        {/* Task 6: both lists live inside ONE bounded, scrollable region
            (flex: 1, minHeight: 0 lets it shrink below its content size at
            small window heights) so the commit box below — a flexShrink: 0
            sibling, outside this wrapper — always keeps the room it needs
            instead of being pushed off-screen with no way to reach it. */}
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
              !actions.stageAll.isPending &&
              actions.stageAll.mutate(undefined, {
                onError: (e: unknown) => toast(errMsg(e, t("workingCopy.stageAllError")), "error"),
              })
            }
            className="gs-row"
            style={{ fontSize: 12, color: "var(--l0)", cursor: actions.stageAll.isPending ? "default" : "pointer", opacity: actions.stageAll.isPending ? 0.6 : 1, padding: "3px 8px", borderRadius: 6, fontWeight: 600 }}
          >
            {actions.stageAll.isPending ? t("workingCopy.staging") : t("workingCopy.stageAll")}
          </div>
          <div
            onClick={() => {
              if (unstaged.length === 0) return;
              if (useThemeStore.getState().confirmDiscard) setConfirmDiscardAll(true);
              else discardAll();
            }}
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

        <div style={{ padding: 14, borderTop: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: 10, background: "var(--panel)", flexShrink: 0 }}>
          <textarea
            value={msg}
            onChange={(e) => setMsg(e.target.value)}
            placeholder={t("workingCopy.commitPlaceholder")}
            style={{
              height: 64,
              resize: "none",
              background: "var(--input)",
              border: "1px solid var(--btnB)",
              borderRadius: 9,
              padding: "10px 12px",
              fontSize: 13,
              color: "var(--text)",
              outline: "none",
              fontFamily: "var(--font)",
              boxSizing: "border-box",
            }}
          />
          {commitErr && <div style={{ color: "var(--ddT)", fontSize: 12.5 }}>{commitErr}</div>}
          <div onClick={toggleAmend} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 12.5, color: "var(--text2)" }}>
            <span style={{ width: 15, height: 15, borderRadius: 4, border: "1.5px solid var(--btnB)", boxSizing: "border-box", display: "grid", placeItems: "center", background: amend ? "var(--accent)" : "transparent", color: "var(--accentT)", fontSize: 10, fontWeight: 800 }}>
              {amend ? "✓" : ""}
            </span>
            <span>{t("workingCopy.amendLabel")}</span>
          </div>
          {amendPushed && (
            <div style={{ fontSize: 11.5, color: "var(--stMT)", lineHeight: 1.4 }}>
              {t("workingCopy.amendPushedWarning")}
            </div>
          )}
          <div
            onClick={() => commitReady && !commit.isPending && doCommit()}
            className="gs-press"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              padding: 10,
              borderRadius: 9,
              background: commitReady ? "var(--accent)" : "var(--btn)",
              color: commitReady ? "var(--accentT)" : "var(--muted)",
              border: commitReady ? "none" : "1px solid var(--btnB)",
              fontSize: 13.5,
              fontWeight: 700,
              cursor: commitReady ? "pointer" : "default",
              opacity: commit.isPending ? 0.7 : 1,
            }}
          >
            {commit.isPending ? t("workingCopy.committing") : amend ? t("workingCopy.amendCommit") : t("workingCopy.commitTo", { branch })}
            <span style={{ fontFamily: mono, fontWeight: 500, opacity: 0.75 }}>· {t("workingCopy.filesShort", { count: staged.length })}</span>
          </div>
        </div>
      </div>

      {/* Diff */}
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", order: isStacked ? 1 : 2 }}>
        <div style={{ padding: "13px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 10 }}>
          {effSel ? (
            <>
              <FileIcon path={effSel.path} />
              <span style={{ fontFamily: mono, fontSize: 13, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{effSel.path}</span>
              <span title={statusTitle(selStatus)} style={{ width: 16, height: 16, borderRadius: 4, display: "grid", placeItems: "center", fontFamily: mono, fontSize: 10, fontWeight: 700, background: selSt.bg, color: selSt.color, flexShrink: 0 }}>
                {selStatus}
              </span>
            </>
          ) : (
            <span style={{ fontSize: 13, color: "var(--muted)" }}>{t("workingCopy.selectFilePrompt")}</span>
          )}
          <div style={{ flex: 1 }} />
          {effSel && selStatus !== "?" && (
            <div onClick={() => setBlameOn((v) => !v)} className="gs-lift" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, minHeight: 32, padding: "5px 11px", borderRadius: 7, background: blameOn ? "var(--sel)" : "var(--btn)", border: "1px solid var(--btnB)", fontSize: 12, color: "var(--btnT)", cursor: "pointer", whiteSpace: "nowrap", boxSizing: "border-box" }}>
              Blame
            </div>
          )}
          {/* Task 6 progressive disclosure: this label is redundant with the
              file path + status badge already shown — hide it before the
              Blame/split toggles would ever need to clip or wrap. */}
          {!blameOn && !bp.hideSecondary && (
            <span style={{ fontSize: 12, color: "var(--muted)" }}>{effSel?.staged ? t("workingCopy.stagedDiff") : t("workingCopy.worktreeDiff")}</span>
          )}
          {!blameOn && (
            <div onClick={() => setStacked((v) => !v)} className="gs-lift" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, minHeight: 32, padding: "5px 11px", borderRadius: 7, background: "var(--btn)", border: "1px solid var(--btnB)", fontSize: 12, color: "var(--btnT)", cursor: "pointer", whiteSpace: "nowrap", boxSizing: "border-box" }}>
              {isStacked ? t("workingCopy.sideBySide") : t("workingCopy.stacked")}
            </div>
          )}
        </div>
        <div style={{ flex: 1, overflow: "auto", padding: "10px 0", background: "var(--panel2)" }}>
          {!effSel ? null : blameOn ? (
            blameQ.isLoading ? (
              <div style={{ padding: 20, color: "var(--muted)" }}>{t("workingCopy.loadingBlame")}</div>
            ) : blameQ.data && blameQ.data.length ? (
              <BlameView lines={blameQ.data} />
            ) : (
              <div style={{ padding: 20, color: "var(--muted)" }}>{t("workingCopy.noBlame")}</div>
            )
          ) : diff.isLoading ? (
            <div style={{ padding: 20, color: "var(--muted)" }}>{t("workingCopy.loadingDiff")}</div>
          ) : diff.data && diff.data.trim() ? (
            <DiffView
              patch={diff.data}
              fontSize={12.5}
              stageLabel={effSel.staged ? t("workingCopy.unstage") : t("workingCopy.stage")}
              onStageHunk={selStatus === "?" ? undefined : onStageHunk}
              onLoadFull={() => setFullDiff(true)}
            />
          ) : (
            <div style={{ padding: 20, color: "var(--muted)" }}>{t("workingCopy.noTextChanges")}</div>
          )}
        </div>
      </div>
      </div>

      {confirmDiscardAll && (
        <ConfirmDialog
          message={`${t("workingCopy.discardAllConfirm", { count: unstaged.length })}${
            untrackedCount > 0 ? ` ${t("workingCopy.discardAllUntracked", { count: untrackedCount })}` : ""
          } ${t("workingCopy.discardAllTail")}`}
          onCancel={() => setConfirmDiscardAll(false)}
          onConfirm={discardAll}
        />
      )}

      {confirmDiscardFile && (
        <ConfirmDialog
          message={
            confirmDiscardFile.worktree_status === "?"
              ? t("workingCopy.deleteFileConfirm", { path: confirmDiscardFile.path })
              : t("workingCopy.discardFileConfirm", { path: confirmDiscardFile.path })
          }
          onCancel={() => setConfirmDiscardFile(null)}
          onConfirm={() => discardFileNow(confirmDiscardFile)}
        />
      )}

      {fileMenu && (
        <ContextMenu x={fileMenu.x} y={fileMenu.y} items={fileMenuItems(fileMenu.file)} onClose={() => setFileMenu(null)} />
      )}
    </div>
  );
}
