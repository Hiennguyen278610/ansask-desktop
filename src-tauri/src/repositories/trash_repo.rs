use crate::db::DbPool;
use crate::dto::trash_dto::TrashItemDto;
use crate::error::AppError;

pub fn list(pool: &DbPool) -> Result<Vec<TrashItemDto>, AppError> {
    let conn = pool.get()?;
    let mut items = Vec::new();

    // Lấy môn học đã xóa
    let mut stmt_sub = conn.prepare(
        "SELECT id, name, deleted_at,
                (SELECT count(*) FROM exams e WHERE e.subject_id = s.id AND e.deleted_at IS NOT NULL),
                (SELECT count(*) FROM attempts a WHERE a.subject_id = s.id)
         FROM subjects s WHERE s.deleted_at IS NOT NULL"
    )?;
    let sub_rows = stmt_sub.query_map([], |r| {
        Ok(TrashItemDto {
            id: r.get(0)?,
            kind: "subject".into(),
            name: r.get(1)?,
            subject_id: None,
            subject_name: None,
            deleted_at: r.get(2)?,
            question_count: 0,
            attempt_count: r.get(4)?,
            deleted_by_parent: false,
        })
    })?;
    for row in sub_rows {
        items.push(row?);
    }

    // Lấy bộ đề đã xóa
    let mut stmt_exam = conn.prepare(
        "SELECT e.id, e.title, e.subject_id, s.name, e.deleted_at, s.deleted_at,
                (SELECT count(*) FROM questions q WHERE q.exam_id = e.id),
                (SELECT count(*) FROM attempts a WHERE a.exam_id = e.id)
         FROM exams e JOIN subjects s ON e.subject_id = s.id
         WHERE e.deleted_at IS NOT NULL",
    )?;
    let exam_rows = stmt_exam.query_map([], |r| {
        let parent_deleted: Option<String> = r.get(5)?;
        Ok(TrashItemDto {
            id: r.get(0)?,
            kind: "exam".into(),
            name: r.get(1)?,
            subject_id: Some(r.get(2)?),
            subject_name: Some(r.get(3)?),
            deleted_at: r.get(4)?,
            question_count: r.get(6)?,
            attempt_count: r.get(7)?,
            deleted_by_parent: parent_deleted.is_some(),
        })
    })?;
    for row in exam_rows {
        items.push(row?);
    }

    // Sắp xếp theo thời gian xóa giảm dần
    items.sort_by(|a, b| b.deleted_at.cmp(&a.deleted_at));
    Ok(items)
}

pub fn get_exam_batch_id(pool: &DbPool, exam_id: &str) -> Result<String, AppError> {
    let conn = pool.get()?;
    let batch_id: Option<String> = conn.query_row(
        "SELECT delete_batch_id FROM exams WHERE id = ?1",
        [exam_id],
        |r| r.get(0),
    )?;
    Ok(batch_id.unwrap_or_default())
}

pub fn get_subject_batch_id(pool: &DbPool, subject_id: &str) -> Result<String, AppError> {
    let conn = pool.get()?;
    let batch_id: Option<String> = conn.query_row(
        "SELECT delete_batch_id FROM subjects WHERE id = ?1",
        [subject_id],
        |r| r.get(0),
    )?;
    Ok(batch_id.unwrap_or_default())
}

pub fn restore_subject(
    pool: &DbPool,
    id: &str,
    name: &str,
    batch_id: &str,
) -> Result<(), AppError> {
    let mut conn = pool.get()?;
    let tx = conn.transaction()?;
    tx.execute(
        "UPDATE subjects SET deleted_at = NULL, delete_batch_id = NULL, name = ?1 WHERE id = ?2",
        rusqlite::params![name, id],
    )?;
    // Phục hồi các bộ đề bị xóa cùng đợt
    tx.execute("UPDATE exams SET deleted_at = NULL, delete_batch_id = NULL WHERE subject_id = ?1 AND delete_batch_id = ?2", rusqlite::params![id, batch_id])?;
    tx.commit()?;
    Ok(())
}

