use serde::Serialize;

#[derive(Debug, thiserror::Error)]
pub enum AppError {
    #[error("Không tìm thấy dữ liệu")]
    NotFound,
    #[error("{0}")]
    Validation(String),
    #[error(transparent)]
    Db(#[from] rusqlite::Error),
    #[error(transparent)]
    Json(#[from] serde_json::Error),
    #[error(transparent)]
    Io(#[from] std::io::Error),
    #[error("{0}")]
    Internal(String),
}

impl Serialize for AppError {
    fn serialize<S: serde::Serializer>(&self, serializer: S) -> Result<S::Ok, S::Error> {
        #[derive(Serialize)]
        struct ErrorBody<'a> {
            code: &'a str,
            message: String,
        }
        let code = match self {
            Self::NotFound => "NOT_FOUND",
            Self::Validation(_) => "VALIDATION",
            _ => "INTERNAL",
        };
        ErrorBody {
            code,
            message: self.to_string(),
        }
        .serialize(serializer)
    }
}
