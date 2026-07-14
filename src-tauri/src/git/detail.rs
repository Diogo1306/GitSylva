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
    pub message: String,
    pub additions: u32,
    pub deletions: u32,
    pub files: Vec<CommitFile>,
    pub diff: String,
}

// Merge commits: `git show` alone uses the combined (--cc) diff, which is
// usually empty for clean merges — the panel would show "0 files". Diffing
// against the first parent (-m --first-parent) shows what the merge brought in.

#[tauri::command(rename = "commit_detail")]
pub async fn commit_detail_cmd(path: String, hash: String, full: Option<bool>) -> Result<CommitDetail, GitError> {
    let full = full.unwrap_or(false);
    crate::git::run_blocking("commit_detail", move || {
        let mut detail = commit_detail(path, hash)?;
        if !full {
            detail.diff = crate::git::cap_patch(detail.diff, crate::git::PATCH_CAP_BYTES);
        }
        Ok(detail)
    })
    .await
}

/// Files changed by a commit (with per file add/delete counts and status), the
/// full commit message, and the unified patch. Backs the history detail panel.
pub fn commit_detail(path: String, hash: String) -> Result<CommitDetail, GitError> {
    // The (possibly large) patch is fetched on a separate thread while the
    // main thread parses message + stats: two git spawns run concurrently.
    let diff_handle = {
        let (p, h) = (path.clone(), hash.clone());
        std::thread::spawn(move || run_git(&p, &["show", "--format=", "-m", "--first-parent", "--patch", &h]))
    };

    // Status letter per (new) path. `-z` gives exact NUL-separated fields even
    // for renames/copies: "R100 NUL old NUL new NUL".
    let name_status = run_git(
        &path,
        &["show", "--format=", "--name-status", "-z", "-m", "--first-parent", &hash],
    )?;
    let mut status_by_path: HashMap<String, String> = HashMap::new();
    let mut fields = name_status.split('\u{0}');
    while let Some(code) = fields.next() {
        let code = code.trim_matches('\n');
        if code.is_empty() {
            continue;
        }
        let letter = code.chars().next().unwrap().to_string();
        if letter == "R" || letter == "C" {
            let _old = fields.next();
            if let Some(new) = fields.next() {
                status_by_path.insert(new.to_string(), letter);
            }
        } else if let Some(p) = fields.next() {
            status_by_path.insert(p.to_string(), letter);
        }
    }

    // Full message and per-file add/delete counts in one call: %B then a NUL,
    // then the numstat records (NUL-terminated because of -z).
    let out = run_git(
        &path,
        &["show", "--format=%B%x00", "--numstat", "-z", "-m", "--first-parent", &hash],
    )?;
    let (message, numstat) = out.split_once('\u{0}').unwrap_or((out.as_str(), ""));
    let message = message.trim().to_string();

    let mut files = Vec::new();
    let mut add_total = 0u32;
    let mut del_total = 0u32;
    let mut records = numstat.split('\u{0}');
    while let Some(rec) = records.next() {
        let rec = rec.trim_matches('\n');
        if rec.is_empty() {
            continue;
        }
        let cols: Vec<&str> = rec.splitn(3, '\t').collect();
        if cols.len() < 3 {
            continue;
        }
        // Binary files report "-" for both counts.
        let additions = cols[0].parse::<u32>().unwrap_or(0);
        let deletions = cols[1].parse::<u32>().unwrap_or(0);
        // Renames leave the inline path empty; the old and new paths follow as
        // two separate NUL fields.
        let (fpath, renamed) = if cols[2].is_empty() {
            let _old = records.next();
            (records.next().unwrap_or("").to_string(), true)
        } else {
            (cols[2].to_string(), false)
        };
        add_total += additions;
        del_total += deletions;
        let status = status_by_path
            .get(&fpath)
            .cloned()
            .unwrap_or_else(|| if renamed { "R".into() } else { "M".into() });
        files.push(CommitFile {
            path: fpath,
            status,
            additions,
            deletions,
        });
    }

    let diff = diff_handle
        .join()
        .map_err(|_| GitError {
            code: "internal".into(),
            message: "falha ao obter o diff".into(),
        })??;

    Ok(CommitDetail {
        message,
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

    fn repo(name: &str) -> String {
        let dir = std::env::temp_dir().join(format!("gitsylva-detail-test-{name}"));
        let _ = fs::remove_dir_all(&dir);
        fs::create_dir_all(&dir).unwrap();
        let p = dir.to_string_lossy().to_string();
        run_git(&p, &["init", "-b", "main"]).unwrap();
        run_git(&p, &["config", "user.email", "t@t.com"]).unwrap();
        run_git(&p, &["config", "user.name", "T"]).unwrap();
        p
    }

    #[test]
    fn reads_commit_files_and_diff() {
        let p = repo("basic");
        fs::write(format!("{p}/a.txt"), "one\ntwo\n").unwrap();
        run_git(&p, &["add", "-A"]).unwrap();
        run_git(&p, &["commit", "-m", "init\n\ncorpo da mensagem"]).unwrap();
        let hash = run_git(&p, &["rev-parse", "HEAD"]).unwrap().trim().to_string();
        let d = commit_detail(p, hash).unwrap();
        assert_eq!(d.files.len(), 1);
        assert_eq!(d.files[0].path, "a.txt");
        assert_eq!(d.files[0].status, "A");
        assert_eq!(d.additions, 2);
        assert!(d.diff.contains("+two"));
        assert!(d.message.contains("corpo da mensagem"));
    }

    #[test]
    fn rename_reports_r_status_and_new_path() {
        let p = repo("rename");
        fs::write(format!("{p}/old.txt"), "same content that stays\n").unwrap();
        run_git(&p, &["add", "-A"]).unwrap();
        run_git(&p, &["commit", "-m", "init"]).unwrap();
        run_git(&p, &["mv", "old.txt", "new.txt"]).unwrap();
        run_git(&p, &["commit", "-m", "rename"]).unwrap();
        let hash = run_git(&p, &["rev-parse", "HEAD"]).unwrap().trim().to_string();
        let d = commit_detail(p, hash).unwrap();
        assert_eq!(d.files.len(), 1);
        assert_eq!(d.files[0].path, "new.txt");
        assert_eq!(d.files[0].status, "R");
    }

    #[test]
    fn merge_commit_shows_first_parent_changes() {
        let p = repo("merge");
        fs::write(format!("{p}/a.txt"), "base\n").unwrap();
        run_git(&p, &["add", "-A"]).unwrap();
        run_git(&p, &["commit", "-m", "base"]).unwrap();
        run_git(&p, &["checkout", "-b", "feature"]).unwrap();
        fs::write(format!("{p}/b.txt"), "feature file\n").unwrap();
        run_git(&p, &["add", "-A"]).unwrap();
        run_git(&p, &["commit", "-m", "feat"]).unwrap();
        run_git(&p, &["checkout", "main"]).unwrap();
        run_git(&p, &["merge", "--no-ff", "feature"]).unwrap();
        let hash = run_git(&p, &["rev-parse", "HEAD"]).unwrap().trim().to_string();
        let d = commit_detail(p, hash).unwrap();
        // The merge brought b.txt in relative to main (first parent).
        assert!(d.files.iter().any(|f| f.path == "b.txt"));
        assert!(d.diff.contains("feature file"));
    }
}
