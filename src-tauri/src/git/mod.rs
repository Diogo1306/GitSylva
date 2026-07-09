pub mod repo;
pub mod status;
pub mod stage;
pub mod commit;
pub mod log;
pub mod diff;

use crate::error::GitError;
use std::process::Command;

/// Run the system git in `repo` with `args`. Returns stdout on success.
pub fn run_git(repo: &str, args: &[&str]) -> Result<String, GitError> {
    let output = Command::new("git")
        .arg("-C")
        .arg(repo)
        .args(args)
        .output()
        .map_err(|e| GitError {
            code: "spawn_failed".into(),
            message: format!("could not run git: {e}"),
        })?;
    if output.status.success() {
        Ok(String::from_utf8_lossy(&output.stdout).into_owned())
    } else {
        Err(GitError {
            code: "git_failed".into(),
            message: String::from_utf8_lossy(&output.stderr).trim().to_owned(),
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;

    fn temp_repo(name: &str) -> String {
        let dir = std::env::temp_dir().join(format!("gitsylva-test-{}-{name}", std::process::id()));
        let _ = fs::remove_dir_all(&dir);
        fs::create_dir_all(&dir).unwrap();
        let p = dir.to_string_lossy().to_string();
        run_git(&p, &["init"]).unwrap();
        run_git(&p, &["config", "user.email", "test@test.com"]).unwrap();
        run_git(&p, &["config", "user.name", "Test"]).unwrap();
        p
    }

    #[test]
    fn run_git_reports_current_branch_error_free() {
        let repo = temp_repo("branch");
        let out = run_git(&repo, &["rev-parse", "--is-inside-work-tree"]).unwrap();
        assert_eq!(out.trim(), "true");
    }

    #[test]
    fn run_git_returns_error_on_bad_command() {
        let repo = temp_repo("badcmd");
        let err = run_git(&repo, &["not-a-command"]).unwrap_err();
        assert_eq!(err.code, "git_failed");
    }
}
