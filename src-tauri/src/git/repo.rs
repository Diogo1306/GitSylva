use crate::error::GitError;
use crate::git::run_git;
use serde::Serialize;

#[derive(Debug, Serialize)]
pub struct RepoInfo {
    pub path: String,
    pub current_branch: String,
    pub head: String,
    pub is_empty: bool,
}

#[tauri::command]
pub fn open_repo(path: String) -> Result<RepoInfo, GitError> {
    // Fail early if this is not a git work tree.
    let inside = run_git(&path, &["rev-parse", "--is-inside-work-tree"])?;
    if inside.trim() != "true" {
        return Err(GitError {
            code: "not_a_repo".into(),
            message: "this folder is not a git repository".into(),
        });
    }
    // symbolic-ref resolves the branch name even on an unborn branch (no commits yet),
    // where rev-parse --abbrev-ref would only print "HEAD". Falls back on detached HEAD.
    let branch = run_git(&path, &["symbolic-ref", "--short", "HEAD"])
        .map(|s| s.trim().to_string())
        .unwrap_or_else(|_| "HEAD".into());
    let head = run_git(&path, &["rev-parse", "HEAD"]).unwrap_or_default();
    let is_empty = head.trim().is_empty();
    Ok(RepoInfo {
        path,
        current_branch: branch,
        head: head.trim().to_string(),
        is_empty,
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::git::run_git;
    use std::fs;

    #[test]
    fn open_repo_reads_branch() {
        let dir = std::env::temp_dir().join("gitsylva-openrepo-test");
        let _ = fs::remove_dir_all(&dir);
        fs::create_dir_all(&dir).unwrap();
        let p = dir.to_string_lossy().to_string();
        run_git(&p, &["init", "-b", "main"]).unwrap();
        run_git(&p, &["config", "user.email", "t@t.com"]).unwrap();
        run_git(&p, &["config", "user.name", "T"]).unwrap();
        let info = open_repo(p).unwrap();
        assert_eq!(info.current_branch, "main");
        assert!(info.is_empty);
    }
}
