use crate::error::GitError;
use crate::git::run_git;

#[tauri::command]
pub fn commit(path: String, message: String, amend: bool) -> Result<String, GitError> {
    if message.trim().is_empty() {
        return Err(GitError { code: "empty_message".into(), message: "commit message is empty".into() });
    }
    if amend {
        run_git(&path, &["commit", "--amend", "-m", &message])?;
    } else {
        run_git(&path, &["commit", "-m", &message])?;
    }
    let hash = run_git(&path, &["rev-parse", "HEAD"])?;
    Ok(hash.trim().to_string())
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;

    #[test]
    fn commit_creates_head() {
        let dir = std::env::temp_dir().join("gitsylva-commit-test");
        let _ = fs::remove_dir_all(&dir);
        fs::create_dir_all(&dir).unwrap();
        let p = dir.to_string_lossy().to_string();
        run_git(&p, &["init"]).unwrap();
        run_git(&p, &["config", "user.email", "t@t.com"]).unwrap();
        run_git(&p, &["config", "user.name", "T"]).unwrap();
        fs::write(format!("{p}/a.txt"), "hi").unwrap();
        run_git(&p, &["add", "a.txt"]).unwrap();
        let hash = commit(p.clone(), "first".into(), false).unwrap();
        assert_eq!(hash.len(), 40);

        // Amend rewrites the subject without adding a commit.
        commit(p.clone(), "first (amended)".into(), true).unwrap();
        assert_eq!(run_git(&p, &["rev-list", "--count", "HEAD"]).unwrap().trim(), "1");
        assert_eq!(run_git(&p, &["log", "-1", "--format=%s"]).unwrap().trim(), "first (amended)");
    }
}
