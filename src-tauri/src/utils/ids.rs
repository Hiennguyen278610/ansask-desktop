use uuid::Uuid;

#[allow(dead_code)]
pub fn new_id_v7() -> String {
    Uuid::now_v7().to_string()
}

#[allow(dead_code)]
pub fn prefixed(prefix: &str) -> String {
    format!("{prefix}-{}", Uuid::now_v7())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn v7_is_sortable_and_unique() {
        let a = new_id_v7();
        std::thread::sleep(std::time::Duration::from_millis(2));
        let b = new_id_v7();
        assert_ne!(a, b);
        assert!(a < b, "UUIDv7 phải sortable theo thời gian");
    }

    #[test]
    fn prefixed_has_prefix() {
        let id = prefixed("sub");
        assert!(id.starts_with("sub-"));
    }
}
