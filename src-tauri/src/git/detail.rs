use crate::error::GitError;
use crate::git::run_git;
use serde::Serialize;
use std::collections::HashMap;

#[derive(Debug, Serialize)]
pub struct CommitFile {
    pub path: String,
    pub status: String,
    pub additions: u32,
    pub deletions: u32,
}

#[derive(Debug, Serialize)]
pub struct CommitDetail {
    pub additions: u32,
    pub deletions: u32,
    pub files: Vec<CommitFile>,
    pub diff: String,
}

/// Files changed by a commit (with per file add/delete counts and status) plus
/// the full unified patch. Backs the history detail panel.
#[tauri::command]
pub fn commit_detail(path: String, hash: String) -> Result<CommitDetail, GitError> {
    // Status letter per path (M, A, D, R...). Renames appear as "R100\told\tnew".
    let name_status = run_git(&path, &["show", "--format=", "--name-status", &hash])?;
    let mut status_by_path: HashMap<String, String> = HashMap::new();
    for line in name_status.lines() {
        let Some(code) = line.split('\t').next() else { continue };
        if code.is_empty() {
            continue;
        }
        let letter = code.chars().next().unwrap().to_string();
        // The changed path is the last tab-separated column (handles renames).
        if let Some(p) = line.split('\t').last() {
            status_by_path.insert(p.to_string(), letter);
        }
    }

    // Per file add/delete counts. Binary files report "-".
    let numstat = run_git(&path, &["show", "--format=", "--numstat", &hash])?;
    let mut files = Vec::new();
    let mut add_total = 0u32;
    let mut del_total = 0u32;
    for line in numstat.lines() {
        if line.trim().is_empty() {
            continue;
        }
        let cols: Vec<&str> = line.split('\t').collect();
        if cols.len() < 3 {
            continue;
        }
        let additions = cols[0].parse::<u32>().unwrap_or(0);
        let deletions = cols[1].parse::<u32>().unwrap_or(0);
        let fpath = cols[cols.len() - 1].to_string();
        add_total += additions;
        del_total += deletions;
        let status = status_by_path
            .get(&fpath)
            .cloned()
            .unwrap_or_else(|| "M".into());
        files.push(CommitFile {
            path: fpath,
            status,
            additions,
            deletions,
        });
    }

    // Full unified patch (empty --format drops the commit header lines).
    let diff = run_git(&path, &["show", "--format=", &hash])?;

    Ok(CommitDetail {
        additions: add_total,
        deletions: del_total,
        files,
        diff,
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;

    #[test]
    fn reads_commit_files_and_diff() {
        let dir = std::env::temp_dir().join("gitsylva-detail-test");
        let _ = fs::remove_dir_all(&dir);
        fs::create_dir_all(&dir).unwrap();
        let p = dir.to_string_lossy().to_string();
        run_git(&p, &["init"]).unwrap();
        run_git(&p, &["config", "user.email", "t@t.com"]).unwrap();
        run_git(&p, &["config", "user.name", "T"]).unwrap();
        fs::write(format!("{p}/a.txt"), "one\ntwo\n").unwrap();
        run_git(&p, &["add", "-A"]).unwrap();
        run_git(&p, &["commit", "-m", "init"]).unwrap();
        let hash = run_git(&p, &["rev-parse", "HEAD"]).unwrap().trim().to_string();
        let d = commit_detail(p, hash).unwrap();
        assert_eq!(d.files.len(), 1);
        assert_eq!(d.files[0].path, "a.txt");
        assert_eq!(d.files[0].status, "A");
        assert_eq!(d.additions, 2);
        assert!(d.diff.contains("+two"));
    }
}
