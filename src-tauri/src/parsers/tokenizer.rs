#[derive(Debug, PartialEq)]
pub enum TokenKind {
    Ask,
    AnsTrue,
    AnsFalse,
    Text,
}

#[derive(Debug)]
pub struct Token {
    pub kind: TokenKind,
    pub content: String,
}

pub fn tokenize(input: &str) -> Vec<Token> {
    let mut tokens = Vec::new();
    for raw_line in input.lines() {
        let line = raw_line.trim();
        if line.is_empty() {
            continue;
        }

        if let Some(rest) = line
            .strip_prefix("ask :")
            .or_else(|| line.strip_prefix("ask:"))
        {
            tokens.push(Token {
                kind: TokenKind::Ask,
                content: rest.trim().to_string(),
            });
        } else if line.starts_with("ask") && line.contains(':') {
            let parts: Vec<&str> = line.splitn(2, ':').collect();
            tokens.push(Token {
                kind: TokenKind::Ask,
                content: parts[1].trim().to_string(),
            });
        } else if let Some(rest) = line.strip_prefix("ans.*") {
            tokens.push(Token {
                kind: TokenKind::AnsTrue,
                content: rest.trim().to_string(),
            });
        } else if let Some(rest) = line.strip_prefix("ans.") {
            tokens.push(Token {
                kind: TokenKind::AnsFalse,
                content: rest.trim().to_string(),
            });
        } else {
            tokens.push(Token {
                kind: TokenKind::Text,
                content: line.to_string(),
            });
        }
    }
    tokens
}
