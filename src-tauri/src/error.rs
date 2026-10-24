use serde::{ser::SerializeStruct, Serialize, Serializer};
use thiserror::Error;

#[allow(dead_code)]
#[derive(Debug, Error)]
pub enum AppError {
    #[error("Không tìm thấy: {0}")]
    NotFound(String),

    #[error("Tên đã tồn tại: {0}")]
    DuplicateName(String),

    #[error("Dữ liệu không hợp lệ")]
    Validation(Vec<ValidationIssue>),

    #[error("Không thể thực hiện: {0}")]
    Blocked(String),

    #[error("Lỗi cơ sở dữ liệu: {0}")]
    Db(String),

    #[error("Lỗi hệ thống: {0}")]
    Internal(String),
}

#[allow(dead_code)]
#[derive(Debug, Clone, Serialize)]
pub struct ValidationIssue {
    pub line: Option<i64>,
    pub field: Option<String>,
    pub message: String,
}

impl AppError {
    fn code(&self) -> &'static str {
        match self {
            AppError::NotFound(_) => "NOT_FOUND",
            AppError::DuplicateName(_) => "DUPLICATE_NAME",
            AppError::Validation(_) => "VALIDATION",
            AppError::Blocked(_) => "BLOCKED",
            AppError::Db(_) => "DB_ERROR",
            AppError::Internal(_) => "INTERNAL",
        }
    }
}

impl Serialize for AppError {
    fn serialize<S: Serializer>(&self, s: S) -> Result<S::Ok, S::Error> {
        let mut st = s.serialize_struct("AppError", 2)?;
        st.serialize_field("code", self.code())?;
        st.serialize_field("message", &self.to_string())?;
        st.end()
    }
}

impl From<rusqlite::Error> for AppError {
    fn from(e: rusqlite::Error) -> Self {
        AppError::Db(e.to_string())
    }
}

impl From<r2d2::Error> for AppError {
    fn from(e: r2d2::Error) -> Self {
        AppError::Db(e.to_string())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn not_found_wire_has_code_and_message() {
        let j = serde_json::to_value(AppError::NotFound("xyz".into())).unwrap();
        assert_eq!(j["code"], "NOT_FOUND");
        assert!(j["message"].as_str().unwrap().contains("xyz"));
    }

    #[test]
    fn duplicate_name_wire() {
        let j = serde_json::to_value(AppError::DuplicateName("Mạng".into())).unwrap();
        assert_eq!(j["code"], "DUPLICATE_NAME");
    }

    #[test]
    fn validation_wire() {
        let j = serde_json::to_value(AppError::Validation(vec![ValidationIssue {
            line: Some(3),
            field: None,
            message: "cần ≥ 2 đáp án".into(),
        }]))
        .unwrap();
        assert_eq!(j["code"], "VALIDATION");
    }
}
