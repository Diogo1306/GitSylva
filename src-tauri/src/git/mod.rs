pub mod repo;
pub mod status;
pub mod stage;
pub mod commit;
pub mod log;
pub mod diff;
pub mod hunk;
pub mod detail;
pub mod branches;
pub mod stashes;
pub mod tags;
pub mod sync;
pub mod config;
pub mod rewrite;
pub mod blame;
pub mod conflict;

use crate::error::GitError;
use std::io::Write;
use std::process::{Command, Stdio};

/// Prefix well-known raw git failures with an actionable Portuguese hint.
/// The original stderr is kept below the hint — never hidden.
fn friendly(stderr: &str) -> String {
    let lower = stderr.to_lowercase();
    let hint = if lower.contains("terminal prompts disabled") || lower.contains("could not read username") || lower.contains("authentication failed") {
        Some("Autenticação necessária: configura credenciais git (credential manager) ou usa um URL SSH com chave carregada.")
    } else if lower.contains("permission denied (publickey)") {
        Some("O remoto recusou a chave SSH: confirma que a chave está no ssh-agent e registada na conta.")
    } else if lower.contains("could not resolve host") || lower.contains("unable to access") && lower.contains("could not") {
        Some("Sem ligação ao remoto: verifica a internet ou o URL do remoto.")
    } else if lower.contains("index.lock") {
        Some("Outra operação git está (ou ficou) em curso neste repositório. Tenta de novo; se persistir, apaga .git/index.lock.")
    } else {
        None
    };
    match hint {
        Some(h) => format!("{h}\n{}", stderr.trim()),
        None => stderr.trim().to_owned(),
    }
}

/// Run the system git in `repo` with `args`. Returns stdout on success.
///
/// GIT_TERMINAL_PROMPT=0 makes network operations fail fast instead of hanging
/// on a credential prompt. GIT_EDITOR=true stops merge/rebase --continue from
/// opening an editor and blocking. A GUI must never block on either.
pub fn run_git(repo: &str, args: &[&str]) -> Result<String, GitError> {
    let output = Command::new("git")
        .arg("-C")
        .arg(repo)
        .args(args)
        .env("GIT_TERMINAL_PROMPT", "0")
        .env("GIT_EDITOR", "true")
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
            message: friendly(&String::from_utf8_lossy(&output.stderr)),
        })
    }
}

/// Run git in `repo` feeding `input` to stdin. Used for `git apply`, which reads
/// a patch from stdin. Same environment guards as `run_git`.
pub fn run_git_stdin(repo: &str, args: &[&str], input: &str) -> Result<String, GitError> {
    let mut child = Command::new("git")
        .arg("-C")
        .arg(repo)
        .args(args)
        .env("GIT_TERMINAL_PROMPT", "0")
        .env("GIT_EDITOR", "true")
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .map_err(|e| GitError {
            code: "spawn_failed".into(),
            message: format!("could not run git: {e}"),
        })?;
    child
        .stdin
        .take()
        .ok_or_else(|| GitError { code: "spawn_failed".into(), message: "no stdin".into() })?
        .write_all(input.as_bytes())
        .map_err(|e| GitError { code: "spawn_failed".into(), message: format!("write failed: {e}") })?;
    let output = child.wait_with_output().map_err(|e| GitError {
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
