use crate::db::DbPool;
use crate::dto::subject_dto::SubjectSummary;
use crate::error::AppError;

pub fn list(pool: &DbPool) -> Result<Vec<SubjectSummary>, AppError> {
    let conn = pool.get()?;
    let mut stmt = conn.prepare(
        "SELECT s.id, s.name, s.color, s.created_at,
                (SELECT count(*) FROM exams e WHERE e.subject_id = s.id AND e.deleted_at IS NULL) as exam_count,
                (SELECT count(*) FROM questions q JOIN exams e ON q.exam_id = e.id WHERE e.subject_id = s.id AND e.deleted_at IS NULL) as question_count
         FROM subjects s WHERE s.deleted_at IS NULL ORDER BY s.created_at ASC, s.id ASC"
    )?;
    let rows = stmt.query_map([], |row| {
        Ok(SubjectSummary {
            id: row.get(0)?,
            name: row.get(1)?,
            color: row.get(2)?,
            created_at: row.get(3)?,
            exam_count: row.get(4)?,
            question_count: row.get(5)?,
        })
    })?;
    let mut res = Vec::new();
    for r in rows {
        res.push(r?);
    }
    Ok(res)
}

pub fn insert(pool: &DbPool, id: &str, name: &str, color: &str) -> Result<(), AppError> {
    let conn = pool.get()?;
    conn.execute("INSERT INTO subjects (id, name, color, created_at, updated_at) VALUES (?1, ?2, ?3, strftime('%Y-%m-%dT%H:%M:%fZ','now'), strftime('%Y-%m-%dT%H:%M:%fZ','now'))", [id, name, color])?;
    Ok(())
}

pub fn update(pool: &DbPool, id: &str, name: &str, color: &str) -> Result<(), AppError> {
    let conn = pool.get()?;
    let affected = conn.execute("UPDATE subjects SET name = ?1, color = ?2, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = ?3 AND deleted_at IS NULL", [name, color, id])?;
    if affected == 0 {
        return Err(AppError::NotFound(id.into()));
    }
    Ok(())
}

pub fn soft_delete(pool: &DbPool, id: &str, batch_id: &str) -> Result<(), AppError> {
    let mut conn = pool.get()?;
    let tx = conn.transaction()?;
    let now = "strftime('%Y-%m-%dT%H:%M:%fZ','now')";
    let affected = tx.execute(&format!("UPDATE subjects SET deleted_at = {}, delete_batch_id = ?1 WHERE id = ?2 AND deleted_at IS NULL", now), rusqlite::params![batch_id, id])?;
    if affected == 0 {
        return Err(AppError::NotFound(id.into()));
    }
    tx.execute(&format!("UPDATE exams SET deleted_at = {}, delete_batch_id = ?1 WHERE subject_id = ?2 AND deleted_at IS NULL", now), rusqlite::params![batch_id, id])?;
    tx.commit()?;
    Ok(())
}

pub fn exists_active_name(pool: &DbPool, canonical_name: &str) -> Result<bool, AppError> {
    let conn = pool.get()?;
    let mut stmt = conn.prepare(
        "SELECT 1 FROM subjects WHERE lower(trim(name)) = ?1 AND deleted_at IS NULL LIMIT 1",
    )?;
    let mut rows = stmt.query([canonical_name])?;
    Ok(rows.next()?.is_some())
}
