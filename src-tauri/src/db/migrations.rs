use rusqlite::Connection;
use rusqlite_migration::{Migrations, M};

pub fn migrations() -> Migrations<'static> {
    Migrations::new(vec![M::up(include_str!("migrations/001_init.sql"))])
}

pub fn run(conn: &mut Connection) -> Result<(), rusqlite_migration::Error> {
    migrations().to_latest(conn)
}

#[cfg(test)]
mod tests {
    use super::*;

    fn fresh() -> Connection {
        let mut conn = Connection::open_in_memory().unwrap();
        run(&mut conn).unwrap();
        conn
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

    #[test]
    fn partial_unique_index_subjects_name() {
        let conn = fresh();
        let now = "2026-01-01T00:00:00.000Z";
        conn.execute(
            "INSERT INTO subjects (id, name, color, created_at, updated_at) VALUES ('s1','A','#000',?1,?1)",
            [now],
        )
        .unwrap();
        // Trùng tên khi cả 2 đang sống → fail
        let res = conn.execute(
            "INSERT INTO subjects (id, name, color, created_at, updated_at) VALUES ('s2','A','#000',?1,?1)",
            [now],
        );
        assert!(res.is_err(), "phải chặn trùng tên khi cả hai đang sống");
        // Soft delete s1 → tạo s3 trùng tên được (partial index)
        conn.execute("UPDATE subjects SET deleted_at = ?1 WHERE id='s1'", [now])
            .unwrap();
        conn.execute(
            "INSERT INTO subjects (id, name, color, created_at, updated_at) VALUES ('s3','A','#000',?1,?1)",
            [now],
        )
        .unwrap();
    }

    /// Lưu ý: SQLite lower() built-in chỉ xử lý ASCII.
    /// Việc so khớp tiếng Việt có dấu là trách nhiệm của service layer (Rust + unicode-normalization).
    /// Test này kiểm tra đúng giới hạn thực tế của DB.
    #[test]
    fn unique_index_is_case_and_trim_insensitive_for_ascii() {
        let conn = fresh();
        let now = "2026-01-01T00:00:00.000Z";
        conn.execute(
            "INSERT INTO subjects (id, name, color, created_at, updated_at) VALUES ('s1','TEST','#000',?1,?1)",
            [now],
        )
        .unwrap();
        let res = conn.execute(
            "INSERT INTO subjects (id, name, color, created_at, updated_at) VALUES ('s2','  test  ','#000',?1,?1)",
            [now],
        );
        assert!(
            res.is_err(),
            "phải chặn trùng tên sau lower(trim(...)) với ASCII"
        );
    }

    #[test]
    fn unique_exams_title_per_subject_only() {
        let conn = fresh();
        let now = "2026-01-01T00:00:00.000Z";
        conn.execute(
            "INSERT INTO subjects (id, name, color, created_at, updated_at) VALUES ('s1','A','#000',?1,?1)",
            [now],
        )
        .unwrap();
        conn.execute(
            "INSERT INTO subjects (id, name, color, created_at, updated_at) VALUES ('s2','B','#000',?1,?1)",
            [now],
        )
        .unwrap();
        conn.execute(
            "INSERT INTO exams (id, subject_id, title, created_at, updated_at) VALUES ('e1','s1','X',?1,?1)",
            [now],
        )
        .unwrap();
        // Cùng tên khác môn → OK
        conn.execute(
            "INSERT INTO exams (id, subject_id, title, created_at, updated_at) VALUES ('e2','s2','X',?1,?1)",
            [now],
        )
        .unwrap();
        // Cùng tên cùng môn → fail
        let res = conn.execute(
            "INSERT INTO exams (id, subject_id, title, created_at, updated_at) VALUES ('e3','s1','X',?1,?1)",
            [now],
        );
        assert!(res.is_err(), "phải chặn trùng tên bộ đề trong cùng môn");
    }
}
