import { useCallback, useEffect, useMemo, useState } from "react";
import { useAppStore } from "../../state/appStore";
import { useStatus, useStageActions, useCommit, useDiff, useBlame, useHunkActions, useSyncStatus } from "../../state/queries";
import { useThemeStore } from "../../state/themeStore";
import { ConfirmDialog } from "../../components/ConfirmDialog";
import { ContextMenu, type MenuItem } from "../../components/ui/ContextMenu";
import { PanelHandle } from "../../components/ui/PanelResize";
import { usePanelWidth, usePanelHeight } from "../../lib/usePanelWidth";
import { isConflict } from "../../lib/status";
import { errMsg } from "../../lib/errors";
import { useBreakpoint } from "../../lib/useBreakpoint";
import { headMessage, openPath, revealPath } from "../../lib/api";
import { spawnLeaf } from "../../lib/leaf";
import { toast } from "../../state/toastStore";
import { useT } from "../../i18n";
import type { FileChange } from "../../lib/types";
import { FileList, type Ghost } from "./FileList";
import { CommitBox } from "./CommitBox";
import { DiffPane } from "./DiffPane";

let ghostSeq = 0;

export type Sel = { path: string; staged: boolean } | null;

export function WorkingCopy() {
  const t = useT();
  const repo = useAppStore((s) => s.repo)!;
  const setModal = useAppStore((s) => s.setModal);
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

  if (isLoading) return <div style={{ padding: "var(--sp-7)", color: "var(--muted)" }}>{t("workingCopy.loadingChanges")}</div>;
  if (error) return <div style={{ padding: "var(--sp-7)", color: "var(--ddT)" }}>{errMsg(error, t("workingCopy.statusError"))}</div>;

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

  // Ghosts (rows animating out) are injected at their original index BEFORE
  // grouping so they leave from inside their folder (see FileList).
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
        <FileList
          unstaged={unstaged}
          staged={staged}
          ghosts={ghosts}
          hiddenPaths={hiddenPaths}
          effSel={effSel}
          stageAllPending={actions.stageAll.isPending}
          onStageAll={() =>
            actions.stageAll.mutate(undefined, {
              onError: (e: unknown) => toast(errMsg(e, t("workingCopy.stageAllError")), "error"),
            })
          }
          onDiscardAllClick={() => {
            if (unstaged.length === 0) return;
            if (useThemeStore.getState().confirmDiscard) setConfirmDiscardAll(true);
            else discardAll();
          }}
          onStash={() => setModal("stash")}
          onToggle={stageEntry}
          onSelect={select}
          onContext={(x, y, file) => setFileMenu({ x, y, file })}
          unstagedH={unstagedH}
        />

        <CommitBox
          msg={msg}
          setMsg={setMsg}
          commitErr={commitErr}
          amend={amend}
          onToggleAmend={toggleAmend}
          amendPushed={amendPushed}
          commitReady={commitReady}
          committing={commit.isPending}
          onCommit={doCommit}
          branch={branch}
          stagedCount={staged.length}
        />
      </div>

      <DiffPane
        effSel={effSel}
        selStatus={selStatus}
        isStacked={isStacked}
        order={isStacked ? 1 : 2}
        hideSecondaryLabel={bp.hideSecondary}
        blameOn={blameOn}
        onToggleBlame={() => setBlameOn((v) => !v)}
        onToggleStacked={() => setStacked((v) => !v)}
        blameQ={blameQ}
        diff={diff}
        onStageHunk={selStatus === "?" ? undefined : onStageHunk}
        onLoadFull={() => setFullDiff(true)}
      />
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
