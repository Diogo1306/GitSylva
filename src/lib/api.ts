// Every Tauri call goes through the instrumented invoke (timing, ring buffer,
// error trail) instead of the raw one.
import { invoke } from "./telemetry";
import { open as openDialog } from "@tauri-apps/plugin-dialog";
import type { RepoInfo, LocalRepoEntry, FileChange, Commit, CommitDetail, BranchInfo, StashInfo, TagInfo, SyncStatus, GitIdentity, BlameLine, ConflictState, ConflictKind } from "./types";

export async function pickFolder(): Promise<string | null> {
  const picked = await openDialog({ directory: true, multiple: false });
  return typeof picked === "string" ? picked : null;
}

export function openRepo(path: string): Promise<RepoInfo> {
  return invoke<RepoInfo>("open_repo", { path });
}

export function initRepo(parent: string, name: string): Promise<RepoInfo> {
  return invoke<RepoInfo>("init_repo", { parent, name });
}

export function cloneRepo(parent: string, url: string, name: string): Promise<RepoInfo> {
  return invoke<RepoInfo>("clone_repo", { parent, url, name });
}

/** Scans one level under `base` (default: `~/dev`) for folders, each marked as an existing repo or a plain folder. */
export function scanLocalRepos(base?: string): Promise<LocalRepoEntry[]> {
  return invoke<LocalRepoEntry[]>("scan_local_repos", { base: base ?? null });
}

export function getStatus(path: string): Promise<FileChange[]> {
  return invoke<FileChange[]>("get_status", { path });
}

export function stageFile(path: string, file: string): Promise<void> {
  return invoke("stage_file", { path, file });
}

export function unstageFile(path: string, file: string): Promise<void> {
  return invoke("unstage_file", { path, file });
}

export function stageAll(path: string): Promise<void> {
  return invoke("stage_all", { path });
}

export function discardFile(path: string, file: string, untracked: boolean): Promise<void> {
  return invoke("discard_file", { path, file, untracked });
}

export function discardAll(path: string): Promise<void> {
  return invoke("discard_all", { path });
}

export function commit(path: string, message: string, amend = false): Promise<string> {
  return invoke<string>("commit", { path, message, amend });
}

export function headMessage(path: string): Promise<string> {
  return invoke<string>("head_message", { path });
}

export function openPath(path: string, file: string): Promise<void> {
  return invoke("open_path", { path, file });
}

export function revealPath(path: string, file: string): Promise<void> {
  return invoke("reveal_path", { path, file });
}

export function resetTo(path: string, target: string, mode: "soft" | "mixed" | "hard"): Promise<void> {
  return invoke("reset_to", { path, target, mode });
}

export function cherryPick(path: string, hash: string): Promise<void> {
  return invoke("cherry_pick", { path, hash });
}

export function rebase(path: string, onto: string): Promise<void> {
  return invoke("rebase", { path, onto });
}

export function revertCommit(path: string, hash: string): Promise<void> {
  return invoke("revert_commit", { path, hash });
}

export function renameBranch(path: string, old: string, name: string): Promise<void> {
  return invoke("rename_branch", { path, old, new: name });
}

export function getLog(path: string, limit: number, skip = 0): Promise<Commit[]> {
  return invoke<Commit[]>("get_log", { path, limit, skip });
}

// History branch/path filters (Task 11): the loaded log window doesn't carry
// branch reachability or per-commit changed files, so these ask the backend
// for just the matching hashes — the frontend already has the row data for
// anything in its window.
export function getBranchCommits(path: string, branch: string, limit: number): Promise<string[]> {
  return invoke<string[]>("get_branch_commits", { path, branch, limit });
}

export function getPathCommits(path: string, pathspec: string, limit: number): Promise<string[]> {
  return invoke<string[]>("get_path_commits", { path, pathspec, limit });
}

export function getDiff(path: string, file: string, staged: boolean, untracked = false, full = false): Promise<string> {
  // Without `full` the backend caps huge patches (see diffLimits.ts).
  return invoke<string>("get_diff", { path, file, staged, untracked, full });
}

