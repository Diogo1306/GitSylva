use crate::error::GitError;
use crate::git::run_git;
use serde::Serialize;

#[derive(Debug, Serialize)]
pub struct BlameLine {
    pub line: u32,
    pub hash: String,
    pub author: String,
    pub content: String,
}

/// Per-line blame for a tracked file. --line-porcelain repeats the full author
/// metadata on every line, which makes parsing straightforward.
#[tauri::command]
pub fn blame(path: String, file: String) -> Result<Vec<BlameLine>, GitError> {
    let out = run_git(&path, &["blame", "--line-porcelain", "--", &file])?;
    let mut lines = Vec::new();
    let mut hash = String::new();
    let mut author = String::new();
    let mut line_no = 0u32;
    for l in out.lines() {
        if l.starts_with('\t') {
            // The tab-prefixed line is the actual file content; it closes the block.
            line_no += 1;
            lines.push(BlameLine {
                line: line_no,
                hash: hash.chars().take(7).collect(),
                author: author.clone(),
                content: l[1..].to_string(),
            });
        } else if let Some(rest) = l.strip_prefix("author ") {
            author = rest.to_string();
        } else {
            // A header line "<40hex> orig final [n]" starts a new block.
            let first = l.split(' ').next().unwrap_or("");
            if first.len() == 40 && first.chars().all(|c| c.is_ascii_hexdigit()) {
                hash = first.to_string();
            }
        }
    }
    Ok(lines)
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;

    #[test]
    fn blame_reports_author_per_line() {
        let dir = std::env::temp_dir().join("gitsylva-blame-test");
        let _ = fs::remove_dir_all(&dir);
        fs::create_dir_all(&dir).unwrap();
        let p = dir.to_string_lossy().to_string();
        run_git(&p, &["init", "-b", "main"]).unwrap();
        run_git(&p, &["config", "user.email", "t@t.com"]).unwrap();
        run_git(&p, &["config", "user.name", "Ana"]).unwrap();
        fs::write(format!("{p}/a.txt"), "um\ndois\ntres\n").unwrap();
        run_git(&p, &["add", "-A"]).unwrap();
        run_git(&p, &["commit", "-m", "init"]).unwrap();

        let b = blame(p, "a.txt".into()).unwrap();
        assert_eq!(b.len(), 3);
        assert_eq!(b[0].line, 1);
        assert_eq!(b[0].content, "um");
        assert_eq!(b[1].content, "dois");
        assert!(b.iter().all(|l| l.author == "Ana"));
        assert!(b.iter().all(|l| l.hash.len() == 7));
    }
}
