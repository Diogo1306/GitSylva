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
