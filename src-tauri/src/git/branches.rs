use crate::error::GitError;
use crate::git::run_git;
use serde::Serialize;

#[derive(Debug, Serialize)]
pub struct BranchInfo {
    pub name: String,
    pub is_current: bool,
    pub is_remote: bool,
    pub upstream: Option<String>,
}

/// List local and remote-tracking branches, most-recent activity first.
#[tauri::command]
pub fn list_branches(path: String) -> Result<Vec<BranchInfo>, GitError> {
    // Fields: full refname, short name, HEAD marker (*), upstream short name.
    let out = run_git(
        &path,
        &[
            "for-each-ref",
            "--sort=-committerdate",
            "--format=%(refname)%1f%(refname:short)%1f%(HEAD)%1f%(upstream:short)",
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
        branches.push(BranchInfo {
            name,
            is_current,
            is_remote,
            upstream,
        });
    }
    Ok(branches)
}

/// Switch the working tree to an existing branch.
#[tauri::command]
pub fn checkout_branch(path: String, name: String) -> Result<(), GitError> {
    run_git(&path, &["checkout", &name]).map(|_| ())
}

/// Create a new branch from HEAD, optionally checking it out.
#[tauri::command]
pub fn create_branch(path: String, name: String, checkout: bool) -> Result<(), GitError> {
    if name.trim().is_empty() {
        return Err(GitError {
            code: "empty_name".into(),
            message: "o nome da branch está vazio".into(),
        });
    }
    if checkout {
        run_git(&path, &["checkout", "-b", &name]).map(|_| ())
    } else {
        run_git(&path, &["branch", &name]).map(|_| ())
    }
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
        create_branch(p.clone(), "feature/x".into(), false).unwrap();
        let branches = list_branches(p.clone()).unwrap();
        let names: Vec<&str> = branches.iter().map(|b| b.name.as_str()).collect();
        assert!(names.contains(&"main"));
        assert!(names.contains(&"feature/x"));
        assert!(branches.iter().find(|b| b.name == "main").unwrap().is_current);

        checkout_branch(p.clone(), "feature/x".into()).unwrap();
        let branches = list_branches(p).unwrap();
        assert!(branches.iter().find(|b| b.name == "feature/x").unwrap().is_current);
    }

    #[test]
    fn create_with_checkout() {
        let p = repo("create");
        create_branch(p.clone(), "dev".into(), true).unwrap();
        let branches = list_branches(p).unwrap();
        assert!(branches.iter().find(|b| b.name == "dev").unwrap().is_current);
    }
}
