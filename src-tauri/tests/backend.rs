use ansask_desktop_lib::{db, models::finish_page};
use std::path::PathBuf;

#[test]
fn pagination_cursor_tracks_last_visible_row() {
    let page = finish_page(vec![3, 2, 1], 2, |value| *value);
    assert_eq!(page.items, vec![3, 2]);
    assert_eq!(page.next_cursor, Some(2));
    let last = finish_page(vec![1], 2, |value| *value);
    assert_eq!(last.items, vec![1]);
    assert_eq!(last.next_cursor, None);
}

#[test]
fn migration_enables_foreign_keys_and_cascade() {
    let db = db::open(PathBuf::from(":memory:")).unwrap();
    let conn = db.0.lock().unwrap();
    let foreign_keys: i64 = conn
        .query_row("PRAGMA foreign_keys", [], |r| r.get(0))
        .unwrap();
    assert_eq!(foreign_keys, 1);
    conn.execute("INSERT INTO subjects (id, name, icon, created_at) VALUES ('s', 'Sinh học', 'plant_cell.svg', 1)", []).unwrap();
    conn.execute("INSERT INTO exams (id, subject_id, title, created_at, updated_at) VALUES ('e', 's', 'Đề', 1, 1)", []).unwrap();
    conn.execute("DELETE FROM subjects WHERE id='s'", [])
        .unwrap();
    let count: i64 = conn
        .query_row("SELECT COUNT(*) FROM exams", [], |r| r.get(0))
        .unwrap();
    assert_eq!(count, 0);
}

#[test]
fn session_draft_keeps_one_resume_point_and_cascades_with_exam() {
    let db = db::open(PathBuf::from(":memory:")).unwrap();
    let conn = db.0.lock().unwrap();
    conn.execute("INSERT INTO subjects (id, name, icon, created_at) VALUES ('s', 'Sinh học', 'plant_cell.svg', 1)", []).unwrap();
    conn.execute("INSERT INTO exams (id, subject_id, title, created_at, updated_at) VALUES ('e', 's', 'Đề', 1, 1)", []).unwrap();
    conn.execute("INSERT INTO session_drafts (id, exam_id, mode, questions_json, answers_json, first_try_json, current_index, started_at, elapsed_sec, updated_at) VALUES ('d', 'e', 'quiz', '[]', '{}', '{}', 0, 1, 0, 1)", []).unwrap();
    assert!(conn.execute("INSERT INTO session_drafts (id, exam_id, mode, questions_json, answers_json, first_try_json, current_index, started_at, elapsed_sec, updated_at) VALUES ('d2', 'e', 'quiz', '[]', '{}', '{}', 0, 1, 0, 1)", []).is_err());
    conn.execute("DELETE FROM exams WHERE id='e'", []).unwrap();
    let count: i64 = conn
        .query_row("SELECT COUNT(*) FROM session_drafts", [], |r| r.get(0))
        .unwrap();
    assert_eq!(count, 0);
}

#[test]
fn existing_database_upgrades_without_losing_subjects() {
    let path = std::env::temp_dir().join(format!("ansask-upgrade-{}.db", uuid::Uuid::now_v7()));
    let mut old = rusqlite::Connection::open(&path).unwrap();
    rusqlite_migration::Migrations::new(vec![rusqlite_migration::M::up(include_str!(
        "../src/db/migrations/0001_init.sql"
    ))])
    .to_latest(&mut old)
    .unwrap();
    old.execute("INSERT INTO subjects (id, name, icon, created_at) VALUES ('s', 'Sinh học', 'plant_cell.svg', 1)", []).unwrap();
    drop(old);

    let upgraded = db::open(path.clone()).unwrap();
    let conn = upgraded.0.lock().unwrap();
    let name: String = conn
        .query_row("SELECT name FROM subjects WHERE id='s'", [], |r| r.get(0))
        .unwrap();
    assert_eq!(name, "Sinh học");
    let count: i64 = conn
        .query_row("SELECT COUNT(*) FROM session_drafts", [], |r| r.get(0))
        .unwrap();
    assert_eq!(count, 0);
    drop(conn);
    drop(upgraded);
    for suffix in ["", "-wal", "-shm"] {
        let _ = std::fs::remove_file(format!("{}{}", path.display(), suffix));
    }
}
