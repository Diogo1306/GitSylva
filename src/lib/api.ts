import { invoke } from "@tauri-apps/api/core";
import { open as openDialog } from "@tauri-apps/plugin-dialog";
import type { RepoInfo, FileChange, Commit } from "./types";

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