pub fn restore_exam(pool: &DbPool, id: &str, title: &str) -> Result<(), AppError> {
    let conn = pool.get()?;
    conn.execute(
        "UPDATE exams SET deleted_at = NULL, delete_batch_id = NULL, title = ?1 WHERE id = ?2",
        rusqlite::params![title, id],
    )?;
    Ok(())
}

pub fn purge_subject(pool: &DbPool, id: &str) -> Result<(), AppError> {
    let mut conn = pool.get()?;
    let tx = conn.transaction()?;
    // Xóa attempt_answers
    tx.execute("DELETE FROM attempt_answers WHERE attempt_id IN (SELECT id FROM attempts WHERE subject_id = ?1)", [id])?;
    // Xóa attempts
    tx.execute("DELETE FROM attempts WHERE subject_id = ?1", [id])?;
    // Xóa answer_options
    tx.execute("DELETE FROM answer_options WHERE question_id IN (SELECT id FROM questions WHERE exam_id IN (SELECT id FROM exams WHERE subject_id = ?1))", [id])?;
    // Xóa questions
    tx.execute(
        "DELETE FROM questions WHERE exam_id IN (SELECT id FROM exams WHERE subject_id = ?1)",
        [id],
    )?;
    // Xóa exams
    tx.execute("DELETE FROM exams WHERE subject_id = ?1", [id])?;
    // Xóa subject
    tx.execute("DELETE FROM subjects WHERE id = ?1", [id])?;
    tx.commit()?;
    Ok(())
}

pub fn purge_exam(pool: &DbPool, id: &str) -> Result<(), AppError> {
    let mut conn = pool.get()?;
    let tx = conn.transaction()?;
    tx.execute("DELETE FROM attempt_answers WHERE attempt_id IN (SELECT id FROM attempts WHERE exam_id = ?1)", [id])?;
    tx.execute("DELETE FROM attempts WHERE exam_id = ?1", [id])?;
    tx.execute("DELETE FROM answer_options WHERE question_id IN (SELECT id FROM questions WHERE exam_id = ?1)", [id])?;
    tx.execute("DELETE FROM questions WHERE exam_id = ?1", [id])?;
    tx.execute("DELETE FROM exams WHERE id = ?1", [id])?;
    tx.commit()?;
    Ok(())
}

pub fn empty_trash(pool: &DbPool) -> Result<(), AppError> {
    let mut conn = pool.get()?;
    let tx = conn.transaction()?;
    tx.execute("DELETE FROM attempt_answers WHERE attempt_id IN (SELECT id FROM attempts WHERE exam_id IN (SELECT id FROM exams WHERE deleted_at IS NOT NULL) OR subject_id IN (SELECT id FROM subjects WHERE deleted_at IS NOT NULL))", [])?;
    tx.execute("DELETE FROM attempts WHERE exam_id IN (SELECT id FROM exams WHERE deleted_at IS NOT NULL) OR subject_id IN (SELECT id FROM subjects WHERE deleted_at IS NOT NULL)", [])?;
    tx.execute("DELETE FROM answer_options WHERE question_id IN (SELECT id FROM questions WHERE exam_id IN (SELECT id FROM exams WHERE deleted_at IS NOT NULL OR subject_id IN (SELECT id FROM subjects WHERE deleted_at IS NOT NULL)))", [])?;
    tx.execute("DELETE FROM questions WHERE exam_id IN (SELECT id FROM exams WHERE deleted_at IS NOT NULL OR subject_id IN (SELECT id FROM subjects WHERE deleted_at IS NOT NULL))", [])?;
    tx.execute("DELETE FROM exams WHERE deleted_at IS NOT NULL OR subject_id IN (SELECT id FROM subjects WHERE deleted_at IS NOT NULL)", [])?;
    tx.execute("DELETE FROM subjects WHERE deleted_at IS NOT NULL", [])?;
    tx.commit()?;
    Ok(())
}
