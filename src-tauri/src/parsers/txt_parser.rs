use crate::dto::exam_dto::{OptionUpsertReq, QuestionUpsertReq};
use crate::parsers::tokenizer::{tokenize, TokenKind};

pub fn parse(input: &str) -> Vec<QuestionUpsertReq> {
    let tokens = tokenize(input);
    let mut questions = Vec::new();
    let mut current_q: Option<QuestionUpsertReq> = None;

    for token in tokens {
        match token.kind {
            TokenKind::Ask => {
                if let Some(q) = current_q.take() {
                    questions.push(q);
                }
                current_q = Some(QuestionUpsertReq {
                    ask: token.content,
                    options: Vec::new(),
                });
            }
            TokenKind::AnsTrue | TokenKind::AnsFalse => {
                if current_q.is_none() {
                    current_q = Some(QuestionUpsertReq {
                        ask: "".into(),
                        options: Vec::new(),
                    });
                }
                if let Some(ref mut q) = current_q {
                    q.options.push(OptionUpsertReq {
                        text: token.content,
                        is_correct: token.kind == TokenKind::AnsTrue,
                    });
                }
            }
            TokenKind::Text => {
                if let Some(ref mut q) = current_q {
                    if q.options.is_empty() {
                        q.ask = format!("{} {}", q.ask, token.content).trim().to_string();
                    } else {
                        if let Some(last_opt) = q.options.last_mut() {
                            last_opt.text = format!("{} {}", last_opt.text, token.content)
                                .trim()
                                .to_string();
                        }
                    }
                }
            }
        }
    }
    if let Some(q) = current_q {
        questions.push(q);
    }
    questions
}
