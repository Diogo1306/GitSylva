import type { MessageValue } from "../../types";
import type { WorkspaceKey } from "../pt/workspace";

export const enWorkspace: Record<WorkspaceKey, MessageValue> = {
  // ═══════════════════════════════════════════════════════════════════════════
  // History
  // ═══════════════════════════════════════════════════════════════════════════

  // ── screen states ──────────────────────────────────────────────────────────
  "history.loading": "Loading history…",
  "history.readError": "could not read the history",
  "history.noCommits": "No commits yet.",
  "history.commitsCount": { one: "{count} commit", other: "{count} commits" },
  "history.listAriaLabel": "Commit history",
  "history.loadMore": "Load more commits",
  "history.dragPanel": "Drag to adjust the panel",
  "history.row.title": "1 click: view · 2 clicks: go to this commit · right-click: options",

  // ── detail / diff panel ────────────────────────────────────────────────────
  "history.detail.filesCount": { one: "{count} file", other: "{count} files" },
  "history.detail.changedFiles": "CHANGED FILES",
  "history.detail.viewFileDiff": "See this file's diff",
  "history.detail.loadingDiff": "Loading diff…",
  "history.detail.readCommitError": "could not read the commit",
  "history.detail.noTextChanges": "No text changes.",
  "history.detail.hidePanel": "Hide the detail/diff panel",
  "history.detail.showPanel": "Show the detail/diff panel",

  // ── filter bar ─────────────────────────────────────────────────────────────
  "history.filter.label": "Filter commits",
  "history.filter.placeholder": "Filter history…",
  "history.filter.applyingInline": "applying filter…",
  "history.filter.applying": "Applying filter…",
  "history.filter.hideAdvanced": "Hide advanced filters",
  "history.filter.showAdvanced": "Show advanced filters (branch, author, date, merges, path)",
  "history.filter.filters": "Filters",
  "history.filter.author": "Author",
  "history.filter.allBranches": "All branches",
  "history.filter.local": "Local",
  "history.filter.remote": "Remote",
  "history.filter.dateFrom": "From (start date)",
  "history.filter.dateTo": "Until (end date)",
  "history.filter.commitTypeAria": "Commit type",
  "history.filter.commitAll": "All",
  "history.filter.commitNormal": "Regular",
  "history.filter.path": "Path or file type",
  "history.filter.pathPlaceholder": "e.g. src/, *.rs",
  "history.filter.resetAllTitle": "Reset all filters",
  "history.filter.reset": "Reset filters",
  "history.filter.applyErrorBranch": "Could not apply the branch filter.",
  "history.filter.applyErrorPath": "Could not apply the path filter.",
  "history.filter.clear": "Clear filters",
  "history.filter.noResults": "No results for the applied filters.",

  // ── commit context menu ────────────────────────────────────────────────────
  "history.menu.gotoCommit": "Go to this commit…",
  "history.menu.branchFromHere": "Create branch from here…",
  "history.menu.tagAtCommit": "Create tag at this commit…",
  "history.menu.cherryPick": "Cherry-pick onto the current branch",
  "history.menu.cherryPickDone": "Cherry-pick applied",
  "history.menu.cherryPickConflict": "cherry-pick conflict",
  "history.menu.revertCommit": "Revert this commit…",
  "history.menu.rebaseOnto": "Rebase the current branch onto this commit…",
  "history.menu.resetSoft": "Soft reset to {short}",
  "history.menu.resetMixed": "Mixed reset to {short}",
  "history.menu.resetHard": "Hard reset to {short}…",
  "history.menu.resetToast": "Reset {mode} to {short}",
  "history.menu.resetError": "could not reset",
  "history.menu.copyHash": "Copy hash",
  "history.menu.hashCopied": "Hash copied",
  "history.menu.copyMessage": "Copy message",
  "history.menu.messageCopied": "Message copied",

  // ── confirm dialogs ────────────────────────────────────────────────────────
  "history.rebaseConfirm": "Rebase {branch} onto {short}? The current branch's local commits are rewritten.",
  "history.rebaseDone": "Rebase complete",
  "history.rebaseConflict": "rebase conflict — see the Working copy",
  "history.hardResetConfirm": "Hard reset to {short}? Discards ALL local changes (staged and unstaged) and the commits ahead of this one. This action cannot be undone.",
  "history.hardResetConfirmLabel": "Hard reset",
  "history.hardResetToast": "Hard reset to {short}",
  "history.gotoConfirm": 'Go to commit {short}? The working copy will reflect that point in detached HEAD mode. To keep working from here, use right-click → "Create branch from here…".',
  "history.gotoConfirmLabel": "Go to commit",
  "history.gotoDone": "On {short} (detached HEAD)",
  "history.gotoError": "could not go to the commit",
  "history.revertConfirm": "Revert {short}? Creates a new commit on the current branch that undoes this one's changes (history is not rewritten).",
  "history.revertConfirmLabel": "Revert",
  "history.revertDone": "Commit {short} reverted",
  "history.revertConflict": "revert conflict — see the Working copy",

  // ── create-branch modal ────────────────────────────────────────────────────
  "history.branchModal.title": "Create branch from {short}",
  "history.branchModal.placeholder": "feature/my-branch",
  "history.branchModal.createSwitch": "Create and switch",
  "history.branchModal.checkedOut": "On {name}",
  "history.branchModal.created": "Branch {name} created at {short}",
  "history.branchModal.createError": "could not create the branch",

  // ── create-tag modal ───────────────────────────────────────────────────────
  "history.tagModal.title": "Create tag at {short}",
  "history.tagModal.create": "Create tag",
  "history.tagModal.created": "Tag {name} created at {short}",
  "history.tagModal.createError": "could not create the tag",

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
