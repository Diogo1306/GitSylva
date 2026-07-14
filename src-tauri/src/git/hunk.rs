use crate::error::GitError;
use crate::git::run_git_stdin;

/// Apply a single-hunk patch (built by the frontend from a file's diff) to the
/// index and/or working tree via `git apply`.
///
/// - stage a hunk:   cached = true,  reverse = false
/// - unstage a hunk: cached = true,  reverse = true   (patch is the staged diff)
/// - discard a hunk: cached = false, reverse = true   (patch is the worktree diff)
#[tauri::command(rename = "apply_hunk")]
pub async fn apply_hunk_cmd(path: String, patch: String, cached: bool, reverse: bool) -> Result<(), GitError> {
    crate::git::run_mutating("apply_hunk", path.clone(), move || apply_hunk(path, patch, cached, reverse)).await
}

pub fn apply_hunk(path: String, patch: String, cached: bool, reverse: bool) -> Result<(), GitError> {
    let mut args = vec!["apply"];
    if cached {
        args.push("--cached");
    }
    if reverse {
        args.push("--reverse");
    }
    // Read the patch from stdin so we never touch a temp file.
    args.push("-");
    run_git_stdin(&path, &args, &patch).map(|_| ())
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::git::run_git;
    use std::fs;

    // Build a one-hunk patch: the file header plus only the Nth `@@` block.
    fn nth_hunk(diff: &str, n: usize) -> String {
        let lines: Vec<&str> = diff.lines().collect();
        let mut header = Vec::new();
        let mut hunks: Vec<Vec<&str>> = Vec::new();
        for l in &lines {
            if l.starts_with("@@") {
                hunks.push(vec![*l]);
            } else if hunks.is_empty() {
                header.push(*l);
            } else {
                hunks.last_mut().unwrap().push(*l);
            }
        }
        let mut out = header.join("\n");
        out.push('\n');
        out.push_str(&hunks[n].join("\n"));
        out.push('\n');
        out
    }

    #[test]
    fn stages_only_the_chosen_hunk() {
        let dir = std::env::temp_dir().join(format!("gitsylva-hunk-{}", std::process::id()));
        let _ = fs::remove_dir_all(&dir);
        fs::create_dir_all(&dir).unwrap();
        let p = dir.to_string_lossy().to_string();
        run_git(&p, &["init"]).unwrap();
        run_git(&p, &["config", "user.email", "t@t.com"]).unwrap();
        run_git(&p, &["config", "user.name", "T"]).unwrap();
        // Six lines, wide enough apart that two edits become two hunks.
        fs::write(format!("{p}/a.txt"), "a\nb\nc\nd\ne\nf\ng\nh\ni\nj\n").unwrap();
        run_git(&p, &["add", "-A"]).unwrap();
        run_git(&p, &["commit", "-m", "init"]).unwrap();
        fs::write(format!("{p}/a.txt"), "AA\nb\nc\nd\ne\nf\ng\nh\ni\nJJ\n").unwrap();

        let diff = run_git(&p, &["diff", "--", "a.txt"]).unwrap();
        let first = nth_hunk(&diff, 0);
        apply_hunk(p.clone(), first, true, false).unwrap();

        let staged = run_git(&p, &["diff", "--staged", "--", "a.txt"]).unwrap();
        assert!(staged.contains("+AA"), "first hunk should be staged");
        assert!(!staged.contains("+JJ"), "second hunk should remain unstaged");
    }

    #[test]
    fn reverse_unstages_a_hunk() {
        let dir = std::env::temp_dir().join(format!("gitsylva-hunk-rev-{}", std::process::id()));
        let _ = fs::remove_dir_all(&dir);
        fs::create_dir_all(&dir).unwrap();
        let p = dir.to_string_lossy().to_string();
        run_git(&p, &["init"]).unwrap();
        run_git(&p, &["config", "user.email", "t@t.com"]).unwrap();
        run_git(&p, &["config", "user.name", "T"]).unwrap();
        fs::write(format!("{p}/a.txt"), "one\n").unwrap();
        run_git(&p, &["add", "-A"]).unwrap();
        run_git(&p, &["commit", "-m", "init"]).unwrap();
        fs::write(format!("{p}/a.txt"), "one\ntwo\n").unwrap();
        run_git(&p, &["add", "-A"]).unwrap();

        let staged = run_git(&p, &["diff", "--staged", "--", "a.txt"]).unwrap();
        apply_hunk(p.clone(), nth_hunk(&staged, 0), true, true).unwrap();

        let after = run_git(&p, &["diff", "--staged", "--", "a.txt"]).unwrap();
        assert!(!after.contains("+two"), "hunk should be unstaged");
    }
}
