# structure-be.md — Kiến trúc & thiết kế kỹ thuật (ansask-desktop)

> Tài liệu này thay thế `docs/tech-stack.md` (đã xóa). Nguồn sự thật đi kèm: `docs/domain-core.md`
> (quy tắc nghiệp vụ, Q-xx đã chốt), `docs/db.dbml` (schema), `docs/design-system.md` (tên component).
> Nhãn: `[YÊU CẦU MỚI]` = yêu cầu mới chưa có trong ref-ui; `[GIẢ ĐỊNH]` = giả định cần người xác nhận (tổng hợp ở §11).

---

## 1. Tổng quan & nguyên tắc

**ansask-desktop** là app Tauri 2 cá nhân (R5): học & thi trắc nghiệm offline-first, dữ liệu nằm trong
SQLite cục bộ của OS, không auth, không cloud. `src-tauri/` chứa toàn bộ nghiệp vụ; `src/` (React) chỉ là
lớp hiển thị, gọi qua command Tauri.

### 1.1 Nguyên tắc & cách áp dụng CỤ THỂ vào dự án này

| Nguyên tắc | Áp dụng cụ thể (không nói chung chung) |
|---|---|
| **S — Single Responsibility** | Mỗi `command` chỉ điều phối (parse DTO → gọi service → map DTO trả về), không chứa SQL hay thuật toán. Parser TXT tách 3 bước `tokenizer → parser → validator` (R4); `ThemeToggle` chỉ lo theme, không dính nav (Q-13). |
| **O — Open/Closed** | Chấm điểm 1 đáp án vs nhiều đáp án (Q-10) là 2 strategy trong `grading_service` — thêm chế độ chấm mới (ví dụ partial credit) không sửa `attempt_submit`. Random/ thứ tự quiz (R1) cũng là strategy riêng. |
| **L — Liskov** | `repositories/*` là **trait**; mọi test service chạy trên `Mock*Repo` in-memory, không mở SQLite. Thay `SqliteSubjectRepo` bằng mock không làm `SubjectService` đổi hành vi. |
| **I — Interface Segregation** | Không có `AppRepo` to đùng: `SubjectRepo`, `ExamRepo`, `AttemptRepo`, `SettingRepo`… mỗi trait ~3–6 hàm; command chỉ inject đúng repo/service nó cần qua `tauri::State`. |
| **D — Dependency Inversion** | `services` phụ thuộc **trait** repository + trait `Clock` `[GIẢ ĐỊNH]` (để test stats/ranh giới kỳ không phụ thuộc thời gian thật), không phụ thuộc `rusqlite::Connection` trực tiếp. |
| **DRY** | (1) Mọi invoke đi qua 1 wrapper `lib/tauri/invoke.ts` (map `AppError` → toast tiếng Việt 1 chỗ). (2) Bộ lọc soft delete `WHERE deleted_at IS NULL` viết 1 lần trong repository, các hàm dùng chung. (3) Chuyển UTC→`Asia/Ho_Chi_Minh` chỉ có trong `utils/time.rs` + `lib/time.ts`. (4) Mã lỗi chỉ định nghĩa tập trung trong `error.rs`. |

### 1.2 Quy ước kích thước — BẮT BUỘC KIỂM TRA khi review

- **File Rust/TS: ≤ ~200 dòng.** Vượt → tách module con (ví dụ `commands/exam_cmds.rs` quá dài → tách
  `commands/exam_import_cmds.rs`).
- **Hàm: ≤ ~40 dòng.** Vượt → tách hàm phụ hoặc đẩy xuống repository/parser.
- `lib.rs` chỉ là composer (builder + đăng ký) — nếu dài quá thì phần đăng ký tách `commands/mod.rs`.
- Mục 3 và mục 8 liệt kê cây thư mục đã tính sẵn trần dòng; mọi file mới sinh ra phải nằm trong cây đó.

---

## 2. Stack chốt

Phiên bản "hiện hành" đọc từ repo (sprint 0 chưa thêm gì mới):

| Lớp | Chọn | Phiên bản hiện hành trong repo | Ghi chú |
|---|---|---|---|
| Desktop shell | **Tauri 2** | `tauri = "2"`, `@tauri-apps/api ^2`, `@tauri-apps/cli ^2` | Đã chốt từ template; schema config `tauri.conf.json` v2. |
| UI | **React 19 + TypeScript ~6.0 + Vite ^8** | `react ^19.1.0`, `typescript ~6.0.3`, `vite ^8.0.16` | Đúng như hiện có; `@vitejs/plugin-react ^6`. |
| CSS | **Tailwind CSS** | *chưa có trong package.json* | Thêm ở sprint 0 (§9): `tailwindcss` + `@tailwindcss/vite` (Tailwind v4 — `[GIẢ ĐỊNH]` major version). |
| Icon | **lucide-react** | *chưa có* | Theo design-system; thêm sprint 0. |
| DB | **SQLite qua Rust**: **`rusqlite` + `rusqlite_migration` + pool `r2d2_sqlite`** | *chưa có* | Xem lựa chọn bên dưới. |
| Serialization | **serde / serde_json** | `serde 1` (derive), `serde_json 1` | DTO command đều derive `Serialize/Deserialize`. |
| Lỗi | **thiserror** | *chưa có* | Định nghĩa `AppError` (mã lỗi → FE). |
| ID | **uuid v7** (`uuid = "1", features = ["v7"]`) | *chưa có* | Sortable theo thời gian, tránh index fragmentation; lưu dạng TEXT. |
| Thời gian | **chrono + chrono-tz** | *chưa có* | Lưu UTC, hiển thị/ranh giới kỳ theo `Asia/Ho_Chi_Minh` (Q-06). |
| Random | **rand** (`rand::seq::SliceRandom`) | *chưa có* | Random N câu + xáo thứ tự (R1) — logic ở BE. |
| Logging | **tracing** (+ `tracing-subscriber`) | *chưa có* | Ghi log vào stdout/dev console; không log dữ liệu nhạy cảm (app cá nhân, ít rủi ro). |

### 2.1 Vì sao chọn `rusqlite` (+ `rusqlite_migration` + `r2d2_sqlite`) chứ không `sqlx`

| Tiêu chí | `rusqlite` (CHỌN) | `sqlx` |
|---|---|---|
| Loại kết nối | Sync, blocking — vừa với SQLite file local; Tauri command chạy threadpool riêng, blocking SQLite vài ms là chấp nhận được. | Async-first; với SQLite bản chất vẫn serialize trên 1 file — async không mang lại lợi thế thật. |
| Migration | `rusqlite_migration`: khai báo `Migrations` versioned, chạy 1 lần lúc khởi động (§5), test được bằng SQLite in-memory. | `sqlx::migrate!` cũng được, nhưng thêm toolchain compile-time. |
| Pool | `r2d2_sqlite`: pool nhỏ (4 kết nối) đủ cho app 1 người + WAL. | `sqlx::SqlitePool` kèm theo, không cần thêm crate. |
| Compile time | `bundled` feature: tự build SQLite C source — không phụ thuộc hệ thống, build Tauri sạch hơn. | Cần `DATABASE_URL`/offline data nếu dùng compile-time check; thừa với dự án nhỏ. |
| Phức tạp | Thấp: 1 pool + trait repo là xong. | Cao hơn: runtime async len vào mọi nơi, khó test mock hơn. |

Kết luận: app cá nhân, 1 người, thao tác CRUD + 1 transaction nộp bài — SQLite sync là đủ; `rusqlite`
giữ tầng dữ liệu đơn giản, dễ test in-memory, ít dependency surprise.

### 2.2 FE state & data fetching

| Thư viện | Quyết định | Lý do |
|---|---|---|
| **TanStack Query** (`@tanstack/react-query`) | **Dùng** | Data fetching qua `invoke` là side-effect đồng bộ-ish; Query cho cache, invalidation sau mutation (`subject_create` → invalidate `['subjects']`), loading/error state chuẩn hóa — tránh mỗi feature tự `useState + useEffect`. |
| **Zustand** | **Chỉ dùng nếu cần** `[GIẢ ĐỊNH]` | State app-wide thật sự cần chỉ có **theme mode** (đọc sớm trước render — §8) và có thể **cấu hình quiz tạm** (số câu, random on/off) sống qua vài màn. Nếu chỉ 2 thứ đó thì Zustand 1 store mỏng là hợp lý; còn state thuộc server thì để Query, **không** nhân đôi vào store. |
| React Router | **Dùng** (`react-router`) `[GIẢ ĐỊNH]` | ref-ui dùng state `screen` tay; router thật sự cần cho deep-link lịch sử/xem lại (UC-17/21) — nhưng cũng có thể giữ nav bằng state nếu muốn tối giản; cần người quyết (§11). |

