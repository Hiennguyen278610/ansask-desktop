use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Page<T, C> {
    pub items: Vec<T>,
    pub next_cursor: Option<C>,
}

pub fn finish_page<T, C>(
    mut rows: Vec<T>,
    limit: usize,
    cursor_of: impl Fn(&T) -> C,
) -> Page<T, C> {
    let has_more = rows.len() > limit;
    if has_more {
        rows.truncate(limit);
    }
    let next_cursor = if has_more {
        rows.last().map(cursor_of)
    } else {
        None
    };
    Page {
        items: rows,
        next_cursor,
    }
}

#[derive(Clone, Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct TimeCursor {
    pub created_at: i64,
    pub id: String,
}

#[derive(Clone, Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct TrashCursor {
    pub deleted_at: i64,
    pub id: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Subject {
    pub id: String,
    pub name: String,
    pub icon: String,
    pub exam_count: i64,
    pub question_count: i64,
    pub created_at: i64,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ExamSummary {
    pub id: String,
    pub subject_id: String,
    pub title: String,
    pub question_count: i64,
    pub created_at: i64,
    pub updated_at: i64,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct OptionItem {
    pub id: String,
    pub content: String,
    pub is_correct: bool,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Question {
    pub id: String,
    pub content: String,
    pub options: Vec<OptionItem>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct OptionInput {
    pub content: String,
    pub is_correct: bool,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct QuestionInput {
    pub content: String,
    pub options: Vec<OptionInput>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ExamInput {
    pub title: String,
    pub questions: Vec<QuestionInput>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct TrashItem {
    pub id: String,
    pub kind: String,
    pub name: String,
    pub parent_name: Option<String>,
    pub deleted_at: i64,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AttemptDetail {
    pub id: String,
    pub exam_id: String,
    pub subject_id: String,
    pub exam_title: String,
    pub mode: String,
    pub total: i64,
    pub correct: i64,
    pub score: f64,
    pub elapsed_sec: i64,
    pub submitted_at: i64,
    pub questions: serde_json::Value,
    pub answers: serde_json::Value,
}

#[derive(Clone, Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AttemptCursor {
    pub submitted_at: i64,
    pub id: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AttemptListItem {
    pub id: String,
    pub exam_id: String,
    pub subject_id: String,
    pub exam_title: String,
    pub subject_name: String,
    pub mode: String,
    pub score: f64,
    pub total: i64,
    pub correct: i64,
    pub submitted_at: i64,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SessionDraft {
    pub id: String,
    pub exam_id: String,
    pub mode: String,
    pub questions: serde_json::Value,
    pub answers: serde_json::Value,
    pub first_try: serde_json::Value,
    pub current_index: i64,
    pub started_at: i64,
    pub elapsed_sec: i64,
    pub updated_at: i64,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Totals {
    pub subjects: i64,
    pub exams: i64,
    pub questions: i64,
    pub attempts: i64,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RecentAttempt {
    pub id: String,
    pub exam_title: String,
    pub subject_name: String,
    pub mode: String,
    pub score: f64,
    pub submitted_at: i64,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SubjectAverage {
    pub subject_id: String,
    pub subject_name: String,
    pub avg_score: f64,
    pub attempts: i64,
}
