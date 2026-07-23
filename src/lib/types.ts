export type RepoInfo = {
  path: string;
  current_branch: string;
  head: string;
  is_empty: boolean;
};

/** One folder found by `scanLocalRepos`: a real repo (has `.git`) or a plain folder. */
export type LocalRepoEntry = {
  path: string;
  name: string;
  is_repo: boolean;
};

export type FileChange = {
  path: string;
  index_status: string;
  worktree_status: string;
  orig_path: string | null;
};

export type Commit = {
  hash: string;
  parents: string[];
  author: string;
  email: string;
  date: string;
  subject: string;
  refs: string;
};

export type CommitFile = {
  path: string;
  status: string;
  additions: number;
  deletions: number;
};

export type CommitDetail = {
  message: string;
  additions: number;
  deletions: number;
  files: CommitFile[];
  diff: string;
};

export type BranchInfo = {
  name: string;
  is_current: boolean;
  is_remote: boolean;
  upstream: string | null;
  /** Full hash of the branch tip (focused in the history on click). */
  tip: string;
  /** Commits ahead/behind the upstream (0/0 without upstream). */
  ahead: number;
  behind: number;
};

export type StashInfo = {
  index: number;
  message: string;
  relative_date: string;
};

export type TagInfo = {
  name: string;
  target: string;
  subject: string;
};

export type SyncStatus = {
  ahead: number;
  behind: number;
  upstream: string | null;
};

export type GitIdentity = {
  name: string;
  email: string;
};

export type BlameLine = {
  line: number;
  hash: string;
  author: string;
  content: string;
};

export type ConflictState = {
  in_merge: boolean;
  in_rebase: boolean;
  in_cherry_pick: boolean;
  in_revert: boolean;
  files: string[];
};

export type ConflictKind = "merge" | "rebase" | "cherry-pick" | "revert";
