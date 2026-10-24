use crate::dto::stats_dto::{StatsOverviewDto, StatsOverviewReq};
use crate::error::AppError;
use crate::services::stats_service;
use crate::state::AppState;
use tauri::State;

#[tauri::command]
pub fn stats_overview(
    state: State<'_, AppState>,
    req: StatsOverviewReq,
) -> Result<StatsOverviewDto, AppError> {
    stats_service::get_overview(&state.pool, &req.period)
}
