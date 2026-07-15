use crate::error::GitError;
use crate::git::run_git;
use serde::Serialize;

#[derive(Debug, Serialize)]
pub struct TagInfo {
    pub name: String,
    pub target: String,
    pub subject: String,
}

#[tauri::command(rename = "list_tags")]
pub async fn list_tags_cmd(path: String) -> Result<Vec<TagInfo>, GitError> {
    crate::git::run_blocking("list_tags", move || list_tags(path)).await
}

#[tauri::command(rename = "create_tag")]
pub async fn create_tag_cmd(path: String, name: String, message: String, target: Option<String>) -> Result<(), GitError> {
    crate::git::run_mutating("create_tag", path.clone(), move || create_tag(path, name, message, target)).await
}

#[tauri::command(rename = "delete_tag")]
pub async fn delete_tag_cmd(path: String, name: String) -> Result<(), GitError> {
    crate::git::run_mutating("delete_tag", path.clone(), move || delete_tag(path, name)).await
}

/// List tags, newest first.
pub fn list_tags(path: String) -> Result<Vec<TagInfo>, GitError> {
    let out = run_git(
        &path,
        &[
            "for-each-ref",
            "--sort=-creatordate",
            "--format=%(refname:short)%1f%(objectname:short)%1f%(contents:subject)",
            "refs/tags",
        ],
    )?;
    let mut tags = Vec::new();
    for line in out.lines() {
        if line.trim().is_empty() {
            continue;
        }
        let f: Vec<&str> = line.split('\u{1f}').collect();
        let name = f.first().copied().unwrap_or("").to_string();
        if name.is_empty() {
            continue;
        }
        tags.push(TagInfo {
            name,
            target: f.get(1).copied().unwrap_or("").to_string(),
            subject: f.get(2).copied().unwrap_or("").to_string(),
        });
    }
    Ok(tags)
}

/// Create a tag on `target` (HEAD when omitted). A non-empty message produces
/// an annotated tag.
pub fn create_tag(path: String, name: String, message: String, target: Option<String>) -> Result<(), GitError> {
    if name.trim().is_empty() {
        return Err(GitError {
            code: "empty_name".into(),
            message: "o nome da tag está vazio".into(),
        });
    }
    let name = name.trim();
    let msg = message.trim();
    let mut args: Vec<&str> = if msg.is_empty() {
        vec!["tag", name]
    } else {
        vec!["tag", "-a", name, "-m", msg]
    };
    if let Some(t) = target.as_deref() {
        args.push(t);
    }
    run_git(&path, &args).map(|_| ())
}

/// Delete a tag.
pub fn delete_tag(path: String, name: String) -> Result<(), GitError> {
    run_git(&path, &["tag", "-d", &name]).map(|_| ())
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;

    fn repo(name: &str) -> String {
        let dir = std::env::temp_dir().join(format!("gitsylva-tags-test-{name}"));
        let _ = fs::remove_dir_all(&dir);
        fs::create_dir_all(&dir).unwrap();
        let p = dir.to_string_lossy().to_string();
        run_git(&p, &["init", "-b", "main"]).unwrap();
        run_git(&p, &["config", "user.email", "t@t.com"]).unwrap();
        run_git(&p, &["config", "user.name", "T"]).unwrap();
        fs::write(format!("{p}/a.txt"), "1").unwrap();
        run_git(&p, &["add", "-A"]).unwrap();
        run_git(&p, &["commit", "-m", "init"]).unwrap();
        p
    }

    #[test]
    fn create_list_delete() {
        let p = repo("cycle");
        create_tag(p.clone(), "v1.0".into(), "primeira".into(), None).unwrap();
        create_tag(p.clone(), "v0.9".into(), "".into(), None).unwrap();
        let tags = list_tags(p.clone()).unwrap();
        let names: Vec<&str> = tags.iter().map(|t| t.name.as_str()).collect();
        assert!(names.contains(&"v1.0"));
        assert!(names.contains(&"v0.9"));
        assert!(tags.iter().find(|t| t.name == "v1.0").unwrap().subject.contains("primeira"));

        delete_tag(p.clone(), "v0.9".into()).unwrap();
        let tags = list_tags(p).unwrap();
        assert!(!tags.iter().any(|t| t.name == "v0.9"));
    }
}
