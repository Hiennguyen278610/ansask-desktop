use crate::db::DbPool;
use crate::dto::exam_dto::{ExamDetail, ExamSaveReq, ExamSummary};
use crate::error::AppError;
use crate::repositories::exam_repo;
use crate::utils::{ids::prefixed, string::canonicalize};

pub fn list_by_subject(pool: &DbPool, subject_id: &str) -> Result<Vec<ExamSummary>, AppError> {
    exam_repo::list_by_subject(pool, subject_id)
}

pub fn get_detail(pool: &DbPool, id: &str) -> Result<ExamDetail, AppError> {
    exam_repo::get_detail(pool, id)
}

pub fn save(pool: &DbPool, req: ExamSaveReq) -> Result<String, AppError> {
    let title = if req.title.trim().is_empty() {
        "Chưa có tiêu đề"
    } else {
        req.title.trim()
    };

    // Validate questions (R4)
    if req.questions.is_empty() {
        return Err(AppError::Validation(vec![crate::error::ValidationIssue {
            line: None,
            field: Some("questions".into()),
            message: "Bộ đề cần có ít nhất 1 câu hỏi!".into(),
        }]));
    }
    for (i, q) in req.questions.iter().enumerate() {
        if q.options.len() < 2 {
            return Err(AppError::Validation(vec![crate::error::ValidationIssue {
                line: None,
                field: Some(format!("questions[{}]", i)),
                message: "Mỗi câu hỏi phải có ít nhất 2 lựa chọn".into(),
            }]));
        }
        if !q.options.iter().any(|o| o.is_correct) {
            return Err(AppError::Validation(vec![crate::error::ValidationIssue {
                line: None,
                field: Some(format!("questions[{}]", i)),
                message: "Mỗi câu hỏi phải có ít nhất 1 đáp án đúng".into(),
            }]));
        }
    }

    let canonical = canonicalize(title);
    if exam_repo::exists_active_title(pool, &req.subject_id, &canonical)? && req.id.is_none() {
        return Err(AppError::DuplicateName(title.into()));
    }

    exam_repo::save(pool, req)
}

pub fn delete(pool: &DbPool, id: &str) -> Result<(), AppError> {
    let batch_id = prefixed("batch");
    exam_repo::soft_delete(pool, id, &batch_id)
}
