use crate::{
    db,
    error::AppError,
    models::{finish_page, Page, Subject, TimeCursor},
    state::Db,
};
use rusqlite::{params, OptionalExtension, Row};
use serde::Deserialize;
use tauri::State;

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SubjectListReq {
    cursor: Option<TimeCursor>,
    limit: i64,
    query: Option<String>,
}

fn map_subject(row: &Row<'_>) -> rusqlite::Result<Subject> {
    Ok(Subject {
        id: row.get(0)?,
        name: row.get(1)?,
        icon: row.get(2)?,
        exam_count: row.get(3)?,
        question_count: row.get(4)?,
        created_at: row.get(5)?,
    })
}

#[tauri::command(async)]
pub fn subject_list(
    db: State<'_, Db>,
    req: SubjectListReq,
) -> Result<Page<Subject, TimeCursor>, AppError> {
    let conn = db.0.lock().unwrap();
    let limit = super::limit(req.limit);
    let (at, id) = req
        .cursor
        .map(|c| (c.created_at, c.id))
        .unwrap_or((i64::MAX, String::new()));
    let query = req.query.unwrap_or_default().trim().to_lowercase();
    let mut stmt = conn.prepare_cached("SELECT id, name, icon, exam_count, question_count, created_at FROM subjects WHERE deleted_at IS NULL AND (created_at < ?1 OR (created_at = ?1 AND id < ?2)) ORDER BY created_at DESC, id DESC")?;
    let mut rows = stmt.query(params![at, id])?;
    let mut items = Vec::with_capacity(limit + 1);
    while let Some(row) = rows.next()? {
        let subject = map_subject(row)?;
        if subject.name.to_lowercase().contains(&query) {
            items.push(subject);
            if items.len() > limit {
                break;
            }
        }
    }
    Ok(finish_page(items, limit, |s| TimeCursor {
        created_at: s.created_at,
        id: s.id.clone(),
    }))
}

#[derive(Deserialize)]
pub struct SubjectRenameReq {
    id: String,
    name: String,
}

#[tauri::command(async)]
pub fn subject_rename(db: State<'_, Db>, req: SubjectRenameReq) -> Result<Subject, AppError> {
    let name = req.name.trim();
    if name.is_empty() {
        return Err(AppError::Validation("Tên môn không được để trống".into()));
    }
    let conn = db.0.lock().unwrap();
    let changed = conn.execute(
        "UPDATE subjects SET name=?1 WHERE id=?2 AND deleted_at IS NULL",
        params![name, req.id],
    )?;
    if changed == 0 {
        return Err(AppError::NotFound);
    }
    conn.query_row(
        "SELECT id, name, icon, exam_count, question_count, created_at FROM subjects WHERE id=?1",
        [req.id],
        map_subject,
    )
    .map_err(Into::into)
}

#[derive(Deserialize)]
pub struct SubjectCreateReq {
    name: String,
    icon: String,
}

#[tauri::command(async)]
pub fn subject_create(db: State<'_, Db>, req: SubjectCreateReq) -> Result<Subject, AppError> {
    let name = req.name.trim();
    if name.is_empty() {
        return Err(AppError::Validation("Tên môn không được để trống".into()));
    }
    let icon = req.icon.trim();
    if icon.is_empty() || icon.contains('/') || icon.contains('\\') || !icon.ends_with(".svg") {
        return Err(AppError::Validation("Icon không hợp lệ".into()));
    }
    let id = db::new_id();
    let created_at = db::now_ms();
    let conn = db.0.lock().unwrap();
    conn.execute(
        "INSERT INTO subjects (id, name, icon, created_at) VALUES (?1, ?2, ?3, ?4)",
        params![id, name, icon, created_at],
    )?;
    Ok(Subject {
        id,
        name: name.to_owned(),
        icon: icon.to_owned(),
        exam_count: 0,
        question_count: 0,
        created_at,
    })
}

#[derive(Deserialize)]
pub struct IdReq {
    pub id: String,
}

#[tauri::command(async)]
pub fn subject_soft_delete(db: State<'_, Db>, req: IdReq) -> Result<(), AppError> {
    let conn = db.0.lock().unwrap();
    let changed = conn.execute(
        "UPDATE subjects SET deleted_at = ?1 WHERE id = ?2 AND deleted_at IS NULL",
        params![db::now_ms(), req.id],
    )?;
    if changed == 0 {
        return Err(AppError::NotFound);
    }
    Ok(())
}

pub(crate) fn subject_exists(conn: &rusqlite::Connection, id: &str) -> Result<bool, AppError> {
    Ok(conn
        .query_row(
            "SELECT 1 FROM subjects WHERE id = ?1 AND deleted_at IS NULL",
            [id],
            |_| Ok(()),
        )
        .optional()?
        .is_some())
}
