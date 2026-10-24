use crate::dto::exam_dto::QuestionUpsertReq;
use crate::error::ValidationIssue;

pub fn validate_questions(questions: &[QuestionUpsertReq]) -> Vec<ValidationIssue> {
    let mut issues = Vec::new();
    if questions.is_empty() {
        issues.push(ValidationIssue {
            line: None,
            field: None,
            message: "Bộ đề phải có ít nhất 1 câu hỏi".into(),
        });
        return issues;
    }

    for (i, q) in questions.iter().enumerate() {
        if q.options.len() < 2 {
            issues.push(ValidationIssue {
                line: None,
                field: Some(format!("questions[{}]", i)),
                message: format!("Câu {} phải có ít nhất 2 lựa chọn", i + 1),
            });
        }
        if !q.options.iter().any(|o| o.is_correct) {
            issues.push(ValidationIssue {
                line: None,
                field: Some(format!("questions[{}]", i)),
                message: format!("Câu {} phải có ít nhất 1 đáp án đúng", i + 1),
            });
        }
    }
    issues
}
