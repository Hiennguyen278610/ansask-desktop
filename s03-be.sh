#!/bin/bash
set -e

# 1. DTOs cho Quiz & Attempt
cat > src-tauri/src/dto/quiz_dto.rs << 'EOF'
use serde::{Deserialize, Serialize};
use crate::dto::exam_dto::OptionDto;

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct QuizStartReq {
    pub exam_id: String,
    pub count: Option<usize>,
    pub randomize: Option<bool>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct QuizQuestionDto {
    pub id: String,
    pub ask: String,
    pub options: Vec<OptionDto>, // OptionDto đã ẩn is_correct
    pub option_order: Vec<String>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct QuizStartRes {
    pub questions: Vec<QuizQuestionDto>,
    pub total: usize,
}
EOF

cat > src-tauri/src/dto/attempt_dto.rs << 'EOF'
use serde::{Deserialize, Serialize};
use crate::dto::exam_dto::OptionDto;

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AttemptAnswerReq {
    pub question_id: String,
    pub selected_option_ids: Vec<String>,
    pub position: i64,
    pub option_order: Vec<String>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AttemptSubmitReq {
    pub exam_id: String,
    pub started_at: String,
    pub answers: Vec<AttemptAnswerReq>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AttemptResultDto {
    pub attempt_id: String,
    pub score: f64,
    pub correct_count: usize,
    pub total_questions: usize,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AttemptSummary {
    pub id: String,
    pub exam_id: String,
    pub exam_title: String,
    pub subject_id: String,
    pub subject_name: String,
    pub submitted_at: String,
    pub total_questions: usize,
    pub correct_count: usize,
    pub score: f64,
    pub duration_sec: i64,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct GradedQuestionDto {
    pub question_id: String,
    pub position: i64,
    pub question_text: String,
    pub options_snapshot: Vec<OptionDto>,
    pub correct_option_ids: Vec<String>,
    pub selected_option_ids: Vec<String>,
    pub option_order: Vec<String>,
    pub is_correct: bool,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AttemptReviewDto {
    pub attempt_id: String,
    pub exam_title: String,
    pub score: f64,
    pub total_questions: usize,
    pub correct_count: usize,
    pub questions: Vec<GradedQuestionDto>,
}
EOF

# 2. Repository cho Attempt
cat > src-tauri/src/repositories/attempt_repo.rs << 'EOF'
use crate::db::DbPool;
use crate::dto::attempt_dto::{AttemptSummary, AttemptReviewDto, GradedQuestionDto};
use crate::dto::exam_dto::OptionDto;
use crate::error::AppError;

pub fn list_by_exam(pool: &DbPool, exam_id: &str) -> Result<Vec<AttemptSummary>, AppError> {
    let conn = pool.get()?;
    let mut stmt = conn.prepare(
        "SELECT id, exam_id, exam_title, subject_id, subject_name, submitted_at, total_questions, correct_count, score, duration_sec
         FROM attempts WHERE exam_id = ?1 ORDER BY submitted_at DESC"
    )?;
    let rows = stmt.query_map([exam_id], |row| Ok(AttemptSummary {
        id: row.get(0)?, exam_id: row.get(1)?, exam_title: row.get(2)?, subject_id: row.get(3)?,
        subject_name: row.get(4)?, submitted_at: row.get(5)?, total_questions: row.get::<_, i64>(6)? as usize,
        correct_count: row.get::<_, i64>(7)? as usize, score: row.get(8)?, duration_sec: row.get(9)?,
    }))?;
    let mut res = Vec::new();
    for r in rows { res.push(r?); }
    Ok(res)
}

pub fn get_review(pool: &DbPool, attempt_id: &str) -> Result<AttemptReviewDto, AppError> {
    let conn = pool.get()?;
    let mut stmt = conn.prepare("SELECT exam_title, score, total_questions, correct_count FROM attempts WHERE id = ?1")?;
    let mut review = stmt.query_row([attempt_id], |row| {
        Ok(AttemptReviewDto {
            attempt_id: attempt_id.to_string(),
            exam_title: row.get(0)?,
            score: row.get(1)?,
            total_questions: row.get::<_, i64>(2)? as usize,
            correct_count: row.get::<_, i64>(3)? as usize,
            questions: Vec::new(),
        })
    }).map_err(|e| if matches!(e, rusqlite::Error::QueryReturnedNoRows) { AppError::NotFound(attempt_id.into()) } else { AppError::from(e) })?;

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
EOF

# 3. Services
cat > src-tauri/src/services/quiz_service.rs << 'EOF'
use crate::db::DbPool;
use crate::dto::quiz_dto::{QuizStartReq, QuizStartRes, QuizQuestionDto};
use crate::dto::exam_dto::OptionDto;
use crate::error::AppError;
use crate::repositories::exam_repo;
use rand::seq::SliceRandom;

pub fn start_quiz(pool: &DbPool, req: QuizStartReq) -> Result<QuizStartRes, AppError> {
    let exam = exam_repo::get_detail(pool, &req.exam_id)?;
    if exam.questions.is_empty() { return Err(AppError::Validation(vec![crate::error::ValidationIssue { line: None, field: None, message: "Bộ đề chưa có câu hỏi".into() }])); }

    let randomize = req.randomize.unwrap_or(true);
    let req_count = req.count.unwrap_or(exam.questions.len());
    let n = std::cmp::min(req_count, exam.questions.len());

    let mut pool_qs = exam.questions;
    let mut rng = rand::thread_rng();

    if randomize {
        pool_qs.shuffle(&mut rng);
    }
    pool_qs.truncate(n);

    let mut final_qs = Vec::new();
    for (i, q) in pool_qs.into_iter().enumerate() {
        let mut opts = q.options;
        if randomize {
            opts.shuffle(&mut rng);
        }
        let option_order: Vec<String> = opts.iter().map(|o| o.id.clone()).collect();
        
        // Ẩn đáp án đúng (is_correct = false) khi trả về
        let options_dto: Vec<OptionDto> = opts.into_iter().map(|o| OptionDto {
            id: o.id, text: o.text, is_correct: false
        }).collect();

        final_qs.push(QuizQuestionDto {
            id: q.id,
            ask: q.ask,
            options: options_dto,
            option_order,
        });
    }

    Ok(QuizStartRes { questions: final_qs, total: n })
}
EOF

cat > src-tauri/src/services/attempt_service.rs << 'EOF'
use crate::db::DbPool;
use crate::dto::attempt_dto::{AttemptSubmitReq, AttemptResultDto};
use crate::error::AppError;
use crate::repositories::exam_repo;
use crate::utils::ids::prefixed;

pub fn submit_attempt(pool: &DbPool, req: AttemptSubmitReq) -> Result<AttemptResultDto, AppError> {
    let exam = exam_repo::get_detail(pool, &req.exam_id)?;
    let mut conn = pool.get()?;
    let tx = conn.transaction()?;
    
    let attempt_id = prefixed("att");
    let total_q = req.answers.len();
    let mut correct_count = 0;
    let now_str = crate::utils::time::now_iso_utc();

    let mut stmt_ins_attempt = tx.prepare(
        "INSERT INTO attempts (id, exam_id, subject_id, exam_title, subject_name, submitted_at, total_questions, correct_count, score, duration_sec)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)"
    )?;
    
    // Tính điểm trước
    let mut processed_answers = Vec::new();
    
    for ans in &req.answers {
        if let Some(orig_q) = exam.questions.iter().find(|q| q.id == ans.question_id) {
            let correct_ids: Vec<String> = orig_q.options.iter().filter(|o| o.is_correct).map(|o| o.id.clone()).collect();
            let mut sel_ids = ans.selected_option_ids.clone();
            sel_ids.sort();
            let mut cor_ids = correct_ids.clone();
            cor_ids.sort();
            
            let is_correct = !sel_ids.is_empty() && sel_ids == cor_ids;
            if is_correct { correct_count += 1; }
            
            processed_answers.push((orig_q, correct_ids, is_correct));
        }
    }
    
    let score = NumberRound((correct_count as f64 / total_q as f64) * 10.0);
    let duration_sec = 100; // Sẽ tính từ FE gửi lên (nếu cần), tạm fix cứng

    stmt_ins_attempt.execute(rusqlite::params![
        attempt_id, req.exam_id, exam.subject_id, exam.title, "Môn học", now_str, total_q, correct_count, score, duration_sec
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
            aa_id, attempt_id, q.id, ans_req.position, sel_json, q.ask, opt_json, cor_json, ord_json, if is_correct {1} else {0}
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

fn NumberRound(val: f64) -> f64 {
    (val * 10.0).round() / 10.0
}
EOF

# 4. Commands & lib.rs
cat > src-tauri/src/commands/quiz_cmds.rs << 'EOF'
use tauri::State;
use crate::state::AppState;
use crate::error::AppError;
use crate::dto::quiz_dto::{QuizStartReq, QuizStartRes};
use crate::services::quiz_service;

#[tauri::command]
pub fn quiz_start(state: State<'_, AppState>, req: QuizStartReq) -> Result<QuizStartRes, AppError> {
    quiz_service::start_quiz(&state.pool, req)
}
EOF

cat > src-tauri/src/commands/attempt_cmds.rs << 'EOF'
use tauri::State;
use crate::state::AppState;
use crate::error::AppError;
use crate::dto::attempt_dto::{AttemptSubmitReq, AttemptResultDto, AttemptSummary, AttemptReviewDto};
use crate::services::attempt_service;
use crate::repositories::attempt_repo;
use serde::Deserialize;

#[derive(Deserialize)] #[serde(rename_all = "camelCase")] pub struct ExamIdReq { pub exam_id: String }
#[derive(Deserialize)] #[serde(rename_all = "camelCase")] pub struct IdReq { pub id: String }

#[tauri::command] pub fn attempt_submit(state: State<'_, AppState>, req: AttemptSubmitReq) -> Result<AttemptResultDto, AppError> { attempt_service::submit_attempt(&state.pool, req) }
#[tauri::command] pub fn attempt_list(state: State<'_, AppState>, req: ExamIdReq) -> Result<Vec<AttemptSummary>, AppError> { attempt_repo::list_by_exam(&state.pool, &req.exam_id) }
#[tauri::command] pub fn attempt_review(state: State<'_, AppState>, req: IdReq) -> Result<AttemptReviewDto, AppError> { attempt_repo::get_review(&state.pool, &req.id) }
EOF

cat > src-tauri/src/commands/mod.rs << 'EOF'
pub mod settings_cmds;
pub mod subject_cmds;
pub mod exam_cmds;
pub mod import_cmds;
pub mod quiz_cmds;
pub mod attempt_cmds;
EOF

cat > src-tauri/src/dto/mod.rs << 'EOF'
pub mod subject_dto;
pub mod exam_dto;
pub mod import_dto;
pub mod quiz_dto;
pub mod attempt_dto;
EOF

cat > src-tauri/src/repositories/mod.rs << 'EOF'
pub mod setting_repo;
pub mod subject_repo;
pub mod exam_repo;
pub mod attempt_repo;
EOF

cat > src-tauri/src/services/mod.rs << 'EOF'
pub mod subject_service;
pub mod exam_service;
pub mod quiz_service;
pub mod attempt_service;
EOF

# Sửa lib.rs để đăng ký
python3 - << 'PYEOF'
import re
p = 'src-tauri/src/lib.rs'
s = open(p).read()
s = s.replace(
  'commands::import_cmds::import_parse,',
  'commands::import_cmds::import_parse,\n            commands::quiz_cmds::quiz_start,\n            commands::attempt_cmds::attempt_submit,\n            commands::attempt_cmds::attempt_list,\n            commands::attempt_cmds::attempt_review,'
)
open(p, 'w').write(s)
PYEOF

cd src-tauri && cargo fmt && cd ..
