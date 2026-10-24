use tauri::State;
use crate::state::AppState;
use crate::error::AppError;
use crate::dto::subject_dto::{SubjectSummary, SubjectCreateReq, SubjectUpdateReq};
use crate::services::subject_service;
use serde::Deserialize;

#[derive(Deserialize)] 
#[serde(rename_all = "camelCase")]
pub struct IdReq { pub id: String }

#[tauri::command] pub fn subject_list(state: State<'_, AppState>) -> Result<Vec<SubjectSummary>, AppError> { subject_service::list(&state.pool) }
#[tauri::command] pub fn subject_create(state: State<'_, AppState>, req: SubjectCreateReq) -> Result<SubjectSummary, AppError> { subject_service::create(&state.pool, req) }
#[tauri::command] pub fn subject_update(state: State<'_, AppState>, req: SubjectUpdateReq) -> Result<(), AppError> { subject_service::update(&state.pool, req) }
#[tauri::command] pub fn subject_delete(state: State<'_, AppState>, req: IdReq) -> Result<(), AppError> { subject_service::delete(&state.pool, &req.id) }
