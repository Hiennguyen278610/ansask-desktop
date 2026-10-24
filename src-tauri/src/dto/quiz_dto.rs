use crate::dto::exam_dto::OptionDto;
use serde::{Deserialize, Serialize};

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct QuizStartReq {
    pub exam_id: String,
    pub count: Option<usize>,
    pub randomize: Option<bool>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct QuizQuestionDto {
    pub id: String,
    pub ask: String,
    pub options: Vec<OptionDto>, // OptionDto đã ẩn is_correct
    pub option_order: Vec<String>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct QuizStartRes {
    pub questions: Vec<QuizQuestionDto>,
    pub total: usize,
}
