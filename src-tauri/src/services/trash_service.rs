use crate::db::DbPool;
use crate::dto::trash_dto::{PurgeReq, RestoreReq, TrashItemDto};
use crate::error::AppError;
use crate::repositories::trash_repo;
use crate::utils::string::canonicalize;

pub fn list(pool: &DbPool) -> Result<Vec<TrashItemDto>, AppError> {
    trash_repo::list(pool)
}

pub fn restore_subject(pool: &DbPool, req: RestoreReq) -> Result<(), AppError> {
    let name = req
        .new_name
        .ok_or_else(|| AppError::Internal("Thiếu tên mới".into()))?;
    let canonical = canonicalize(&name);

    // Check trùng tên
    let conn = pool.get()?;
    let mut stmt = conn.prepare(
        "SELECT 1 FROM subjects WHERE lower(trim(name)) = ?1 AND deleted_at IS NULL LIMIT 1",
    )?;
    if stmt.query([canonical]).unwrap().next().unwrap().is_some() {
        return Err(AppError::DuplicateName(name));
    }

    let batch_id = trash_repo::get_subject_batch_id(pool, &req.id)?;
    trash_repo::restore_subject(pool, &req.id, &name, &batch_id)
}

pub fn restore_exam(pool: &DbPool, req: RestoreReq) -> Result<(), AppError> {
    let title = req
        .new_name
        .ok_or_else(|| AppError::Internal("Thiếu tên mới".into()))?;
    let canonical = canonicalize(&title);

    // Check trùng tên trong môn
    let conn = pool.get()?;
    let mut stmt = conn.prepare("SELECT subject_id FROM exams WHERE id = ?1")?;
    let subject_id: String = stmt.query_row([&req.id], |r| r.get(0))?;

    let mut check = conn.prepare("SELECT 1 FROM exams WHERE subject_id = ?1 AND lower(trim(title)) = ?2 AND deleted_at IS NULL LIMIT 1")?;
    if check
        .query(rusqlite::params![subject_id, canonical])
        .unwrap()
        .next()
        .unwrap()
        .is_some()
    {
        return Err(AppError::DuplicateName(title));
    }

    trash_repo::restore_exam(pool, &req.id, &title)
}

pub fn purge_item(pool: &DbPool, req: PurgeReq) -> Result<(), AppError> {
    if req.kind == "subject" {
        trash_repo::purge_subject(pool, &req.id)
    } else {
        trash_repo::purge_exam(pool, &req.id)
    }
}

pub fn empty_trash(pool: &DbPool) -> Result<(), AppError> {
    trash_repo::empty_trash(pool)
}
