use rusqlite::Connection;
use rusqlite_migration::{Migrations, M};

pub fn migrations() -> Migrations<'static> {
    Migrations::new(vec![M::up(include_str!("migrations/001_init.sql"))])
}

pub fn run(conn: &mut Connection) -> Result<(), rusqlite_migration::Error> {
    migrations().to_latest(conn)
}

/// Test tầng DB. Phạm vi: SQLite built-in `lower()` + `trim()`.
///
/// QUYẾT ĐỊNH (xem `docs/decisions/ADR-001-subject-name-uniqueness.md`):
/// - DB bảo vệ **ASCII case** (M/m) và **ASCII space trim** (U+0020).
/// - DB KHÔNG bảo vệ **Unicode case** (Ạ/ạ, Đ/đ) hay **Unicode whitespace** (tab, NBSP).
/// - Service layer (Sprint 01) chịu trách nhiệm cho Unicode.
#[cfg(test)]
mod tests {
    use super::*;

    fn fresh() -> Connection {
        let mut conn = Connection::open_in_memory().unwrap();
        run(&mut conn).unwrap();
        conn
    }

    fn insert_subject(conn: &Connection, id: &str, name: &str) -> Result<usize, rusqlite::Error> {
        let now = "2026-01-01T00:00:00.000Z";
        conn.execute(
            "INSERT INTO subjects (id, name, color, created_at, updated_at) VALUES (?1, ?2, '#000', ?3, ?3)",
            rusqlite::params![id, name, now],
        )
    }

    #[test]
    fn migrations_apply_on_memory() {
        let conn = fresh();
        let count: i64 = conn
            .query_row(
                "SELECT count(*) FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'",
                [],
                |r| r.get(0),
            )
            .unwrap();
        assert_eq!(count, 7, "phải có 7 bảng lõi");
    }

    #[test]
    fn seed_theme_is_system() {
        let conn = fresh();
        let v: String = conn
            .query_row(
                "SELECT value FROM app_settings WHERE key='theme'",
                [],
                |r| r.get(0),
            )
            .unwrap();
        assert_eq!(v, "system");
    }

    // ---------- subjects.name uniqueness — ASCII case + ASCII space trim ----------

    #[test]
    fn subjects_name_blocks_ascii_case_duplicates() {
        let conn = fresh();
        insert_subject(&conn, "s1", "Toan").unwrap();
        let res = insert_subject(&conn, "s2", "toan");
        assert!(res.is_err(), "phải chặn trùng ASCII khác hoa/thường");
    }

    #[test]
    fn subjects_name_blocks_ascii_space_trim_duplicates() {
        let conn = fresh();
        insert_subject(&conn, "s1", "Toan").unwrap();
        let res = insert_subject(&conn, "s2", "  Toan  ");
        assert!(res.is_err(), "phải chặn trùng sau khi trim space (ASCII)");
    }

    #[test]
    fn subjects_name_releases_after_soft_delete() {
        let conn = fresh();
        insert_subject(&conn, "s1", "Toan").unwrap();
        conn.execute(
            "UPDATE subjects SET deleted_at = '2026-01-01T00:00:00.000Z' WHERE id='s1'",
            [],
        )
        .unwrap();
        insert_subject(&conn, "s2", "Toan").unwrap();
    }

    #[test]
    fn subjects_name_second_concurrent_insert_is_rejected() {
        let conn = fresh();
        insert_subject(&conn, "s1", "Toan").unwrap();
        assert!(
            insert_subject(&conn, "s2", "toan").is_err(),
            "insert thứ hai phải bị chặn"
        );
    }

    /// Ghi nhận giới hạn: Unicode case (Ạ/ạ) KHÔNG bị DB chặn.
    /// SQLite bundled `lower()` giữ nguyên ký tự có dấu.
    #[test]
    fn subjects_name_allows_unicode_case_duplicates_at_db_level() {
        let conn = fresh();
        insert_subject(&conn, "s1", "MẠNG").unwrap();
        let res = insert_subject(&conn, "s2", "mạng");
        assert!(
            res.is_ok(),
            "'MẠNG' vs 'mạng' khác cả M/m và Ạ/ạ, SQLite bundled lower() không hạ Ạ nên cùng insert được."
        );
    }

    /// Ghi nhận giới hạn: SQLite default trim() chỉ cắt U+0020, không cắt tab.
    #[test]
    fn subjects_name_allows_ascii_tab_at_db_level() {
        let conn = fresh();
        insert_subject(&conn, "s1", "Toan").unwrap();
        let res = insert_subject(&conn, "s2", "Toan\t");
        assert!(
            res.is_ok(),
            "Tab không bị trim bởi SQLite default trim(), DB phải cho qua."
        );
    }

    // ---------- exams.title uniqueness — (subject_id, ASCII) ----------

    #[test]
    fn exams_title_unique_within_subject_only() {
        let conn = fresh();
        let now = "2026-01-01T00:00:00.000Z";
        for (id, name) in [("s1", "A"), ("s2", "B")] {
            conn.execute(
                "INSERT INTO subjects (id, name, color, created_at, updated_at) VALUES (?1,?2,'#000',?3,?3)",
                rusqlite::params![id, name, now],
            )
            .unwrap();
        }
        conn.execute(
            "INSERT INTO exams (id, subject_id, title, created_at, updated_at) VALUES ('e1','s1','X',?1,?1)",
            [now],
        )
        .unwrap();
        conn.execute(
            "INSERT INTO exams (id, subject_id, title, created_at, updated_at) VALUES ('e2','s2','X',?1,?1)",
            [now],
        )
        .unwrap();
        let res = conn.execute(
            "INSERT INTO exams (id, subject_id, title, created_at, updated_at) VALUES ('e3','s1','X',?1,?1)",
            [now],
        );
        assert!(res.is_err(), "phải chặn trùng tên bộ đề trong cùng môn");
    }
}
