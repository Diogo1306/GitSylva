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

#[cfg(test)]
mod tests {
    use super::*;
    use crate::git::status::get_status;
    use std::fs;

    fn repo() -> String {
        let dir = std::env::temp_dir().join("gitsylva-stage-test");
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
        let p = repo();
        fs::write(format!("{p}/a.txt"), "hi").unwrap();
        stage_file(p.clone(), "a.txt".into()).unwrap();
        assert_eq!(get_status(p.clone()).unwrap()[0].index_status, "A");
        unstage_file(p.clone(), "a.txt".into()).unwrap();
        assert_eq!(get_status(p).unwrap()[0].worktree_status, "?");
    }
}
