use crate::{
    error::AppError,
    models::{RecentAttempt, SubjectAverage, Totals},
    state::Db,
};
use rusqlite::params;
use serde::Deserialize;
use tauri::State;

#[tauri::command(async)]
pub fn stats_totals(db: State<'_, Db>) -> Result<Totals, AppError> {
    let conn = db.0.lock().unwrap();
    let subjects = conn.query_row(
        "SELECT COUNT(*) FROM subjects WHERE deleted_at IS NULL",
        [],
        |r| r.get(0),
    )?;
    let (exams, questions) = conn.query_row("SELECT COUNT(*), COALESCE(SUM(e.question_count),0) FROM exams e JOIN subjects s ON s.id=e.subject_id AND s.deleted_at IS NULL WHERE e.deleted_at IS NULL", [], |r| Ok((r.get(0)?, r.get(1)?)))?;
    let attempts = conn.query_row("SELECT COUNT(*) FROM attempts a JOIN exams e ON e.id=a.exam_id AND e.deleted_at IS NULL JOIN subjects s ON s.id=e.subject_id AND s.deleted_at IS NULL", [], |r| r.get(0))?;
    Ok(Totals {
        subjects,
        exams,
        questions,
        attempts,
    })
}

#[derive(Deserialize)]
pub struct RecentReq {
    limit: i64,
}

#[tauri::command(async)]
pub fn stats_recent_attempts(
    db: State<'_, Db>,
    req: RecentReq,
) -> Result<Vec<RecentAttempt>, AppError> {
    let conn = db.0.lock().unwrap();
    let mut stmt = conn.prepare_cached("SELECT a.id, e.title, s.name, a.mode, a.score, a.submitted_at FROM attempts a JOIN exams e ON e.id=a.exam_id AND e.deleted_at IS NULL JOIN subjects s ON s.id=e.subject_id AND s.deleted_at IS NULL ORDER BY a.submitted_at DESC, a.id DESC LIMIT ?1")?;
    let items = stmt
        .query_map(params![req.limit.clamp(1, 100)], |r| {
            Ok(RecentAttempt {
                id: r.get(0)?,
                exam_title: r.get(1)?,
                subject_name: r.get(2)?,
                mode: r.get(3)?,
                score: r.get(4)?,
                submitted_at: r.get(5)?,
            })
        })?
        .collect::<Result<Vec<_>, _>>()?;
    Ok(items)
}

#[tauri::command(async)]
pub fn stats_avg_by_subject(db: State<'_, Db>) -> Result<Vec<SubjectAverage>, AppError> {
    let conn = db.0.lock().unwrap();
    let mut stmt = conn.prepare_cached("SELECT s.id, s.name, AVG(a.score), COUNT(a.id) FROM attempts a JOIN exams e ON e.id=a.exam_id AND e.deleted_at IS NULL JOIN subjects s ON s.id=e.subject_id AND s.deleted_at IS NULL GROUP BY s.id, s.name ORDER BY s.name")?;
    let items = stmt
        .query_map([], |r| {
            Ok(SubjectAverage {
                subject_id: r.get(0)?,
                subject_name: r.get(1)?,
                avg_score: r.get(2)?,
                attempts: r.get(3)?,
            })
        })?
        .collect::<Result<Vec<_>, _>>()?;
    Ok(items)
}
