use crate::db::DbPool;
use crate::dto::exam_dto::OptionDto;
use crate::dto::quiz_dto::{QuizQuestionDto, QuizStartReq, QuizStartRes};
use crate::error::AppError;
use crate::repositories::exam_repo;
use rand::seq::SliceRandom;

pub fn start_quiz(pool: &DbPool, req: QuizStartReq) -> Result<QuizStartRes, AppError> {
    let exam = exam_repo::get_detail(pool, &req.exam_id)?;
    if exam.questions.is_empty() {
        return Err(AppError::Validation(vec![crate::error::ValidationIssue {
            line: None,
            field: None,
            message: "Bộ đề chưa có câu hỏi".into(),
        }]));
    }

    let randomize = req.randomize.unwrap_or(true);
    let req_count = req.count.unwrap_or(exam.questions.len());
    let mut n = std::cmp::min(req_count, exam.questions.len());
    if n > 200 {
        n = 200;
    }
    if n == 0 {
        n = 1;
    }

    let mut pool_qs = exam.questions;
    let mut rng = rand::rng();

    if randomize {
        pool_qs.shuffle(&mut rng);
    }
    pool_qs.truncate(n);

    let mut final_qs = Vec::new();
    for q in pool_qs.into_iter() {
        let mut opts = q.options;
        if randomize {
            opts.shuffle(&mut rng);
        }
        let option_order: Vec<String> = opts.iter().map(|o| o.id.clone()).collect();

        // Ẩn đáp án đúng (is_correct = false) khi trả về
        let options_dto: Vec<OptionDto> = opts
            .into_iter()
            .map(|o| OptionDto {
                id: o.id,
                text: o.text,
                is_correct: false,
            })
            .collect();

        final_qs.push(QuizQuestionDto {
            id: q.id,
            ask: q.ask,
            options: options_dto,
            option_order,
        });
    }

    Ok(QuizStartRes {
        questions: final_qs,
        total: n,
    })
}
