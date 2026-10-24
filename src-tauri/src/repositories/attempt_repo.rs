use crate::db::DbPool;
use crate::dto::attempt_dto::{AttemptReviewDto, AttemptSummary, GradedQuestionDto};
use crate::error::AppError;

pub fn list_by_exam(pool: &DbPool, exam_id: &str) -> Result<Vec<AttemptSummary>, AppError> {
    let conn = pool.get()?;
    let mut stmt = conn.prepare(
        "SELECT id, exam_id, exam_title, subject_id, subject_name, submitted_at, total_questions, correct_count, score, duration_sec
         FROM attempts WHERE exam_id = ?1 ORDER BY submitted_at DESC"
    )?;
    let rows = stmt.query_map([exam_id], |row| {
        Ok(AttemptSummary {
            id: row.get(0)?,
            exam_id: row.get(1)?,
            exam_title: row.get(2)?,
            subject_id: row.get(3)?,
            subject_name: row.get(4)?,
            submitted_at: row.get(5)?,
            total_questions: row.get::<_, i64>(6)? as usize,
            correct_count: row.get::<_, i64>(7)? as usize,
            score: row.get(8)?,
            duration_sec: row.get(9)?,
        })
    })?;
    let mut res = Vec::new();
    for r in rows {
        res.push(r?);
    }
    Ok(res)
}

pub fn get_review(pool: &DbPool, attempt_id: &str) -> Result<AttemptReviewDto, AppError> {
    let conn = pool.get()?;
    let mut stmt = conn.prepare(
        "SELECT exam_title, score, total_questions, correct_count FROM attempts WHERE id = ?1",
    )?;
    let mut review = stmt
        .query_row([attempt_id], |row| {
            Ok(AttemptReviewDto {
                attempt_id: attempt_id.to_string(),
                exam_title: row.get(0)?,
                score: row.get(1)?,
                total_questions: row.get::<_, i64>(2)? as usize,
                correct_count: row.get::<_, i64>(3)? as usize,
                questions: Vec::new(),
            })
        })
        .map_err(|e| {
            if matches!(e, rusqlite::Error::QueryReturnedNoRows) {
                AppError::NotFound(attempt_id.into())
            } else {
                AppError::from(e)
            }
        })?;

    let mut aa_stmt = conn.prepare(
        "SELECT question_id, position, question_text, options_snapshot, correct_option_ids, selected_option_ids, option_order, is_correct
         FROM attempt_answers WHERE attempt_id = ?1 ORDER BY position ASC"
    )?;
    let mut aa_rows = aa_stmt.query([attempt_id])?;
    while let Some(row) = aa_rows.next()? {
        let options_json: String = row.get(3)?;
        let correct_json: String = row.get(4)?;
        let selected_json: String = row.get(5)?;
        let order_json: String = row.get(6)?;

        review.questions.push(GradedQuestionDto {
            question_id: row.get(0)?,
            position: row.get(1)?,
            question_text: row.get(2)?,
            options_snapshot: serde_json::from_str(&options_json).unwrap_or_default(),
            correct_option_ids: serde_json::from_str(&correct_json).unwrap_or_default(),
            selected_option_ids: serde_json::from_str(&selected_json).unwrap_or_default(),
            option_order: serde_json::from_str(&order_json).unwrap_or_default(),
            is_correct: row.get::<_, i64>(7)? == 1,
        });
    }
    Ok(review)
}