---

## 3. Cây thư mục Rust `src-tauri/src/`

Phân tầng: **`commands` (mỏng, chỉ DTO) → `services` (nghiệp vụ) → `repositories` (trait + impl SQLite) → `db`**.
Kèm `domain`, `dto`, `error`, `state`, `utils`. Mọi file ≤ ~200 dòng (§1.2).

```
src-tauri/src/
├── main.rs                      # entrypoint: chấm và gọi ansask_desktop_lib::run()
├── lib.rs                       # builder Tauri: pool + services + State, đăng ký invoke_handler
├── state.rs                     # AppState { pool, services }; impl Default để inject vào Tauri
├── error.rs                     # AppError (thiserror): NotFound/DuplicateName/Validation/Db + From impl → Serialize cho FE
├── db/
│   ├── mod.rs                   # re-export pool + migrations
│   ├── pool.rs                  # mở SQLite ở app-data dir, PRAGMA (WAL/FK/busy_timeout), tạo r2d2 pool
│   └── migrations.rs            # rusqlite_migration::Migrations: 001_init.sql (schema §5), chạy khi khởi động
├── domain/                      # entity thuần, không biết serde/SQL (kèm serde derive để DTO dùng chung — [GIẢ ĐỊNH] xem §4)
│   ├── mod.rs                   # re-export entity
│   ├── subject.rs               # Subject { id, name, deleted_at, created_at, ... }
│   ├── exam.rs                  # Exam { id, subject_id, title, created_at, updated_at, deleted_at, ... }
│   ├── question.rs              # Question { id, exam_id, content, position, ... }
│   ├── answer_option.rs         # AnswerOption { id, question_id, text, is_correct, position }
│   ├── attempt.rs               # Attempt { id, exam_id, score, started_at, submitted_at, ... }
│   ├── attempt_answer.rs        # AttemptAnswer { id, attempt_id, question_id, selected_option_ids, option_order: Vec<String>, question_text, options_snapshot, correct_option_ids (Q-04), position, is_correct }
│   └── app_setting.rs           # AppSetting { key, value, updated_at } (R2: theme)
├── dto/                         # request/response DTO command: struct nhỏ, derive Serialize/Deserialize
│   ├── mod.rs                   # re-export + map domain→dto (From impl)
│   ├── subject_dto.rs           # SubjectSummary, SubjectDetail, SubjectCreateReq/UpdateReq
│   ├── exam_dto.rs              # ExamSummary, ExamDetail, ExamSaveReq, QuestionUpsertReq, OptionUpsertReq
│   ├── import_dto.rs            # ImportParseReq { format, raw }, ParsedExamDto, ParseIssueDto { line, message }
│   ├── quiz_dto.rs              # QuizConfigReq { exam_id, count, randomize }, QuizQuestionDto, QuizStartRes
│   ├── attempt_dto.rs           # AttemptSubmitReq, AttemptSummaryDto, AttemptReviewDto, GradedQuestionDto
│   ├── stats_dto.rs             # StatsPeriodReq { period, anchor? }, StatsOverviewDto, SeriesPointDto
│   ├── settings_dto.rs          # GetSettingReq/SettingValueDto (theme)
│   └── trash_dto.rs             # TrashItemDto, TrashListReq { kind? }, RestoreReq { id, new_name? }, PurgeReq { kind, id }
├── repositories/                # trait + impl SQLite; mọi query soft-delete/ORDER BY nằm đây
│   ├── mod.rs                   # re-export trait + Sqlite*Repo
│   ├── subject_repo.rs          # trait SubjectRepo + SqliteSubjectRepo (list/create/update/soft_delete/count_by_name)
│   ├── exam_repo.rs             # trait ExamRepo + impl (list_by_subject/get/insert/update/soft_delete/updated_at)
│   ├── question_repo.rs         # trait QuestionRepo + impl (list_by_exam/insert_many/delete/shift position)
│   ├── option_repo.rs           # trait OptionRepo + impl (list_by_question/insert_many/update is_correct)
│   ├── attempt_repo.rs          # trait AttemptRepo + impl (insert/list_by_exam/get/soft_delete cascade)
│   ├── attempt_answer_repo.rs   # trait AttemptAnswerRepo + impl (insert_many trong tx, list_by_attempt)
│   ├── setting_repo.rs          # trait SettingRepo + impl (get/upsert theme trong app_settings)
│   └── trash_repo.rs            # trait TrashRepo + impl: list_deleted_subjects/exams, restore_subject/exam, purge_subject/exam, empty_trash (Unit of Work)
├── services/                    # nghiệp vụ thuần; không biết tauri::State, chỉ biết repo trait
│   ├── mod.rs                   # struct ServiceDeps + constructors
│   ├── subject_service.rs       # CRUD môn, validate tên unique toàn cục (Q-15), soft delete cascade (Q-01)
│   ├── exam_service.rs          # CRUD bộ đề trong môn, validate tên theo môn (Q-15), touch updated_at (Q-02)
│   ├── question_service.rs      # inline edit/chèn/xóa câu, thêm/xóa option, đổi đáp án đúng (UC-07..11)
│   ├── import_service.rs        # nhận text → tokenizer/parser/validator → dựng Exam (Factory, UC-12..14, R4)
│   ├── quiz_service.rs          # random N câu + xáo thứ tự câu/đáp án (R1, Strategy), dựng QuizStartRes
│   ├── grading_service.rs       # Strategy: chấm 1 đáp án vs nhiều đáp án (trùng khớp hoàn toàn, Q-10/AS-12)
│   ├── attempt_service.rs       # start/submit attempt: 1 transaction chấm + lưu attempt_answers và snapshot (Q-03/Q-04), đếm câu trống (Q-11)
│   ├── stats_service.rs         # lọc attempts theo kỳ (Q-05), biên kỳ Asia/Ho_Chi_Minh trên UTC (Q-06)
│   ├── setting_service.rs       # đọc/ghi theme trong app_settings, chuẩn hóa light/dark/system (R2)
│   └── trash_service.rs         # orchestration thùng rác: list, restore (conflict name check, batch restore), purge item/all (Unit of Work)
├── parsers/                     # import TXT/JSON — không dính DB (R4)
│   ├── mod.rs                   # re-export + lỗi ParseError theo dòng
│   ├── tokenizer.rs             # tách dòng TXT → token { kind: Ask|Ans|Text, line }
│   ├── txt_parser.rs            # token stream → Vec<RawQuestion> (content + options + correct flags)
│   ├── json_parser.rs           # parse JSON dán vào (UC-12) với validate tương đương
│   └── validator.rs             # rule: câu ≥2 đáp án, ≥1 đáp án đúng (R4); trả lỗi kèm số dòng
├── commands/                    # mỏng: deserialize DTO → gọi service → serialize DTO; mỗi UC 1 hàm
│   ├── mod.rs                   # danh sách + generate_handler!() — file đăng ký duy nhất
│   ├── subject_cmds.rs          # subject_list, subject_create, subject_update, subject_delete
│   ├── exam_cmds.rs             # exam_list, exam_get, exam_save (create/update), exam_delete
│   ├── question_cmds.rs         # question_update, question_insert, question_delete, option_add/remove, option_toggle_correct
│   ├── import_cmds.rs           # import_parse (TXT/JSON → ParsedExamDto + issues)
│   ├── quiz_cmds.rs             # quiz_start (R1)
│   ├── attempt_cmds.rs          # attempt_submit (Q-11 precheck), attempt_list, attempt_review
│   ├── stats_cmds.rs            # stats_overview (Q-05, sprint cuối)
│   ├── settings_cmds.rs         # setting_get, setting_set (R2)
│   └── trash_cmds.rs            # trash_list, subject_restore, exam_restore, trash_purge_item, trash_empty (UC-33..37)
└── utils/
    ├── mod.rs                   # re-export
    ├── time.rs                  # now_utc(), to_hcm(), boundaries_of(PeriodKind) — Q-06/BR ranh giới tuần/tháng/năm
    └── ids.rs                   # new_id_v7() -> String (uuid v7)
```

Quy ước:

- `commands/*_cmds.rs`: mỗi hàm ≤ ~15 dòng; quá nhiều UC cùng lĩnh vực → tách file con (giữ tên `*_cmds.rs`).
- `repositories/*`: constructor nhận `&Pool`; method dùng `conn()` từ pool; transaction được truyền xuống qua
  parameter `&mut Connection` (xem §7.2 Unit of Work).
- Test unit: mỗi `services/*` và `parsers/*` có `#[cfg(test)] mod tests` inline (file test nằm cùng, vẫn ≤200 dòng);
  test DB dùng SQLite `:memory:` qua repo thật (§9).

