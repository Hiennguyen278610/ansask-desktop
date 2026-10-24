use crate::dto::exam_dto::OptionDto;
use serde::{Deserialize, Serialize};

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AttemptAnswerReq {
    pub question_id: String,
    pub selected_option_ids: Vec<String>,
    pub position: i64,
    pub option_order: Vec<String>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AttemptSubmitReq {
    pub exam_id: String,
    #[allow(dead_code)]
    pub started_at: String,
    pub answers: Vec<AttemptAnswerReq>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AttemptResultDto {
    pub attempt_id: String,
    pub score: f64,
    pub correct_count: usize,
    pub total_questions: usize,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AttemptSummary {
    pub id: String,
    pub exam_id: String,
    pub exam_title: String,
    pub subject_id: String,
    pub subject_name: String,
    pub submitted_at: String,
    pub total_questions: usize,
    pub correct_count: usize,
    pub score: f64,
    pub duration_sec: i64,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct GradedQuestionDto {
    pub question_id: String,
    pub position: i64,
    pub question_text: String,
    pub options_snapshot: Vec<OptionDto>,
    pub correct_option_ids: Vec<String>,
    pub selected_option_ids: Vec<String>,
    pub option_order: Vec<String>,
    pub is_correct: bool,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AttemptReviewDto {
    pub attempt_id: String,
    pub exam_id: String,
    pub subject_id: String,
    pub exam_title: String,
    pub score: f64,
    pub total_questions: usize,
    pub correct_count: usize,
    pub questions: Vec<GradedQuestionDto>,
}
