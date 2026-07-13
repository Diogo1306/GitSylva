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

#[tauri::command]
pub fn get_log(path: String, limit: u32, skip: u32) -> Result<Vec<Commit>, GitError> {
    let arg = format!("--pretty=format:{FMT}");
    let n = format!("-{limit}");
    let sk = format!("--skip={skip}");
    match run_git(&path, &["log", &n, &sk, &arg]) {
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
    fn empty_repo_yields_empty_log() {
        let dir = std::env::temp_dir().join("gitsylva-log-test-empty");
        let _ = fs::remove_dir_all(&dir);
        fs::create_dir_all(&dir).unwrap();
        let p = dir.to_string_lossy().to_string();
        run_git(&p, &["init"]).unwrap();
        let commits = get_log(p, 10, 0).unwrap();
        assert!(commits.is_empty());
    }
}