export function applyHunk(path: string, patch: string, cached: boolean, reverse: boolean): Promise<void> {
  return invoke("apply_hunk", { path, patch, cached, reverse });
}

export function commitDetail(path: string, hash: string, full = false): Promise<CommitDetail> {
  return invoke<CommitDetail>("commit_detail", { path, hash, full });
}

export function listBranches(path: string): Promise<BranchInfo[]> {
  return invoke<BranchInfo[]>("list_branches", { path });
}

export function checkoutBranch(path: string, name: string): Promise<void> {
  return invoke("checkout_branch", { path, name });
}

export function createBranch(path: string, name: string, checkout: boolean, from?: string): Promise<void> {
  return invoke("create_branch", { path, name, checkout, from: from ?? null });
}

export function mergeBranch(path: string, name: string): Promise<void> {
  return invoke("merge_branch", { path, name });
}

export function deleteBranch(path: string, name: string, force: boolean): Promise<void> {
  return invoke("delete_branch", { path, name, force });
}

export function listStashes(path: string): Promise<StashInfo[]> {
  return invoke<StashInfo[]>("list_stashes", { path });
}

export function createStash(path: string, message: string, keepIndex: boolean, includeUntracked: boolean): Promise<void> {
  return invoke("create_stash", { path, message, keepIndex, includeUntracked });
}

export function applyStash(path: string, index: number): Promise<void> {
  return invoke("apply_stash", { path, index });
}

export function popStash(path: string, index: number): Promise<void> {
  return invoke("pop_stash", { path, index });
}

export function stashFiles(path: string, index: number): Promise<string[]> {
  return invoke<string[]>("stash_files", { path, index });
}

export function dropStash(path: string, index: number): Promise<void> {
  return invoke("drop_stash", { path, index });
}

export function listTags(path: string): Promise<TagInfo[]> {
  return invoke<TagInfo[]>("list_tags", { path });
}

export function createTag(path: string, name: string, message: string, target?: string): Promise<void> {
  return invoke("create_tag", { path, name, message, target: target ?? null });
}

export function deleteTag(path: string, name: string): Promise<void> {
  return invoke("delete_tag", { path, name });
}

export function fetchRemote(path: string): Promise<void> {
  return invoke("fetch", { path });
}

export function syncStatus(path: string): Promise<SyncStatus> {
  return invoke<SyncStatus>("sync_status", { path });
}

export function pull(path: string, mode: "ff" | "merge" | "rebase"): Promise<void> {
  return invoke("pull", { path, mode });
}

export function push(path: string): Promise<void> {
  return invoke("push", { path });
}

export function pushBranches(path: string, branches: string[]): Promise<void> {
  return invoke("push_branches", { path, branches });
}

export function outgoing(path: string): Promise<Commit[]> {
  return invoke<Commit[]>("outgoing", { path });
}

export function incoming(path: string): Promise<Commit[]> {
  return invoke<Commit[]>("incoming", { path });
}

export function getIdentity(path: string): Promise<GitIdentity> {
  return invoke<GitIdentity>("get_identity", { path });
}

export function setIdentity(path: string, name: string, email: string): Promise<void> {
  return invoke("set_identity", { path, name, email });
}

export function blame(path: string, file: string): Promise<BlameLine[]> {
  return invoke<BlameLine[]>("blame", { path, file });
}

export function conflictState(path: string): Promise<ConflictState> {
  return invoke<ConflictState>("conflict_state", { path });
}

export function resolveUse(path: string, file: string, side: "ours" | "theirs"): Promise<void> {
  return invoke("resolve_use", { path, file, side });
}

export function markResolved(path: string, file: string): Promise<void> {
  return invoke("mark_resolved", { path, file });
}

export function continueOp(path: string, kind: ConflictKind): Promise<void> {
  return invoke("continue_op", { path, kind });
}

export function abortOp(path: string, kind: ConflictKind): Promise<void> {
  return invoke("abort_op", { path, kind });
}
