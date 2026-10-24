#!/bin/bash
set -e

# 1. Tạo DTO
cat > src-tauri/src/dto/trash_dto.rs << 'EOF'
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct TrashItemDto {
    pub id: String,
    pub kind: String, // "subject" | "exam"
    pub name: String, // Tên môn hoặc tiêu đề đề
    pub subject_id: Option<String>,
    pub subject_name: Option<String>,
    pub deleted_at: String,
    pub question_count: i64,
    pub attempt_count: i64,
    pub deleted_by_parent: bool,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RestoreReq {
    pub id: String,
    pub new_name: Option<String>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PurgeReq {
    pub kind: String,
    pub id: String,
}
EOF

# 2. Tạo Repository (Truy vấn Thùng rác)
cat > src-tauri/src/repositories/trash_repo.rs << 'EOF'
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
    for row in sub_rows { items.push(row?); }

    // Lấy bộ đề đã xóa
    let mut stmt_exam = conn.prepare(
        "SELECT e.id, e.title, e.subject_id, s.name, e.deleted_at, s.deleted_at,
                (SELECT count(*) FROM questions q WHERE q.exam_id = e.id),
                (SELECT count(*) FROM attempts a WHERE a.exam_id = e.id)
         FROM exams e JOIN subjects s ON e.subject_id = s.id
         WHERE e.deleted_at IS NOT NULL"
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
    for row in exam_rows { items.push(row?); }

    // Sắp xếp theo thời gian xóa giảm dần
    items.sort_by(|a, b| b.deleted_at.cmp(&a.deleted_at));
    Ok(items)
}

pub fn get_exam_batch_id(pool: &DbPool, exam_id: &str) -> Result<String, AppError> {
    let conn = pool.get()?;
    let batch_id: Option<String> = conn.query_row("SELECT delete_batch_id FROM exams WHERE id = ?1", [exam_id], |r| r.get(0))?;
    Ok(batch_id.unwrap_or_default())
}

pub fn get_subject_batch_id(pool: &DbPool, subject_id: &str) -> Result<String, AppError> {
    let conn = pool.get()?;
    let batch_id: Option<String> = conn.query_row("SELECT delete_batch_id FROM subjects WHERE id = ?1", [subject_id], |r| r.get(0))?;
    Ok(batch_id.unwrap_or_default())
}

pub fn restore_subject(pool: &DbPool, id: &str, name: &str, batch_id: &str) -> Result<(), AppError> {
    let mut conn = pool.get()?;
    let tx = conn.transaction()?;
    tx.execute("UPDATE subjects SET deleted_at = NULL, delete_batch_id = NULL, name = ?1 WHERE id = ?2", rusqlite::params![name, id])?;
    // Phục hồi các bộ đề bị xóa cùng đợt
    tx.execute("UPDATE exams SET deleted_at = NULL, delete_batch_id = NULL WHERE subject_id = ?1 AND delete_batch_id = ?2", rusqlite::params![id, batch_id])?;
    tx.commit()?;
    Ok(())
}

pub fn restore_exam(pool: &DbPool, id: &str, title: &str) -> Result<(), AppError> {
    let conn = pool.get()?;
    conn.execute("UPDATE exams SET deleted_at = NULL, delete_batch_id = NULL, title = ?1 WHERE id = ?2", rusqlite::params![title, id])?;
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
    tx.execute("DELETE FROM questions WHERE exam_id IN (SELECT id FROM exams WHERE subject_id = ?1)", [id])?;
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
EOF

# 3. Tạo Service (Xử lý logic trùng tên)
cat > src-tauri/src/services/trash_service.rs << 'EOF'
use crate::db::DbPool;
use crate::dto::trash_dto::{TrashItemDto, RestoreReq, PurgeReq};
use crate::error::AppError;
use crate::repositories::trash_repo;
use crate::utils::string::canonicalize;

pub fn list(pool: &DbPool) -> Result<Vec<TrashItemDto>, AppError> {
    trash_repo::list(pool)
}

pub fn restore_subject(pool: &DbPool, req: RestoreReq) -> Result<(), AppError> {
    let name = req.new_name.ok_or_else(|| AppError::Internal("Thiếu tên mới".into()))?;
    let canonical = canonicalize(&name);
    
    // Check trùng tên
    let conn = pool.get()?;
    let mut stmt = conn.prepare("SELECT 1 FROM subjects WHERE lower(trim(name)) = ?1 AND deleted_at IS NULL LIMIT 1")?;
    if stmt.query([canonical]).unwrap().next().unwrap().is_some() {
        return Err(AppError::DuplicateName(name.into()));
    }

    let batch_id = trash_repo::get_subject_batch_id(pool, &req.id)?;
    trash_repo::restore_subject(pool, &req.id, &name, &batch_id)
}

pub fn restore_exam(pool: &DbPool, req: RestoreReq) -> Result<(), AppError> {
    let title = req.new_name.ok_or_else(|| AppError::Internal("Thiếu tên mới".into()))?;
    let canonical = canonicalize(&title);
    
    // Check trùng tên trong môn
    let conn = pool.get()?;
    let mut stmt = conn.prepare("SELECT subject_id FROM exams WHERE id = ?1")?;
    let subject_id: String = stmt.query_row([&req.id], |r| r.get(0))?;
    
    let mut check = conn.prepare("SELECT 1 FROM exams WHERE subject_id = ?1 AND lower(trim(title)) = ?2 AND deleted_at IS NULL LIMIT 1")?;
    if check.query(rusqlite::params![subject_id, canonical]).unwrap().next().unwrap().is_some() {
        return Err(AppError::DuplicateName(title.into()));
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
EOF

# 4. Commands & Đăng ký
cat > src-tauri/src/commands/trash_cmds.rs << 'EOF'
use tauri::State;
use crate::state::AppState;
use crate::error::AppError;
use crate::dto::trash_dto::{TrashItemDto, RestoreReq, PurgeReq};
use crate::services::trash_service;

#[tauri::command] pub fn trash_list(state: State<'_, AppState>) -> Result<Vec<TrashItemDto>, AppError> { trash_service::list(&state.pool) }
#[tauri::command] pub fn subject_restore(state: State<'_, AppState>, req: RestoreReq) -> Result<(), AppError> { trash_service::restore_subject(&state.pool, req) }
#[tauri::command] pub fn exam_restore(state: State<'_, AppState>, req: RestoreReq) -> Result<(), AppError> { trash_service::restore_exam(&state.pool, req) }
#[tauri::command] pub fn trash_purge_item(state: State<'_, AppState>, req: PurgeReq) -> Result<(), AppError> { trash_service::purge_item(&state.pool, req) }
#[tauri::command] pub fn trash_empty(state: State<'_, AppState>) -> Result<(), AppError> { trash_service::empty_trash(&state.pool) }
EOF

cat > src-tauri/src/dto/mod.rs << 'EOF'
pub mod subject_dto;
pub mod exam_dto;
pub mod import_dto;
pub mod quiz_dto;
pub mod attempt_dto;
pub mod trash_dto;
EOF

cat > src-tauri/src/repositories/mod.rs << 'EOF'
pub mod setting_repo;
pub mod subject_repo;
pub mod exam_repo;
pub mod attempt_repo;
pub mod trash_repo;
EOF

cat > src-tauri/src/services/mod.rs << 'EOF'
pub mod subject_service;
pub mod exam_service;
pub mod quiz_service;
pub mod attempt_service;
pub mod trash_service;
EOF

cat > src-tauri/src/commands/mod.rs << 'EOF'
pub mod settings_cmds;
pub mod subject_cmds;
pub mod exam_cmds;
pub mod import_cmds;
pub mod quiz_cmds;
pub mod attempt_cmds;
pub mod trash_cmds;
EOF

python3 - << 'PYEOF'
p = 'src-tauri/src/lib.rs'
s = open(p).read()
s = s.replace(
  'commands::attempt_cmds::attempt_review,',
  'commands::attempt_cmds::attempt_review,\n            commands::trash_cmds::trash_list,\n            commands::trash_cmds::subject_restore,\n            commands::trash_cmds::exam_restore,\n            commands::trash_cmds::trash_purge_item,\n            commands::trash_cmds::trash_empty,'
)
open(p, 'w').write(s)
PYEOF

cd src-tauri && cargo fmt && cd ..