---

## 4. Design pattern

Chỉ dùng pattern khi có **vấn đề nghiệp vụ thật**; cột “Vì sao / nếu bỏ” nêu lý do.

| Pattern | Vấn đề nghiệp vụ thật | File/module |
|---|---|---|
| **Repository** | SQLite bị rải rác trong services → không test được, sửa query dễ vỡ CRUD khác. Cần mock để test service không cần DB thật. | `repositories/*_repo.rs` (trait + `Sqlite*Repo`); consume bởi `services/*`. |
| **Service Layer** | Command đang phải kiêm nhiệm vụ vụn (validate tên Q-15, cascade soft delete Q-01, chấm điểm Q-10) → tách lớp nghiệp vụ dùng chung cho nhiều command. | `services/*`; command chỉ điều phối. |
| **DTO / Mapper** | Domain entity không khớp JSON trả FE (thiếu tên môn trong exam summary, snake_case vs camelCase, ẩn `is_correct` khi đang làm bài để không lộ đáp án). | `dto/*` + `From` impl trong `dto/mod.rs`. |
| **Unit of Work (transaction)** | (1) Nộp bài: chấm điểm → insert `attempts` + N dòng `attempt_answers`. (2) Soft delete môn: cascade ẩn môn + exams + attempts. (3) Thùng rác Q-21: khôi phục (restore) và xóa cứng (purge) — restore subject/exam + descendants trong 1 tx; purge item/all xóa vĩnh viễn subject/exam + exams/questions/options/attempts/attempt_answers trong 1 tx; conflict tên được kiểm tra trong cùng tx. | `attempt_service::submit`, `subject_service::soft_delete`, `trash_service::{restore_subject, restore_exam, purge_item, empty_trash}` nhận `&mut Connection`; pattern chỉ áp chỗ cần atomicity — không bọc mọi hàm. |
| **Strategy — random/thứ tự (câu + đáp án)** | Q-19: xáo thứ tự **câu** và **đáp án** chung 1 công tắc `randomize`; tắt random tắt cả hai (giữ nguyên thứ tự câu và thứ tự đáp án gốc); option shuffle cùng module `quiz_service` (DRY — không module riêng); nhãn A/B/C/D theo vị trí sau xáo; lưu `option_order` (JSON TEXT) vào `attempt_answers` để review đúng. | `quiz_service` + `QuizOrderingStrategy` enum (`Shuffle` / `Preserved`) trong `services/quiz_service.rs`; `option_order` persist qua `attempt_answer_repo`. |
| **Strategy — chấm điểm** | Q-10: câu 1 đáp án đúng vs nhiều đáp án đúng có thuật toán khác (điều kiện đúng “trùng khớp hoàn toàn” chỉ áp nhóm nhiều đáp án). | `grading_service`: enum `GradingStrategy { SingleChoice, MultiChoiceExactSet }` chọn theo tập đáp án đúng của câu. |
| **Strategy — kỳ thống kê** | Q-05/UC-32: tuần (Thứ 2→CN), tháng (tuần 1..4/5), năm (T5..T10) — ranh giới tính theo `Asia/Ho_Chi_Minh` trên timestamp UTC. | `stats_service` + `utils/time.rs::boundaries_of(PeriodKind)`; enum `PeriodKind { Week, Month, Year }`. |
| **Factory/Builder — tạo Exam từ import** | UC-12/13 + UC-06: từ JSON dán hoặc TXT parse → dựng cây `Exam → Questions → AnswerOptions` đúng vị trí, validate rồi mới lưu (không lưu nửa chừng lỗi). | `import_service::build_exam_from_parsed` (nhận `Vec<RawQuestion>` đã validate → `ExamSaveReq`). |
| **Parser (tokenizer → parser → validator)** | R4: TXT free-text (“ask … ans. …”) cần báo lỗi **theo dòng**; trộn tokenize + validate chung 1 hàm sẽ không chỉ được dòng lỗi nào. | `parsers/tokenizer.rs`, `txt_parser.rs`, `validator.rs` (pipeline 3 bước, `ParseIssue { line, message }`). |
| **DI qua `tauri::State`** | Nhiều command cần cùng pool/services; không muốn `static`/global mutable. | `state.rs::AppState` build 1 lần trong `lib.rs::setup`, inject vào mọi command qua tham số `State<'_, AppState>`. |
| **Specification / Query object — lọc thống kê** | UC-32 (sprint cuối): bộ lọc kỳ (period kind + anchor date) + phạm vi (exam?, subject?) sinh `WHERE` động → truyền tham số rời rạc sẽ hỗn độn. | `stats_service::StatsQuery { period: PeriodKind, from: DateTime<Utc>, to: DateTime<Utc>, exam_id?, subject_id? }` — object gom tham số, repo build SQL từ nó. |
| **Centralized `AppError`** | FE cần hiển thị lỗi tiếng Việt đúng (trùng tên Q-15, câu hỏi <2 đáp án R4…) thay vì chuỗi RuntimeError lẫn lộn. | `error.rs`: enum `AppError { NotFound(String), DuplicateName(String), Validation(Vec<ParseIssue>), Db(String), … }` → `Serialize` thành `{ code, message }`; FE map `code` → copy UI. |

Pattern **cố ý KHÔNG dùng**: Observer/Event bus (không có sự kiện app-wide nào cần phát — tăng chiều sâu không tương xứng lợi ích),
Active Record (trộn SQL vào entity sẽ giết Repository), Redux-like store to (server state để TanStack Query,
chỉ Zustand mỏng cho theme — §2.2).

---

## 5. Tầng dữ liệu

### 5.1 Vị trí & kết nối

- DB file: `<app-data-dir>/ansask.db` — lấy bằng `app.path().app_data_dir()` của Tauri (R5: cục bộ, không cloud).
- Kết nối: mở 1 file, PRAGMA chạy ngay sau khi mở, chia sẻ qua **pool `r2d2_sqlite` (max ~4 connection)** `[GIẢ ĐỊNH]`.
- Test: dùng `Connection::open(":memory:")` + chạy migrations — không đụng file thật.

### 5.2 PRAGMA (mọi kết nối trong pool)

| PRAGMA | Giá trị | Lý do |
|---|---|---|
| `foreign_keys` | `ON` | FK exam→subject, question→exam… phải được SQLite tôn trọng (mặc định OFF). |
| `journal_mode` | `WAL` | Đọc/ghi đồng thời (FE render trong khi BE ghi) không block nhau. |
| `busy_timeout` | `5000` ms | Tránh `SQLITE_BUSY` tức thì khi 2 connection chạm nhau. |
| `synchronous` | `NORMAL` | Cân bằng an toàn WAL vs tốc độ; app cá nhân chấp nhận được. |

### 5.3 Migration

- File `.sql` đánh số trong `src-tauri/src/db/migrations/`: `001_init.sql` (6 bảng theo `docs/db.dbml` + `app_settings` + `deleted_at` subjects/exams + `updated_at` exams — Q-01/Q-02/Q-03),
  các bản sau: `002_….sql`, `003_….sql`…
- Quản lý bằng `rusqlite_migration::Migrations` — chạy **1 lần khi khởi động** (trong Tauri `setup`), in ra log phiên bản đã áp.
- Quy tắc: migration chỉ thêm, không sửa file cũ đã phát hành; đổi schema = thêm file mới.

### 5.4 Ngữ nghĩa thời gian (Q-06)

| Hành động | Quy tắc |
|---|---|
| Ghi vào DB (`created_at`, `updated_at`, `started_at`, `submitted_at`) | **UTC** (`chrono::DateTime<Utc>`, ISO-8601 TEXT hoặc INTEGER epoch ms — `[GIẢ ĐỊNH]` dạng lưu: TEXT dễ đọc, INTEGER gọn nhẹ; chọn TEXT). |
| Hiển thị (mọi màn hình) | Convert sang `Asia/Ho_Chi_Minh` (chrono-tz) ở UI hoặc `utils/time.rs` — không dùng local time của OS. |
| Ranh giới kỳ thống kê (Tuần/Tháng/Năm) | Tính theo `Asia/Ho_Chi_Minh` rồi convert về UTC để `WHERE submitted_at >= ? AND < ?` (Q-05/UC-32). |

### 5.5 Soft delete (Q-01)

