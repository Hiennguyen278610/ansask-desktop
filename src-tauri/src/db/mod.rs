use crate::{error::AppError, state::Db};
use rusqlite::{params, Connection, Transaction};
use rusqlite_migration::{Migrations, M};
use std::path::PathBuf;

pub fn open(path: PathBuf) -> Result<Db, AppError> {
    let mut conn = Connection::open(path)?;
    conn.execute_batch("PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL;")?;
    Migrations::new(vec![
        M::up(include_str!("migrations/0001_init.sql")),
        M::up(include_str!("migrations/0002_sessions.sql")),
    ])
    .to_latest(&mut conn)
    .map_err(|e| AppError::Internal(e.to_string()))?;
    Ok(Db(std::sync::Mutex::new(conn)))
}

pub fn recount_subject(tx: &Transaction<'_>, subject_id: &str) -> Result<(), AppError> {
    tx.execute("UPDATE subjects SET exam_count = (SELECT COUNT(*) FROM exams WHERE subject_id = ?1 AND deleted_at IS NULL), question_count = (SELECT COALESCE(SUM(question_count), 0) FROM exams WHERE subject_id = ?1 AND deleted_at IS NULL) WHERE id = ?1", params![subject_id])?;
    Ok(())
}

pub fn now_ms() -> i64 {
    std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis() as i64
}

pub fn new_id() -> String {
    uuid::Uuid::now_v7().to_string()
}
