use crate::error::GitError;
use crate::git::run_git;

#[tauri::command]
pub fn get_diff(path: String, file: String, staged: bool) -> Result<String, GitError> {
    let mut args = vec!["diff"];
    if staged {
        args.push("--staged");
    }
    args.push("--");
    args.push(&file);
    run_git(&path, &args)
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;

    #[test]
    fn diff_shows_added_line() {
        let dir = std::env::temp_dir().join("gitsylva-diff-test");
        let _ = fs::remove_dir_all(&dir);
        fs::create_dir_all(&dir).unwrap();
        let p = dir.to_string_lossy().to_string();
        run_git(&p, &["init"]).unwrap();
        run_git(&p, &["config", "user.email", "t@t.com"]).unwrap();
        run_git(&p, &["config", "user.name", "T"]).unwrap();
        fs::write(format!("{p}/a.txt"), "one\n").unwrap();
        run_git(&p, &["add", "-A"]).unwrap();
        run_git(&p, &["commit", "-m", "init"]).unwrap();
        fs::write(format!("{p}/a.txt"), "one\ntwo\n").unwrap();
        let diff = get_diff(p, "a.txt".into(), false).unwrap();
        assert!(diff.contains("+two"));
    }
}
