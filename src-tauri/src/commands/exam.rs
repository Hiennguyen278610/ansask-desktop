use crate::{
    db,
    error::AppError,
    models::{finish_page, ExamInput, ExamSummary, OptionItem, Page, Question, TimeCursor},
    state::Db,
};
use rusqlite::{params, OptionalExtension, Row};
use serde::Deserialize;
use tauri::State;

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ExamListReq {
    subject_id: String,
    cursor: Option<TimeCursor>,
    limit: i64,
    query: Option<String>,
}

fn map_exam(row: &Row<'_>) -> rusqlite::Result<ExamSummary> {
    Ok(ExamSummary {
        id: row.get(0)?,
        subject_id: row.get(1)?,
        title: row.get(2)?,
        question_count: row.get(3)?,
        created_at: row.get(4)?,
        updated_at: row.get(5)?,
    })
}

#[tauri::command(async)]
pub fn exam_list(
    db: State<'_, Db>,
    req: ExamListReq,
) -> Result<Page<ExamSummary, TimeCursor>, AppError> {
    let conn = db.0.lock().unwrap();
    let limit = super::limit(req.limit);
    let (at, id) = req
        .cursor
        .map(|c| (c.created_at, c.id))
        .unwrap_or((i64::MAX, String::new()));
    let query = req.query.unwrap_or_default().trim().to_lowercase();
    let mut stmt = conn.prepare_cached("SELECT e.id, e.subject_id, e.title, e.question_count, e.created_at, e.updated_at FROM exams e JOIN subjects s ON s.id = e.subject_id AND s.deleted_at IS NULL WHERE e.subject_id = ?1 AND e.deleted_at IS NULL AND (e.created_at < ?2 OR (e.created_at = ?2 AND e.id < ?3)) ORDER BY e.created_at DESC, e.id DESC")?;
    let mut rows = stmt.query(params![req.subject_id, at, id])?;
    let mut items = Vec::with_capacity(limit + 1);
    while let Some(row) = rows.next()? {
        let exam = map_exam(row)?;
        if exam.title.to_lowercase().contains(&query) {
            items.push(exam);
            if items.len() > limit {
                break;
            }
        }
    }
    Ok(finish_page(items, limit, |e| TimeCursor {
        created_at: e.created_at,
        id: e.id.clone(),
    }))
}

#[derive(Deserialize)]
pub struct IdReq {
    id: String,
}

#[tauri::command(async)]
pub fn exam_get(db: State<'_, Db>, req: IdReq) -> Result<ExamSummary, AppError> {
    let conn = db.0.lock().unwrap();
    conn.query_row("SELECT e.id, e.subject_id, e.title, e.question_count, e.created_at, e.updated_at FROM exams e JOIN subjects s ON s.id=e.subject_id AND s.deleted_at IS NULL WHERE e.id=?1 AND e.deleted_at IS NULL", [req.id], map_exam).optional()?.ok_or(AppError::NotFound)
}

fn validate(input: &ExamInput) -> Result<(), AppError> {
    if input.title.trim().is_empty() {
        return Err(AppError::Validation("Tên đề không được để trống".into()));
    }
    for (index, question) in input.questions.iter().enumerate() {
        if question.content.trim().is_empty() {
            return Err(AppError::Validation(format!(
                "Câu {} chưa có nội dung",
                index + 1
            )));
        }
        if !(1..=10).contains(&question.options.len()) {
            return Err(AppError::Validation(format!(
                "Câu {} phải có 1 đến 10 lựa chọn",
                index + 1
            )));
        }
        if question.options.iter().filter(|o| o.is_correct).count() != 1 {
            return Err(AppError::Validation(format!(
                "Câu {} phải có đúng một đáp án",
                index + 1
            )));
        }
    }
    Ok(())
}

