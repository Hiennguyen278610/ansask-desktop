use crate::{
    db,
    error::AppError,
    models::{finish_page, AttemptCursor, AttemptDetail, AttemptListItem, Page},
    state::Db,
};
use rusqlite::{params, OptionalExtension};
use serde::{Deserialize, Serialize};
use tauri::State;

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AttemptSaveReq {
    exam_id: String,
    mode: String,
    questions: serde_json::Value,
    answers: serde_json::Value,
    total: i64,
    correct: i64,
    score: f64,
    elapsed_sec: i64,
    started_at: i64,
}

#[derive(Serialize)]
pub struct IdResult {
    id: String,
}

#[tauri::command(async)]
pub fn attempt_save(db: State<'_, Db>, req: AttemptSaveReq) -> Result<IdResult, AppError> {
    if req.mode != "quiz" && req.mode != "flashcard" {
        return Err(AppError::Validation("Chế độ làm bài không hợp lệ".into()));
    }
    if !req.questions.is_array() || !req.answers.is_object() {
        return Err(AppError::Validation("Dữ liệu bài làm không hợp lệ".into()));
    }
    if req.total < 0
        || req.correct < 0
        || req.correct > req.total
        || req.elapsed_sec < 0
        || !req.score.is_finite()
        || !(0.0..=10.0).contains(&req.score)
    {
        return Err(AppError::Validation("Điểm hoặc số câu không hợp lệ".into()));
    }
    if req
        .questions
        .as_array()
        .is_none_or(|q| q.len() as i64 != req.total)
    {
        return Err(AppError::Validation(
            "Số câu không khớp dữ liệu bài làm".into(),
        ));
    }
    let mut conn = db.0.lock().unwrap();
    if conn.query_row("SELECT 1 FROM exams e JOIN subjects s ON s.id=e.subject_id AND s.deleted_at IS NULL WHERE e.id=?1 AND e.deleted_at IS NULL", [&req.exam_id], |_| Ok(())).optional()?.is_none() { return Err(AppError::NotFound); }
    let id = db::new_id();
    let tx = conn.transaction()?;
    tx.execute("INSERT INTO attempts (id, exam_id, mode, snapshot_json, answers_json, total, correct, score, elapsed_sec, started_at, submitted_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)", params![id, req.exam_id, req.mode, req.questions.to_string(), req.answers.to_string(), req.total, req.correct, req.score, req.elapsed_sec, req.started_at, db::now_ms()])?;
    tx.execute(
        "DELETE FROM session_drafts WHERE exam_id=?1",
        [&req.exam_id],
    )?;
    tx.commit()?;
    Ok(IdResult { id })
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AttemptListReq {
    cursor: Option<AttemptCursor>,
    limit: i64,
    exam_id: Option<String>,
    subject_id: Option<String>,
}

#[tauri::command(async)]
pub fn attempt_list(
    db: State<'_, Db>,
    req: AttemptListReq,
) -> Result<Page<AttemptListItem, AttemptCursor>, AppError> {
    let conn = db.0.lock().unwrap();
    let limit = super::limit(req.limit);
    let (at, id) = req
        .cursor
        .map(|c| (c.submitted_at, c.id))
        .unwrap_or((i64::MAX, String::new()));
    let mut stmt = conn.prepare_cached("SELECT a.id, e.id, s.id, e.title, s.name, a.mode, a.score, a.total, a.correct, a.submitted_at FROM attempts a JOIN exams e ON e.id=a.exam_id AND e.deleted_at IS NULL JOIN subjects s ON s.id=e.subject_id AND s.deleted_at IS NULL WHERE (?1 IS NULL OR e.id=?1) AND (?2 IS NULL OR s.id=?2) AND (a.submitted_at < ?3 OR (a.submitted_at = ?3 AND a.id < ?4)) ORDER BY a.submitted_at DESC, a.id DESC LIMIT ?5")?;
    let rows = stmt
        .query_map(
            params![req.exam_id, req.subject_id, at, id, (limit + 1) as i64],
            |r| {
                Ok(AttemptListItem {
                    id: r.get(0)?,
                    exam_id: r.get(1)?,
                    subject_id: r.get(2)?,
                    exam_title: r.get(3)?,
                    subject_name: r.get(4)?,
                    mode: r.get(5)?,
                    score: r.get(6)?,
                    total: r.get(7)?,
                    correct: r.get(8)?,
                    submitted_at: r.get(9)?,
                })
            },
        )?
        .collect::<Result<Vec<_>, _>>()?;
    Ok(finish_page(rows, limit, |a| AttemptCursor {
        submitted_at: a.submitted_at,
        id: a.id.clone(),
    }))
}

#[derive(Deserialize)]
pub struct IdReq {
    id: String,
}

#[tauri::command(async)]
pub fn attempt_get(db: State<'_, Db>, req: IdReq) -> Result<AttemptDetail, AppError> {
    let conn = db.0.lock().unwrap();
    let raw = conn.query_row("SELECT a.id, e.id, s.id, e.title, a.mode, a.total, a.correct, a.score, a.elapsed_sec, a.submitted_at, a.snapshot_json, a.answers_json FROM attempts a JOIN exams e ON e.id=a.exam_id AND e.deleted_at IS NULL JOIN subjects s ON s.id=e.subject_id AND s.deleted_at IS NULL WHERE a.id=?1", [req.id], |r| Ok((r.get::<_, String>(0)?, r.get::<_, String>(1)?, r.get::<_, String>(2)?, r.get::<_, String>(3)?, r.get::<_, String>(4)?, r.get::<_, i64>(5)?, r.get::<_, i64>(6)?, r.get::<_, f64>(7)?, r.get::<_, i64>(8)?, r.get::<_, i64>(9)?, r.get::<_, String>(10)?, r.get::<_, String>(11)?))).optional()?.ok_or(AppError::NotFound)?;
    Ok(AttemptDetail {
        id: raw.0,
        exam_id: raw.1,
        subject_id: raw.2,
        exam_title: raw.3,
        mode: raw.4,
        total: raw.5,
        correct: raw.6,
        score: raw.7,
        elapsed_sec: raw.8,
        submitted_at: raw.9,
        questions: serde_json::from_str(&raw.10)?,
        answers: serde_json::from_str(&raw.11)?,
    })
}
