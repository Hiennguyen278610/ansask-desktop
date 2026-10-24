use crate::dto::attempt_dto::{
    AttemptResultDto, AttemptReviewDto, AttemptSubmitReq, AttemptSummary,
};
use crate::error::AppError;
use crate::repositories::attempt_repo;
use crate::services::attempt_service;
use crate::state::AppState;
use serde::Deserialize;
use tauri::State;

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ExamIdReq {
    pub exam_id: String,
}
#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct IdReq {
    pub id: String,
}

#[tauri::command]
pub fn attempt_submit(
    state: State<'_, AppState>,
    req: AttemptSubmitReq,
) -> Result<AttemptResultDto, AppError> {
    attempt_service::submit_attempt(&state.pool, req)
}
#[tauri::command]
pub fn attempt_list(
    state: State<'_, AppState>,
    req: ExamIdReq,
) -> Result<Vec<AttemptSummary>, AppError> {
    attempt_repo::list_by_exam(&state.pool, &req.exam_id)
}
#[tauri::command]
pub fn attempt_review(
    state: State<'_, AppState>,
    req: IdReq,
) -> Result<AttemptReviewDto, AppError> {
    attempt_repo::get_review(&state.pool, &req.id)
}
