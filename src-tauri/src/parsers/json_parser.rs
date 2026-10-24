use crate::dto::exam_dto::{OptionUpsertReq, QuestionUpsertReq};
use serde::Deserialize;

#[derive(Deserialize)]
struct RawJsonAns {
    #[serde(rename = "true")]
    true_opt: Option<String>,
    #[serde(rename = "false")]
    false_opt: Option<String>,
}

#[derive(Deserialize)]
struct RawJsonQuestion {
    ask: String,
    answer: Vec<RawJsonAns>,
}

pub fn parse(input: &str) -> Result<Vec<QuestionUpsertReq>, String> {
    let parsed: Vec<RawJsonQuestion> =
        serde_json::from_str(input).map_err(|e| format!("Lỗi JSON: {}", e))?;

    let mut questions = Vec::new();
    for item in parsed {
        let mut options = Vec::new();
        for ans in item.answer {
            if let Some(text) = ans.true_opt {
                options.push(OptionUpsertReq {
                    text,
                    is_correct: true,
                });
            } else if let Some(text) = ans.false_opt {
                options.push(OptionUpsertReq {
                    text,
                    is_correct: false,
                });
            }
        }
        if options.is_empty() {
            options = vec![
                OptionUpsertReq {
                    text: "".into(),
                    is_correct: true,
                },
                OptionUpsertReq {
                    text: "".into(),
                    is_correct: false,
                },
            ];
        }
        questions.push(QuestionUpsertReq {
            ask: item.ask,
            options,
        });
    }
    Ok(questions)
}
