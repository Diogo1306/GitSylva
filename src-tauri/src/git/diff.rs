use crate::error::GitError;
use crate::git::run_git;

#[tauri::command(rename = "get_diff")]
pub async fn get_diff_cmd(path: String, file: String, staged: bool, untracked: bool, full: Option<bool>) -> Result<String, GitError> {
    let full = full.unwrap_or(false);
    crate::git::run_blocking("get_diff", move || {
        let patch = get_diff(path, file, staged, untracked)?;
        Ok(if full { patch } else { crate::git::cap_patch(patch, crate::git::PATCH_CAP_BYTES) })
    })
    .await
}

pub fn get_diff(path: String, file: String, staged: bool, untracked: bool) -> Result<String, GitError> {
    // `git diff` shows nothing for untracked files; synthesize an all-added
    // patch so new files can be previewed before staging.
    if untracked {
        return untracked_diff(&path, &file);
    }
    let mut args = vec!["diff"];
    if staged {
        args.push("--staged");
    }
    args.push("--");
    args.push(&file);
    run_git(&path, &args)
}

fn untracked_diff(path: &str, file: &str) -> Result<String, GitError> {
    let full = std::path::Path::new(path).join(file);
    if full.is_dir() {
        return Ok(format!("diff --git a/{file} b/{file}\nnovo diretório (conteúdo não rastreado)\n"));
    }
    let bytes = std::fs::read(&full).map_err(|e| GitError {
        code: "io".into(),
        message: format!("não foi possível ler {file}: {e}"),
    })?;
    if bytes.contains(&0) {
        return Ok(format!("diff --git a/{file} b/{file}\nficheiro novo (binário, {} bytes)\n", bytes.len()));
    }
    const CAP: usize = 1_000_000;
    let truncated = bytes.len() > CAP;
    let end = bytes.len().min(CAP);
    let text = String::from_utf8_lossy(&bytes[..end]);
    let lines: Vec<&str> = text.lines().collect();
    let mut out = format!(
        "diff --git a/{file} b/{file}\nnew file mode 100644\n--- /dev/null\n+++ b/{file}\n@@ -0,0 +1,{} @@\n",
        lines.len()
    );
    for l in &lines {
        out.push('+');
        out.push_str(l);
        out.push('\n');
    }
    if truncated {
        out.push_str("+… (pré-visualização truncada)\n");
    }
    Ok(out)
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;

    #[test]
    fn diff_shows_added_line() {
        let dir = std::env::temp_dir().join("gitsylva-diff-test");
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
        let diff = get_diff(p, "a.txt".into(), false, false).unwrap();
        assert!(diff.contains("+two"));
    }

    #[test]
    fn untracked_file_previews_as_added() {
        let dir = std::env::temp_dir().join("gitsylva-diff-test-untracked");
        let _ = fs::remove_dir_all(&dir);
        fs::create_dir_all(&dir).unwrap();
        let p = dir.to_string_lossy().to_string();
        run_git(&p, &["init"]).unwrap();
        fs::write(format!("{p}/novo.txt"), "linha um\nlinha dois\n").unwrap();
        let diff = get_diff(p, "novo.txt".into(), false, true).unwrap();
        assert!(diff.contains("+linha um"));
        assert!(diff.contains("@@ -0,0 +1,2 @@"));
    }
}
