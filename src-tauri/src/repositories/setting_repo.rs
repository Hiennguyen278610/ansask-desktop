use crate::db::DbPool;
use crate::error::AppError;

pub fn get(pool: &DbPool, key: &str) -> Result<Option<String>, AppError> {
    let conn = pool.get()?;
    let mut stmt = conn.prepare("SELECT value FROM app_settings WHERE key = ?1")?;
    let mut rows = stmt.query([key])?;
    if let Some(row) = rows.next()? {
        Ok(Some(row.get::<_, String>(0)?))
    } else {
        Ok(None)
    }
}

pub fn upsert(pool: &DbPool, key: &str, value: &str) -> Result<(), AppError> {
    let conn = pool.get()?;
    conn.execute(
        "INSERT INTO app_settings (key, value, updated_at) \
         VALUES (?1, ?2, strftime('%Y-%m-%dT%H:%M:%fZ','now')) \
         ON CONFLICT(key) DO UPDATE SET \
           value = excluded.value, updated_at = excluded.updated_at",
        [key, value],
    )?;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::db::{create_memory_pool, migrations};

    fn pool() -> DbPool {
        let pool = create_memory_pool().unwrap();
        let mut conn = pool.get().unwrap();
        migrations::run(&mut conn).unwrap();
        pool
    }

    #[test]
    fn get_seeded_theme_returns_system() {
        assert_eq!(get(&pool(), "theme").unwrap(), Some("system".into()));
    }

    #[test]
    fn get_missing_returns_none() {
        assert_eq!(get(&pool(), "nonexistent").unwrap(), None);
    }

    #[test]
    fn upsert_inserts_new_key() {
        let p = pool();
        upsert(&p, "custom", "v1").unwrap();
        assert_eq!(get(&p, "custom").unwrap(), Some("v1".into()));
    }

    #[test]
    fn upsert_overwrites_existing() {
        let p = pool();
        upsert(&p, "theme", "dark").unwrap();
        assert_eq!(get(&p, "theme").unwrap(), Some("dark".into()));
        upsert(&p, "theme", "light").unwrap();
        assert_eq!(get(&p, "theme").unwrap(), Some("light".into()));
    }
}
