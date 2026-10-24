use crate::dto::trash_dto::{PurgeReq, RestoreReq, TrashItemDto};
use crate::error::AppError;
use crate::services::trash_service;
use crate::state::AppState;
use tauri::State;

#[tauri::command]
pub fn trash_list(state: State<'_, AppState>) -> Result<Vec<TrashItemDto>, AppError> {
    trash_service::list(&state.pool)
}
#[tauri::command]
pub fn subject_restore(state: State<'_, AppState>, req: RestoreReq) -> Result<(), AppError> {
    trash_service::restore_subject(&state.pool, req)
}
#[tauri::command]
pub fn exam_restore(state: State<'_, AppState>, req: RestoreReq) -> Result<(), AppError> {
    trash_service::restore_exam(&state.pool, req)
}
#[tauri::command]
pub fn trash_purge_item(state: State<'_, AppState>, req: PurgeReq) -> Result<(), AppError> {
    trash_service::purge_item(&state.pool, req)
}
#[tauri::command]
pub fn trash_empty(state: State<'_, AppState>) -> Result<(), AppError> {
    trash_service::empty_trash(&state.pool)
}
