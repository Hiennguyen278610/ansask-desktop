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
