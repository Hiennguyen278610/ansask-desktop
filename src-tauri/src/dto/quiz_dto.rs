use crate::dto::exam_dto::OptionDto;
use serde::{Deserialize, Serialize};

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct QuizStartReq {
    pub exam_id: String,
    pub count: Option<usize>,
    pub randomize: Option<bool>,
    pub question_ids: Option<Vec<String>>, // Dùng cho Practice Mode
    pub include_answers: Option<bool>,     // Dùng cho Stream Mode
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct QuizQuestionDto {
    pub id: String,
    pub ask: String,
    pub options: Vec<OptionDto>,
    pub option_order: Vec<String>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct QuizStartRes {
    pub questions: Vec<QuizQuestionDto>,
    pub total: usize,
}
