import type { MessageValue } from "../../types";
import type { WorkspaceKey } from "../pt/workspace";

export const enWorkspace: Record<WorkspaceKey, MessageValue> = {
  // ═══════════════════════════════════════════════════════════════════════════
  // Working copy
  // ═══════════════════════════════════════════════════════════════════════════

  // ── screen states / errors ─────────────────────────────────────────────────
  "workingCopy.loadingChanges": "Loading changes…",
  "workingCopy.statusError": "could not read the repository status",
  "workingCopy.hunkError": "could not apply the hunk",
  "workingCopy.commitError": "could not commit",
  "workingCopy.stageError": "could not stage {path}",
  "workingCopy.unstageError": "could not unstage {path}",
  "workingCopy.discardError": "could not discard",
  "workingCopy.discardAllError": "could not discard the changes",
  "workingCopy.stageAllError": "could not stage everything",

  // ── file row + context menu ────────────────────────────────────────────────
  "workingCopy.file.conflictedTitle": "In conflict — resolve it first (panel above)",
  "workingCopy.file.unstageTitle": "Unstage",
  "workingCopy.file.stageTitle": "Stage",
  "workingCopy.folder.stageTitle": "Stage the {count} files in {dir}/",
  "workingCopy.folder.unstageTitle": "Unstage the {count} files in {dir}/",
  "workingCopy.file.reveal": "Show in file explorer",
  "workingCopy.file.revealError": "could not open the file explorer",
  "workingCopy.file.openError": "could not open",
  "workingCopy.file.copyPath": "Copy path",
  "workingCopy.file.pathCopied": "Path copied",
  "workingCopy.file.deleteFromDisk": "Delete from disk…",
  "workingCopy.file.discardChanges": "Discard changes…",
  "workingCopy.file.deleted": "{path} deleted",
  "workingCopy.file.discarded": "Discarded changes to {path}",

  // ── lists + commit box ─────────────────────────────────────────────────────
  "workingCopy.unstagedSection": "UNSTAGED",
  "workingCopy.stagedSection": "STAGED",
  "workingCopy.staging": "Staging…",
  "workingCopy.stageAll": "Stage all",
  "workingCopy.discard": "Discard",
  "workingCopy.dragLists": "Drag to adjust the list sizes",
  "workingCopy.commitPlaceholder": "Commit message…",
  "workingCopy.amendLabel": "Amend last commit",
  "workingCopy.amendPushedWarning": "The last commit is already on the remote — amending it rewrites published history and will require a force push.",
  "workingCopy.committing": "Committing…",
  "workingCopy.amendCommit": "Amend commit",
  "workingCopy.commitTo": "Commit to {branch}",
  "workingCopy.filesShort": "{count} files",

  // ── diff / blame panel ─────────────────────────────────────────────────────
  "workingCopy.selectFilePrompt": "Select a file to see the diff",
  "workingCopy.stagedDiff": "staged diff",
  "workingCopy.worktreeDiff": "working copy diff",
  "workingCopy.sideBySide": "Side by side",
  "workingCopy.stacked": "Stacked",
  "workingCopy.blame": "Blame",
  "workingCopy.loadingBlame": "Loading blame…",
  "workingCopy.noBlame": "No blame (new file?).",
  "workingCopy.loadingDiff": "Loading diff…",
  "workingCopy.unstage": "Unstage",
  "workingCopy.stage": "Stage",
  "workingCopy.noTextChanges": "No text changes.",

  // ── discard confirmations ──────────────────────────────────────────────────
  "workingCopy.discardAllConfirm": {
    one: "Discard {count} unstaged change?",
    other: "Discard {count} unstaged changes?",
  },
  "workingCopy.discardAllUntracked": {
    one: "{count} untracked file will be deleted from disk.",
    other: "{count} untracked files will be deleted from disk.",
  },
  "workingCopy.discardAllTail": "Staged changes are kept. This action cannot be undone.",
  "workingCopy.deleteFileConfirm": "Delete {path} from disk? This cannot be undone.",
  "workingCopy.discardFileConfirm": "Discard the unstaged changes to {path}? Staged changes are kept.",

  // ── conflict banner ────────────────────────────────────────────────────────
  "workingCopy.conflict.withConflicts": "{kind} with conflicts",
  "workingCopy.conflict.unresolved": "Unresolved conflicts",
  "workingCopy.conflict.remaining": "{count} remaining",
  "workingCopy.conflict.continue": "Continue",
  "workingCopy.conflict.continueDone": "{kind} complete",
  "workingCopy.conflict.stillConflicts": "there are still conflicts",
  "workingCopy.conflict.abort": "Abort",
  "workingCopy.conflict.aborting": "Aborting…",
  "workingCopy.conflict.aborted": "Operation aborted",
  "workingCopy.conflict.abortError": "could not abort",
  "workingCopy.conflict.resolveError": "could not resolve the file",
  "workingCopy.conflict.useOurs": "Use mine",
  "workingCopy.conflict.useTheirs": "Use theirs",
  "workingCopy.conflict.resolved": "Resolved",

  // ═══════════════════════════════════════════════════════════════════════════
  // Stashes
  // ═══════════════════════════════════════════════════════════════════════════
  "stashes.filesCount": { one: "{count} file", other: "{count} files" },
  "stashes.saveStash": "Save stash",
  "stashes.readError": "could not read the stashes",
  "stashes.empty": 'No stashes. Use "Save stash" above (or {combo}) to stash work in progress.',
  "stashes.applied": "Stash applied",
  "stashes.applyError": "could not apply",
  "stashes.applying": "Applying…",
  "stashes.apply": "Apply",
  "stashes.poppedDone": "Stash applied and removed",
  "stashes.popError": "could not pop",
  "stashes.popTitle": "git stash pop — applies and, if there are no conflicts, removes the stash",
  "stashes.applyRemove": "Apply and remove",
  "stashes.discard": "Discard",
  "stashes.dropConfirm": "Discard stash stash@{{index}}? The saved content is lost for good.",
  "stashes.dropped": "Stash discarded",
  "stashes.dropError": "could not discard",
};
