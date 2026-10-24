use crate::dto::exam_dto::QuestionUpsertReq;
use crate::error::ValidationIssue;
use serde::{Deserialize, Serialize};

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ImportParseReq {
    pub format: String, // "txt" | "json"
    pub raw: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ParsedExamDto {
    pub questions: Vec<QuestionUpsertReq>,
    pub issues: Vec<ValidationIssue>,
}
