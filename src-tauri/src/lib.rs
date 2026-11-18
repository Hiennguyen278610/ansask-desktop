mod commands;
pub mod db;
pub mod error;
pub mod models;
pub mod state;

use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .setup(|app| {
            let dir = app.path().app_data_dir()?;
            std::fs::create_dir_all(&dir)?;
            let database = db::open(dir.join("ansask.db"))?;
            app.manage(database);
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::subject_list,
            commands::subject_create,
            commands::subject_rename,
            commands::subject_soft_delete,
            commands::exam_list,
            commands::exam_get,
            commands::exam_create,
            commands::exam_update,
            commands::exam_soft_delete,
            commands::question_list_all,
            commands::attempt_save,
            commands::attempt_get,
            commands::attempt_list,
            commands::session_save,
            commands::session_get,
            commands::session_delete,
            commands::trash_list,
            commands::trash_restore,
            commands::trash_purge,
            commands::stats_totals,
            commands::stats_recent_attempts,
            commands::stats_avg_by_subject,
            commands::open_external_url
        ])
        .run(tauri::generate_context!())
        .expect("error while running Ansask");
}
