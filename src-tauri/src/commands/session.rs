use crate::{db, error::AppError, models::SessionDraft, state::Db};
use rusqlite::{params, OptionalExtension};
use serde::Deserialize;
use tauri::State;

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SessionSaveReq {
    exam_id: String,
    mode: String,
    questions: serde_json::Value,
    answers: serde_json::Value,
    first_try: serde_json::Value,
    current_index: i64,
    started_at: i64,
    elapsed_sec: i64,
}

#[derive(serde::Serialize)]
pub struct SessionIdResult {
    id: String,
}

#[tauri::command(async)]
pub fn session_save(db: State<'_, Db>, req: SessionSaveReq) -> Result<SessionIdResult, AppError> {
    if req.mode != "quiz" && req.mode != "flashcard" {
        return Err(AppError::Validation("Chế độ làm bài không hợp lệ".into()));
    }
    let questions = req
        .questions
        .as_array()
        .ok_or_else(|| AppError::Validation("Danh sách câu hỏi không hợp lệ".into()))?;
    if questions.is_empty()
        || !req.answers.is_object()
        || !req.first_try.is_object()
        || req.current_index < 0
        || req.current_index as usize >= questions.len()
        || req.started_at <= 0
        || req.elapsed_sec < 0
    {
        return Err(AppError::Validation(
            "Dữ liệu phiên làm bài không hợp lệ".into(),
        ));
    }
    let conn = db.0.lock().unwrap();
    let exists = conn.query_row("SELECT 1 FROM exams e JOIN subjects s ON s.id=e.subject_id AND s.deleted_at IS NULL WHERE e.id=?1 AND e.deleted_at IS NULL", [&req.exam_id], |_| Ok(())).optional()?.is_some();
    if !exists {
        return Err(AppError::NotFound);
    }
    let submitted = conn
        .query_row(
            "SELECT 1 FROM attempts WHERE exam_id=?1 AND started_at=?2 LIMIT 1",
            params![req.exam_id, req.started_at],
            |_| Ok(()),
        )
        .optional()?
        .is_some();
    if submitted {
        return Err(AppError::Validation("Phiên làm bài này đã được nộp".into()));
    }
    let id = db::new_id();
    conn.execute("INSERT INTO session_drafts (id, exam_id, mode, questions_json, answers_json, first_try_json, current_index, started_at, elapsed_sec, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10) ON CONFLICT(exam_id) DO UPDATE SET mode=excluded.mode, questions_json=excluded.questions_json, answers_json=excluded.answers_json, first_try_json=excluded.first_try_json, current_index=excluded.current_index, started_at=excluded.started_at, elapsed_sec=excluded.elapsed_sec, updated_at=excluded.updated_at", params![id, req.exam_id, req.mode, req.questions.to_string(), req.answers.to_string(), req.first_try.to_string(), req.current_index, req.started_at, req.elapsed_sec, db::now_ms()])?;
    let saved_id = conn.query_row(
        "SELECT id FROM session_drafts WHERE exam_id=?1",
        [&req.exam_id],
        |r| r.get(0),
    )?;
    Ok(SessionIdResult { id: saved_id })
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SessionExamReq {
    exam_id: String,
}

#[tauri::command(async)]
pub fn session_get(
    db: State<'_, Db>,
    req: SessionExamReq,
) -> Result<Option<SessionDraft>, AppError> {
    let conn = db.0.lock().unwrap();
    type Raw = (
        String,
        String,
        String,
        String,
        String,
        String,
        i64,
        i64,
        i64,
        i64,
    );
    let raw: Option<Raw> = conn.query_row("SELECT d.id, d.exam_id, d.mode, d.questions_json, d.answers_json, d.first_try_json, d.current_index, d.started_at, d.elapsed_sec, d.updated_at FROM session_drafts d JOIN exams e ON e.id=d.exam_id AND e.deleted_at IS NULL JOIN subjects s ON s.id=e.subject_id AND s.deleted_at IS NULL WHERE d.exam_id=?1", [&req.exam_id], |r| Ok((r.get(0)?, r.get(1)?, r.get(2)?, r.get(3)?, r.get(4)?, r.get(5)?, r.get(6)?, r.get(7)?, r.get(8)?, r.get(9)?))).optional()?;
    raw.map(|r| {
        Ok(SessionDraft {
            id: r.0,
            exam_id: r.1,
            mode: r.2,
            questions: serde_json::from_str(&r.3)?,
            answers: serde_json::from_str(&r.4)?,
            first_try: serde_json::from_str(&r.5)?,
            current_index: r.6,
            started_at: r.7,
            elapsed_sec: r.8,
            updated_at: r.9,
        })
    })
    .transpose()
}

#[tauri::command(async)]
pub fn session_delete(db: State<'_, Db>, req: SessionExamReq) -> Result<(), AppError> {
    db.0.lock()
        .unwrap()
        .execute("DELETE FROM session_drafts WHERE exam_id=?1", [req.exam_id])?;
    Ok(())
}
