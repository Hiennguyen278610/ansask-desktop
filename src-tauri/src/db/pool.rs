use r2d2::Pool;
use r2d2_sqlite::SqliteConnectionManager;
use std::path::Path;

pub type DbPool = Pool<SqliteConnectionManager>;

pub fn create_pool(db_path: &Path) -> Result<DbPool, Box<dyn std::error::Error>> {
    let manager = SqliteConnectionManager::file(db_path).with_init(|c| {
        c.execute_batch(
            "PRAGMA foreign_keys = ON;\
             PRAGMA journal_mode = WAL;\
             PRAGMA busy_timeout = 5000;\
             PRAGMA synchronous = NORMAL;",
        )
    });
    Ok(Pool::builder().max_size(4).build(manager)?)
}

/// max_size = 1 → mọi kết nối dùng chung một DB `:memory:`.
/// Chỉ dùng trong test (`cargo test`) — dead_code ở build dev profile là bình thường.
#[allow(dead_code)]
pub fn create_memory_pool() -> Result<DbPool, Box<dyn std::error::Error>> {
    let manager = SqliteConnectionManager::memory()
        .with_init(|c| c.execute_batch("PRAGMA foreign_keys = ON;"));
    Ok(Pool::builder().max_size(1).build(manager)?)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::db::migrations;

    #[test]
    fn memory_pool_enables_foreign_keys() {
        let pool = create_memory_pool().unwrap();
        let conn = pool.get().unwrap();
        let fk: i64 = conn
            .query_row("PRAGMA foreign_keys", [], |r| r.get(0))
            .unwrap();
        assert_eq!(fk, 1, "foreign_keys phải ON mỗi kết nối");
    }

    #[test]
    fn foreign_key_violation_is_rejected() {
        let pool = create_memory_pool().unwrap();
        let mut conn = pool.get().unwrap();
        migrations::run(&mut conn).unwrap();
        let res = conn.execute(
            "INSERT INTO exams (id, subject_id, title) VALUES ('e1','missing','X')",
            [],
        );
        assert!(res.is_err(), "phải chặn FK vi phạm khi foreign_keys=ON");
    }
}