- Cột `deleted_at` (nullable, TEXT UTC) trên `subjects` + `exams`.
- **Repository mặc định** lọc `deleted_at IS NULL` của bản ghi và các cha qua JOIN: exam cần subject còn sống; attempt cần cả exam và subject còn sống. Áp dụng chung cho list/get/review/thống kê (DRY).
- Xóa môn → **cascade ẩn qua cha**: set `subjects.deleted_at` + `delete_batch_id` trong 1 transaction; `deleted_at` của exams/attempts con có thể vẫn NULL, chúng bị ẩn qua JOIN parent `deleted_at`. Không ghi đè batch của bộ đề đã xóa riêng.
- Unique index Q-15 là **partial**: `WHERE deleted_at IS NULL` → bản ghi ẩn không chiếm tên.
- Thùng rác/khôi phục Q-21: cột `deleted_at` + `delete_batch_id` (TEXT, nullable) trên `subjects`/`exams`; unique index partial `WHERE deleted_at IS NULL`; purge vĩnh viễn xóa cả descendants. `delete_batch_id` có từ **Sprint 01**, trước sprint thùng rác; `option_order` thuộc schema attempt, không chờ thùng rác. Khôi phục chỉ phục hồi descendants thuộc cùng batch; con ẩn gián tiếp tự hiện khi cha sống lại, con đã xóa riêng vẫn ẩn.

### 5.6 Backup / export `[GIẢ ĐỊNH]`

- App cá nhân: chưa làm auto-backup. Hướng để ngỏ: nút “Export JSON” (toàn bộ subjects/exams/attempts) hoặc
  copy file `ansask.db` khi app đóng. Nếu làm thì nằm ngoài lõi sprint.

---

## 6. Hợp đồng command Tauri

Danh sách UC lấy từ `docs/domain-core.md` — grep được đầy đủ **UC-01..UC-38** (UC-33..UC-37 thùng rác Q-21, UC-38 toast Hoàn tác UI-only). Bảng §6.2 phủ đủ: **UC-29/UC-30/UC-38 là UI thuần** (không cần invoke — xem chú thích dưới bảng); các UC còn lại map sang command.

### 6.1 Quy ước đặt tên

- `subject_list`, `exam_create`, `attempt_submit` — `{entity}_{action}`; action ∈ `list, get, create, save, update, delete, start, submit, review, parse, overview, set`.
- `save` = upsert (create hoặc update — UC-06/15); `delete` = **soft delete** (Q-01).
- Mọi input/output là DTO derive `Serialize` (§3 `dto/`); lỗi trả `AppError` `{ code, message }`.

### 6.2 Bảng hợp đồng command

Request `question_update`/`question_insert` dùng `ask` trên wire; `examId` là camelCase, Rust dùng `exam_id` với `#[serde(rename_all = "camelCase")]`. Ví dụ: `question_update({ id: "q1", ask: "Câu hỏi mới?" })`.

| Command | UC | Input DTO | Output DTO | Lỗi chính |
|---|---|---|---|---|
| `subject_list` | UC-04 (view), dashboard | — | `Vec<SubjectSummary>` | `Db` |
| `subject_create` | UC-04 | `SubjectCreateReq { name }` | `SubjectSummary` | `DuplicateName` (Q-15: unique toàn cục, ko phân biệt hoa/thường + trim, bản ẩn không chiếm tên) |
| `subject_update` | — (sửa tên) `[YÊU CẦU MỚI]` | `SubjectUpdateReq { id, name }` | `SubjectSummary` | `NotFound`, `DuplicateName` |
| `subject_delete` | **UC-26** `[YÊU CẦU MỚI]` (Q-01) | `IdReq { id }` | `Ok` | `NotFound`, `Db` (transaction cascade ẩn exams+attempts) |
| `exam_list` | UC-05 | `ExamListReq { subject_id }` | `Vec<ExamSummary>` | `NotFound` (subject) |
| `exam_save` | UC-06, UC-15 | `ExamSaveReq { id?, subject_id, title, questions: Vec<QuestionUpsertReq> }` | `ExamDetail` | `NotFound`, `DuplicateName` (Q-15: unique trong môn), `Validation` (Q-10/R4: ≥2 đáp án, ≥1 đáp án đúng) |
| `exam_get` | UC-16 | `ExamGetReq { id, include_answers: bool }` | `ExamDetail` (ẩn `is_correct` khi `include_answers=false`) | `NotFound` |
| `exam_delete` | **UC-27** `[YÊU CẦU MỚI]` (Q-01) | `IdReq { id }` | `Ok` | `NotFound`, `Db` (transaction cascade ẩn questions + attempts của bộ đề) |
| `question_update` | UC-07 | `QuestionUpdateReq { id, ask }` | `QuestionDto` | `NotFound` |
| `question_insert` | UC-08 | `QuestionInsertReq { examId, position, ask, options }` | `QuestionDto` | `NotFound`, `Validation` |
| `question_delete` | UC-09 | `IdReq { id }` | `Ok` | `NotFound` |
| `option_add` / `option_remove` | UC-10 | `OptionAddReq { question_id, text }` / `IdReq` | `QuestionDto` | `NotFound`, `Validation` (xóa xuống <2 đáp án) |
| `option_set_correct` | UC-11 | `OptionSetCorrectReq { question_id, correct_option_ids: Vec<String> }` | `QuestionDto` | `NotFound`, `Validation` (rỗng tập đúng) |
| `import_parse` | UC-12 (JSON), UC-13 (TXT), R4 | `ImportParseReq { format: "txt"\|"json", raw: string }` | `ParsedExamDto { title?, questions, issues: Vec<ParseIssueDto> }` | `Validation` (kèm `line` — lỗi theo dòng) |
| `quiz_start` | UC-18, UC-22, **UC-31**, R1 | `QuizStartReq { exam_id, count?, randomize: bool }` (`randomize` mặc định **true** — UC-31) | `QuizStartRes { questions: Vec<QuizQuestionDto>, total }` (mỗi câu có `option_order: Vec<String>`, wire `optionOrder: string[]`) (R1/UC-31: random N câu ko trùng + xáo thứ tự; N ≤ 0 → clamp 1; N ≥ pool → lấy hết **vẫn xáo**; randomize=false → giữ nguyên thứ tự; `position` lưu thứ tự phiên cho attempt_answers) | `NotFound`, `Validation` |
| `attempt_submit` | UC-20, Q-03, Q-10, Q-11 | `AttemptSubmitReq { exam_id, started_at, answers: Vec<AttemptAnswerReq { question_id, selected_option_ids, position, option_order: Vec<String> }> }` | `AttemptResultDto { attempt_id, score, per_question: Vec<GradedQuestionDto> }` — 1 transaction: chấm (Q-10 exact-set), insert `attempts` + `attempt_answers` kèm snapshot Q-04/BR-81 (Q-03) | `NotFound`, `Validation`, `Db` (rollback) |
| `attempt_list` | UC-17 | `AttemptListReq { exam_id }` | `Vec<AttemptSummary>` (mới→cũ, BR-27/28) | `NotFound` |
| `attempt_review` | UC-21 | `IdReq { id }` | `AttemptReviewDto` (mỗi câu: `questionText`, `optionsSnapshot: {id,text}[]`, `correctOptionIds: string[]`, `selectedOptionIds: string[]`, `optionOrder: string[]`, `position`, `isCorrect`; đọc snapshot `attempt_answers`, không join nội dung câu hỏi hiện tại — Q-04/BR-81) | `NotFound` |
| `stats_overview` | UC-01, UC-02, UC-03, **UC-32** (sprint cuối — Q-05) `[YÊU CẦU MỚI]` | `StatsOverviewReq { period: "week"\|"month"\|"year", anchor_utc? }` | `StatsOverviewDto { total_exams, total_attempts, avg_score, accuracy, series: Vec<SeriesPointDto>, score_distribution }` — biên kỳ theo `Asia/Ho_Chi_Minh` trên UTC (Q-06) | `Db` |
| `setting_get` | **UC-28** (Q-14, R2, `app_settings`) | `SettingGetReq { key }` | `SettingValueDto { key, value }` | `Db` |
| `setting_set` | **UC-28** (Q-14, R2, `app_settings`) | `SettingSetReq { key, value }` | `SettingValueDto` | `Db` |
| `trash_list` | **UC-33** `[YÊU CẦU MỚI]` (Q-21) | `TrashListReq { kind?: "subject"\|"exam" }` | `Vec<TrashItemDto> { id, kind, name, subject_id: Option<String>, subject_name: Option<String>, deleted_at, delete_batch_id, question_count?, attempt_count?, deleted_by_parent }` | `Db` |
| `subject_restore` | **UC-34** `[YÊU CẦU MỚI]` (Q-21) | `RestoreReq { id, new_name? }` | `SubjectSummary` | `NotFound`, `DuplicateName`, `Validation` |
| `exam_restore` | **UC-35** `[YÊU CẦU MỚI]` (Q-21) | `RestoreReq { id, new_name? }` | `ExamDetail` | `NotFound`, `DuplicateName`, `Blocked` (môn cha đã bị xóa — BR-77), `Validation` |
| `trash_purge_item` | **UC-36** `[YÊU CẦU MỚI]` (Q-21) | `PurgeReq { kind: "subject"\|"exam", id }` | `Ok` | `NotFound`, `Db` (transaction xóa cứng) |
| `trash_empty` | **UC-37** `[YÊU CẦU MỚI]` (Q-21) | `{}` | `Ok` | `Db` (transaction xóa cứng toàn bộ) |

