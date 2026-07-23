use crate::error::GitError;
use crate::git::log::{log_range, Commit};
use crate::git::{run_git, run_git_full};
use serde::Serialize;

#[derive(Debug, Serialize)]
pub struct SyncStatus {
    pub ahead: u32,
    pub behind: u32,
    pub upstream: Option<String>,
}

#[tauri::command(rename = "fetch")]
pub async fn fetch_cmd(path: String) -> Result<(), GitError> {
    crate::git::run_mutating("fetch", path.clone(), move || fetch(path)).await
}

#[tauri::command(rename = "sync_status")]
pub async fn sync_status_cmd(path: String) -> Result<SyncStatus, GitError> {
    crate::git::run_blocking("sync_status", move || sync_status(path)).await
}

#[tauri::command(rename = "pull")]
pub async fn pull_cmd(path: String, mode: String) -> Result<(), GitError> {
    crate::git::run_mutating("pull", path.clone(), move || pull(path, mode)).await
}

#[tauri::command(rename = "push")]
pub async fn push_cmd(path: String) -> Result<(), GitError> {
    crate::git::run_mutating("push", path.clone(), move || push(path)).await
}

#[tauri::command(rename = "push_branches")]
pub async fn push_branches_cmd(path: String, branches: Vec<String>) -> Result<(), GitError> {
    crate::git::run_mutating("push_branches", path.clone(), move || push_branches(path, branches)).await
}

#[tauri::command(rename = "outgoing")]
pub async fn outgoing_cmd(path: String) -> Result<Vec<Commit>, GitError> {
    crate::git::run_blocking("outgoing", move || outgoing(path)).await
}

#[tauri::command(rename = "incoming")]
pub async fn incoming_cmd(path: String) -> Result<Vec<Commit>, GitError> {
    crate::git::run_blocking("incoming", move || incoming(path)).await
}

/// Fetches all remotes and prunes deleted refs; killed after 120s since a
/// hung network must not block the UI forever (fetch is idempotent).
pub fn fetch(path: String) -> Result<(), GitError> {
    crate::git::run_git_timeout(&path, &["fetch", "--all", "--prune"], 120).map(|_| ())
}

fn has_upstream(path: &str) -> bool {
    run_git(path, &["rev-parse", "--abbrev-ref", "@{u}"]).is_ok()
}

/// Local commits not yet on the upstream (what a push would send).
pub fn outgoing(path: String) -> Result<Vec<Commit>, GitError> {
    if !has_upstream(&path) {
        return Ok(Vec::new());
    }
    Ok(log_range(&path, "@{u}..HEAD"))
}

/// Upstream commits not yet local (what a pull would bring). Reflects the last
/// fetch; the pull modal fetches first.
pub fn incoming(path: String) -> Result<Vec<Commit>, GitError> {
    if !has_upstream(&path) {
        return Ok(Vec::new());
    }
    Ok(log_range(&path, "HEAD..@{u}"))
}

/// Pulls using `mode`: "ff" (fast-forward only, safe default), "merge", or
/// "rebase". Uses `run_git_full` so a conflict's STDOUT text reaches the
/// frontend classifier instead of being dropped.
pub fn pull(path: String, mode: String) -> Result<(), GitError> {
    let flag = match mode.as_str() {
        "merge" => "--no-rebase",
        "rebase" => "--rebase",
        _ => "--ff-only",
    };
    run_git_full(&path, &["pull", flag]).map(|_| ())
}

/// Push the current branch. Sets the upstream if the branch has none yet.
pub fn push(path: String) -> Result<(), GitError> {
    let has_upstream = run_git(&path, &["rev-parse", "--abbrev-ref", "@{u}"]).is_ok();
    if has_upstream {
        run_git(&path, &["push"]).map(|_| ())
    } else {
        run_git(&path, &["push", "-u", "origin", "HEAD"]).map(|_| ())
    }
}

/// Pushes each selected local branch to origin, in order, stopping at the
/// first failure. Sets the upstream per-branch when it has none yet — mirrors
/// `push`'s upstream handling but keyed on the pushed branch, not HEAD.
pub fn push_branches(path: String, branches: Vec<String>) -> Result<(), GitError> {
    for branch in &branches {
        let has_upstream = run_git(&path, &["rev-parse", "--abbrev-ref", &format!("{branch}@{{u}}")]).is_ok();
        if has_upstream {
            run_git(&path, &["push", "origin", branch]).map(|_| ())?;
        } else {
            run_git(&path, &["push", "-u", "origin", branch]).map(|_| ())?;
        }
    }
    Ok(())
}

