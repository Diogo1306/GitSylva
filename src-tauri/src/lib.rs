mod error;
mod git;
mod sys;

use tauri_plugin_log::{RotationStrategy, Target, TargetKind};

/// Captures every panic (location, message, backtrace, current git op) as a
/// safety net — run_blocking already converts in-command panics to GitError.
fn install_panic_hook() {
  std::panic::set_hook(Box::new(|info| {
    let location = info
      .location()
      .map(|l| format!("{}:{}:{}", l.file(), l.line(), l.column()))
      .unwrap_or_else(|| "?".into());
    let payload = info.payload();
    let msg = payload
      .downcast_ref::<&str>()
      .map(|s| s.to_string())
      .or_else(|| payload.downcast_ref::<String>().cloned())
      .unwrap_or_else(|| "panic sem mensagem".into());
    let op = git::CURRENT_OP.with(|o| o.get()).unwrap_or("-");
    let backtrace = std::backtrace::Backtrace::force_capture();
    // Both sinks: the log file may not exist yet during very early startup.
    log::error!("PANIC [op={op}] em {location}: {msg}\n{backtrace}");
    eprintln!("PANIC [op={op}] em {location}: {msg}");
  }));
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  install_panic_hook();
  tauri::Builder::default()
    .plugin(tauri_plugin_dialog::init())
    // Auto-update: startup check lives in the frontend (UpdatePrompt); the
    // download/install runs here. process powers the relaunch afterwards.
    .plugin(tauri_plugin_updater::Builder::new().build())
    .plugin(tauri_plugin_process::init())
    .plugin(
      // Release builds also log (INFO+) to the app's log dir, capped and rotated.
      tauri_plugin_log::Builder::default()
        .level(if cfg!(debug_assertions) {
          log::LevelFilter::Debug
        } else {
          log::LevelFilter::Info
        })
        .targets([
          Target::new(TargetKind::Stdout),
          Target::new(TargetKind::LogDir { file_name: Some("gitsylva".into()) }),
        ])
        .max_file_size(2_000_000)
        .rotation_strategy(RotationStrategy::KeepOne)
        .build(),
    )
    .setup(|_app| {
      log::info!("GitSylva a iniciar (v{})", env!("CARGO_PKG_VERSION"));
      Ok(())
    })
    .invoke_handler(tauri::generate_handler![
      git::repo::open_repo_cmd,
      git::repo::init_repo_cmd,
      git::repo::clone_repo_cmd,
      git::repo::scan_local_repos_cmd,
      git::status::get_status_cmd,
      git::stage::stage_file_cmd,
      git::stage::unstage_file_cmd,
      git::stage::stage_all_cmd,
      git::stage::discard_file_cmd,
      git::stage::discard_all_cmd,
      git::commit::commit_cmd,
      git::commit::head_message_cmd,
      git::log::get_log_cmd,
      git::log::get_branch_commits_cmd,
      git::log::get_path_commits_cmd,
      git::diff::get_diff_cmd,
      git::hunk::apply_hunk_cmd,
      git::detail::commit_detail_cmd,
      git::branches::list_branches_cmd,
      git::branches::checkout_branch_cmd,
      git::branches::create_branch_cmd,
      git::branches::merge_branch_cmd,
      git::branches::delete_branch_cmd,
      git::branches::rename_branch_cmd,
      git::rewrite::reset_to_cmd,
      git::rewrite::cherry_pick_cmd,
      git::rewrite::rebase_cmd,
      git::rewrite::revert_commit_cmd,
      git::blame::blame_cmd,
      git::conflict::conflict_state_cmd,
      git::conflict::resolve_use_cmd,
      git::conflict::mark_resolved_cmd,
      git::conflict::continue_op_cmd,
      git::conflict::abort_op_cmd,
      git::stashes::list_stashes_cmd,
      git::stashes::stash_files_cmd,
      git::stashes::create_stash_cmd,
      git::stashes::apply_stash_cmd,
      git::stashes::pop_stash_cmd,
      git::stashes::drop_stash_cmd,
      git::tags::list_tags_cmd,
      git::tags::create_tag_cmd,
      git::tags::delete_tag_cmd,
      git::sync::fetch_cmd,
      git::sync::sync_status_cmd,
      git::sync::pull_cmd,
      git::sync::push_cmd,
      git::sync::push_branches_cmd,
      git::sync::outgoing_cmd,
      git::sync::incoming_cmd,
      git::config::get_identity_cmd,
      git::config::set_identity_cmd,
      sys::open_path_cmd,
      sys::reveal_path_cmd,
      sys::frontend_log_cmd
    ])
    .build(tauri::generate_context!())
    .expect("error while building tauri application")
    .run(|_app, event| {
      if let tauri::RunEvent::Exit = event {
        log::info!("GitSylva a encerrar");
      }
    });
}
