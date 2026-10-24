use crate::db::DbPool;
use crate::dto::exam_dto::{ExamDetail, ExamSaveReq, ExamSummary, OptionDto};
use crate::error::AppError;
use crate::utils::ids::prefixed;

pub fn list_by_subject(pool: &DbPool, subject_id: &str) -> Result<Vec<ExamSummary>, AppError> {
    let conn = pool.get()?;
    let mut stmt = conn.prepare(
        "SELECT e.id, e.subject_id, e.title, e.created_at,
                (SELECT count(*) FROM attempts a WHERE a.exam_id = e.id) as attempt_count,
                (SELECT count(*) FROM questions q WHERE q.exam_id = e.id) as question_count
         FROM exams e WHERE e.subject_id = ?1 AND e.deleted_at IS NULL ORDER BY e.created_at DESC, e.id DESC"
    )?;
    let rows = stmt.query_map([subject_id], |row| {
        Ok(ExamSummary {
            id: row.get(0)?,
            subject_id: row.get(1)?,
            title: row.get(2)?,
            created_at: row.get(3)?,
            attempt_count: row.get(4)?,
            question_count: row.get(5)?,
        })
    })?;
    let mut res = Vec::new();
    for r in rows {
        res.push(r?);
    }
    Ok(res)
}

pub fn get_detail(pool: &DbPool, id: &str) -> Result<ExamDetail, AppError> {
    let conn = pool.get()?;
    let mut stmt = conn.prepare("SELECT id, subject_id, title, created_at, updated_at FROM exams WHERE id = ?1 AND deleted_at IS NULL")?;
    let mut exam = stmt
        .query_row([id], |row| {
            Ok(ExamDetail {
                id: row.get(0)?,
                subject_id: row.get(1)?,
                title: row.get(2)?,
                created_at: row.get(3)?,
                updated_at: row.get(4)?,
                questions: Vec::new(),
            })
        })
        .map_err(|e| {
            if matches!(e, rusqlite::Error::QueryReturnedNoRows) {
                AppError::NotFound(id.into())
            } else {
                AppError::from(e)
            }
        })?;

    let mut q_stmt =
        conn.prepare("SELECT id, ask FROM questions WHERE exam_id = ?1 ORDER BY position ASC")?;
    let mut q_rows = q_stmt.query([id])?;
    while let Some(q_row) = q_rows.next()? {
        let q_id: String = q_row.get(0)?;
        let ask: String = q_row.get(1)?;
        let mut o_stmt = conn.prepare("SELECT id, text, is_correct FROM answer_options WHERE question_id = ?1 ORDER BY position ASC")?;
        let mut o_rows = o_stmt.query([&q_id])?;
        let mut options = Vec::new();
        while let Some(o_row) = o_rows.next()? {
            options.push(OptionDto {
                id: o_row.get(0)?,
                text: o_row.get(1)?,
                is_correct: o_row.get::<_, i64>(2)? == 1,
            });
        }
        exam.questions.push(crate::dto::exam_dto::QuestionDto {
            id: q_id,
            ask,
            options,
        });
    }
    Ok(exam)
}

pub fn save(pool: &DbPool, req: ExamSaveReq) -> Result<String, AppError> {
    let mut conn = pool.get()?;
    let tx = conn.transaction()?;
    let now = "strftime('%Y-%m-%dT%H:%M:%fZ','now')";
    let is_update = req.id.is_some();
    let exam_id = req.id.clone().unwrap_or_else(|| prefixed("exam"));

    if is_update {
        tx.execute(
            &format!(
                "UPDATE exams SET title = ?1, updated_at = {} WHERE id = ?2 AND deleted_at IS NULL",
                now
            ),
            rusqlite::params![req.title, exam_id],
        )?;
        tx.execute("DELETE FROM questions WHERE exam_id = ?1", [&exam_id])?;
    } else {
        tx.execute("INSERT INTO exams (id, subject_id, title, created_at, updated_at) VALUES (?1, ?2, ?3, strftime('%Y-%m-%dT%H:%M:%fZ','now'), strftime('%Y-%m-%dT%H:%M:%fZ','now'))", rusqlite::params![exam_id, req.subject_id, req.title])?;
    }

    for (q_idx, q) in req.questions.into_iter().enumerate() {
        let q_id = prefixed("q");
        tx.execute("INSERT INTO questions (id, exam_id, ask, position, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, strftime('%Y-%m-%dT%H:%M:%fZ','now'), strftime('%Y-%m-%dT%H:%M:%fZ','now'))", rusqlite::params![q_id, exam_id, q.ask, q_idx as i64])?;
        for (o_idx, o) in q.options.into_iter().enumerate() {
            let o_id = prefixed("opt");
            tx.execute("INSERT INTO answer_options (id, question_id, text, is_correct, position, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, strftime('%Y-%m-%dT%H:%M:%fZ','now'), strftime('%Y-%m-%dT%H:%M:%fZ','now'))", rusqlite::params![o_id, q_id, o.text, if o.is_correct {1} else {0}, o_idx as i64])?;
        }
    }
    tx.commit()?;
    Ok(exam_id)
}

pub fn soft_delete(pool: &DbPool, id: &str, batch_id: &str) -> Result<(), AppError> {
    let conn = pool.get()?;
    let affected = conn.execute("UPDATE exams SET deleted_at = strftime('%Y-%m-%dT%H:%M:%fZ','now'), delete_batch_id = ?1 WHERE id = ?2 AND deleted_at IS NULL", rusqlite::params![batch_id, id])?;
    if affected == 0 {
        return Err(AppError::NotFound(id.into()));
    }
    Ok(())
}

pub fn exists_active_title(
    pool: &DbPool,
    subject_id: &str,
    canonical_title: &str,
) -> Result<bool, AppError> {
    let conn = pool.get()?;
    let mut stmt = conn.prepare("SELECT 1 FROM exams WHERE subject_id = ?1 AND lower(trim(title)) = ?2 AND deleted_at IS NULL LIMIT 1")?;
    let mut rows = stmt.query([subject_id, canonical_title])?;
    Ok(rows.next()?.is_some())
}
