use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SubjectSummary {
    pub id: String,
    pub name: String,
    pub color: String,
    pub created_at: String,
    pub exam_count: i64,
    pub question_count: i64,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SubjectCreateReq {
    pub name: String,
    pub color: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SubjectUpdateReq {
    pub id: String,
    pub name: String,
    pub color: String,
}