**UI-only, không cần invoke** (dữ liệu đã có từ command khác hoặc thuần state FE): **UC-14** (chuyển tab JSON ↔ TXT — chỉ đổi tab trong editor); **UC-19** (làm bài: chọn đáp án/timer/nhảy câu — phiên do `quiz_start` sinh, câu trả lời giữ ở FE tới `attempt_submit`); **UC-23** (AI Guide — prompt cố định + copy clipboard); **UC-24** (breadcrumb reset điều hướng); **UC-25** (thu gọn sidebar); **UC-29** (`QuestionNavigatorDialog` — danh sách câu lấy từ dữ liệu `quiz_start` đã có trong phiên, FE tự render/scroll); **UC-30** (`SubmitWarningDialog` — FE tự đếm câu trống trước khi gọi `attempt_submit`; BE không có command riêng, không chặn câu trống); **UC-38** (toast “Hoàn tác” sau xóa mềm — gọi `subject_restore`/`exam_restore` có sẵn).

**TrashItemDto:** `subject_id` nullable (`null` với item môn, ID môn cha với item bộ đề); `subject_name` là tên môn cha, nullable với item môn. Wire tương ứng `subjectId`/`subjectName`. **BR-77** = chặn restore bộ đề khi cha bị xóa; **BR-78** = conflict tên (`DuplicateName`), yêu cầu đổi tên trước khi restore.

### 6.3 Đồng bộ kiểu sang TypeScript

**[CẬP NHẬT đợt 5]** Mọi DTO wire Rust dùng `#[serde(rename_all = "camelCase")]` cùng derive Serialize/Deserialize theo chiều sử dụng. Tên snake_case trong bảng là field Rust; JSON/TypeScript dùng camelCase, kể cả DTO lồng nhau. `quiz_start` trả, `attempt_submit` nhận, `attempt_review` trả `optionOrder: string[]` (`Vec<String>` ở Rust). JSON string chỉ tồn tại ở SQLite; repository mapper encode/decode `option_order`, `selected_option_ids`, `options_snapshot`, `correct_option_ids`, không stringify ở FE.

**Chọn: thủ công** (không dùng `specta`/`ts-rs`) `[GIẢ ĐỊNH]`.

| Cách | Ưu | Nhược |
|---|---|---|
| **Thủ công (CHỌN)** | ~20 command, DTO nhỏ; viết `src/lib/tauri/commands.ts` mirror các type + wrapper invoke duy nhất; không thêm macro/build step, không dính version tauri-specta với Tauri 2 + React 19. | Sửa DTO Rust phải sửa tay TS — chấp nhận được vì DTO đổi ít, review checklist §9. |
| `tauri-specta` + `ts-rs` | Auto-generate type + bind Commands 1 file; compile-time safety. | Thêm dependency/macro, cấu hình build extra, debug khó hơn với app quy mô này. |

Quy ước chống lệch: mỗi DTO Rust có dòng `// TS: src/lib/tauri/commands.ts#<Tên>` và ngược lại; checklist sprint.

---

## 7. Luồng xử lý mẫu

### 7.1 Tạo quiz ngẫu nhiên — `quiz_start` (R1)

```
FE                          BE quiz_service                     DB
 │  quiz_start {exam_id,        │                                  │
 │   count, randomize=true}     │                                  │
 ├─────────────────────────────►│  exam_repo.get(id)               │
 │                              ├─────────────────────────────────►│
 │                              │◄──── Exam + questions + options ─┤
 │                              │                                  │
 │                              │  [Strategy: Shuffle]             │
 │                              │   q = questions                  │
 │                              │   n = min(count, len(q))         │
 │                              │   q.choose_multiple(n)  ← rand  │
 │                              │   q.shuffle()            ← rand  │
 │                              │   (mỗi question: options cũng   │
 │                              │    shuffle ← rand nếu randomize) │
 │                              │   position = 0..n-1 (thứ tự đã  │
 │                              │    xáo, lưu attempt_answers.     │
 │                              │    position + optionOrder: ID[]) │
 │  QuizStartRes (ẩn is_correct)│                                  │
 │◄─────────────────────────────┤                                  │
```

- randomize=false → bỏ shuffle câu **và** shuffle đáp án (giữ nguyên thứ tự gốc cả hai); vẫn lấy N câu đầu (hoặc đủ N); nhãn A/B/C/D theo thứ tự gốc.
- `is_correct` **không** trả về cho FE trong lúc làm bài (chỉ chấm ở submit).

### 7.2 Nộp bài — `attempt_submit` (1 transaction — Q-03, Q-10, Q-11)

```
FE                              BE                              DB
 │ attempt_submit {exam_id,      │                               │
 │  started_at, answers[]}       │                               │
 ├──────────────────────────────►│ begin_tx ────────────────────►│
 │                               │  exam_repo.get_with_options(id)│
 │                               │  grading_service.grade():      │
 │                               │   mỗi câu:                     │
 │                               │   1 đáp án đúng → selected==[c]│
 │                               │   nhiều đáp án → set(selected) │
 │                               │       == set(correct) (Q-10)   │
 │                               │  score = Σ đúng / tổng × 10    │
 │                               │  attempt_repo.insert(attempt)  │
 │                               ├───────────────────────────────►│ INSERT attempts (submitted_at=UTC now)
 │                               │  attempt_answer_repo           │
 │                               │   .insert_many(answers)        │
 │                               ├───────────────────────────────►│ INSERT attempt_answers ×N (kèm option_order JSON TEXT, Q-19)
 │                               │  commit ──────────────────────►│
 │  AttemptResultDto             │  (lỗi bất kỳ → rollback,      │
 │◄──────────────────────────────┤   AppError::Db)                │
```

- **Q-11**: FE kiểm tra câu trống TRƯỚC khi gọi submit → `SubmitWarningDialog` liệt kê câu trống, 2 nút
  “Quay lại làm tiếp” / “Vẫn nộp”. BE không chặn câu trống (chấp nhận nộp thiếu), chỉ lưu đúng dữ liệu nhận được.
- **Q-19:** mỗi `AttemptAnswerReq` gửi `selectedOptionIds` + `position` + `optionOrder: string[]`; Rust repository encode thành JSON TEXT ở SQLite, decode thành mảng khi review để dựng đúng nhãn A/B/C/D.
- **[CẬP NHẬT đợt 5] Q-04/BR-81:** `grading_service` lấy nội dung câu hỏi, toàn bộ options `{id,text}` và tập đúng tại lúc nộp; `attempt_submit` ghi `question_text`, `options_snapshot`, `correct_option_ids` cùng kết quả chấm trong một transaction. `AttemptReviewDto` đọc snapshot này; không lấy lại nội dung/đáp án từ bảng câu hỏi hiện tại.

### 7.3 Xóa mềm môn — `subject_delete` (Q-01)

```text
FE xác nhận → subject_service.begin_tx
  → UPDATE subjects SET deleted_at=now(UTC), delete_batch_id=batch_id WHERE id=?
  → commit → invalidate subjects/exams/attempts/stats/trash
```

- `delete_batch_id` được tạo từ **Sprint 01** cho mỗi thao tác xóa mềm; schema subjects/exams có cột này ngay từ Sprint 01.
- Exams/attempts bị ẩn **qua cha**; `deleted_at` của con có thể NULL. Repository JOIN subject/exam và kiểm tra `deleted_at` của toàn bộ chuỗi cha (§5.5), không chỉ của bản ghi con.
- Không ghi đè `delete_batch_id` của exam đã xóa riêng. Restore môn chỉ phục hồi con cùng batch; con ẩn qua cha tự hiện, con đã xóa riêng vẫn ẩn.
- `attempt_answers` không cần cập nhật; truy vấn đi qua attempt và các cha còn sống.

### 7.4 Lấy thống kê theo kỳ — `stats_overview` (UC-32, Q-05/Q-06, sprint cuối)

