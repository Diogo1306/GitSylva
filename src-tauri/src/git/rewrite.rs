use crate::error::GitError;
use crate::git::run_git;

/// Move the current branch to `target` with the given reset mode.
/// mode: "soft" | "mixed" | "hard".
#[tauri::command]
pub fn reset_to(path: String, target: String, mode: String) -> Result<(), GitError> {
    let flag = match mode.as_str() {
        "soft" => "--soft",
        "hard" => "--hard",
        _ => "--mixed",
    };
    run_git(&path, &["reset", flag, &target]).map(|_| ())
}

/// Apply the changes of a single commit onto the current branch.
#[tauri::command]
pub fn cherry_pick(path: String, hash: String) -> Result<(), GitError> {
    run_git(&path, &["cherry-pick", &hash]).map(|_| ())
}

/// Rebase the current branch onto `onto` (a branch or commit). On conflict git
/// leaves the rebase in progress and this returns the error message.
#[tauri::command]
pub fn rebase(path: String, onto: String) -> Result<(), GitError> {
    run_git(&path, &["rebase", &onto]).map(|_| ())
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