fn insert_questions(
    tx: &rusqlite::Transaction<'_>,
    exam_id: &str,
    input: &ExamInput,
) -> Result<(), AppError> {
    for (position, question) in input.questions.iter().enumerate() {
        let question_id = db::new_id();
        tx.execute(
            "INSERT INTO questions (id, exam_id, position, content) VALUES (?1, ?2, ?3, ?4)",
            params![question_id, exam_id, position as i64, question.content],
        )?;
        for (option_position, option) in question.options.iter().enumerate() {
            tx.execute("INSERT INTO options (id, question_id, position, content, is_correct) VALUES (?1, ?2, ?3, ?4, ?5)", params![db::new_id(), question_id, option_position as i64, option.content, option.is_correct])?;
        }
    }
    Ok(())
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ExamCreateReq {
    subject_id: String,
    input: ExamInput,
}

#[tauri::command(async)]
pub fn exam_create(db: State<'_, Db>, req: ExamCreateReq) -> Result<ExamSummary, AppError> {
    validate(&req.input)?;
    let mut conn = db.0.lock().unwrap();
    if !super::subject_exists(&conn, &req.subject_id)? {
        return Err(AppError::NotFound);
    }
    let tx = conn.transaction()?;
    let id = db::new_id();
    let now = db::now_ms();
    tx.execute("INSERT INTO exams (id, subject_id, title, question_count, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, ?5)", params![id, req.subject_id, req.input.title.trim(), req.input.questions.len() as i64, now])?;
    insert_questions(&tx, &id, &req.input)?;
    db::recount_subject(&tx, &req.subject_id)?;
    tx.commit()?;
    Ok(ExamSummary {
        id,
        subject_id: req.subject_id,
        title: req.input.title.trim().into(),
        question_count: req.input.questions.len() as i64,
        created_at: now,
        updated_at: now,
    })
}

#[derive(Deserialize)]
pub struct ExamUpdateReq {
    id: String,
    input: ExamInput,
}

#[tauri::command(async)]
pub fn exam_update(db: State<'_, Db>, req: ExamUpdateReq) -> Result<ExamSummary, AppError> {
    validate(&req.input)?;
    let mut conn = db.0.lock().unwrap();
    let old = conn.query_row("SELECT e.id, e.subject_id, e.title, e.question_count, e.created_at, e.updated_at FROM exams e JOIN subjects s ON s.id=e.subject_id AND s.deleted_at IS NULL WHERE e.id=?1 AND e.deleted_at IS NULL", [&req.id], map_exam).optional()?.ok_or(AppError::NotFound)?;
    let tx = conn.transaction()?;
    let now = db::now_ms();
    tx.execute(
        "UPDATE exams SET title=?1, question_count=?2, updated_at=?3 WHERE id=?4",
        params![
            req.input.title.trim(),
            req.input.questions.len() as i64,
            now,
            req.id
        ],
    )?;
    tx.execute("DELETE FROM questions WHERE exam_id=?1", [&req.id])?;
    insert_questions(&tx, &req.id, &req.input)?;
    db::recount_subject(&tx, &old.subject_id)?;
    tx.commit()?;
    Ok(ExamSummary {
        id: req.id,
        subject_id: old.subject_id,
        title: req.input.title.trim().into(),
        question_count: req.input.questions.len() as i64,
        created_at: old.created_at,
        updated_at: now,
    })
}

#[derive(Deserialize)]
pub struct ExamRenameReq {
    id: String,
    title: String,
}

#[tauri::command(async)]
pub fn exam_rename(db: State<'_, Db>, req: ExamRenameReq) -> Result<ExamSummary, AppError> {
    let title = req.title.trim();
    if title.is_empty() {
        return Err(AppError::Validation("Tên đề không được để trống".into()));
    }
    let conn = db.0.lock().unwrap();
    let now = db::now_ms();
    let changed = conn.execute(
        "UPDATE exams SET title=?1, updated_at=?2 WHERE id=?3 AND deleted_at IS NULL",
        params![title, now, req.id],
    )?;
    if changed == 0 {
        return Err(AppError::NotFound);
    }
    conn.query_row(
        "SELECT e.id, e.subject_id, e.title, e.question_count, e.created_at, e.updated_at FROM exams e WHERE e.id=?1",
        [&req.id],
        map_exam,
    )
    .map_err(Into::into)
}

#[tauri::command(async)]
pub fn exam_soft_delete(db: State<'_, Db>, req: IdReq) -> Result<(), AppError> {
    let mut conn = db.0.lock().unwrap();
    let subject_id: String = conn.query_row("SELECT e.subject_id FROM exams e JOIN subjects s ON s.id=e.subject_id AND s.deleted_at IS NULL WHERE e.id=?1 AND e.deleted_at IS NULL", [&req.id], |r| r.get(0)).optional()?.ok_or(AppError::NotFound)?;
    let tx = conn.transaction()?;
    tx.execute(
        "UPDATE exams SET deleted_at=?1 WHERE id=?2",
        params![db::now_ms(), req.id],
    )?;
    db::recount_subject(&tx, &subject_id)?;
    tx.commit()?;
    Ok(())
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct QuestionListReq {
    exam_id: String,
}

#[tauri::command(async)]
pub fn question_list_all(
    db: State<'_, Db>,
    req: QuestionListReq,
) -> Result<Vec<Question>, AppError> {
    let conn = db.0.lock().unwrap();
    if conn.query_row("SELECT 1 FROM exams e JOIN subjects s ON s.id=e.subject_id AND s.deleted_at IS NULL WHERE e.id=?1 AND e.deleted_at IS NULL", [&req.exam_id], |_| Ok(())).optional()?.is_none() { return Err(AppError::NotFound); }
    let mut questions =
        conn.prepare("SELECT id, content FROM questions WHERE exam_id=?1 ORDER BY position")?;
    let question_rows = questions
        .query_map([req.exam_id], |row| {
            Ok((row.get::<_, String>(0)?, row.get::<_, String>(1)?))
        })?
        .collect::<Result<Vec<_>, _>>()?;
    let mut options = conn.prepare_cached(
        "SELECT id, content, is_correct FROM options WHERE question_id=?1 ORDER BY position",
    )?;
    question_rows
        .into_iter()
        .map(|(id, content)| {
            let items = options
                .query_map([&id], |row| {
                    Ok(OptionItem {
                        id: row.get(0)?,
                        content: row.get(1)?,
                        is_correct: row.get(2)?,
                    })
                })?
                .collect::<Result<Vec<_>, _>>()?;
            Ok(Question {
                id,
                content,
                options: items,
            })
        })
        .collect()
}
