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
    let include_answers = req.include_answers.unwrap_or(false);

    // Lọc theo danh sách câu hỏi (Practice Mode)
    let mut pool_qs = if let Some(ids) = req.question_ids {
        exam.questions
            .into_iter()
            .filter(|q| ids.contains(&q.id))
            .collect::<Vec<_>>()
    } else {
        exam.questions
    };

    if pool_qs.is_empty() {
        return Err(AppError::Internal(
            "Không có câu hỏi nào hợp lệ để tạo bài.".into(),
        ));
    }

    let req_count = req.count.unwrap_or(pool_qs.len());
    let n = std::cmp::min(req_count, pool_qs.len()).clamp(1, 200);

    let mut rng = rand::rng();

    if randomize {
        pool_qs.shuffle(&mut rng);
    }
    pool_qs.truncate(n);

    let mut final_qs = Vec::new();
    for q in pool_qs {
        let mut opts = q.options;
        if randomize {
            opts.shuffle(&mut rng);
        }
        let option_order: Vec<String> = opts.iter().map(|o| o.id.clone()).collect();

        let options_dto: Vec<OptionDto> = opts
            .into_iter()
            .map(|o| OptionDto {
                id: o.id,
                text: o.text,
                is_correct: if include_answers { o.is_correct } else { false }, // Trả đáp án nếu là Stream Mode
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
