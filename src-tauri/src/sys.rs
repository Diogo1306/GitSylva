use crate::error::GitError;
use std::path::Path;

fn os_err(e: std::io::Error) -> GitError {
    GitError {
        code: "os".into(),
        message: e.to_string(),
    }
}

#[tauri::command(rename = "open_path")]
pub async fn open_path_cmd(path: String, file: String) -> Result<(), GitError> {
    crate::git::run_blocking("open_path", move || open_path(path, file)).await
}

#[tauri::command(rename = "reveal_path")]
pub async fn reveal_path_cmd(path: String, file: String) -> Result<(), GitError> {
    crate::git::run_blocking("reveal_path", move || reveal_path(path, file)).await
}

/// Open a file (or folder) with the OS default handler.
pub fn open_path(path: String, file: String) -> Result<(), GitError> {
    let full = Path::new(&path).join(&file);
    #[cfg(target_os = "windows")]
    {
        std::process::Command::new("cmd")
            .args(["/C", "start", ""])
            .arg(&full)
            .spawn()
            .map_err(os_err)?;
    }
    #[cfg(target_os = "macos")]
    {
        std::process::Command::new("open").arg(&full).spawn().map_err(os_err)?;
    }
    #[cfg(all(unix, not(target_os = "macos")))]
    {
        std::process::Command::new("xdg-open").arg(&full).spawn().map_err(os_err)?;
    }
    Ok(())
}

/// Reveal a file in the system file manager (Explorer on Windows).
pub fn reveal_path(path: String, file: String) -> Result<(), GitError> {
    let full = Path::new(&path).join(&file);
    #[cfg(target_os = "windows")]
    {
        std::process::Command::new("explorer")
            .arg(format!("/select,{}", full.display()))
            .spawn()
            .map_err(os_err)?;
    }
    #[cfg(target_os = "macos")]
    {
        std::process::Command::new("open").arg("-R").arg(&full).spawn().map_err(os_err)?;
    }
    #[cfg(all(unix, not(target_os = "macos")))]
    {
        let parent = full.parent().unwrap_or(Path::new("."));
        std::process::Command::new("xdg-open").arg(parent).spawn().map_err(os_err)?;
    }
    Ok(())
}