```
FE                         BE stats_service                  DB
 │ stats_overview            │                                │
 │ {period:"week",           │  utils::time:                   │
 │  anchor_utc}              │   boundaries_of(Week, anchor)   │
 │                           │   = [Mon 00:00, Mon+7 00:00)    │
 │                           │   theo Asia/Ho_Chi_Minh → UTC   │
 │                           │  StatsQuery{from,to}            │
 │                           │  attempt_repo.stats(query)      │
 │                           ├───────────────────────────────►│ SELECT count(*), avg(score), …
 │                           │                                │   WHERE submitted_at >= from
 │                           │                                │     AND submitted_at < to
 │                           │                                │     AND deleted_at IS NULL
 │                           │◄── aggregate rows ─────────────┤
 │  StatsOverviewDto         │  build series + distribution   │
 │◄──────────────────────────┤                                │
```

- KHÔNG còn offset giả (+59/+1420/+242/+6150); điểm TB đổi theo kỳ đang chọn.
- Tuần = Thứ 2→CN, tháng = theo lịch, năm = T5..T10 — đều theo `Asia/Ho_Chi_Minh` (Q-06).

### 7.5 Đổi / đọc theme — `setting_set` / `setting_get` (R2, Q-14)

**[CẬP NHẬT đợt 5]** Cache localStorage dùng duy nhất key `theme` (`light|dark|system`) từ Sprint 00 đến Sprint 06; `app_settings` cũng dùng key `theme`.

```
Khởi động app:
 index.html inline script ──► đọc localStorage('theme') ──► set class "dark"
      trên <html> TRƯỚC khi React render (không nháy trắng)
 FE mount ──► setting_get {key:"theme"} ──► BE đọc app_settings
      (nguồn sự thật; localStorage chỉ là cache đọc sớm)

Người dùng bấm ThemeToggle (light → dark → system):
 FE ──► setting_set {key:"theme", value:"dark"} ──► BE upsert app_settings
 FE ──► cập nhật class <html> + localStorage ngay (optimistic)
 system mode ──► theo prefers-color-scheme, lắng nghe change event
```

- `app_settings(key TEXT PK, value TEXT, updated_at TEXT UTC)` — bảng duy nhất không có `deleted_at`.
- Nguồn sự thật = DB (`app_settings`); localStorage chỉ để chống nháy trắng trước khi BE sẵn sàng `[GIẢ ĐỊNH]`.

### 7.6 Xóa vĩnh viễn 1 mục — `trash_purge_item` / `trash_empty` (Q-21, Unit of Work)

```
FE (TrashScreen)               BE trash_service                  DB
 │ purge confirm                  │                                │
 ├──────────────────────────────►│ begin_tx ─────────────────────►│
 │                                │  trash_repo.get_deleted(kind,id)│
 │                                ├───────────────────────────────►│ SELECT ... WHERE deleted_at IS NOT NULL
 │                                │  if subject:                    │
 │                                │   purge exams (soft-deleted)    │
 │                                │   + questions/options/attempts  │
 │                                │   + attempt_answers             │
 │                                │  if exam: purge questions/...   │
 │                                │  trash_repo.purge_*(id)         │
 │                                ├───────────────────────────────►│ DELETE FROM ... (hard delete)
 │                                │  commit ──────────────────────►│
 │ invalidate ['trash']           │                                │
 │◄───────────────────────────────┤                                │
```

- `trash_empty` lặp cùng logic cho mọi bản ghi `deleted_at IS NOT NULL` trong 1 transaction.
- Mọi truy vấn đi qua attempt đã ẩn; `attempt_answers` chỉ xóa khi purge vĩnh viễn.
- `delete_batch_id` (UUID v7) gom các bản ghi bị xóa cùng 1 thao tác cascade để UI nhóm hiển thị.

### 7.7 Khôi phục có xung đột tên — `subject_restore` / `exam_restore` (Q-21)

```
FE (RestoreDialog)             BE trash_service                  DB
 │ restore {id, new_name?}        │                                │
 ├──────────────────────────────►│ begin_tx ─────────────────────►│
 │                                │  trash_repo.get_deleted(id)     │
 │                                ├───────────────────────────────►│
 │                                │  conflict check:                │
 │                                │   name đã tồn tại (active)?    │
 │                                │   → DuplicateName (gợi ý new_name)
 │                                │  if parent deleted (exam→subject)│
 │                                │   → Blocked (khôi phục môn trước)
 │                                │  trash_repo.restore_*(id, name) │
 │                                ├───────────────────────────────►│ UPDATE ... SET deleted_at=NULL, name=?
 │                                │  restore descendants cùng batch│
 │                                │  commit ──────────────────────►│
 │ invalidate ['subjects'/'exams'/'trash'] │                     │
 │◄───────────────────────────────┤                                │
```

- Conflict tên: nếu `new_name` không truyền và tên gốc đã bị chiếm → BE trả `DuplicateName` kèm gợi ý; FE mở `RestoreDialog` để nhập tên mới (validate unique Q-15: trim + case-insensitive).
- Khôi phục môn cascade khôi phục exams/attempts đã bị ẩn cùng `delete_batch_id` (nếu vẫn trong thùng rác).
- Undo toast (nếu có) chỉ gọi lại `subject_restore`/`exam_restore` với `new_name` mặc định.

---

## 8. Cấu trúc FE `src/`

```
src/
├── main.tsx                     # React root; gắn ThemeProvider + QueryClientProvider
├── App.tsx                      # KHUNG app thật (thay demo Tauri hiện tại §9): Shell + routes
├── index.css                    # @import "tailwindcss"; tokens light/dark từ Sprint 00; @custom-variant dark
├── vite-env.d.ts                # (giữ nguyên)
├── assets/                      # (giữ nguyên) font/icon tĩnh nếu cần
├── styles/
│   └── tokens.css               # design-token màu/spacing theo design-system.md
├── lib/
│   ├── tauri/
│   │   ├── invoke.ts            # wrapper invoke duy nhất: typed invoke + map AppError → AppException (DRY)
│   │   └── commands.ts          # type DTO mirror từ Rust (§6.3) + hàm subjectList(), examSave(), …
│   ├── time.ts                  # utcToHcm(), formatDateTime(), period boundaries label (Q-06)
│   └── cn.ts                    # clsx/tailwind-merge helper (nếu dùng)
├── hooks/
│   ├── useSubjects.ts           # useQuery ['subjects'] → subject_list; mutations + invalidate
│   ├── useExams.ts              # useQuery ['exams', subjectId] → exam_list
│   ├── useExamDetail.ts         # useQuery ['exam', id] → exam_get
│   ├── useQuizSession.ts        # quiz_start + state phiên làm bài (câu hiện tại, answers map)
│   ├── useAttemptHistory.ts     # attempt_list; attempt_review
│   ├── useStats.ts              # stats_overview theo period (UC-32)
│   ├── useTheme.ts              # setting_get/set + prefers-color-scheme listener (R2)
│   └── useTrash.ts              # trash_list + restore/purge mutations + invalidate ['trash'] (Q-21)
├── stores/
│   └── uiStore.ts               # Zustand MỎNG: theme mode, sidebarOpen (UC-25), quiz config tạm — server state KHÔNG vào đây
├── routes/
│   ├── index.tsx                # router config (nếu dùng react-router — §2.2)
│   └── paths.ts                 # constant đường dẫn
├── features/
│   │
│   ├── dashboard/               # SCREEN-01 (UC-01..03)
│   │   ├── DashboardScreen.tsx
│   │   ├── StatsOverviewCard.tsx
│   │   ├── PeriodSwitcher.tsx   # Tuần / Tháng / Năm (Q-05 đích: gọi stats_overview thật)
│   │   └── ScoreChart.tsx       # series + phổ điểm
│   ├── subject/                 # SCREEN-02 (UC-04, soft delete Q-01)
│   │   ├── SubjectListScreen.tsx
│   │   ├── SubjectCard.tsx
│   │   ├── SubjectFormDialog.tsx   # tạo/sửa tên — validate tên trùng phía FE BE (Q-15)
│   │   └── DeleteConfirmDialog.tsx # dùng chung cho xóa môn/bộ đề (tên theo design-system)
│   ├── exam/                    # SCREEN-03/04/05 (UC-05..UC-16)
│   │   ├── ExamListScreen.tsx
│   │   ├── ExamEditorScreen.tsx   # khung editor: toolbar + question list; ≤200 dòng → composition
│   │   ├── ExamOverviewScreen.tsx # UC-16 “Hiện đáp án”
│   │   ├── QuestionEditorCard.tsx # inline edit nội dung (UC-07)
│   │   ├── OptionRow.tsx          # thêm/xóa option, toggle đáp án đúng (UC-10/11)
│   │   ├── InsertQuestionControl.tsx # UC-08
│   │   └── SyntaxHighlightedTextarea.tsx # UC-13: token ask/ans. tô màu FE (Q-20, R4)
│   ├── import/                  # UC-12/13/14
│   │   ├── ImportTab.tsx          # chuyển tab JSON ↔ TXT (UC-14)
│   │   ├── JsonImportPanel.tsx
│   │   ├── TxtImportPanel.tsx
│   │   └── ParseIssueList.tsx     # hiển thị lỗi theo dòng từ ParseIssueDto
│   ├── quiz/                    # SCREEN-06 (UC-18..20)
│   │   ├── QuizSetupDialog.tsx    # số câu, random on/off (R1, mặc định ON)
│   │   ├── QuizScreen.tsx         # render theo thứ tự attempt_answers.position
│   │   ├── QuizQuestionCard.tsx   # radio (1 đáp án) vs checkbox (nhiều đáp án) theo dữ liệu (Q-10)
│   │   ├── QuizProgressbar.tsx
│   │   ├── QuizTimer.tsx
│   │   ├── QuestionNavigatorDialog.tsx # R3: danh sách câu — dùng lại cho danh sách câu trống
│   │   └── SubmitWarningDialog.tsx     # Q-11: liệt kê câu trống + 2 nút
│   ├── attempt/                 # SCREEN-07 (UC-17, 21, 22)
│   │   ├── AttemptHistoryScreen.tsx
│   │   ├── AttemptSummaryCard.tsx
│   │   └── AttemptReviewScreen.tsx # dữ liệu từ attempt_review (DB), không từ state tạm
│   ├── stats/                   # (nếu tách khỏi dashboard — mặc định gộp trong features/dashboard) [GIẢ ĐỊNH]
│   ├── ai-guide/                # SCREEN-08 (UC-23): prompt cố định + copy
│   ├── trash/                   # Thùng rác (Q-21, tab sau AI Guide)
│   │   ├── TrashScreen.tsx      # danh sách đã xóa (subject/exam) + filter kind
│   │   ├── TrashList.tsx
│   │   ├── TrashItemRow.tsx
│   │   └── RestoreDialog.tsx    # nhập new_name khi conflict (DuplicateName)
│   └── theme/                   # R2, Q-13/Q-14
│       ├── ThemeToggle.tsx        # 3 chế độ light/dark/system (tên theo design-system)
│       └── theme.ts              # ánh xạ mode → class dark, sync prefers-color-scheme
├── components/
│   ├── ui/                      # primitive dùng chung theo design-system.md
│   │   ├── Button.tsx, Card.tsx, Dialog.tsx, Input.tsx, Badge.tsx, Toast.tsx, Tabs.tsx
│   │   └── (mỗi file 1 component, ≤200 dòng)
│   └── layout/
│       ├── AppShell.tsx          # sidebar + header + main (UC-24 breadcrumb, UC-25 collapse)
│       ├── Sidebar.tsx
│       ├── BreadcrumbHeader.tsx  # UC-24 reset điều hướng
│       └── ToastHost.tsx         # OVL-01, render cố định góc dưới phải
└── test/                         # vitest cho hooks/utils quan trọng (time.ts boundaries) [GIẢ ĐỊNH]
```

