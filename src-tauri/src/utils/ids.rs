use uuid::Uuid;

pub fn new_id_v7() -> String {
    Uuid::now_v7().to_string()
}

pub fn prefixed(prefix: &str) -> String {
    format!("{prefix}-{}", Uuid::now_v7())
}
