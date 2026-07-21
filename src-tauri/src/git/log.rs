use crate::error::GitError;
use crate::git::run_git;
use serde::Serialize;

#[derive(Debug, Serialize)]
pub struct Commit {
    pub hash: String,
    pub parents: Vec<String>,
    pub author: String,
    pub email: String,
    pub date: String,
    pub subject: String,
    pub refs: String,
}

// Unit separator between fields, record separator between commits.
const FMT: &str = "%H%x1f%P%x1f%an%x1f%ae%x1f%aI%x1f%s%x1f%D%x1e";

#[tauri::command(rename = "get_log")]
pub async fn get_log_cmd(path: String, limit: u32, skip: u32) -> Result<Vec<Commit>, GitError> {
    crate::git::run_blocking("get_log", move || get_log(path, limit, skip)).await
}

pub fn get_log(path: String, limit: u32, skip: u32) -> Result<Vec<Commit>, GitError> {
    let arg = format!("--pretty=format:{FMT}");
    let n = format!("-{limit}");
    let sk = format!("--skip={skip}");
    // ALL branches/remotes/tags, not just HEAD's history (the graph audit's
    // root cause: unmerged branches never appeared at all), in --topo-order
    // so parallel branches don't interleave by date and tangle the lanes.
    // HEAD is listed explicitly for the detached case. refs/stash is NOT
    // included (--all would pull it in).
    match run_git(&path, &["log", "--branches", "--remotes", "--tags", "HEAD", "--topo-order", &n, &sk, &arg]) {
        Ok(out) => Ok(parse_log(&out)),
        Err(e) => {
            // A repository with no commits yet has no HEAD; that's an empty
            // log, not an error the user needs to see.
            if run_git(&path, &["rev-parse", "--verify", "HEAD"]).is_err() {
                Ok(Vec::new())
            } else {
                Err(e)
            }
        }
    }
}

/// Commits in a revision range (e.g. "@{u}..HEAD"), newest first. Used by the
/// pull/push preview modals. Returns empty if the range cannot be resolved.
pub fn log_range(path: &str, range: &str) -> Vec<Commit> {
    let arg = format!("--pretty=format:{FMT}");
    match run_git(path, &["log", "-200", &arg, range]) {
        Ok(out) => parse_log(&out),
        Err(_) => Vec::new(),
    }
}

// ── History filters (Task 11) ────────────────────────────────────────────
//
// The History screen's loaded log window comes from `get_log` above, which
// walks --branches --remotes --tags HEAD together — it does NOT record which
// ref(s) each commit is reachable from, and per-commit changed files aren't
// loaded at all (that's `commit_detail`, one commit at a time). So "commits
// on branch X" and "commits touching path P" can't be answered from the
// window already in the frontend; both need a small, targeted git query.
// Both return just hashes (not full Commit rows) — the frontend already has
// the row data for anything in its loaded window and only needs membership.

fn parse_hashes(out: &str) -> Vec<String> {
    out.lines().map(str::trim).filter(|l| !l.is_empty()).map(str::to_string).collect()
}

/// Hashes reachable from `branch` (a local or remote-tracking branch name,
/// e.g. "main" or "origin/main"), newest first, capped at `limit` — mirrors
/// the cap already applied to the main log window.
#[tauri::command(rename = "get_branch_commits")]
pub async fn get_branch_commits_cmd(path: String, branch: String, limit: u32) -> Result<Vec<String>, GitError> {
    crate::git::run_blocking("get_branch_commits", move || get_branch_commits(path, branch, limit)).await
}

pub fn get_branch_commits(path: String, branch: String, limit: u32) -> Result<Vec<String>, GitError> {
    let n = format!("-{limit}");
    let out = run_git(&path, &["log", &branch, "--topo-order", &n, "--pretty=format:%H"])?;
    Ok(parse_hashes(&out))
}

