use crate::dto::import_dto::{ImportParseReq, ParsedExamDto};
use crate::error::AppError;
use crate::parsers::{json_parser, txt_parser, validator};
use crate::state::AppState;
use tauri::State;

#[tauri::command]
pub fn import_parse(
    _state: State<'_, AppState>,
    req: ImportParseReq,
) -> Result<ParsedExamDto, AppError> {
    let questions = if req.format == "json" {
        json_parser::parse(&req.raw).map_err(|e| {
            AppError::Validation(vec![crate::error::ValidationIssue {
                line: None,
                field: None,
                message: e,
            }])
        })?
    } else {
        txt_parser::parse(&req.raw)
    };

    let issues = validator::validate_questions(&questions);
    Ok(ParsedExamDto { questions, issues })
}
