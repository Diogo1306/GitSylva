use crate::error::GitError;
use crate::git::run_git;
use serde::Serialize;

#[derive(Debug, Serialize)]
pub struct FileChange {
    pub path: String,
    pub index_status: String,
    pub worktree_status: String,
    pub orig_path: Option<String>,
}

#[tauri::command]
pub fn get_status(path: String) -> Result<Vec<FileChange>, GitError> {
    // Null terminated porcelain v2 is robust against spaces and renames.
    let out = run_git(&path, &["status", "--porcelain=v2", "-z"])?;
    Ok(parse_status(&out))
}

/// Parse porcelain v2 null terminated output into changes.
fn parse_status(out: &str) -> Vec<FileChange> {
    let mut changes = Vec::new();
    let mut fields = out.split('\u{0}').peekable();
    while let Some(entry) = fields.next() {
        if entry.is_empty() {
            continue;
        }
        let kind = entry.chars().next().unwrap();
        match kind {
            '1' => {
                // "1 XY sub mH mI mW hH hI path"
                let parts: Vec<&str> = entry.splitn(9, ' ').collect();
                let xy = parts[1];
                changes.push(FileChange {
                    path: parts[8].to_string(),
                    index_status: xy[0..1].to_string(),
                    worktree_status: xy[1..2].to_string(),
                    orig_path: None,
                });
            }
            '2' => {
                // Rename or copy. Path is in this entry, orig path is the next field.
                let parts: Vec<&str> = entry.splitn(10, ' ').collect();
                let xy = parts[1];
                let orig = fields.next().unwrap_or("").to_string();
                changes.push(FileChange {
                    path: parts[9].to_string(),
                    index_status: xy[0..1].to_string(),
                    worktree_status: xy[1..2].to_string(),
                    orig_path: Some(orig),
                });
            }
            '?' => {
                // "? path"
                let path = entry[2..].to_string();
                changes.push(FileChange {
                    path,
                    index_status: ".".into(),
                    worktree_status: "?".into(),
                    orig_path: None,
                });
            }
            'u' => {
                // Unmerged (conflict): "u XY sub m1 m2 m3 mW h1 h2 h3 path"
                let parts: Vec<&str> = entry.splitn(11, ' ').collect();
                if parts.len() == 11 {
                    let xy = parts[1];
                    changes.push(FileChange {
                        path: parts[10].to_string(),
                        index_status: xy[0..1].to_string(),
                        worktree_status: xy[1..2].to_string(),
                        orig_path: None,
                    });
                }
            }
            _ => {}
        }
    }
    changes
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;

    fn repo(name: &str) -> String {
        let dir = std::env::temp_dir().join(format!("gitsylva-status-test-{name}"));
        let _ = fs::remove_dir_all(&dir);
        fs::create_dir_all(&dir).unwrap();
        let p = dir.to_string_lossy().to_string();
        run_git(&p, &["init"]).unwrap();
        run_git(&p, &["config", "user.email", "t@t.com"]).unwrap();
        run_git(&p, &["config", "user.name", "T"]).unwrap();
        p
    }

    #[test]
    fn detects_conflicted_files() {
        let p = repo("conflict");
        // Base commit, then two branches editing the same line -> merge conflict.
        fs::write(format!("{p}/a.txt"), "base\n").unwrap();
        run_git(&p, &["add", "-A"]).unwrap();
        run_git(&p, &["commit", "-m", "base"]).unwrap();
        run_git(&p, &["checkout", "-b", "feature"]).unwrap();
        fs::write(format!("{p}/a.txt"), "feature\n").unwrap();
        run_git(&p, &["commit", "-am", "feat"]).unwrap();
        run_git(&p, &["checkout", "-"]).unwrap();
        fs::write(format!("{p}/a.txt"), "main\n").unwrap();
        run_git(&p, &["commit", "-am", "main"]).unwrap();
        let _ = run_git(&p, &["merge", "feature"]);

        let changes = get_status(p).unwrap();
        let conflicted = changes.iter().find(|c| c.path == "a.txt").expect("conflicted file listed");
        assert_eq!(conflicted.index_status, "U");
        assert_eq!(conflicted.worktree_status, "U");
    }

    #[test]
    fn detects_untracked_and_staged() {
        let p = repo("basic");
        fs::write(format!("{p}/a.txt"), "hello").unwrap();
        let changes = get_status(p.clone()).unwrap();
        assert_eq!(changes.len(), 1);
        assert_eq!(changes[0].worktree_status, "?");

        run_git(&p, &["add", "a.txt"]).unwrap();
        let changes = get_status(p).unwrap();
        assert_eq!(changes[0].index_status, "A");
    }
}
