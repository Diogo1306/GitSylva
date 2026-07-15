use crate::error::GitError;
use crate::git::run_git;

#[tauri::command(rename = "reset_to")]
pub async fn reset_to_cmd(path: String, target: String, mode: String) -> Result<(), GitError> {
    crate::git::run_mutating("reset_to", path.clone(), move || reset_to(path, target, mode)).await
}

#[tauri::command(rename = "cherry_pick")]
pub async fn cherry_pick_cmd(path: String, hash: String) -> Result<(), GitError> {
    crate::git::run_mutating("cherry_pick", path.clone(), move || cherry_pick(path, hash)).await
}

#[tauri::command(rename = "rebase")]
pub async fn rebase_cmd(path: String, onto: String) -> Result<(), GitError> {
    crate::git::run_mutating("rebase", path.clone(), move || rebase(path, onto)).await
}

#[tauri::command(rename = "revert_commit")]
pub async fn revert_commit_cmd(path: String, hash: String) -> Result<(), GitError> {
    crate::git::run_mutating("revert_commit", path.clone(), move || revert_commit(path, hash)).await
}

/// Move the current branch to `target` with the given reset mode.
/// mode: "soft" | "mixed" | "hard".
pub fn reset_to(path: String, target: String, mode: String) -> Result<(), GitError> {
    let flag = match mode.as_str() {
        "soft" => "--soft",
        "hard" => "--hard",
        _ => "--mixed",
    };
    run_git(&path, &["reset", flag, &target]).map(|_| ())
}

/// Apply the changes of a single commit onto the current branch.
pub fn cherry_pick(path: String, hash: String) -> Result<(), GitError> {
    run_git(&path, &["cherry-pick", &hash]).map(|_| ())
}

/// Rebase the current branch onto `onto` (a branch or commit). On conflict git
/// leaves the rebase in progress and this returns the error message.
pub fn rebase(path: String, onto: String) -> Result<(), GitError> {
    run_git(&path, &["rebase", &onto]).map(|_| ())
}

/// Create a new commit that undoes `hash`. On conflict git leaves the revert
/// in progress — the conflict banner takes over from there.
pub fn revert_commit(path: String, hash: String) -> Result<(), GitError> {
    run_git(&path, &["revert", "--no-edit", &hash]).map(|_| ())
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;

    fn repo(name: &str) -> String {
        let dir = std::env::temp_dir().join(format!("gitsylva-rewrite-test-{name}"));
        let _ = fs::remove_dir_all(&dir);
        fs::create_dir_all(&dir).unwrap();
        let p = dir.to_string_lossy().to_string();
        run_git(&p, &["init", "-b", "main"]).unwrap();
        run_git(&p, &["config", "user.email", "t@t.com"]).unwrap();
        run_git(&p, &["config", "user.name", "T"]).unwrap();
        p
    }

    #[test]
    fn reset_soft_keeps_changes_staged() {
        let p = repo("reset");
        fs::write(format!("{p}/a.txt"), "1").unwrap();
        run_git(&p, &["add", "-A"]).unwrap();
        run_git(&p, &["commit", "-m", "one"]).unwrap();
        fs::write(format!("{p}/a.txt"), "2").unwrap();
        run_git(&p, &["commit", "-am", "two"]).unwrap();
        // Soft reset back one commit: HEAD moves, change stays staged.
        reset_to(p.clone(), "HEAD~1".into(), "soft".into()).unwrap();
        assert_eq!(run_git(&p, &["rev-list", "--count", "HEAD"]).unwrap().trim(), "1");
        let staged = run_git(&p, &["diff", "--cached", "--name-only"]).unwrap();
        assert!(staged.contains("a.txt"));
    }

    #[test]
    fn rebase_replays_onto_base() {
        let p = repo("rebase");
        fs::write(format!("{p}/a.txt"), "base\n").unwrap();
        run_git(&p, &["add", "-A"]).unwrap();
        run_git(&p, &["commit", "-m", "base"]).unwrap();
        // feature adds b.txt
        run_git(&p, &["checkout", "-b", "feature"]).unwrap();
        fs::write(format!("{p}/b.txt"), "feat\n").unwrap();
        run_git(&p, &["add", "-A"]).unwrap();
        run_git(&p, &["commit", "-m", "feat"]).unwrap();
        // main advances with c.txt
        run_git(&p, &["checkout", "main"]).unwrap();
        fs::write(format!("{p}/c.txt"), "main\n").unwrap();
        run_git(&p, &["add", "-A"]).unwrap();
        run_git(&p, &["commit", "-m", "main2"]).unwrap();
        // rebase feature onto main -> feature has base, main2, feat (linear)
        run_git(&p, &["checkout", "feature"]).unwrap();
        rebase(p.clone(), "main".into()).unwrap();
        assert!(std::path::Path::new(&format!("{p}/c.txt")).exists());
        assert_eq!(run_git(&p, &["rev-list", "--count", "HEAD"]).unwrap().trim(), "3");
    }

    #[test]
    fn revert_creates_undo_commit() {
        let p = repo("revert");
        fs::write(format!("{p}/a.txt"), "um\n").unwrap();
        run_git(&p, &["add", "-A"]).unwrap();
        run_git(&p, &["commit", "-m", "um"]).unwrap();
        fs::write(format!("{p}/a.txt"), "dois\n").unwrap();
        run_git(&p, &["commit", "-am", "dois"]).unwrap();
        let hash = run_git(&p, &["rev-parse", "HEAD"]).unwrap().trim().to_string();
        revert_commit(p.clone(), hash).unwrap();
        // A third commit exists and the file is back to the first content.
        assert_eq!(run_git(&p, &["rev-list", "--count", "HEAD"]).unwrap().trim(), "3");
        // autocrlf may rewrite the checkout with CRLF on Windows — normalize.
        assert_eq!(fs::read_to_string(format!("{p}/a.txt")).unwrap().replace("\r\n", "\n"), "um\n");
    }

    #[test]
    fn cherry_pick_applies_commit() {
        let p = repo("cherry");
        fs::write(format!("{p}/a.txt"), "base\n").unwrap();
        run_git(&p, &["add", "-A"]).unwrap();
        run_git(&p, &["commit", "-m", "base"]).unwrap();
        // A feature commit adds a file.
        run_git(&p, &["checkout", "-b", "feature"]).unwrap();
        fs::write(format!("{p}/b.txt"), "feature\n").unwrap();
        run_git(&p, &["add", "-A"]).unwrap();
        run_git(&p, &["commit", "-m", "add b"]).unwrap();
        let hash = run_git(&p, &["rev-parse", "HEAD"]).unwrap().trim().to_string();
        // Back on main, cherry-pick brings b.txt over.
        run_git(&p, &["checkout", "main"]).unwrap();
        cherry_pick(p.clone(), hash).unwrap();
        assert!(std::path::Path::new(&format!("{p}/b.txt")).exists());
    }
}
