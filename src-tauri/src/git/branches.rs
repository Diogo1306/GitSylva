use crate::error::GitError;
use crate::git::run_git;
use serde::Serialize;

#[derive(Debug, Serialize)]
pub struct BranchInfo {
    pub name: String,
    pub is_current: bool,
    pub is_remote: bool,
    pub upstream: Option<String>,
    /// Full hash of the branch tip — the sidebar focuses it in the history.
    pub tip: String,
    /// Commits ahead/behind the upstream (0/0 when there is no upstream).
    pub ahead: u32,
    pub behind: u32,
}

/// Parse "%(upstream:track)" output — "[ahead 2, behind 1]", "[ahead 2]",
/// "[behind 3]", "[gone]" or "" — into (ahead, behind).
fn parse_track(track: &str) -> (u32, u32) {
    let num_after = |key: &str| -> u32 {
        track
            .split(key)
            .nth(1)
            .and_then(|rest| {
                let digits: String = rest.trim_start().chars().take_while(|c| c.is_ascii_digit()).collect();
                digits.parse().ok()
            })
            .unwrap_or(0)
    };
    (num_after("ahead "), num_after("behind "))
}

#[tauri::command(rename = "list_branches")]
pub async fn list_branches_cmd(path: String) -> Result<Vec<BranchInfo>, GitError> {
    crate::git::run_blocking("list_branches", move || list_branches(path)).await
}

#[tauri::command(rename = "checkout_branch")]
pub async fn checkout_branch_cmd(path: String, name: String) -> Result<(), GitError> {
    crate::git::run_mutating("checkout_branch", path.clone(), move || checkout_branch(path, name)).await
}

#[tauri::command(rename = "create_branch")]
pub async fn create_branch_cmd(path: String, name: String, checkout: bool, from: Option<String>) -> Result<(), GitError> {
    crate::git::run_mutating("create_branch", path.clone(), move || create_branch(path, name, checkout, from)).await
}

#[tauri::command(rename = "merge_branch")]
pub async fn merge_branch_cmd(path: String, name: String) -> Result<(), GitError> {
    crate::git::run_mutating("merge_branch", path.clone(), move || merge_branch(path, name)).await
}

#[tauri::command(rename = "delete_branch")]
pub async fn delete_branch_cmd(path: String, name: String, force: bool) -> Result<(), GitError> {
    crate::git::run_mutating("delete_branch", path.clone(), move || delete_branch(path, name, force)).await
}

#[tauri::command(rename = "rename_branch")]
pub async fn rename_branch_cmd(path: String, old: String, new: String) -> Result<(), GitError> {
    crate::git::run_mutating("rename_branch", path.clone(), move || rename_branch(path, old, new)).await
}

/// List local and remote-tracking branches, most-recent activity first.
pub fn list_branches(path: String) -> Result<Vec<BranchInfo>, GitError> {
    // Fields: full refname, short name, HEAD marker (*), upstream short name.
    let out = run_git(
        &path,
        &[
            "for-each-ref",
            "--sort=-committerdate",
            "--format=%(refname)%1f%(refname:short)%1f%(HEAD)%1f%(upstream:short)%1f%(objectname)%1f%(upstream:track)",
            "refs/heads",
            "refs/remotes",
        ],
    )?;
    let mut branches = Vec::new();
    for line in out.lines() {
        if line.trim().is_empty() {
            continue;
        }
        let f: Vec<&str> = line.split('\u{1f}').collect();
        let full = f.first().copied().unwrap_or("");
        let name = f.get(1).copied().unwrap_or("").to_string();
        // Skip the symbolic "origin/HEAD -> origin/main" pointer.
        if name.is_empty() || name.ends_with("/HEAD") {
            continue;
        }
        let is_remote = full.starts_with("refs/remotes/");
        let is_current = f.get(2).copied().unwrap_or("") == "*";
        let upstream = f
            .get(3)
            .copied()
            .filter(|s| !s.is_empty())
            .map(|s| s.to_string());
        let tip = f.get(4).copied().unwrap_or("").to_string();
        let (ahead, behind) = parse_track(f.get(5).copied().unwrap_or(""));
        branches.push(BranchInfo {
            name,
            is_current,
            is_remote,
            upstream,
            tip,
            ahead,
            behind,
        });
    }
    Ok(branches)
}

/// Switch the working tree to an existing branch.
pub fn checkout_branch(path: String, name: String) -> Result<(), GitError> {
    run_git(&path, &["checkout", &name]).map(|_| ())
}

/// A branch name git will accept. The refs/heads/ prefix also keeps a name
/// beginning with "-" from being parsed as an option.
fn validate_branch_name(path: &str, name: &str) -> Result<(), GitError> {
    if name.trim().is_empty() {
        return Err(GitError {
            code: "empty_name".into(),
            message: "o nome da branch está vazio".into(),
        });
    }
    let refname = format!("refs/heads/{}", name.trim());
    run_git(path, &["check-ref-format", &refname]).map(|_| ()).map_err(|_| GitError {
        code: "invalid_name".into(),
        message: format!("\"{}\" não é um nome de branch válido", name.trim()),
    })
}

/// Create a new branch from `from` (HEAD when omitted), optionally checking
/// it out — the history's "criar branch daqui" passes a commit hash.
pub fn create_branch(path: String, name: String, checkout: bool, from: Option<String>) -> Result<(), GitError> {
    validate_branch_name(&path, &name)?;
    let name = name.trim();
    let mut args: Vec<&str> = if checkout { vec!["checkout", "-b", name] } else { vec!["branch", name] };
    if let Some(f) = from.as_deref() {
        args.push(f);
    }
    run_git(&path, &args).map(|_| ())
}

