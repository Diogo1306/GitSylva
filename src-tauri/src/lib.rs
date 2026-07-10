mod error;
mod git;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_dialog::init())
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      Ok(())
    })
    .invoke_handler(tauri::generate_handler![
      git::repo::open_repo,
      git::status::get_status,
      git::stage::stage_file,
      git::stage::unstage_file,
      git::stage::stage_all,
      git::stage::discard_file,
      git::commit::commit,
      git::log::get_log,
      git::diff::get_diff,
      git::detail::commit_detail,
      git::branches::list_branches,
      git::branches::checkout_branch,
      git::branches::create_branch,
      git::stashes::list_stashes,
      git::stashes::create_stash,
      git::stashes::apply_stash,
      git::stashes::drop_stash,
      git::tags::list_tags,
      git::tags::create_tag,
      git::tags::delete_tag
    ])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