Quy ước:

- **File ≤ ~200 dòng, component 1 file** (§1.2); screen composition từ feature components, không viết JSX to.
- Tên component khớp `docs/design-system.md`: `ThemeToggle`, `QuestionNavigatorDialog`, `SubmitWarningDialog`,
  `DeleteConfirmDialog`, `SyntaxHighlightedTextarea`.
- Mọi lệnh gọi BE qua `lib/tauri/commands.ts` — feature **không** import `invoke` trực tiếp (DRY + 1 chỗ đổi tên command).
- **Theme không nháy trắng (R2/NFR-16)**: inline script trong `index.html` đọc `localStorage.theme` và
  set class `dark` trên `<html>` **trước** bundle React chạy; `useTheme` đồng bộ từ DB + `prefers-color-scheme`.

---

**Quy tắc task UI (đợt 5):** mọi task UI chỉ dùng CSS variable/token semantic cho cả light/dark, không hex trực tiếp trong JSX/CSS component. `src/index.css` khai báo `:root`, `.dark` và `@custom-variant dark (&:where(.dark, .dark *));` từ Sprint 00; repository mapper giữ JSON TEXT khỏi DTO wire (§6.3), màn review dùng snapshot Q-04.

## 9. Lấp khoảng trống hạ tầng — sprint 0 (CHỈ LIỆT KÊ, KHÔNG SỬA)

> Mục này là checklist cho agent sprint 0 — **không** sửa file nào ngoài phạm vi được giao.

### 9.1 `package.json` (FE)

| Việc | Chi tiết |
|---|---|
| Thêm dependency | `tailwindcss` + `@tailwindcss/vite` (plugin Vite, Tailwind v4 `[GIẢ ĐỊNH]`), `lucide-react`, `@tanstack/react-query`; thêm `zustand` + `react-router` nếu chốt dùng (§2.2). |
| `@import` CSS | Trong `src/index.css`: `@import "tailwindcss";` đứng đầu (trước mọi CSS custom), rồi `@import` font (Q-17: nếu offline-first thì bundle font thay `@import` mạng), rồi tokens/styles. |
| Scripts | Thêm `lint` (eslint .), `format` (prettier --write .), `test` (vitest) — chưa có trong scripts hiện tại. |
| Alias | Trong `vite.config.ts` + `tsconfig`: alias `@/*` → `src/*`. |

### 9.2 `src-tauri/Cargo.toml`

| Crate | Version `[GIẢ ĐỊNH]` | Lý do |
|---|---|---|
| `rusqlite` (features `["bundled"]`) | `0.32` `[GIẢ ĐỊNH]` | SQLite (§2.1). |
| `rusqlite_migration` | `1` `[GIẢ ĐỊNH]` | Migration (§5.3). |
| `r2d2` + `r2d2_sqlite` | `0.8` `[GIẢ ĐỊNH]` | Pool (§5.1). |
| `thiserror` | `2` `[GIẢ ĐỊNH]` | `AppError`. |
| `uuid` (features `["v7"]`) | `1` | ID sortable. |
| `chrono` + `chrono-tz` | `0.4` / `0.10` | UTC ↔ `Asia/Ho_Chi_Minh` (Q-06). |
| `rand` | `0.9` `[GIẢ ĐỊNH]` | Random quiz (R1). |
| `tracing` + `tracing-subscriber` | `0.1` | Logging. |

**Sprint 00:** hoàn thiện bộ CSS variables light/dark và mapping Tailwind v4 trong `src/index.css` trước mọi task UI. Sprint 06 chỉ hoàn thiện chuyển đổi theme, persist và chống nháy trắng, không trì hoãn token đến Sprint 06.

### 9.3 Cấu hình Tauri

| File | Việc |
|---|---|
| `capabilities/default.json` | Least-privilege: giữ đúng capability đang có cho core + opener nếu còn dùng; KHÔNG thêm permission lạ; mỗi command app tự đăng ký không cần capability riêng. `[GIẢ ĐỊNH]` audit nội dung hiện tại khi sprint 0 chạy. |
| `src-tauri/tauri.conf.json` | Window: `width: 1280, height: 800, minWidth: 1024`; `title`: đặt tên thương hiệu (AS-10 — ref-ui hiển thị “QUIZ Analysis / Smart Exam Studio”, cần chốt `[GIẢ ĐỊNH]`); `identifier` giữ `com.hyanhasta05.ansask-desktop`. |
| `src/App.tsx` | Thay component demo Tauri hiện tại bằng khung app thật (`AppShell` + placeholder screen) — nội dung chi tiết ở sprint feature. |
| `index.html` | Inline script chống nháy trắng theme (R2, §8). |

### 9.4 Lint / format / test / CI

| Nhóm | Việc |
|---|---|
| FE lint/format | ESLint (typescript-eslint + react-hooks) + Prettier; config mới `eslint.config.js`, `.prettierrc`. |
| Rust | `clippy` (all targets, -D warnings trong CI) + `rustfmt`; có thể thêm `rust-toolchain.toml` pin stable. |
| Test Rust | Unit test SQLite `:memory:`: chạy migrations thật, test repository + grading_service (Q-10) + parser (R4) + time boundaries (Q-06). Chạy `cargo test` trong `src-tauri/`. |
| CI `[GIẢ ĐỊNH]` | GitHub Actions tối thiểu: (1) `pnpm install --frozen-lockfile && pnpm lint && pnpm build`; (2) `cargo fmt --check && cargo clippy && cargo test` trong `src-tauri/`. |

---

## 10. Lộ trình sprint

Chỉ thứ tự phụ thuộc — **không** tạo file sprint trong tài liệu này (sprint plan là việc của `docs/sprint/`).

