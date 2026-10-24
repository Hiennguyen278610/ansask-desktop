mod commands;
mod db;
mod domain;
mod dto;
mod error;
mod parsers;
mod repositories;
mod services;
mod state;
mod utils;

use state::AppState;
use std::fs;
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tracing_subscriber::fmt()
        .with_env_filter(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| tracing_subscriber::EnvFilter::new("info")),
        )
        .try_init()
        .ok();

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            let app_dir = app
                .path()
                .app_data_dir()
                .map_err(|e| format!("Lỗi app_data_dir: {e}"))?;
            fs::create_dir_all(&app_dir)?;
            let db_path = app_dir.join("ansask.db");
            let pool = db::pool::create_pool(&db_path).map_err(|e| format!("Lỗi DB: {e}"))?;
            {
                let mut conn = pool.get().map_err(|e| format!("Pool error: {e}"))?;
                db::migrations::run(&mut conn).map_err(|e| format!("Migration lỗi: {e}"))?;
            }
            app.manage(AppState::new(pool));
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::settings_cmds::setting_get,
            commands::settings_cmds::setting_set,
            commands::subject_cmds::subject_list,
            commands::subject_cmds::subject_create,
            commands::subject_cmds::subject_update,
            commands::subject_cmds::subject_delete,
            commands::exam_cmds::exam_list,
            commands::exam_cmds::exam_get,
            commands::exam_cmds::exam_save,
            commands::exam_cmds::exam_delete,
            commands::import_cmds::import_parse,
            commands::quiz_cmds::quiz_start,
            commands::attempt_cmds::attempt_submit,
            commands::attempt_cmds::attempt_list,
            commands::attempt_cmds::attempt_list_all,
            commands::attempt_cmds::attempt_list_all,
            commands::attempt_cmds::attempt_review,
            commands::quiz_cmds::quiz_start,
            commands::attempt_cmds::attempt_submit,
            commands::attempt_cmds::attempt_list,
            commands::attempt_cmds::attempt_list_all,
            commands::attempt_cmds::attempt_list_all,
            commands::attempt_cmds::attempt_review,
            commands::quiz_cmds::quiz_start,
            commands::attempt_cmds::attempt_submit,
            commands::attempt_cmds::attempt_list,
            commands::attempt_cmds::attempt_list_all,
            commands::attempt_cmds::attempt_list_all,
            commands::attempt_cmds::attempt_review,
            commands::quiz_cmds::quiz_start,
            commands::attempt_cmds::attempt_submit,
            commands::attempt_cmds::attempt_list,
            commands::attempt_cmds::attempt_list_all,
            commands::attempt_cmds::attempt_list_all,
            commands::attempt_cmds::attempt_review,
            commands::quiz_cmds::quiz_start,
            commands::attempt_cmds::attempt_submit,
            commands::attempt_cmds::attempt_list,
            commands::attempt_cmds::attempt_list_all,
            commands::attempt_cmds::attempt_list_all,
            commands::attempt_cmds::attempt_review,
            commands::quiz_cmds::quiz_start,
            commands::attempt_cmds::attempt_submit,
            commands::attempt_cmds::attempt_list,
            commands::attempt_cmds::attempt_list_all,
            commands::attempt_cmds::attempt_list_all,
            commands::attempt_cmds::attempt_review,
            commands::quiz_cmds::quiz_start,
            commands::attempt_cmds::attempt_submit,
            commands::attempt_cmds::attempt_list,
            commands::attempt_cmds::attempt_list_all,
            commands::attempt_cmds::attempt_list_all,
            commands::attempt_cmds::attempt_review,
            commands::quiz_cmds::quiz_start,
            commands::attempt_cmds::attempt_submit,
            commands::attempt_cmds::attempt_list,
            commands::attempt_cmds::attempt_list_all,
            commands::attempt_cmds::attempt_list_all,
            commands::attempt_cmds::attempt_review,
        ])
        .run(tauri::generate_context!())
        .expect("Lỗi chạy Tauri");
}
