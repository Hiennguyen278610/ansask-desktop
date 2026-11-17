use crate::{
    db,
    error::AppError,
    models::{finish_page, Page, TrashCursor, TrashItem},
    state::Db,
};
use rusqlite::{params, OptionalExtension};
use serde::Deserialize;
use tauri::State;

#[derive(Deserialize)]
pub struct TrashListReq {
    kind: String,
    cursor: Option<TrashCursor>,
    limit: i64,
}

fn kind(value: &str) -> Result<&str, AppError> {
    match value {
        "subject" | "exam" => Ok(value),
        _ => Err(AppError::Validation("Loại dữ liệu không hợp lệ".into())),
    }
}

#[tauri::command(async)]
pub fn trash_list(
    db: State<'_, Db>,
    req: TrashListReq,
) -> Result<Page<TrashItem, TrashCursor>, AppError> {
    let kind = kind(&req.kind)?;
    let limit = super::limit(req.limit);
    let (at, id) = req
        .cursor
        .map(|c| (c.deleted_at, c.id))
        .unwrap_or((i64::MAX, String::new()));
    let conn = db.0.lock().unwrap();
    let rows = if kind == "subject" {
        let mut stmt = conn.prepare_cached("SELECT id, name, deleted_at FROM subjects WHERE deleted_at IS NOT NULL AND (deleted_at < ?1 OR (deleted_at = ?1 AND id < ?2)) ORDER BY deleted_at DESC, id DESC LIMIT ?3")?;
        let items = stmt
            .query_map(params![at, id, (limit + 1) as i64], |r| {
                Ok(TrashItem {
                    id: r.get(0)?,
                    kind: "subject".into(),
                    name: r.get(1)?,
                    parent_name: None,
                    deleted_at: r.get(2)?,
                })
            })?
            .collect::<Result<Vec<_>, _>>()?;
        items
    } else {
        let mut stmt = conn.prepare_cached("SELECT e.id, e.title, s.name, e.deleted_at FROM exams e JOIN subjects s ON s.id=e.subject_id AND s.deleted_at IS NULL WHERE e.deleted_at IS NOT NULL AND (e.deleted_at < ?1 OR (e.deleted_at = ?1 AND e.id < ?2)) ORDER BY e.deleted_at DESC, e.id DESC LIMIT ?3")?;
        let items = stmt
            .query_map(params![at, id, (limit + 1) as i64], |r| {
                Ok(TrashItem {
                    id: r.get(0)?,
                    kind: "exam".into(),
                    name: r.get(1)?,
                    parent_name: Some(r.get(2)?),
                    deleted_at: r.get(3)?,
                })
            })?
            .collect::<Result<Vec<_>, _>>()?;
        items
    };
    Ok(finish_page(rows, limit, |item| TrashCursor {
        deleted_at: item.deleted_at,
        id: item.id.clone(),
    }))
}

#[derive(Deserialize)]
pub struct TrashActionReq {
    kind: String,
    id: String,
}

#[tauri::command(async)]
pub fn trash_restore(db: State<'_, Db>, req: TrashActionReq) -> Result<(), AppError> {
    let kind = kind(&req.kind)?;
    let mut conn = db.0.lock().unwrap();
    let tx = conn.transaction()?;
    if kind == "subject" {
        let changed = tx.execute(
            "UPDATE subjects SET deleted_at=NULL WHERE id=?1 AND deleted_at IS NOT NULL",
            [&req.id],
        )?;
        if changed == 0 {
            return Err(AppError::NotFound);
        }
        db::recount_subject(&tx, &req.id)?;
    } else {
        let subject_id: String = tx.query_row("SELECT e.subject_id FROM exams e JOIN subjects s ON s.id=e.subject_id AND s.deleted_at IS NULL WHERE e.id=?1 AND e.deleted_at IS NOT NULL", [&req.id], |r| r.get(0)).optional()?.ok_or(AppError::NotFound)?;
        tx.execute("UPDATE exams SET deleted_at=NULL WHERE id=?1", [&req.id])?;
        db::recount_subject(&tx, &subject_id)?;
    }
    tx.commit()?;
    Ok(())
}

#[tauri::command(async)]
pub fn trash_purge(db: State<'_, Db>, req: TrashActionReq) -> Result<(), AppError> {
    let kind = kind(&req.kind)?;
    let mut conn = db.0.lock().unwrap();
    let tx = conn.transaction()?;
    if kind == "subject" {
        let changed = tx.execute(
            "DELETE FROM subjects WHERE id=?1 AND deleted_at IS NOT NULL",
            [&req.id],
        )?;
        if changed == 0 {
            return Err(AppError::NotFound);
        }
    } else {
        let subject_id: String = tx.query_row("SELECT e.subject_id FROM exams e JOIN subjects s ON s.id=e.subject_id AND s.deleted_at IS NULL WHERE e.id=?1 AND e.deleted_at IS NOT NULL", [&req.id], |r| r.get(0)).optional()?.ok_or(AppError::NotFound)?;
        tx.execute("DELETE FROM exams WHERE id=?1", [&req.id])?;
        db::recount_subject(&tx, &subject_id)?;
    }
    tx.commit()?;
    Ok(())
}
