use crate::db::DbPool;
use crate::dto::subject_dto::{SubjectCreateReq, SubjectSummary, SubjectUpdateReq};
use crate::error::AppError;
use crate::repositories::subject_repo;
use crate::utils::{ids::prefixed, string::canonicalize};

pub fn list(pool: &DbPool) -> Result<Vec<SubjectSummary>, AppError> {
    subject_repo::list(pool)
}

pub fn create(pool: &DbPool, req: SubjectCreateReq) -> Result<SubjectSummary, AppError> {
    let name = req.name.trim();
    if name.is_empty() {
        return Err(AppError::Validation(vec![crate::error::ValidationIssue {
            line: None,
            field: Some("name".into()),
            message: "Tên môn học không được để trống".into(),
        }]));
    }
    let canonical = canonicalize(name);
    if subject_repo::exists_active_name(pool, &canonical)? {
        return Err(AppError::DuplicateName(name.into()));
    }
    let id = prefixed("sub");
    subject_repo::insert(pool, &id, name, &req.color)?;
    let list = subject_repo::list(pool)?;
    list.into_iter()
        .find(|s| s.id == id)
        .ok_or_else(|| AppError::Internal("Lỗi tạo môn".into()))
}

pub fn update(pool: &DbPool, req: SubjectUpdateReq) -> Result<(), AppError> {
    let name = req.name.trim();
    if name.is_empty() {
        return Err(AppError::Validation(vec![crate::error::ValidationIssue {
            line: None,
            field: Some("name".into()),
            message: "Tên môn học không được để trống".into(),
        }]));
    }
    let canonical = canonicalize(name);
    let conn = pool.get()?;
    let mut stmt = conn.prepare("SELECT 1 FROM subjects WHERE lower(trim(name)) = ?1 AND id != ?2 AND deleted_at IS NULL LIMIT 1")?;
    let mut rows = stmt.query(rusqlite::params![canonical, req.id])?;
    if rows.next()?.is_some() {
        return Err(AppError::DuplicateName(name.into()));
    }
    subject_repo::update(pool, &req.id, name, &req.color)
}

pub fn delete(pool: &DbPool, id: &str) -> Result<(), AppError> {
    let batch_id = prefixed("batch");
    subject_repo::soft_delete(pool, id, &batch_id)
}