/// Merge a branch into the current one. On conflict, git leaves the tree in a
/// conflicted state and this returns the git error message.
pub fn merge_branch(path: String, name: String) -> Result<(), GitError> {
    run_git(&path, &["merge", "--no-edit", &name]).map(|_| ())
}

/// Delete a branch. `force` uses -D (discard unmerged commits).
pub fn delete_branch(path: String, name: String, force: bool) -> Result<(), GitError> {
    let flag = if force { "-D" } else { "-d" };
    run_git(&path, &["branch", flag, &name]).map(|_| ())
}

/// Rename a branch.
pub fn rename_branch(path: String, old: String, new: String) -> Result<(), GitError> {
    validate_branch_name(&path, &new)?;
    run_git(&path, &["branch", "-m", &old, new.trim()]).map(|_| ())
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;

    fn repo(name: &str) -> String {
        let dir = std::env::temp_dir().join(format!("gitsylva-branches-test-{name}"));
        let _ = fs::remove_dir_all(&dir);
        fs::create_dir_all(&dir).unwrap();
        let p = dir.to_string_lossy().to_string();
        run_git(&p, &["init", "-b", "main"]).unwrap();
        run_git(&p, &["config", "user.email", "t@t.com"]).unwrap();
        run_git(&p, &["config", "user.name", "T"]).unwrap();
        fs::write(format!("{p}/a.txt"), "1").unwrap();
        run_git(&p, &["add", "-A"]).unwrap();
        run_git(&p, &["commit", "-m", "init"]).unwrap();
        p
    }

    #[test]
    fn create_list_and_checkout() {
        let p = repo("checkout");
        create_branch(p.clone(), "feature/x".into(), false, None).unwrap();
        let branches = list_branches(p.clone()).unwrap();
        let names: Vec<&str> = branches.iter().map(|b| b.name.as_str()).collect();
        assert!(names.contains(&"main"));
        assert!(names.contains(&"feature/x"));
        assert!(branches.iter().find(|b| b.name == "main").unwrap().is_current);
        // Every branch carries its tip hash (full 40-hex object name).
        assert!(branches.iter().all(|b| b.tip.len() == 40 && b.tip.chars().all(|c| c.is_ascii_hexdigit())));

        checkout_branch(p.clone(), "feature/x".into()).unwrap();
        let branches = list_branches(p).unwrap();
        assert!(branches.iter().find(|b| b.name == "feature/x").unwrap().is_current);
    }

    #[test]
    fn create_with_checkout() {
        let p = repo("create");
        create_branch(p.clone(), "dev".into(), true, None).unwrap();
        let branches = list_branches(p).unwrap();
        assert!(branches.iter().find(|b| b.name == "dev").unwrap().is_current);
    }

    #[test]
    fn parse_track_variants() {
        assert_eq!(parse_track(""), (0, 0));
        assert_eq!(parse_track("[gone]"), (0, 0));
        assert_eq!(parse_track("[ahead 2]"), (2, 0));
        assert_eq!(parse_track("[behind 13]"), (0, 13));
        assert_eq!(parse_track("[ahead 2, behind 1]"), (2, 1));
    }

    #[test]
    fn create_from_commit_points_at_it() {
        let p = repo("from");
        let first = run_git(&p, &["rev-parse", "HEAD"]).unwrap().trim().to_string();
        fs::write(format!("{p}/b.txt"), "2").unwrap();
        run_git(&p, &["add", "-A"]).unwrap();
        run_git(&p, &["commit", "-m", "segundo"]).unwrap();
        // Branch created FROM the first commit, not from HEAD.
        create_branch(p.clone(), "daqui".into(), false, Some(first.clone())).unwrap();
        let tip = run_git(&p, &["rev-parse", "daqui"]).unwrap().trim().to_string();
        assert_eq!(tip, first);
    }

    #[test]
    fn rename_moves_branch() {
        let p = repo("rename");
        create_branch(p.clone(), "old-name".into(), false, None).unwrap();
        rename_branch(p.clone(), "old-name".into(), "new-name".into()).unwrap();
        let names: Vec<String> = list_branches(p).unwrap().into_iter().map(|b| b.name).collect();
        assert!(names.contains(&"new-name".to_string()));
        assert!(!names.contains(&"old-name".to_string()));
    }

    #[test]
    fn merge_and_delete() {
        let p = repo("merge");
        // Commit on a feature branch, then merge it into main.
        create_branch(p.clone(), "feature".into(), true, None).unwrap();
        fs::write(format!("{p}/b.txt"), "hi").unwrap();
        run_git(&p, &["add", "-A"]).unwrap();
        run_git(&p, &["commit", "-m", "feature work"]).unwrap();
        checkout_branch(p.clone(), "main".into()).unwrap();
        merge_branch(p.clone(), "feature".into()).unwrap();
        assert!(std::path::Path::new(&format!("{p}/b.txt")).exists());

        // Now the feature branch is merged, so a plain delete succeeds.
        delete_branch(p.clone(), "feature".into(), false).unwrap();
        let names: Vec<String> = list_branches(p).unwrap().into_iter().map(|b| b.name).collect();
        assert!(!names.contains(&"feature".to_string()));
    }
}
