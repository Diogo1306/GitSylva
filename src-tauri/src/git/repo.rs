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
    // Bare repositories have no working copy to operate on.
    if run_git(&path, &["rev-parse", "--is-bare-repository"]).map(|s| s.trim() == "true").unwrap_or(false) {
        return Err(GitError {
            code: "bare_repo".into(),
            message: "este é um repositório bare (sem cópia de trabalho)".into(),
        });
    }
    // Fail early if this is not a git work tree.
    let inside = run_git(&path, &["rev-parse", "--is-inside-work-tree"])?;
    if inside.trim() != "true" {
        return Err(GitError {
            code: "not_a_repo".into(),
            message: "esta pasta não é um repositório git".into(),
        });
    }
    // Normalize to the repository root: opening a subfolder must not create a
    // second "repo" with a wrong name and subfolder-relative paths.
    let path = run_git(&path, &["rev-parse", "--show-toplevel"])
        .map(|s| s.trim().to_string())
        .unwrap_or(path);
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

/// Create a new repository at `parent`/`name` with `git init` and return its path.
#[tauri::command]
pub fn init_repo(parent: String, name: String) -> Result<RepoInfo, GitError> {
    let name = name.trim();
    if name.is_empty() {
        return Err(GitError { code: "empty_name".into(), message: "o nome está vazio".into() });
    }
    run_git(&parent, &["init", "-b", "main", name])?;
    open_repo(join(&parent, name))
}

/// Clone `url` into `parent`/`name` and return the new repository. Fails fast if
/// credentials are required (no interactive prompt).
#[tauri::command]
pub fn clone_repo(parent: String, url: String, name: String) -> Result<RepoInfo, GitError> {
    let url = url.trim();
    let name = name.trim();
    if url.is_empty() {
        return Err(GitError { code: "empty_url".into(), message: "o URL está vazio".into() });
    }
    if name.is_empty() {
        return Err(GitError { code: "empty_name".into(), message: "a pasta de destino está vazia".into() });
    }
    // "--" keeps a URL beginning with "-" from being read as a git option.
    run_git(&parent, &["clone", "--", url, name])?;
    open_repo(join(&parent, name))
}

fn join(parent: &str, name: &str) -> String {
    let sep = if parent.ends_with('/') || parent.ends_with('\\') { "" } else { "/" };
    format!("{parent}{sep}{name}")
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

    #[test]
    fn open_repo_normalizes_subfolder_to_toplevel() {
        let dir = std::env::temp_dir().join("gitsylva-openrepo-test-sub");
        let _ = fs::remove_dir_all(&dir);
        fs::create_dir_all(dir.join("sub")).unwrap();
        let p = dir.to_string_lossy().to_string();
        run_git(&p, &["init", "-b", "main"]).unwrap();
        let info = open_repo(dir.join("sub").to_string_lossy().to_string()).unwrap();
        // The stored path is the repo root, not the subfolder.
        assert!(!info.path.ends_with("sub"));
    }

    #[test]
    fn init_creates_repo() {
        let base = std::env::temp_dir().join("gitsylva-init-test");
        let _ = fs::remove_dir_all(&base);
        fs::create_dir_all(&base).unwrap();
        let parent = base.to_string_lossy().replace('\\', "/");
        let info = init_repo(parent, "novo".into()).unwrap();
        assert_eq!(info.current_branch, "main");
        assert!(info.is_empty);
    }

    #[test]
    fn clone_creates_repo() {
        let base = std::env::temp_dir().join("gitsylva-clone-test");
        let _ = fs::remove_dir_all(&base);
        fs::create_dir_all(&base).unwrap();
        let base_s = base.to_string_lossy().replace('\\', "/");

        // A source repo with one commit.
        let src = base.join("src");
        fs::create_dir_all(&src).unwrap();
        let src_s = src.to_string_lossy().to_string();
        run_git(&src_s, &["init", "-b", "main"]).unwrap();
        run_git(&src_s, &["config", "user.email", "t@t.com"]).unwrap();
        run_git(&src_s, &["config", "user.name", "T"]).unwrap();
        fs::write(src.join("a.txt"), "1").unwrap();
        run_git(&src_s, &["add", "-A"]).unwrap();
        run_git(&src_s, &["commit", "-m", "one"]).unwrap();

        let info = clone_repo(base_s, src.to_string_lossy().replace('\\', "/"), "copy".into()).unwrap();
        assert!(!info.is_empty);
        assert!(std::path::Path::new(&base.join("copy").join("a.txt")).exists());
    }
}
