use crate::error::GitError;
use crate::git::run_git;
use serde::Serialize;
use std::path::Path;

#[derive(Debug, Serialize)]
pub struct ConflictState {
    pub in_merge: bool,
    pub in_rebase: bool,
    pub in_cherry_pick: bool,
    pub in_revert: bool,
    pub files: Vec<String>,
}

/// Detect an in-progress merge/rebase/cherry-pick/revert and list the unmerged
/// (conflicted) files. `files` is also populated for bare conflicts with no
/// operation marker (e.g. a conflicting `stash apply`).
#[tauri::command]
pub fn conflict_state(path: String) -> Result<ConflictState, GitError> {
    let git_dir = run_git(&path, &["rev-parse", "--absolute-git-dir"])?
        .trim()
        .to_string();
    let g = Path::new(&git_dir);
    let in_merge = g.join("MERGE_HEAD").exists();
    let in_rebase = g.join("rebase-merge").exists() || g.join("rebase-apply").exists();
    let in_cherry_pick = g.join("CHERRY_PICK_HEAD").exists();
    let in_revert = g.join("REVERT_HEAD").exists();

    let out = run_git(&path, &["diff", "--name-only", "--diff-filter=U"])?;
    let files = out.lines().filter(|l| !l.trim().is_empty()).map(|s| s.to_string()).collect();

    Ok(ConflictState {
        in_merge,
        in_rebase,
        in_cherry_pick,
        in_revert,
        files,
    })
}

/// Resolve a conflicted file by taking one side ("ours" or "theirs"), then stage it.
#[tauri::command]
pub fn resolve_use(path: String, file: String, side: String) -> Result<(), GitError> {
    let flag = if side == "theirs" { "--theirs" } else { "--ours" };
    run_git(&path, &["checkout", flag, "--", &file])?;
    run_git(&path, &["add", "--", &file]).map(|_| ())
}

/// Mark a conflicted file as resolved (stage it) after a manual edit.
#[tauri::command]
pub fn mark_resolved(path: String, file: String) -> Result<(), GitError> {
    run_git(&path, &["add", "--", &file]).map(|_| ())
}

/// Continue an in-progress operation (kind = "merge" | "rebase" | "cherry-pick" | "revert").
#[tauri::command]
pub fn continue_op(path: String, kind: String) -> Result<(), GitError> {
    match kind.as_str() {
        "rebase" => run_git(&path, &["rebase", "--continue"]).map(|_| ()),
        "cherry-pick" => run_git(&path, &["cherry-pick", "--continue"]).map(|_| ()),
        "revert" => run_git(&path, &["revert", "--continue"]).map(|_| ()),
        _ => run_git(&path, &["commit", "--no-edit"]).map(|_| ()),
    }
}

/// Abort an in-progress operation.
#[tauri::command]
pub fn abort_op(path: String, kind: String) -> Result<(), GitError> {
    match kind.as_str() {
        "rebase" => run_git(&path, &["rebase", "--abort"]).map(|_| ()),
        "cherry-pick" => run_git(&path, &["cherry-pick", "--abort"]).map(|_| ()),
        "revert" => run_git(&path, &["revert", "--abort"]).map(|_| ()),
        _ => run_git(&path, &["merge", "--abort"]).map(|_| ()),
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;

    fn conflicting_repo(name: &str) -> String {
        let dir = std::env::temp_dir().join(format!("gitsylva-conflict-test-{name}"));
        let _ = fs::remove_dir_all(&dir);
        fs::create_dir_all(&dir).unwrap();
        let p = dir.to_string_lossy().to_string();
        run_git(&p, &["init", "-b", "main"]).unwrap();
        run_git(&p, &["config", "user.email", "t@t.com"]).unwrap();
        run_git(&p, &["config", "user.name", "T"]).unwrap();
        fs::write(format!("{p}/a.txt"), "base\n").unwrap();
        run_git(&p, &["add", "-A"]).unwrap();
        run_git(&p, &["commit", "-m", "base"]).unwrap();
        // Two branches change the same line.
        run_git(&p, &["checkout", "-b", "feature"]).unwrap();
        fs::write(format!("{p}/a.txt"), "feature\n").unwrap();
        run_git(&p, &["commit", "-am", "feat"]).unwrap();
        run_git(&p, &["checkout", "main"]).unwrap();
        fs::write(format!("{p}/a.txt"), "mainline\n").unwrap();
        run_git(&p, &["commit", "-am", "main2"]).unwrap();
        // Merge feature -> conflict (merge exits non-zero, which we ignore here).
        let _ = run_git(&p, &["merge", "feature"]);
        p
    }

    #[test]
    fn detect_resolve_and_continue() {
        let p = conflicting_repo("resolve");
        let st = conflict_state(p.clone()).unwrap();
        assert!(st.in_merge);
        assert!(st.files.contains(&"a.txt".to_string()));

        resolve_use(p.clone(), "a.txt".into(), "ours".into()).unwrap();
        continue_op(p.clone(), "merge".into()).unwrap();

        // Merge completed: no more conflict, and our side won.
        let st2 = conflict_state(p.clone()).unwrap();
        assert!(!st2.in_merge);
        assert!(st2.files.is_empty());
        let content = fs::read_to_string(format!("{p}/a.txt")).unwrap();
        assert!(content.contains("mainline"));
    }

    #[test]
    fn abort_restores_state() {
        let p = conflicting_repo("abort");
        assert!(conflict_state(p.clone()).unwrap().in_merge);
        abort_op(p.clone(), "merge".into()).unwrap();
        let st = conflict_state(p).unwrap();
        assert!(!st.in_merge);
        assert!(st.files.is_empty());
    }

    #[test]
    fn detects_and_aborts_cherry_pick_conflict() {
        let dir = std::env::temp_dir().join("gitsylva-conflict-test-cherry");
        let _ = fs::remove_dir_all(&dir);
        fs::create_dir_all(&dir).unwrap();
        let p = dir.to_string_lossy().to_string();
        run_git(&p, &["init", "-b", "main"]).unwrap();
        run_git(&p, &["config", "user.email", "t@t.com"]).unwrap();
        run_git(&p, &["config", "user.name", "T"]).unwrap();
        fs::write(format!("{p}/a.txt"), "base\n").unwrap();
        run_git(&p, &["add", "-A"]).unwrap();
        run_git(&p, &["commit", "-m", "base"]).unwrap();
        // A branch commit that conflicts with main's later edit.
        run_git(&p, &["checkout", "-b", "feature"]).unwrap();
        fs::write(format!("{p}/a.txt"), "feature\n").unwrap();
        run_git(&p, &["commit", "-am", "feat"]).unwrap();
        let feat = run_git(&p, &["rev-parse", "HEAD"]).unwrap().trim().to_string();
        run_git(&p, &["checkout", "main"]).unwrap();
        fs::write(format!("{p}/a.txt"), "mainline\n").unwrap();
        run_git(&p, &["commit", "-am", "main2"]).unwrap();
        let _ = run_git(&p, &["cherry-pick", &feat]);

        let st = conflict_state(p.clone()).unwrap();
        assert!(st.in_cherry_pick);
        assert!(!st.in_merge);
        assert!(st.files.contains(&"a.txt".to_string()));

        abort_op(p.clone(), "cherry-pick".into()).unwrap();
        let st2 = conflict_state(p).unwrap();
        assert!(!st2.in_cherry_pick);
        assert!(st2.files.is_empty());
    }
}
