use crate::dto::exam_dto::{ExamDetail, ExamSaveReq, ExamSummary};
use crate::error::AppError;
use crate::services::exam_service;
use crate::state::AppState;
use serde::Deserialize;
use tauri::State;

#[derive(Deserialize)]
pub struct ExamListReq {
    pub subject_id: String,
}
#[derive(Deserialize)]
pub struct IdReq {
    pub id: String,
}

#[tauri::command]
pub fn exam_list(
    state: State<'_, AppState>,
    req: ExamListReq,
) -> Result<Vec<ExamSummary>, AppError> {
    exam_service::list_by_subject(&state.pool, &req.subject_id)
}
#[tauri::command]
pub fn exam_get(state: State<'_, AppState>, req: IdReq) -> Result<ExamDetail, AppError> {
    exam_service::get_detail(&state.pool, &req.id)
}
#[tauri::command]
pub fn exam_save(state: State<'_, AppState>, req: ExamSaveReq) -> Result<String, AppError> {
    exam_service::save(&state.pool, req)
}
#[tauri::command]
pub fn exam_delete(state: State<'_, AppState>, req: IdReq) -> Result<(), AppError> {
    exam_service::delete(&state.pool, &req.id)
}
