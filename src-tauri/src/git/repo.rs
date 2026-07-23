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

/// One folder found by `scan_local_repos`: `is_repo` tells the picker whether
/// to offer "Abrir" (has `.git`) or "Inicializar" (plain folder, `git init` in place).
#[derive(Debug, Serialize)]
pub struct LocalRepoEntry {
    pub path: String,
    pub name: String,
    pub is_repo: bool,
}

#[tauri::command(rename = "open_repo")]
pub async fn open_repo_cmd(path: String) -> Result<RepoInfo, GitError> {
    crate::git::run_blocking("open_repo", move || open_repo(path)).await
}

#[tauri::command(rename = "init_repo")]
pub async fn init_repo_cmd(parent: String, name: String) -> Result<RepoInfo, GitError> {
    // Locked on the destination: two inits/clones into the same folder queue up.
    let key = join(&parent, name.trim());
    crate::git::run_mutating("init_repo", key, move || init_repo(parent, name)).await
}

#[tauri::command(rename = "clone_repo")]
pub async fn clone_repo_cmd(parent: String, url: String, name: String) -> Result<RepoInfo, GitError> {
    let key = join(&parent, name.trim());
    crate::git::run_mutating("clone_repo", key, move || clone_repo(parent, url, name)).await
}

#[tauri::command(rename = "scan_local_repos")]
pub async fn scan_local_repos_cmd(base: Option<String>) -> Result<Vec<LocalRepoEntry>, GitError> {
    crate::git::run_blocking("scan_local_repos", move || scan_local_repos(base)).await
}

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
    // Normalize to the repo root: opening a subfolder must not create a second "repo".
    let path = run_git(&path, &["rev-parse", "--show-toplevel"])
        .map(|s| s.trim().to_string())
        .unwrap_or(path);
    // symbolic-ref resolves the branch name on an unborn branch too (rev-parse --abbrev-ref would only print "HEAD").
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

/// `<home>/dev`, the default base folder for `scan_local_repos`.
pub fn default_dev_base() -> String {
    #[cfg(windows)]
    let home = std::env::var("USERPROFILE").unwrap_or_default();
    #[cfg(not(windows))]
    let home = std::env::var("HOME").unwrap_or_default();
    format!("{}/dev", home.replace('\\', "/"))
}

/// Cap on how many folders a scan returns — a picker grid, not a file browser.
const SCAN_LIMIT: usize = 60;

/// Lists the folders one level under `base` (default: `~/dev`), marking each as
/// an existing repo (has `.git`) or a plain folder a user could `git init` in
/// place. Pure filesystem checks only — no `git` subprocess — so it stays cheap
/// even for a folder with many entries. A missing base folder is not an error:
/// it just yields an empty grid (nothing to scan yet).
pub fn scan_local_repos(base: Option<String>) -> Result<Vec<LocalRepoEntry>, GitError> {
    let base = base.unwrap_or_else(default_dev_base);
    let dir = std::path::Path::new(&base);
    if !dir.is_dir() {
        return Ok(Vec::new());
    }
    let read = std::fs::read_dir(dir).map_err(|e| GitError { code: "os".into(), message: e.to_string() })?;
    let mut out: Vec<LocalRepoEntry> = Vec::new();
    for entry in read.flatten() {
        let path = entry.path();
        if !path.is_dir() {
            continue;
        }
        let name = entry.file_name().to_string_lossy().into_owned();
        // Hidden/dotfolders (.git of an ancestor, .cache, …) are not projects.
        if name.starts_with('.') {
            continue;
        }
        let is_repo = path.join(".git").exists();
        out.push(LocalRepoEntry { path: path.to_string_lossy().replace('\\', "/"), name, is_repo });
    }
    out.sort_by(|a, b| a.name.to_lowercase().cmp(&b.name.to_lowercase()));
    out.truncate(SCAN_LIMIT);
    Ok(out)
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
        let dir = std::env::temp_dir().join("gitsylva-openrepo-toplevel-test");
        let _ = fs::remove_dir_all(&dir);
        fs::create_dir_all(dir.join("inner")).unwrap();
        let p = dir.to_string_lossy().to_string();
        run_git(&p, &["init", "-b", "main"]).unwrap();
        let info = open_repo(dir.join("inner").to_string_lossy().to_string()).unwrap();
        // The stored path is the repo root, not the subfolder.
        assert!(!info.path.ends_with("inner"));
        assert!(info.path.ends_with("gitsylva-openrepo-toplevel-test"));
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

    #[test]
    fn scan_marks_repos_and_plain_folders_skips_hidden_and_files() {
        let base = std::env::temp_dir().join("gitsylva-scan-test");
        let _ = fs::remove_dir_all(&base);
        fs::create_dir_all(&base).unwrap();

        // A real repo…
        let repo_dir = base.join("has-git");
        fs::create_dir_all(&repo_dir).unwrap();
        run_git(&repo_dir.to_string_lossy(), &["init", "-b", "main"]).unwrap();
        // …a plain folder…
        fs::create_dir_all(base.join("plain-folder")).unwrap();
        // …a hidden folder that must be skipped…
        fs::create_dir_all(base.join(".hidden")).unwrap();
        // …and a file at the top level, which is not a folder at all.
        fs::write(base.join("readme.txt"), "x").unwrap();

        let base_s = base.to_string_lossy().replace('\\', "/");
        let entries = scan_local_repos(Some(base_s)).unwrap();

        assert_eq!(entries.len(), 2, "{entries:?}");
        let has_git = entries.iter().find(|e| e.name == "has-git").unwrap();
        assert!(has_git.is_repo);
        let plain = entries.iter().find(|e| e.name == "plain-folder").unwrap();
        assert!(!plain.is_repo);
        assert!(entries.iter().all(|e| e.name != ".hidden"));
    }

    #[test]
    fn scan_sorted_alphabetically_case_insensitive() {
        let base = std::env::temp_dir().join("gitsylva-scan-sort-test");
        let _ = fs::remove_dir_all(&base);
        for name in ["Zebra", "alpha", "Mango"] {
            fs::create_dir_all(base.join(name)).unwrap();
        }
        let base_s = base.to_string_lossy().replace('\\', "/");
        let entries = scan_local_repos(Some(base_s)).unwrap();
        let names: Vec<&str> = entries.iter().map(|e| e.name.as_str()).collect();
        assert_eq!(names, vec!["alpha", "Mango", "Zebra"]);
    }

    #[test]
    fn scan_missing_base_folder_returns_empty_not_error() {
        let base = std::env::temp_dir().join("gitsylva-scan-missing-test-does-not-exist");
        let _ = fs::remove_dir_all(&base);
        let base_s = base.to_string_lossy().replace('\\', "/");
        let entries = scan_local_repos(Some(base_s)).unwrap();
        assert!(entries.is_empty());
    }
}
