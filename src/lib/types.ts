export type RepoInfo = {
  path: string;
  current_branch: string;
  head: string;
  is_empty: boolean;
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
