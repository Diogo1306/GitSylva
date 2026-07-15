use crate::error::GitError;
use crate::git::run_git;
use serde::Serialize;

#[derive(Debug, Serialize)]
pub struct GitIdentity {
    pub name: String,
    pub email: String,
}

#[tauri::command(rename = "get_identity")]
pub async fn get_identity_cmd(path: String) -> Result<GitIdentity, GitError> {
    crate::git::run_blocking("get_identity", move || get_identity(path)).await
}

#[tauri::command(rename = "set_identity")]
pub async fn set_identity_cmd(path: String, name: String, email: String) -> Result<(), GitError> {
    crate::git::run_mutating("set_identity", path.clone(), move || set_identity(path, name, email)).await
}

/// Read the effective user.name / user.email for this repo (falls back to the
/// global config when not set locally). Missing values come back empty.
pub fn get_identity(path: String) -> Result<GitIdentity, GitError> {
    let name = run_git(&path, &["config", "user.name"]).unwrap_or_default().trim().to_string();
    let email = run_git(&path, &["config", "user.email"]).unwrap_or_default().trim().to_string();
    Ok(GitIdentity { name, email })
}

/// Set the repo-local user.name / user.email (empty values are skipped).
pub fn set_identity(path: String, name: String, email: String) -> Result<(), GitError> {
    if !name.trim().is_empty() {
        run_git(&path, &["config", "user.name", name.trim()])?;
    }
    if !email.trim().is_empty() {
        run_git(&path, &["config", "user.email", email.trim()])?;
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;

    #[test]
    fn set_then_get_identity() {
        let dir = std::env::temp_dir().join("gitsylva-config-test");
        let _ = fs::remove_dir_all(&dir);
        fs::create_dir_all(&dir).unwrap();
        let p = dir.to_string_lossy().to_string();
        run_git(&p, &["init"]).unwrap();
        set_identity(p.clone(), "Ana Souza".into(), "ana@sylva.dev".into()).unwrap();
        let id = get_identity(p).unwrap();
        assert_eq!(id.name, "Ana Souza");
        assert_eq!(id.email, "ana@sylva.dev");
    }
}