/// How far the current branch is ahead/behind its upstream. No upstream -> zeros.
pub fn sync_status(path: String) -> Result<SyncStatus, GitError> {
    let upstream = run_git(&path, &["rev-parse", "--abbrev-ref", "--symbolic-full-name", "@{u}"])
        .ok()
        .map(|s| s.trim().to_string())
        .filter(|s| !s.is_empty());
    if upstream.is_none() {
        return Ok(SyncStatus { ahead: 0, behind: 0, upstream: None });
    }
    // "<behind>\t<ahead>" from the upstream to HEAD.
    let counts = run_git(&path, &["rev-list", "--left-right", "--count", "@{u}...HEAD"])
        .unwrap_or_default();
    let mut it = counts.split_whitespace();
    let behind = it.next().and_then(|s| s.parse().ok()).unwrap_or(0);
    let ahead = it.next().and_then(|s| s.parse().ok()).unwrap_or(0);
    Ok(SyncStatus { ahead, behind, upstream })
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;

    fn slug(p: &std::path::Path) -> String {
        // git accepts forward slashes for local clone paths on all platforms.
        p.to_string_lossy().replace('\\', "/")
    }

    #[test]
    fn fetch_pulls_new_remote_commits() {
        let base = std::env::temp_dir().join("gitsylva-sync-test");
        let _ = fs::remove_dir_all(&base);
        fs::create_dir_all(&base).unwrap();

        let bare = base.join("remote.git");
        fs::create_dir_all(&bare).unwrap();
        let bare_s = slug(&bare);
        run_git(&bare_s, &["init", "--bare", "-b", "main"]).unwrap();

        let up = base.join("up");
        fs::create_dir_all(&up).unwrap();
        let up_s = up.to_string_lossy().to_string();
        run_git(&up_s, &["init", "-b", "main"]).unwrap();
        run_git(&up_s, &["config", "user.email", "t@t.com"]).unwrap();
        run_git(&up_s, &["config", "user.name", "T"]).unwrap();
        fs::write(up.join("a.txt"), "one\n").unwrap();
        run_git(&up_s, &["add", "-A"]).unwrap();
        run_git(&up_s, &["commit", "-m", "one"]).unwrap();
        run_git(&up_s, &["remote", "add", "origin", &bare_s]).unwrap();
        run_git(&up_s, &["push", "-u", "origin", "main"]).unwrap();

        let down = base.join("down");
        run_git(&slug(&base), &["clone", &bare_s, "down"]).unwrap();
        let down_s = down.to_string_lossy().to_string();

        fs::write(up.join("a.txt"), "one\ntwo\n").unwrap();
        run_git(&up_s, &["commit", "-am", "two"]).unwrap();
        run_git(&up_s, &["push"]).unwrap();

        // Before fetch the downloader only knows one commit on origin/main.
        let before = run_git(&down_s, &["rev-list", "--count", "origin/main"]).unwrap();
        assert_eq!(before.trim(), "1");

        fetch(down_s.clone()).unwrap();

        let after = run_git(&down_s, &["rev-list", "--count", "origin/main"]).unwrap();
        assert_eq!(after.trim(), "2");

        // The downloader is now one behind its upstream.
        let st = sync_status(down_s.clone()).unwrap();
        assert_eq!(st.behind, 1);
        assert_eq!(st.ahead, 0);
        assert!(st.upstream.is_some());

        // Preview: one incoming commit ("two"), nothing outgoing yet.
        assert_eq!(incoming(down_s.clone()).unwrap().len(), 1);
        assert_eq!(outgoing(down_s.clone()).unwrap().len(), 0);

        // Fast-forward pull brings the downloader up to date.
        pull(down_s.clone(), "ff".into()).unwrap();
        let synced = sync_status(down_s.clone()).unwrap();
        assert_eq!(synced.behind, 0);
        let content = fs::read_to_string(down.join("a.txt")).unwrap();
        assert!(content.contains("two"));

        // A new local commit can be pushed back to the shared remote.
        fs::write(down.join("a.txt"), "one\ntwo\nthree\n").unwrap();
        run_git(&down_s, &["commit", "-am", "three"]).unwrap();
        assert_eq!(outgoing(down_s.clone()).unwrap().len(), 1);
        push(down_s.clone()).unwrap();
        assert_eq!(run_git(&bare_s, &["rev-list", "--count", "main"]).unwrap().trim(), "3");
    }

    #[test]
    fn push_branches_sends_each_branch_and_sets_upstream() {
        let base = std::env::temp_dir().join(format!("gitsylva-push-branches-{}", std::process::id()));
        let _ = fs::remove_dir_all(&base);
        fs::create_dir_all(&base).unwrap();

        let bare = base.join("remote.git");
        fs::create_dir_all(&bare).unwrap();
        let bare_s = slug(&bare);
        run_git(&bare_s, &["init", "--bare", "-b", "main"]).unwrap();

        let repo = base.join("repo");
        fs::create_dir_all(&repo).unwrap();
        let repo_s = repo.to_string_lossy().to_string();
        run_git(&repo_s, &["init", "-b", "main"]).unwrap();
        run_git(&repo_s, &["config", "user.email", "t@t.com"]).unwrap();
        run_git(&repo_s, &["config", "user.name", "T"]).unwrap();
        fs::write(repo.join("a.txt"), "one\n").unwrap();
        run_git(&repo_s, &["add", "-A"]).unwrap();
        run_git(&repo_s, &["commit", "-m", "one"]).unwrap();
        run_git(&repo_s, &["remote", "add", "origin", &bare_s]).unwrap();

        // A second local branch, never pushed, so it has no upstream yet.
        run_git(&repo_s, &["checkout", "-b", "feature"]).unwrap();
        fs::write(repo.join("b.txt"), "two\n").unwrap();
        run_git(&repo_s, &["add", "-A"]).unwrap();
        run_git(&repo_s, &["commit", "-m", "two"]).unwrap();
        run_git(&repo_s, &["checkout", "main"]).unwrap();

        push_branches(repo_s.clone(), vec!["main".into(), "feature".into()]).unwrap();

        // Both branches landed on the bare remote.
        let refs = run_git(&bare_s, &["branch"]).unwrap();
        assert!(refs.contains("main"));
        assert!(refs.contains("feature"));

        // Upstream got set for both, since neither had one before the push.
        let up_main = run_git(&repo_s, &["rev-parse", "--abbrev-ref", "main@{u}"]).unwrap();
        assert_eq!(up_main.trim(), "origin/main");
        let up_feature = run_git(&repo_s, &["rev-parse", "--abbrev-ref", "feature@{u}"]).unwrap();
        assert_eq!(up_feature.trim(), "origin/feature");
    }

    #[test]
    fn pull_merge_conflict_surfaces_conflict_text() {
        // Regression: merge conflict text lands on STDOUT; run_git_full must forward it.
        let base = std::env::temp_dir().join(format!("gitsylva-pull-conflict-{}", std::process::id()));
        let _ = fs::remove_dir_all(&base);
        fs::create_dir_all(&base).unwrap();

        let bare = base.join("remote.git");
        fs::create_dir_all(&bare).unwrap();
        let bare_s = slug(&bare);
        run_git(&bare_s, &["init", "--bare", "-b", "main"]).unwrap();

        let up = base.join("up");
        fs::create_dir_all(&up).unwrap();
        let up_s = up.to_string_lossy().to_string();
        run_git(&up_s, &["init", "-b", "main"]).unwrap();
        run_git(&up_s, &["config", "user.email", "t@t.com"]).unwrap();
        run_git(&up_s, &["config", "user.name", "T"]).unwrap();
        fs::write(up.join("a.txt"), "base\n").unwrap();
        run_git(&up_s, &["add", "-A"]).unwrap();
        run_git(&up_s, &["commit", "-m", "base"]).unwrap();
        run_git(&up_s, &["remote", "add", "origin", &bare_s]).unwrap();
        run_git(&up_s, &["push", "-u", "origin", "main"]).unwrap();

        // Both sides then edit the same line differently, causing a real content conflict.
        let down = base.join("down");
        run_git(&slug(&base), &["clone", &bare_s, "down"]).unwrap();
        let down_s = down.to_string_lossy().to_string();
        run_git(&down_s, &["config", "user.email", "d@d.com"]).unwrap();
        run_git(&down_s, &["config", "user.name", "D"]).unwrap();

        fs::write(up.join("a.txt"), "uploader change\n").unwrap();
        run_git(&up_s, &["commit", "-am", "up"]).unwrap();
        run_git(&up_s, &["push"]).unwrap();

        fs::write(down.join("a.txt"), "downloader change\n").unwrap();
        run_git(&down_s, &["commit", "-am", "down"]).unwrap();

        // Merge-mode pull (`--no-rebase`) fetches, diverges, and conflicts.
        let err = pull(down_s.clone(), "merge".into()).unwrap_err();
        assert_eq!(err.code, "git_failed");
        assert!(
            err.message.contains("CONFLICT") || err.message.contains("Automatic merge failed"),
            "conflict text missing from pull error message: {:?}",
            err.message
        );
    }
}
