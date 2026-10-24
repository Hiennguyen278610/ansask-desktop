use crate::db::DbPool;
use crate::dto::attempt_dto::{AttemptResultDto, AttemptSubmitReq};
use crate::error::AppError;
use crate::repositories::exam_repo;
use crate::utils::ids::prefixed;
use chrono::{DateTime, Utc};

pub fn submit_attempt(pool: &DbPool, req: AttemptSubmitReq) -> Result<AttemptResultDto, AppError> {
    let exam = exam_repo::get_detail(pool, &req.exam_id)?;
    let mut conn = pool.get()?;
    let tx = conn.transaction()?;

    let attempt_id = prefixed("att");
    let total_q = req.answers.len();
    let mut correct_count = 0;
    let now_utc = Utc::now();
    let now_str = crate::utils::time::now_iso_utc();

    // Tính duration_sec
    let started_at = DateTime::parse_from_rfc3339(&req.started_at)
        .map(|dt| dt.with_timezone(&Utc))
        .unwrap_or(now_utc);
    let duration_sec = (now_utc - started_at).num_seconds().max(0);

    let mut stmt_ins_attempt = tx.prepare(
        "INSERT INTO attempts (id, exam_id, subject_id, exam_title, subject_name, submitted_at, total_questions, correct_count, score, duration_sec)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)"
    )?;

    // Tính điểm trước
    let mut processed_answers = Vec::new();

    for ans in &req.answers {
        if let Some(orig_q) = exam.questions.iter().find(|q| q.id == ans.question_id) {
            let correct_ids: Vec<String> = orig_q
                .options
                .iter()
                .filter(|o| o.is_correct)
                .map(|o| o.id.clone())
                .collect();
            let mut sel_ids = ans.selected_option_ids.clone();
            sel_ids.sort();
            let mut cor_ids = correct_ids.clone();
            cor_ids.sort();

            let is_correct = !sel_ids.is_empty() && sel_ids == cor_ids;
            if is_correct {
                correct_count += 1;
            }

            processed_answers.push((orig_q, correct_ids, is_correct));
        }
    }

    let score = number_round((correct_count as f64 / total_q as f64) * 10.0);

    stmt_ins_attempt.execute(rusqlite::params![
        attempt_id,
        req.exam_id,
        exam.subject_id,
        exam.title,
        "Môn học",
        now_str,
        total_q,
        correct_count,
        score,
        duration_sec
    ])?;

    let mut stmt_ins_ans = tx.prepare(
        "INSERT INTO attempt_answers (id, attempt_id, question_id, position, selected_option_ids, question_text, options_snapshot, correct_option_ids, option_order, is_correct)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)"
    )?;

    for (ans_req, (q, cor_ids, is_correct)) in req.answers.iter().zip(processed_answers) {
        let aa_id = prefixed("aa");
        let opt_json = serde_json::to_string(&q.options).unwrap_or_default();
        let cor_json = serde_json::to_string(&cor_ids).unwrap_or_default();
        let sel_json = serde_json::to_string(&ans_req.selected_option_ids).unwrap_or_default();
        let ord_json = serde_json::to_string(&ans_req.option_order).unwrap_or_default();

        stmt_ins_ans.execute(rusqlite::params![
            aa_id,
            attempt_id,
            q.id,
            ans_req.position,
            sel_json,
            q.ask,
            opt_json,
            cor_json,
            ord_json,
            if is_correct { 1 } else { 0 }
        ])?;
    }

    stmt_ins_attempt.finalize()?;
    stmt_ins_ans.finalize()?;
    tx.commit()?;

    Ok(AttemptResultDto {
        attempt_id,
        score,
        correct_count,
        total_questions: total_q,
    })
}

fn number_round(val: f64) -> f64 {
    (val * 10.0).round() / 10.0
}
