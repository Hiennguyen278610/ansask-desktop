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

use std::fs;

use tauri::Manager;

use state::AppState;

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
                .map_err(|e| format!("Không lấy được app_data_dir: {e}"))?;
            fs::create_dir_all(&app_dir)?;
            let db_path = app_dir.join("ansask.db");

            let pool =
                db::pool::create_pool(&db_path).map_err(|e| format!("Không mở được DB: {e}"))?;

            {
                let mut conn = pool.get().map_err(|e| format!("Pool error: {e}"))?;
                db::migrations::run(&mut conn).map_err(|e| format!("Migration lỗi: {e}"))?;
            }

            app.manage(AppState::new(pool));
            tracing::info!("ansask-desktop khởi động, DB: {:?}", db_path);
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::settings_cmds::setting_get,
            commands::settings_cmds::setting_set,
        ])
        .run(tauri::generate_context!())
        .expect("Lỗi khi chạy Tauri");
}
