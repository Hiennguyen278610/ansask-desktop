#!/bin/bash
set -e

# --- Sửa test trong migrations.rs ---
cat > src-tauri/src/db/migrations.rs << 'MIG_EOF'
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
/// - DB bảo vệ **ASCII case** (M/m) và **trim** trên mọi ngôn ngữ.
/// - DB KHÔNG bảo vệ **Unicode case** (Ạ/ạ, Đ/đ) — SQLite bundled `lower()`
///   chỉ hạ ASCII; service layer (Sprint 01) chịu trách nhiệm.
/// - Không assert xử lý dấu tiếng Việt ở đây.
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

    // ---------- subjects.name uniqueness — ASCII case + trim ----------

    #[test]
    fn subjects_name_blocks_ascii_case_duplicates() {
        let conn = fresh();
        insert_subject(&conn, "s1", "Toan").unwrap();
        let res = insert_subject(&conn, "s2", "toan");
        assert!(res.is_err(), "phải chặn trùng ASCII khác hoa/thường");
    }

    #[test]
    fn subjects_name_blocks_ascii_trim_duplicates() {
        let conn = fresh();
        insert_subject(&conn, "s1", "Toan").unwrap();
        let res = insert_subject(&conn, "s2", "  Toan  ");
        assert!(res.is_err(), "phải chặn trùng sau trim (ASCII)");
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

    /// Ghi nhận giới hạn: Unicode case (Ạ/ạ) KHÔNG bị DB chặn — SQLite bundled
    /// `lower()` giữ nguyên ký tự có dấu. Service layer (Sprint 01) xử lý.
    /// Dùng 'MẠNG' vs 'mạng' — khác cả M/m và Ạ/ạ, không chỉ M/m.
    #[test]
    fn subjects_name_allows_unicode_case_duplicates_at_db_level() {
        let conn = fresh();
        insert_subject(&conn, "s1", "MẠNG").unwrap();
        let res = insert_subject(&conn, "s2", "mạng");
        assert!(
            res.is_ok(),
            "SQLite bundled lower() không hạ Ạ; 'MẠNG' vs 'mạng' phải cùng insert được. \
             Nếu DB chặn, có thể version SQLite bundled đã hỗ trợ Unicode case — \
             cập nhật ADR-001 §3 và xem lại service layer."
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
MIG_EOF

# --- Cập nhật ADR-001 cho rõ: ASCII case vs Unicode case ---
cat > docs/decisions/ADR-001-subject-name-uniqueness.md << 'ADR_EOF'
# ADR-001 — Uniqueness tên môn và tên bộ đề

- **Ngày:** 2026-10-24
- **Sprint phát hiện:** 00 (test fail khi dùng cặp Unicode)
- **Liên quan:** Q-15 (domain-core), `db.dbml`, Sprint 01 Q2
- **Trạng thái:** Accepted

## Bối cảnh

Schema Sprint 00 đã chốt partial unique index trên `lower(trim(name))`.

Hành vi `lower()` của SQLite **bundled** (mặc định, không ICU):
- Hạ được **ASCII**: `M` → `m`, `T` → `t`, …
- **Giữ nguyên** ký tự Unicode có dấu: `Ạ` → `Ạ`, `Đ` → `Đ`.
- **Trim** áp dụng được mọi ký tự (Unicode whitespace).

Hệ quả:
- `'Mạng'` vs `'mạng'` — chỉ khác `M/m` (ASCII), phần `ạng` giống hệt ⇒ `lower()` cho cùng chuỗi ⇒ **DB chặn**.
- `'MẠNG'` vs `'mạng'` — khác cả `M/m` và `Ạ/ạ` ⇒ `lower('MẠNG') = 'mẠng'` ≠ `'mạng'` ⇒ **DB không chặn**.

## Quyết định

### 1. Chuỗi tên **hiển thị** giữ nguyên như người dùng nhập (sau trim)
- DB lưu đúng `name` / `title` người dùng nhập — không tự đổi hoa/thường, không đổi NFC/NFD.
- UI hiển thị nguyên văn.

### 2. Khoá so sánh (canonical key) — **thuộc service layer, Sprint 01**
- `canonical(name) = name.trim().nfc().to_lowercase()`
  - `trim` — Unicode whitespace trim (Rust `str::trim`).
  - `nfc` — chuẩn hoá Unicode NFC (không NFKC).
  - `to_lowercase` — Unicode default case folding (Rust đã xử lý `Đ→đ`, `Ạ→ạ`, …).
- Service so sánh **canonical**, không so sánh raw name.
- Không lưu canonical vào DB ở Sprint 00–01. Nếu cần tối ưu sau, thêm cột `name_canonical TEXT` + unique index riêng — migration mới.

### 3. Phạm vi bảo vệ của partial unique index — **defense-in-depth**

| Cặp tên | DB `lower(trim())` | Service `canonical()` |
|---|---|---|
| `Toan` vs `toan` | **Chặn** (ASCII case) | Chặn |
| `Toan` vs `  Toan  ` | **Chặn** (trim) | Chặn |
| `Mạng` vs `mạng` | **Chặn** (M/m ASCII) | Chặn |
| `MẠNG` vs `mạng` | **Cho qua** (Ạ giữ nguyên) | Chặn |
| `Đề 1` vs `đề 1` | **Cho qua** (Đ giữ nguyên) | Chặn |

- Index `lower(trim(name))` xử lý được **ASCII case + trim** trên mọi ngôn ngữ, và release sau soft delete.
- Index **KHÔNG** xử lý Unicode case (dấu tiếng Việt, ký tự Latin có dấu).

### 4. Giới hạn đã chấp nhận — race cho Unicode
- Hai request đồng thời với tên **cùng canonical** nhưng khác Unicode case có thể cùng vượt service check (nếu check ở ngoài transaction insert).
- **Chấp nhận vì:** app single-user (R5), UI mở 1 tab. Nếu cần atomic sau:
  - `BEGIN IMMEDIATE` khi check + insert; hoặc
  - thêm cột `name_canonical` unique.

## Hệ quả test

| Lớp | File | Phạm vi |
|---|---|---|
| DB | `db/migrations.rs` | ASCII case, trim, soft-delete release, concurrent insert, **ghi nhận** Unicode case không bị chặn |
| Service | `services/subject_service.rs::tests` (Sprint 01) | Unicode canonical (`MẠNG` vs `mạng` vs `Mạng`), `Đề 1` vs `đề  1`, message `DuplicateName` |

Test DB không assert xử lý dấu tiếng Việt như "bảo vệ".

## Không làm ở Sprint 00
- Không implement normalization.
- Không thêm cột canonical.
- Không sửa index.
- Không sửa `001_init.sql` (đã áp dụng).
ADR_EOF

# --- Format Rust ---
(cd src-tauri && cargo fmt)

echo "✅ Đã sửa test + ADR-001"
