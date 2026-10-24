use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct TrashItemDto {
    pub id: String,
    pub kind: String, // "subject" | "exam"
    pub name: String, // Tên môn hoặc tiêu đề đề
    pub subject_id: Option<String>,
    pub subject_name: Option<String>,
    pub deleted_at: String,
    pub question_count: i64,
    pub attempt_count: i64,
    pub deleted_by_parent: bool,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RestoreReq {
    pub id: String,
    pub new_name: Option<String>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PurgeReq {
    pub kind: String,
    pub id: String,
}
