# ADR-001 — Uniqueness tên môn và tên bộ đề

- **Ngày:** 2026-10-24
- **Sprint phát hiện:** 00 (test fail khi dùng cặp Unicode)
- **Liên quan:** Q-15 (domain-core), `db.dbml`, Sprint 01 Q2
- **Trạng thái:** Accepted

## Bối cảnh

Schema Sprint 00 đã chốt partial unique index trên `lower(trim(name))`.

Hành vi `lower()` và `trim()` của SQLite **bundled** (mặc định, không ICU):
- `lower()`: Hạ được **ASCII** (`M` → `m`, `T` → `t`). Giữ nguyên ký tự Unicode có dấu (`Ạ` → `Ạ`, `Đ` → `Đ`).
- `trim(X)` mặc định: **Chỉ bỏ khoảng trắng ASCII (`U+0020`)** ở hai đầu. Không trim tab (`\t`), NBSP (`U+00A0`) hay các khoảng trắng Unicode khác.

Hệ quả:
- `'Mạng'` vs `'mạng'`: khác `M/m` (ASCII) ⇒ `lower()` cho cùng chuỗi ⇒ **DB chặn**.
- `'MẠNG'` vs `'mạng'`: khác cả `M/m` và `Ạ/ạ` ⇒ `lower('MẠNG') = 'mẠng'` ≠ `'mạng'` ⇒ **DB không chặn**.
- `'Toan'` vs `'Toan\t'`: tab không bị trim ⇒ **DB không chặn**.

## Quyết định

### 1. Chuỗi tên **hiển thị** giữ nguyên như người dùng nhập (sau trim)
- DB lưu đúng `name` / `title` người dùng nhập — không tự đổi hoa/thường, không đổi NFC/NFD.
- UI hiển thị nguyên văn.

### 2. Khoá so sánh (canonical key) — **thuộc service layer, Sprint 01**
- `canonical(name) = name.trim().nfc().to_lowercase()`
  - `trim` — Unicode whitespace trim (Rust `str::trim`, xử lý cả tab, NBSP, ...).
  - `nfc` — chuẩn hoá Unicode NFC (không NFKC; không gộp compatibility).
  - `to_lowercase` — Unicode lowercase của Rust (xử lý `Đ→đ`, `Ạ→ạ`, …; **không** phải full Unicode case folding cho mọi ký tự).
- Service so sánh **canonical**, không so sánh raw name.
- Lưu ý: công thức này **không gộp** khoảng trắng bên trong tên. `Đề 1` (1 space) và `Đề  1` (2 spaces) có canonical khác nhau. Nếu muốn gộp, cần chốt thêm quy tắc replace multiple spaces với single space và cập nhật công thức.
- Không lưu canonical vào DB ở Sprint 00–01. Nếu cần tối ưu sau, thêm cột `name_canonical TEXT` + unique index riêng — migration mới.

### 3. Phạm vi bảo vệ của partial unique index — **defense-in-depth**

| Cặp tên | DB `lower(trim())` | Service `canonical()` |
|---|---|---|
| `Toan` vs `toan` | **Chặn** (ASCII case) | Chặn |
| `Toan` vs `  Toan  ` | **Chặn** (ASCII space trim) | Chặn |
| `Toan` vs `Toan\t` | **Cho qua** (chỉ trim space) | Chặn |
| `Mạng` vs `mạng` | **Chặn** (M/m ASCII) | Chặn |
| `MẠNG` vs `mạng` | **Cho qua** (Ạ giữ nguyên) | Chặn |
| `Đề 1` vs `đề 1` | **Cho qua** (Đ giữ nguyên) | Chặn |

- Index `lower(trim(name))` xử lý được **ASCII case + ASCII space trim** trên mọi ngôn ngữ, và release sau soft delete.
- Index **KHÔNG** xử lý Unicode case (dấu tiếng Việt) hay Unicode whitespace (tab, NBSP).

### 4. Giới hạn đã chấp nhận — race cho Unicode
- Hai request đồng thời với tên **cùng canonical** nhưng khác Unicode case có thể cùng vượt service check (nếu check ở ngoài transaction insert).
- **Chấp nhận vì:** app single-user (R5), UI mở 1 tab. Tuy nhiên, single-user/1 tab không loại trừ hai lệnh gọi đồng thời từ backend.
- Nếu cần atomic sau:
  - `BEGIN IMMEDIATE` bao trọn cả bước kiểm tra lẫn insert; hoặc
  - thêm cột `name_canonical` unique.

## Hệ quả test

| Lớp | File | Phạm vi |
|---|---|---|
| DB | `db/migrations.rs` | ASCII case, ASCII space trim, soft-delete release, concurrent insert, ghi nhận Unicode case và ASCII tab không bị chặn |
| Service | `services/subject_service.rs::tests` (Sprint 01) | Unicode canonical (`MẠNG` vs `mạng` vs `Mạng`), `Đề 1` vs `đề 1`, tab/NBSP, message `DuplicateName` |

Test DB không assert xử lý dấu tiếng Việt như "bảo vệ".

## Không làm ở Sprint 00
- Không implement normalization.
- Không thêm cột canonical.
- Không sửa index.
- Không sửa `001_init.sql` (đã áp dụng).