```
Sprint 00 — Hạ tầng (§9)
  └─ chặn mọi sprint sau: Tailwind, SQLite+migration+pool, capability, window config,
     AppShell thay demo, tokens light/dark + @custom-variant dark, lint/format/test/CI

Sprint 01 — CRUD môn & bộ đề (không import)
  └─ dependencies: Sprint 00
  ├─ Subject CRUD + soft delete cascade + delete_batch_id từ Sprint 01 (Q-01) + DeleteConfirmDialog + unique tên (Q-15)
  └─ Xem/xóa mềm bộ đề trong môn; hợp đồng exam_get cho editor Sprint 02

Sprint 02 — Câu hỏi & Import, plaintext editor
  └─ dependencies: Sprint 01
  ├─ exam_save + question/option commands (UC-06..15)
  ├─ parsers (tokenizer → parser → validator, lỗi theo dòng — R4)
  ├─ import_parse command + JSON/TXT panel + ParseIssueList
  └─ SyntaxHighlightedTextarea (tô ask/ans., Q-20)

Sprint 03 — Quiz + chấm + attempt
  └─ dependencies: Sprint 01, 02 (cần bộ đề có dữ liệu thật)
  ├─ quiz_start (R1: random N câu, xáo câu + option, position)
  ├─ attempt_submit (1 transaction, Q-03 attempt_answers, Q-10 exact-set, radio/checkbox)
  ├─ snapshot Q-04/BR-81 khi nộp trên schema Sprint 00
  └─ QuestionNavigatorDialog (R3) + SubmitWarningDialog (Q-11)

Sprint 04 — Lịch sử & Thống kê (mock)
  └─ dependencies: Sprint 03 (cần attempt_answers trong DB)
  ├─ attempt_list/history + AttemptReviewScreen từ snapshot attempt_review (UC-21), làm lại đề (UC-22)
  └─ dashboard metric/series/phổ điểm với kỳ mock; lọc thật ở Sprint 07

Sprint 05 — Thùng rác (Q-21)
  └─ dependencies: Sprint 03 (attempts/answers thật để kiểm thử purge), kế thừa soft delete + delete_batch_id Sprint 01
  ├─ trash_list, subject_restore, exam_restore, trash_purge_item, trash_empty (UC-33..UC-37)
  ├─ features/trash (TrashScreen tab sau AI Guide), RestoreDialog conflict tên, badge + toast Hoàn tác (UC-38)
  └─ Unit of Work purge/restore + conflict name check (Q-15)

Sprint 06 — Theme & AI Guide & Polish
  └─ dependencies: Sprint 00 (theme độc lập — có thể chạy song song từ Sprint 02)
  ├─ app_settings + setting_get/set + ThemeToggle 3 chế độ + chống nháy trắng (R2, Q-13/Q-14)
  └─ AI Guide, sidebar collapse, accessibility polish

Sprint 07 — Lọc thống kê thật + Q-07/Q-09 + kiểm thử tổng thể
  └─ dependencies: Sprint 03, 04, 05, 06
  ├─ stats_overview lọc thật theo kỳ (bỏ offset ảo, Q-05/BR-32), biên kỳ Asia/Ho_Chi_Minh (Q-06)
  ├─ điểm TB/phổ điểm theo kỳ (Q-18), donut ba segment (QDS-21), chartMetric lọc series (Q-08)
  ├─ Q-07 đánh số lượt, Q-09 giới hạn số câu
  └─ kiểm thử tổng thể, hồi quy snapshot đã triển khai ở Sprint 03/04
```

**Ngoài phạm vi Sprint 07, để dành sau:** draft editor (Q-16), font offline (Q-17), export/backup (§5.6).

Ghi chú: token light/dark bắt buộc từ Sprint 00; Sprint 06 chỉ chuyển đổi/persist/chống nháy trắng (cùng key `theme`).

---

## 11. Giả định và câu hỏi mở

### 11.1 Giả định `[GIẢ ĐỊNH]` của tài liệu này

| # | Giả định | Nếu sai thì ảnh hưởng |
|---|---|---|
| A1 | Tailwind **v4** (plugin `@tailwindcss/vite`) — repo chưa cài nên chưa xác nhận được. | Sai → cấu hình `tailwind.config.js` v3 + PostCSS (§9.1). |
| A2 | Chọn **rusqlite + rusqlite_migration + r2d2_sqlite** (§2.1); nếu người quyết chọn `sqlx` thì sửa §3/§5 (repositories nhận pool sqlx, async). | Thay toàn bộ tầng repository theo async. |
| A3 | Sync type TS thủ công, không dùng tauri-specta (§6.3). | Nếu chọn specta → bớt `commands.ts` tay, thêm build step. |
| A4 | Timestamp lưu **TEXT ISO-8601 UTC** (không phải INTEGER epoch ms). | Đổi sang INTEGER → sửa repository + migration. |
| A5 | Pool max ~4 kết nối; app 1 người. | Không ảnh hưởng kiến trúc. |
| A6 | `Clock` trait inject vào services để test thời gian. | Không có thì test dùng thời gian thật (yếu hơn nhưng chạy được). |
| A7 | Shuffled thứ tự câu **và** đáp án lưu qua `attempt_answers.position` + `option_order` (JSON TEXT) (R1, Q-19); một công tắc `randomize` tắt cả hai. | Nếu bỏ option shuffle → bỏ cột `option_order`, đơn giản hóa attempt_review. |
| A8 | localStorage cache theme song song DB (chống nháy trắng trước khi `setting_get` xong). | Đơn giản hơn: chỉ inline script với default; hoặc chỉ DB → có thể nháy 1 frame. |
| A9 | Bản version crate trong §9.2 là gần đúng nhất giữa 2025–2026 — cần verify khi cài thật. | `cargo add` sẽ tự chọn version compatible. |
| A10 | react-router được dùng cho nav; nếu không thì AppShell điều hướng bằng state (giống ref-ui). | Chuyển routes/ + hooks liên quan sang state-based nav. |
| A11 | `domain-core.md` đã đủ **UC-01..UC-38** (UC-33..UC-37 thùng rác Q-21, UC-38 toast Hoàn tác); bảng §6.2 đã phủ đủ — UC-29/UC-30/UC-38 UI-only không cần invoke. | Nếu UC đổi hành vi → đối chiếu lại bảng §6.2. |
| A12 | `delete_batch_id` (UUID v7) sinh lúc soft delete môn/bộ đề, lưu trên bản ghi deleted (subjects/exams) để nhóm khôi phục cascade và hiển thị thùng rác. | Nếu không lưu → khôi phục cascade theo FK/subject_id; đơn giản hơn nhưng mất grouping undo. |

### 11.2 Câu hỏi cần người quyết

| # | Câu hỏi | Gợi ý |
|---|---|---|
| Q1 | Tên thương hiệu window/brand: “ansask-desktop” hay “QUIZ Analysis / Smart Exam Studio” (AS-10)? | Đặt title theo brand, productName giữ repo name. |
| Q2 | Chốt Tailwind v4 vs v3; react-router vs nav-state; Zustand có dùng thật hay chỉ theme? (§2.2, A1/A10) | Chốt trước sprint 0. |
| Q3 | Thang điểm lưu của `attempt.score`? | **ĐÃ CHỐT:** REAL **0–10**, làm tròn 1 chữ số thập phân theo BR-25: `score = Number(((correct/total)*10).toFixed(1))`; DB `CHECK (score >= 0 AND score <= 10)` theo `db.dbml`. |
| Q4 | `stats_overview` anchor mặc định “kỳ hiện tại” theo clock thật — có cần cho phép xem kỳ quá khứ (chọn ngày) không? | Giữ simple: chỉ kỳ hiện tại; thêm anchor sau. |
| Q5 | Phạm vi theme theo đợt 5? | ĐÃ CHỐT: token light/dark từ Sprint 00; Sprint 06 chỉ chuyển đổi/persist/chống nháy trắng. |

### 11.3 Tóm tắt tiêu chí hoàn thành tài liệu

- [x] 11 mục đủ (§1–§11).
- [x] `docs/tech-stack.md` đã xóa (thay bằng tài liệu này).
- [x] Cây thư mục §3/§8 mô tả mọi file ≤ ~200 dòng (§1.2).
- [x] Mỗi pattern §4 có "vấn đề nghiệp vụ thật" + lý do; pattern cố ý không dùng cũng được nêu.
- [x] **27 tên command** (§6.2) bao phủ **UC-01..UC-38** (UC-29/UC-30/UC-38 UI-only; UC-33..UC-37 thùng rác Q-21).

> **Kết thúc tài liệu.**
