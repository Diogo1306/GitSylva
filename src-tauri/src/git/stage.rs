use crate::error::GitError;
use crate::git::run_git;

#[tauri::command]
pub fn stage_file(path: String, file: String) -> Result<(), GitError> {
    run_git(&path, &["add", "--", &file]).map(|_| ())
}

#[tauri::command]
pub fn unstage_file(path: String, file: String) -> Result<(), GitError> {
    // reset works even on an unborn branch (no HEAD yet), where restore --staged
    // would fail with "could not resolve HEAD".
    run_git(&path, &["reset", "--", &file]).map(|_| ())
}

#[tauri::command]
pub fn stage_all(path: String) -> Result<(), GitError> {
    run_git(&path, &["add", "-A"]).map(|_| ())
}

#[tauri::command]
pub fn discard_file(path: String, file: String, untracked: bool) -> Result<(), GitError> {
    if untracked {
        run_git(&path, &["clean", "-f", "--", &file]).map(|_| ())
    } else {
        run_git(&path, &["restore", "--staged", "--worktree", "--", &file]).map(|_| ())
    }
}

/// Discard every unstaged change: revert tracked worktree edits to the index
/// (staged changes are kept) and remove untracked files and directories.
#[tauri::command]
pub fn discard_all(path: String) -> Result<(), GitError> {
    // restore may be a no-op (nothing to restore); its error is not fatal.
    let _ = run_git(&path, &["restore", "--worktree", "."]);
    run_git(&path, &["clean", "-fd"]).map(|_| ())
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::git::status::get_status;
    use std::fs;

    fn repo(name: &str) -> String {
        let dir = std::env::temp_dir().join(format!("gitsylva-stage-test-{name}"));
        let _ = fs::remove_dir_all(&dir);
        fs::create_dir_all(&dir).unwrap();
        let p = dir.to_string_lossy().to_string();
        run_git(&p, &["init"]).unwrap();
        run_git(&p, &["config", "user.email", "t@t.com"]).unwrap();
        run_git(&p, &["config", "user.name", "T"]).unwrap();
        p
    }

    #[test]
    fn stage_then_unstage() {
        let p = repo("unstage");
        fs::write(format!("{p}/a.txt"), "hi").unwrap();
        stage_file(p.clone(), "a.txt".into()).unwrap();
        assert_eq!(get_status(p.clone()).unwrap()[0].index_status, "A");
        unstage_file(p.clone(), "a.txt".into()).unwrap();
        assert_eq!(get_status(p).unwrap()[0].worktree_status, "?");
    }

    #[test]
    fn discard_all_reverts_and_cleans() {
        let p = repo("discardall");
        // Commit a tracked file, then modify it (unstaged) and add an untracked one.
        fs::write(format!("{p}/tracked.txt"), "one\n").unwrap();
        run_git(&p, &["add", "-A"]).unwrap();
        run_git(&p, &["commit", "-m", "init"]).unwrap();
        fs::write(format!("{p}/tracked.txt"), "one\ntwo\n").unwrap();
        fs::write(format!("{p}/untracked.txt"), "x").unwrap();
        assert_eq!(get_status(p.clone()).unwrap().len(), 2);

        discard_all(p.clone()).unwrap();
        assert_eq!(get_status(p.clone()).unwrap().len(), 0);
        assert!(!std::path::Path::new(&format!("{p}/untracked.txt")).exists());
        // The unstaged second line was discarded (line endings may be normalized).
        let restored = fs::read_to_string(format!("{p}/tracked.txt")).unwrap();
        assert!(restored.contains("one") && !restored.contains("two"));
    }
}
