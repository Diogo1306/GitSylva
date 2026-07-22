use crate::error::GitError;
use std::path::Path;

fn os_err(e: std::io::Error) -> GitError {
    GitError {
        code: "os".into(),
        message: e.to_string(),
    }
}

/// Sink for frontend failures (window.onerror, unhandledrejection, error
/// boundaries): they land in the same rotated log file as the backend's
/// entries, so a field crash leaves one combined trail.
#[tauri::command(rename = "frontend_log")]
pub async fn frontend_log_cmd(level: String, message: String) -> Result<(), GitError> {
    let msg: String = message.chars().take(4000).collect();
    match level.as_str() {
        "error" => log::error!("[frontend] {msg}"),
        "warn" => log::warn!("[frontend] {msg}"),
        _ => log::info!("[frontend] {msg}"),
    }
    Ok(())
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
        // hide_console: the intermediate cmd must not flash a terminal.
        let mut cmd = std::process::Command::new("cmd");
        cmd.args(["/C", "start", ""]).arg(&full);
        crate::git::hide_console(&mut cmd);
        cmd.spawn().map_err(os_err)?;
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
        let mut cmd = std::process::Command::new("explorer");
        cmd.arg(format!("/select,{}", full.display()));
        crate::git::hide_console(&mut cmd);
        cmd.spawn().map_err(os_err)?;
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
