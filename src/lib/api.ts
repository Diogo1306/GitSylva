import { invoke } from "@tauri-apps/api/core";
import { open as openDialog } from "@tauri-apps/plugin-dialog";
import type { RepoInfo, FileChange, Commit, CommitDetail, BranchInfo, StashInfo, TagInfo } from "./types";

export async function pickFolder(): Promise<string | null> {
  const picked = await openDialog({ directory: true, multiple: false });
  return typeof picked === "string" ? picked : null;
}

export function openRepo(path: string): Promise<RepoInfo> {
  return invoke<RepoInfo>("open_repo", { path });
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

export function commit(path: string, message: string): Promise<string> {
  return invoke<string>("commit", { path, message });
}

export function getLog(path: string, limit: number): Promise<Commit[]> {
  return invoke<Commit[]>("get_log", { path, limit });
}

export function getDiff(path: string, file: string, staged: boolean): Promise<string> {
  return invoke<string>("get_diff", { path, file, staged });
}

export function commitDetail(path: string, hash: string): Promise<CommitDetail> {
  return invoke<CommitDetail>("commit_detail", { path, hash });
}

export function listBranches(path: string): Promise<BranchInfo[]> {
  return invoke<BranchInfo[]>("list_branches", { path });
}

export function checkoutBranch(path: string, name: string): Promise<void> {
  return invoke("checkout_branch", { path, name });
}

export function createBranch(path: string, name: string, checkout: boolean): Promise<void> {
  return invoke("create_branch", { path, name, checkout });
}

export function listStashes(path: string): Promise<StashInfo[]> {
  return invoke<StashInfo[]>("list_stashes", { path });
}

export function createStash(path: string, message: string, keepIndex: boolean): Promise<void> {
  return invoke("create_stash", { path, message, keepIndex });
}

export function applyStash(path: string, index: number): Promise<void> {
  return invoke("apply_stash", { path, index });
}

export function dropStash(path: string, index: number): Promise<void> {
  return invoke("drop_stash", { path, index });
}

export function listTags(path: string): Promise<TagInfo[]> {
  return invoke<TagInfo[]>("list_tags", { path });
}

export function createTag(path: string, name: string, message: string): Promise<void> {
  return invoke("create_tag", { path, name, message });
}

export function deleteTag(path: string, name: string): Promise<void> {
  return invoke("delete_tag", { path, name });
}
