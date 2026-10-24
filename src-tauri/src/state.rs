use crate::db::DbPool;

pub struct AppState {
    pub pool: DbPool,
    // Sprint 01+ sẽ thêm services tại đây (ServiceDeps).
}

impl AppState {
    pub fn new(pool: DbPool) -> Self {
        Self { pool }
    }
}
