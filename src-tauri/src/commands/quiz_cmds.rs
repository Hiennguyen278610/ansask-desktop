use crate::dto::quiz_dto::{QuizStartReq, QuizStartRes};
use crate::error::AppError;
use crate::services::quiz_service;
use crate::state::AppState;
use tauri::State;

#[tauri::command]
pub fn quiz_start(state: State<'_, AppState>, req: QuizStartReq) -> Result<QuizStartRes, AppError> {
    quiz_service::start_quiz(&state.pool, req)
}
