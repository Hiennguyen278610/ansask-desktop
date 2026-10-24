use serde::{Deserialize, Serialize};
use tauri::State;

use crate::error::AppError;
use crate::repositories::setting_repo;
use crate::state::AppState;

#[derive(Debug, Serialize, Deserialize)]
pub struct SettingValueDto {
    pub key: String,
    pub value: String,
}

#[derive(Debug, Deserialize)]
pub struct SettingGetReq {
    pub key: String,
}

#[derive(Debug, Deserialize)]
pub struct SettingSetReq {
    pub key: String,
    pub value: String,
}

#[tauri::command]
pub fn setting_get(
    state: State<'_, AppState>,
    req: SettingGetReq,
) -> Result<SettingValueDto, AppError> {
    let value = setting_repo::get(&state.pool, &req.key)?.unwrap_or_default();
    Ok(SettingValueDto {
        key: req.key,
        value,
    })
}

#[tauri::command]
pub fn setting_set(
    state: State<'_, AppState>,
    req: SettingSetReq,
) -> Result<SettingValueDto, AppError> {
    setting_repo::upsert(&state.pool, &req.key, &req.value)?;
    Ok(SettingValueDto {
        key: req.key,
        value: req.value,
    })
}
