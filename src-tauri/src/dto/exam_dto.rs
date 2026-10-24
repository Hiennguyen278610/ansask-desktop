use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ExamSummary {
    pub id: String,
    pub subject_id: String,
    pub title: String,
    pub created_at: String,
    pub attempt_count: i64,
    pub question_count: i64,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ExamDetail {
    pub id: String,
    pub subject_id: String,
    pub title: String,
    pub created_at: String,
    pub updated_at: String,
    pub questions: Vec<QuestionDto>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct QuestionDto {
    pub id: String,
    pub ask: String,
    pub options: Vec<OptionDto>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct OptionDto {
    pub id: String,
    pub text: String,
    pub is_correct: bool,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ExamSaveReq {
    pub id: Option<String>,
    pub subject_id: String,
    pub title: String,
    pub questions: Vec<QuestionUpsertReq>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct QuestionUpsertReq {
    pub ask: String,
    pub options: Vec<OptionUpsertReq>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct OptionUpsertReq {
    pub text: String,
    pub is_correct: bool,
}
