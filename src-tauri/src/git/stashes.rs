use crate::error::GitError;
use crate::git::run_git;
use serde::Serialize;

#[derive(Debug, Serialize)]
pub struct StashInfo {
    pub index: u32,
    pub message: String,
    pub relative_date: String,
}

/// List stashes, newest (stash@{0}) first.
#[tauri::command]
pub fn list_stashes(path: String) -> Result<Vec<StashInfo>, GitError> {
    let out = run_git(&path, &["stash", "list", "--format=%gd%x1f%s%x1f%cr"])?;
    let mut stashes = Vec::new();
    for line in out.lines() {
        if line.trim().is_empty() {
            continue;
        }
        let f: Vec<&str> = line.split('\u{1f}').collect();
        // %gd looks like "stash@{0}"; pull the number out.
        let index = f
            .first()
            .and_then(|s| s.split('{').nth(1))
            .and_then(|s| s.split('}').next())
            .and_then(|s| s.parse::<u32>().ok())
            .unwrap_or(0);
        stashes.push(StashInfo {
            index,
            message: f.get(1).copied().unwrap_or("").to_string(),
            relative_date: f.get(2).copied().unwrap_or("").to_string(),
        });
    }
    Ok(stashes)
}

/// Stash current changes. `keep_index` leaves staged changes in the index.
#[tauri::command]
pub fn create_stash(path: String, message: String, keep_index: bool) -> Result<(), GitError> {
    let mut args = vec!["stash", "push"];
    if keep_index {
        args.push("--keep-index");
    }
    let msg = message.trim();
    if !msg.is_empty() {
        args.push("-m");
        args.push(msg);
    }
    let out = run_git(&path, &args)?;
    if out.contains("No local changes to save") {
        return Err(GitError {
            code: "nothing_to_stash".into(),
            message: "sem alterações para guardar".into(),
        });
    }
    Ok(())
}

/// Apply a stash without removing it. A conflicting apply DOES write the
/// changes (with conflict markers), so that case is reported distinctly
/// instead of pretending nothing happened.
#[tauri::command]
pub fn apply_stash(path: String, index: u32) -> Result<(), GitError> {
    match run_git(&path, &["stash", "apply", &format!("stash@{{{index}}}")]) {
        Ok(_) => Ok(()),
        Err(original) => {
            let unmerged = run_git(&path, &["diff", "--name-only", "--diff-filter=U"]).unwrap_or_default();
            if unmerged.lines().any(|l| !l.trim().is_empty()) {
                Err(GitError {
                    code: "conflict".into(),
                    message: "o stash foi aplicado com conflitos — resolve os ficheiros marcados na Cópia de trabalho".into(),
                })
            } else {
                Err(original)
            }
        }
    }
}

/// Delete a stash.
#[tauri::command]
pub fn drop_stash(path: String, index: u32) -> Result<(), GitError> {
    run_git(&path, &["stash", "drop", &format!("stash@{{{index}}}")]).map(|_| ())
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;

    fn repo(name: &str) -> String {
        let dir = std::env::temp_dir().join(format!("gitsylva-stashes-test-{name}"));
        let _ = fs::remove_dir_all(&dir);
        fs::create_dir_all(&dir).unwrap();
        let p = dir.to_string_lossy().to_string();
        run_git(&p, &["init", "-b", "main"]).unwrap();
        run_git(&p, &["config", "user.email", "t@t.com"]).unwrap();
        run_git(&p, &["config", "user.name", "T"]).unwrap();
        fs::write(format!("{p}/a.txt"), "one\n").unwrap();
        run_git(&p, &["add", "-A"]).unwrap();
        run_git(&p, &["commit", "-m", "init"]).unwrap();
        p
    }

    #[test]
    fn create_list_apply_drop() {
        let p = repo("cycle");
        fs::write(format!("{p}/a.txt"), "one\ntwo\n").unwrap();
        create_stash(p.clone(), "WIP teste".into(), false).unwrap();
        let stashes = list_stashes(p.clone()).unwrap();
        assert_eq!(stashes.len(), 1);
        assert!(stashes[0].message.contains("WIP teste"));

        apply_stash(p.clone(), 0).unwrap();
        // still present after apply
        assert_eq!(list_stashes(p.clone()).unwrap().len(), 1);

        drop_stash(p.clone(), 0).unwrap();
        assert_eq!(list_stashes(p).unwrap().len(), 0);
    }

    #[test]
    fn stash_without_changes_errors() {
        let p = repo("empty");
        let err = create_stash(p, "nada".into(), false).unwrap_err();
        assert_eq!(err.code, "nothing_to_stash");
    }

    #[test]
    fn conflicting_apply_reports_conflict() {
        let p = repo("conflict");
        // Stash an edit, then commit a different edit to the same line.
        fs::write(format!("{p}/a.txt"), "stashed\n").unwrap();
        create_stash(p.clone(), "WIP".into(), false).unwrap();
        fs::write(format!("{p}/a.txt"), "committed\n").unwrap();
        run_git(&p, &["commit", "-am", "diverge"]).unwrap();

        let err = apply_stash(p.clone(), 0).unwrap_err();
        assert_eq!(err.code, "conflict");
        // The apply really did write conflict markers.
        let content = fs::read_to_string(format!("{p}/a.txt")).unwrap();
        assert!(content.contains("<<<<<<<"));
    }
}
