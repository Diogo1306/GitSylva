use crate::error::GitError;
use crate::git::run_git;
use serde::Serialize;

#[derive(Debug, Serialize)]
pub struct TagInfo {
    pub name: String,
    pub target: String,
    pub subject: String,
}

/// List tags, newest first.
#[tauri::command]
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

/// Create a tag on HEAD. A non-empty message produces an annotated tag.
#[tauri::command]
pub fn create_tag(path: String, name: String, message: String) -> Result<(), GitError> {
    if name.trim().is_empty() {
        return Err(GitError {
            code: "empty_name".into(),
            message: "o nome da tag está vazio".into(),
        });
    }
    let name = name.trim();
    let msg = message.trim();
    if msg.is_empty() {
        run_git(&path, &["tag", name]).map(|_| ())
    } else {
        run_git(&path, &["tag", "-a", name, "-m", msg]).map(|_| ())
    }
}

/// Delete a tag.
#[tauri::command]
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
        create_tag(p.clone(), "v1.0".into(), "primeira".into()).unwrap();
        create_tag(p.clone(), "v0.9".into(), "".into()).unwrap();
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