/// Hashes of commits that touch `pathspec` (a plain path or a glob like
/// "*.rs" — git's pathspec matching is glob-aware by default), newest first,
/// capped at `limit`. Same all-refs scope as `get_log` so the set lines up
/// with the loaded window.
#[tauri::command(rename = "get_path_commits")]
pub async fn get_path_commits_cmd(path: String, pathspec: String, limit: u32) -> Result<Vec<String>, GitError> {
    crate::git::run_blocking("get_path_commits", move || get_path_commits(path, pathspec, limit)).await
}

pub fn get_path_commits(path: String, pathspec: String, limit: u32) -> Result<Vec<String>, GitError> {
    let n = format!("-{limit}");
    let out = run_git(
        &path,
        &["log", "--branches", "--remotes", "--tags", "HEAD", "--topo-order", &n, "--pretty=format:%H", "--", &pathspec],
    )?;
    Ok(parse_hashes(&out))
}

fn parse_log(out: &str) -> Vec<Commit> {
    out.split('\u{1e}')
        .map(|r| r.trim_matches('\n'))
        .filter(|r| !r.is_empty())
        .map(|record| {
            // Defensive indexing: a subject containing a stray separator byte
            // must not panic the whole log.
            let f: Vec<&str> = record.split('\u{1f}').collect();
            let get = |i: usize| f.get(i).copied().unwrap_or("");
            Commit {
                hash: get(0).to_string(),
                parents: get(1).split_whitespace().map(|s| s.to_string()).collect(),
                author: get(2).to_string(),
                email: get(3).to_string(),
                date: get(4).to_string(),
                subject: get(5).to_string(),
                refs: get(6).to_string(),
            }
        })
        .collect()
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;

    #[test]
    fn reads_two_commits() {
        let dir = std::env::temp_dir().join("gitsylva-log-test");
        let _ = fs::remove_dir_all(&dir);
        fs::create_dir_all(&dir).unwrap();
        let p = dir.to_string_lossy().to_string();
        run_git(&p, &["init"]).unwrap();
        run_git(&p, &["config", "user.email", "t@t.com"]).unwrap();
        run_git(&p, &["config", "user.name", "T"]).unwrap();
        fs::write(format!("{p}/a.txt"), "1").unwrap();
        run_git(&p, &["add", "-A"]).unwrap();
        run_git(&p, &["commit", "-m", "one"]).unwrap();
        fs::write(format!("{p}/a.txt"), "2").unwrap();
        run_git(&p, &["add", "-A"]).unwrap();
        run_git(&p, &["commit", "-m", "two"]).unwrap();
        let commits = get_log(p.clone(), 10, 0).unwrap();
        assert_eq!(commits.len(), 2);
        assert_eq!(commits[0].subject, "two");
        assert_eq!(commits[1].parents.len(), 0);

        // Pagination: skip past the newest commit.
        let older = get_log(p, 10, 1).unwrap();
        assert_eq!(older.len(), 1);
        assert_eq!(older[0].subject, "one");
    }

    #[test]
    fn log_includes_unmerged_branches() {
        let dir = std::env::temp_dir().join("gitsylva-log-test-branches");
        let _ = fs::remove_dir_all(&dir);
        fs::create_dir_all(&dir).unwrap();
        let p = dir.to_string_lossy().to_string();
        run_git(&p, &["init", "-b", "main"]).unwrap();
        run_git(&p, &["config", "user.email", "t@t.com"]).unwrap();
        run_git(&p, &["config", "user.name", "T"]).unwrap();
        fs::write(format!("{p}/a.txt"), "1").unwrap();
        run_git(&p, &["add", "-A"]).unwrap();
        run_git(&p, &["commit", "-m", "base"]).unwrap();
        // A commit on a side branch, NOT merged into main.
        run_git(&p, &["checkout", "-b", "lado"]).unwrap();
        fs::write(format!("{p}/b.txt"), "2").unwrap();
        run_git(&p, &["add", "-A"]).unwrap();
        run_git(&p, &["commit", "-m", "so-na-lado"]).unwrap();
        run_git(&p, &["checkout", "main"]).unwrap();
        // The graph must still show the side branch's commit.
        let commits = get_log(p, 10, 0).unwrap();
        assert!(commits.iter().any(|c| c.subject == "so-na-lado"));
    }

    #[test]
    fn empty_repo_yields_empty_log() {
        let dir = std::env::temp_dir().join("gitsylva-log-test-empty");
        let _ = fs::remove_dir_all(&dir);
        fs::create_dir_all(&dir).unwrap();
        let p = dir.to_string_lossy().to_string();
        run_git(&p, &["init"]).unwrap();
        let commits = get_log(p, 10, 0).unwrap();
        assert!(commits.is_empty());
    }

    #[test]
    fn branch_commits_excludes_unmerged_side_branch() {
        let dir = std::env::temp_dir().join("gitsylva-log-test-branch-commits");
        let _ = fs::remove_dir_all(&dir);
        fs::create_dir_all(&dir).unwrap();
        let p = dir.to_string_lossy().to_string();
        run_git(&p, &["init", "-b", "main"]).unwrap();
        run_git(&p, &["config", "user.email", "t@t.com"]).unwrap();
        run_git(&p, &["config", "user.name", "T"]).unwrap();
        fs::write(format!("{p}/a.txt"), "1").unwrap();
        run_git(&p, &["add", "-A"]).unwrap();
        run_git(&p, &["commit", "-m", "base"]).unwrap();
        let base = run_git(&p, &["rev-parse", "HEAD"]).unwrap().trim().to_string();
        // A commit that only exists on the side branch.
        run_git(&p, &["checkout", "-b", "lado"]).unwrap();
        fs::write(format!("{p}/b.txt"), "2").unwrap();
        run_git(&p, &["add", "-A"]).unwrap();
        run_git(&p, &["commit", "-m", "so-na-lado"]).unwrap();
        let side = run_git(&p, &["rev-parse", "HEAD"]).unwrap().trim().to_string();
        run_git(&p, &["checkout", "main"]).unwrap();

        // "main" reaches only the base commit.
        let main_hashes = get_branch_commits(p.clone(), "main".into(), 50).unwrap();
        assert!(main_hashes.contains(&base));
        assert!(!main_hashes.contains(&side));

        // "lado" reaches both (its own commit plus its ancestor).
        let lado_hashes = get_branch_commits(p, "lado".into(), 50).unwrap();
        assert!(lado_hashes.contains(&base));
        assert!(lado_hashes.contains(&side));
    }

    #[test]
    fn path_commits_only_returns_hashes_touching_the_pathspec() {
        let dir = std::env::temp_dir().join("gitsylva-log-test-path-commits");
        let _ = fs::remove_dir_all(&dir);
        fs::create_dir_all(&dir).unwrap();
        let p = dir.to_string_lossy().to_string();
        run_git(&p, &["init", "-b", "main"]).unwrap();
        run_git(&p, &["config", "user.email", "t@t.com"]).unwrap();
        run_git(&p, &["config", "user.name", "T"]).unwrap();
        fs::write(format!("{p}/a.rs"), "1").unwrap();
        run_git(&p, &["add", "-A"]).unwrap();
        run_git(&p, &["commit", "-m", "rust file"]).unwrap();
        let rs_commit = run_git(&p, &["rev-parse", "HEAD"]).unwrap().trim().to_string();
        fs::write(format!("{p}/b.txt"), "1").unwrap();
        run_git(&p, &["add", "-A"]).unwrap();
        run_git(&p, &["commit", "-m", "text file"]).unwrap();
        let txt_commit = run_git(&p, &["rev-parse", "HEAD"]).unwrap().trim().to_string();

        // A glob pathspec ("file type" filter) only picks the .rs commit.
        let rs_hashes = get_path_commits(p.clone(), "*.rs".into(), 50).unwrap();
        assert!(rs_hashes.contains(&rs_commit));
        assert!(!rs_hashes.contains(&txt_commit));

        // An exact path only picks the commit that touched it.
        let txt_hashes = get_path_commits(p, "b.txt".into(), 50).unwrap();
        assert!(txt_hashes.contains(&txt_commit));
        assert!(!txt_hashes.contains(&rs_commit));
    }
}
