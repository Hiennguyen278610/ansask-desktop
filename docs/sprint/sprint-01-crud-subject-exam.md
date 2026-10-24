# SPRINT 01 — CRUD Môn/Bộ đề


**AC-SIZE — acceptance chung bắt buộc:** mọi task code/config/test phải kiểm tra file ≤~200 dòng và hàm ≤~40 dòng; báo số dòng/file và rà ranh giới hàm trong kết quả task, tách module khi vượt, không nén code để né giới hạn. Mọi acceptance task bên dưới viện dẫn AC-SIZE, gate không pass khi chưa kiểm tra.

**Quy tắc UI bắt buộc:** mọi task UI dùng CSS variables/token light và dark từ Sprint 00; không ghi màu hex trực tiếp trong component hoặc style UI.

## CONTEXT
Sprint 00 bàn giao Tauri 2 + React 19 + TypeScript, SQLite pool/migration 001 đủ 7 bảng, AppShell, primitive UI, Tailwind + lucide-react, invoke wrapper và scripts kiểm tra. Sprint này thêm CRUD môn và xem/xóa mềm bộ đề bền vững trong SQLite và SCREEN-02/03/04 cơ bản; chưa xây editor câu hỏi, import hay quiz. Không coi dữ liệu demo trong `ref-ui.tsx` là implementation.

## GOAL
Người dùng tạo/sửa/xem/xóa mềm môn và xem/xóa mềm bộ đề qua UI, tên trùng bị chặn, cascade ẩn nguyên tử và dữ liệu còn đúng sau khi mở lại app, được chứng minh bằng Rust repo/service tests cùng FE smoke cuối sprint.

## Phạm vi, phụ thuộc và tài liệu bắt buộc
- **Trong:** Subject CRUD; exam_list/exam_get/exam_delete trong môn; unique Q-15; soft delete và `delete_batch_id`; DeleteConfirmDialog; SCREEN-02/03/04 cơ bản; Breadcrumb reset; Sidebar điều hướng cơ bản.
- **Ngoài:** tạo/lưu/sửa bộ đề (UC-06/UC-15, exam_save chuyển sang Sprint 02 để luôn tuân BR-08); soạn/sửa câu hỏi, option, import và SCREEN-05 đầy đủ (Sprint 02); quiz (03); lịch sử/ShowAnswersSwitch đầy đủ (04); restore/purge/undo/badge thùng rác (05); theme/collapse/polish (06). Không tạo command câu hỏi, không chép code hoặc seed từ ref-ui.
- **Phụ thuộc:** Sprint 00 phải có migration/schema đúng, AppError, State/DI, UoW hoặc điểm mở rộng transaction, wrapper `src/lib/tauri/invoke.ts`, skeleton `commands.ts`, scripts lint/build/test và quyết định router/state đã ghi nhận. Thiếu nền → báo lỗi Sprint 00, không âm thầm dựng lại.
- **Đọc:** `docs/sprint/sprint-prompt-template.md` toàn bộ; `docs/sprint/sprint-plan-summarize.md` §3, §4, §5 Sprint 01, §8; đọc bàn giao Sprint 00 nếu đã có.
- **Đọc:** `docs/domain-core.md` §4.2/4.3, §5.1/5.2/5.7, §5.9 BR-59/60/64 và BR-71 cho hợp đồng batch, §6 UC-04/05/16/24/26/27, §7, §9 NFR-14, Q-15.
- **Đọc:** `docs/design-system.md` §3.1, §4.2/4.6/4.9, §4.23 Breadcrumb, §4.24..4.31, §4.58 DeleteConfirmDialog, §5 SCREEN-02/03/04, §6.8; dùng tokens/ModalShell đã có từ Sprint 00.
- **Đọc:** `docs/db.dbml` bảng subjects/exams, quy ước thời gian/soft delete, toàn bộ FK liên quan, indexes và SQL partial unique trong Note; `docs/structure-be.md` §3, §4 Repository/Service/UoW, §5.5, §6.2, §7.3, §8.

## QUY ƯỚC CHO TẤT CẢ SPRINT
Mọi triển khai code/config/migration/test/refactor giao cho **subagent codex** (`subagent_codex` nếu môi trường dùng tên đó). Điều phối viên khóa hợp đồng, phân công, đọc kết quả và chạy gate; không tự nhận phần triển khai. Mỗi task dưới đây có mã, tên, mục tiêu, executor, nhóm/phụ thuộc, file, truy vết, prompt tự chứa, acceptance và lệnh kiểm tra. Khi giao task, gửi kèm nguyên mục quy ước, hợp đồng, quyết định G0 và task tương ứng; codex không cần lịch sử hội thoại.

Chạy song song chỉ khi không trùng file ghi; file dùng chung (`lib.rs`, `state.rs`, `mod.rs`, routes, `App.tsx`, `commands.ts`, config) có một chủ sở hữu ở task khóa hợp đồng hoặc tích hợp. Sau mỗi wave phải có gate; file vượt phạm vi cần điều phối lại trước khi sửa. Mỗi task ≤30 phút ước tính; vượt thì chia task nhỏ với cùng đủ trường. File code ≤200 dòng, hàm ≤40 dòng; tách module theo trách nhiệm, không nén code để né giới hạn. DRY/SOLID, không over-engineer.

Tuân thủ `commands → services → repositories → db`; DI qua `tauri::State`; service phụ thuộc trait repository/UoW, không SQL hoặc `rusqlite::Connection`. Một thao tác nhiều bản ghi dùng cùng transaction/connection; không gọi repository tự lấy connection khác trong UoW. Rust test repo/integration dùng SQLite in-memory chạy migration thật và bật FK; service unit test dùng mock trait + Clock kiểm soát thời gian. FE chỉ gọi BE qua `src/lib/tauri/commands.ts`; Tailwind + lucide-react, dùng primitive hiện có. Thời gian lưu UTC ISO-8601 TEXT, hiển thị `Asia/Ho_Chi_Minh`; schema chỉ đổi bằng migration đánh số, không sửa migration đã phát hành. Cuối sprint có task kiểm thử/ nghiệm thu do codex thực hiện và checklist riêng cho Hyan.

### Dữ liệu mẫu chỉ dev cho nghiệm thu

S01-T10 sở hữu `src-tauri/src/db/dev_seed.rs` và đăng ký module/setup dùng `#[cfg(debug_assertions)]`; chỉ nạp khi người chạy bật `ANSASK_DEV_SEED=1` và DB dev còn trống. Nạp một môn, một bộ đề hợp lệ có ít nhất hai câu, mỗi câu ≥2 options và ≥1 đáp án đúng, gồm câu nhiều đáp án đúng; ID/time xác định, insert trong một transaction. Chạy `ANSASK_DEV_SEED=1 pnpm tauri dev` với app-data dev cô lập đã khóa ở G0. Không tự seed DB cá nhân, không ghi đè dữ liệu, chạy lại không nhân bản. Module/fixture seed bị loại khỏi bản release, không thêm command IPC hay seed vào migration 001. S01-T11 kiểm tra xem/xóa đề mẫu qua UI, restart giữ dữ liệu và bản release không có đường nạp seed.

## Hợp đồng tạo ra và điểm cần chốt tại G0
**Đầu vào:** hợp đồng Sprint 00 kể trên. **Đầu ra cho Sprint 02/03/04/05:** 7 command và DTO Rust/TS đồng bộ, unique active-name, active-parent query, UoW soft delete + batch, DeleteConfirmDialog dùng chung, Breadcrumb và reset callbacks. Không tự đổi tên command giữa sprint.

| Command | Input → output; hành vi |
|---|---|
| `subject_list` | Không input → `SubjectSummary[]`; chỉ môn sống; `created_at ASC`, khóa phụ id ổn định. |
| `subject_create` | `{ req: SubjectCreateReq { name, color } }` → `SubjectSummary`; trim, validate rỗng/màu preset, unique toàn cục. `color` bổ sung để thực hiện BR-02/07 dù bảng §6.2 chỉ ghi name. |
| `subject_update` | `{ req: SubjectUpdateReq { id, name } }` → `SubjectSummary`; sửa tên, giữ màu/created_at, loại chính id khỏi kiểm tra trùng; không thêm chức năng đổi màu khi sửa. |
| `subject_delete` | `{ req: IdReq { id } }` → `null` (Rust `()`); môn sống và exams sống thuộc môn cùng deleted_at/batch, một transaction. |
| `exam_list` | `{ req: ExamListReq { subjectId } }` → `ExamSummary[]`; cha phải sống; `created_at DESC`, khóa phụ id ổn định. |
| `exam_get` | `{ req: ExamGetReq { id, includeAnswers } }` → `ExamDetail`; cha/con phải sống; false không trả cờ `isCorrect`; true dành cho editor ở Sprint 02. |
| `exam_delete` | `{ req: IdReq { id } }` → `null`; xóa mềm exam sống, batch riêng; giữ dữ liệu con vật lý. |

- **DTO nền:** `SubjectSummary { id, name, color, createdAt, updatedAt, examCount, totalQuestions }`; `ExamSummary { id, subjectId, title, createdAt, updatedAt, questionCount, attemptCount }`; `ExamDetail` gồm các field ExamSummary và `questions: QuestionDto[]`. Id/time là string, counts là number TS/integer Rust; không persist count. List đếm độc lập tránh nhân bản count khi join nhiều tập con.
- **DTO cho Sprint 02:** `QuestionDto { id, ask, position, options: OptionDto[] }`, `OptionDto { id, text, position, isCorrect?: boolean }`; `QuestionUpsertReq { id?, ask, options: OptionUpsertReq[] }`, `OptionUpsertReq { id?, text, isCorrect }`; vị trí lấy từ thứ tự mảng. Đây là shape hợp đồng, không cho phép cài CRUD câu hỏi trong Sprint 01. Không trả false giả thay cho field đáp án đã ẩn.
- Wire JSON camelCase theo summary §8; Rust snake_case + `#[serde(rename_all = "camelCase")]`; DTO wire tách model UI bằng mapper tường minh. Mã lỗi `NotFound | DuplicateName | Validation | Db`, `{ code, message }` tiếng Việt qua wrapper; chỉ map vi phạm đúng unique-name index sang DuplicateName, không nuốt lỗi DB khác.
- **Tên:** trim đầu/cuối trước lưu; title rỗng → `Chưa có tiêu đề` rồi kiểm tra unique. Hai partial unique index bắt buộc: `uq_subjects_name_active ON subjects(lower(trim(name))) WHERE deleted_at IS NULL`; `uq_exams_subject_title_active ON exams(subject_id, lower(trim(title))) WHERE deleted_at IS NULL`. Update không đổi subject_id; khác môn được trùng title; bản xóa mềm giải phóng tên. Service check cho thông báo dễ hiểu, DB constraint là lớp bảo vệ cuối; xem Q2 về chuẩn hóa.
- **Xóa:** sinh UUIDv7 batch mới mỗi thao tác. Xóa môn chỉ update exams `deleted_at IS NULL`, giữ nguyên deleted_at/batch của exam đã xóa riêng; xóa riêng exam dùng batch riêng theo db.dbml. Một timestamp UTC dùng chung cả batch. Không có restore/purge ở sprint này.
- **Active queries:** exam cần cả `exams.deleted_at IS NULL` và `subjects.deleted_at IS NULL`; get/delete không truy cập được đối tượng ẩn. Questions/options/attempts/attempt_answers không có deleted_at: giữ nguyên rows/FK, ẩn qua cha. Test fixture có descendants để chứng minh cascade; không xây feature lịch sử/thống kê.
- **Thời gian:** tạo mới created_at = updated_at; sửa giữ created_at, ghi updated_at từ Clock UTC; không sort theo updated_at. Card hiển thị ngày tạo `YYYY-MM-DD HH:mm` bằng timezone cố định, không theo OS; không tự thêm ngày tạo môn hay trường thời gian mới lên UI.
- **Component:** `DeleteConfirmDialog { open, targetType: 'subject'|'exam', targetName, meta?: { examCount?, questionCount?, attemptCount? }, pending, onCancel, onConfirm }`; caller sở hữu target id/mutation/error. Focus “Giữ lại”, trap/restore focus, Escape/backdrop/hủy không invoke, pending ngăn gọi lặp; lỗi đóng dialog + toast, dữ liệu UI giữ nguyên. Dùng mô tả xóa mềm/giữ dữ liệu, không dùng cảnh báo “không thể hoàn tác” đã lỗi thời so với Q-21.
- **Breadcrumb:** `Breadcrumb { subject?, exam?, onRoot, onSubject, onExam }`; root luôn hiện, crumb hiện tại vẫn bấm reset; nav có aria-label/aria-current. Root xóa selection/form/tên, giữ màu; môn xóa selectedExamId; exam tắt showAnswers, đóng history/config khi state này có. Reset cùng cấp có toast theo §5.7, không xóa DB. Sidebar đổi tab giữ vị trí Đề kiểm tra, không tạo Power/Settings.
- **Cache:** khóa `['subjects']`, `['exams', subjectId]`, `['exam', examId, includeAnswers]`; mutation thành công invalidate list/count/detail liên quan; xóa môn bỏ detail/cache descendants đã chọn; không render lại dữ liệu ẩn từ cache hoặc response cũ. Lỗi không điều hướng thành công. Xóa môn đang mở → root; xóa exam đang mở → danh sách môn.

**Câu hỏi mở / gate bắt buộc (không được tự coi là đã duyệt):**
1. **Phân kỳ đã chốt:** UC-06/UC-15 và exam_save thuộc Sprint 02; Sprint 01 không tạo hoặc lưu đề rỗng. Test đọc/xóa dùng fixture SQLite có ≥1 câu hợp lệ, không seed runtime.
2. **Q2 — unique tên:** BR-59 có giả định bỏ toàn bộ khoảng trắng, nhưng Q-15/db.dbml dùng `lower(trim(...))`; SQLite lower mặc định không case-fold đầy đủ tiếng Việt. Đề xuất giữ đúng schema Sprint 00 (trim đầu/cuối, giữ khoảng trắng bên trong); cần xác nhận phạm vi case-insensitive/Unicode. Nếu yêu cầu Unicode hoặc bỏ mọi khoảng trắng, chốt normalization + migration/index đồng bộ trước task unique; không dùng FE lowerCase làm đảm bảo DB. Ghi rõ test `Toan/toan`, `To an/Toan`, `TOÁN/toán` và expected theo quyết định.
3. **Sai khác đã đối chiếu schema:** structure-be §5.5/§7.3 yêu cầu update deleted_at attempts/questions nhưng cột không tồn tại; làm ẩn qua cha theo db.dbml. Summary §8 và schema Sprint 00 yêu cầu batch ngay Sprint 01, không hoãn thêm cột đến Sprint 05 như note cũ structure-be. Ghi vào handoff, không sửa tài liệu nền trong sprint.

## TASKS — wave, quyền ghi và gate
```text
W0: S01-T01 khóa đầu vào + hợp đồng ---------------------------- G0
W1: S01-T02 repo Subject || S01-T03 repo Exam || S01-T04 UI dùng chung -- G1
W2: S01-T05 service Subject || S01-T06 service Exam || S01-T07 UI môn -- G2
W3: S01-T08 UoW cascade || S01-T09 UI bộ đề ------------------------ G3
W4: S01-T10 tích hợp command/DI/FE/nav (một codex) ------------- G4
W5: S01-T11 kiểm thử tổng + nghiệm thu codex + Hyan ------------ G5
```
G0 chỉ mở nhánh đã đủ quyết định; nếu Q2 pending thì các task không phụ thuộc vẫn chạy với hợp đồng phần đã chốt. G1..G3 kiểm tra diff/file ownership, test phần đã nối vào build; module chưa đăng ký phải ghi “chưa chạy”, không báo pass giả. G4 compile/test toàn bộ module sau tích hợp; G5 là gate bàn giao thực tế. Mọi gate do điều phối viên tổng hợp log từ codex, không vượt gate khi có failure liên quan.

### S01-T01 — Khóa hợp đồng và baseline
- **Mục tiêu:** khóa API/schema/quyết định và manifest file trước fan-out.
- **Thực thi bởi:** subagent codex
- **Nhóm:** tuần tự W0; **Phụ thuộc:** Sprint 00 DONE.
- **File:** đọc repo/bàn giao Sprint 00; ghi `docs/sprint/sprint-01-crud-subject-exam.md` (quyết định G0), `src-tauri/src/domain/{subject,exam}.rs`, `src-tauri/src/dto/{subject_dto,exam_dto}.rs`, các mod.rs khai báo tương ứng, `src/lib/tauri/commands.ts` types/wrappers, `tests/fixtures/wire/subject-exam.json`, `src-tauri/tests/wire_subject_exam.rs`, `src/test/wire-subject-exam.test.ts`; không sửa business code.
- **Truy vết:** summary §3/8; structure-be §3/4/6.2/8; subjects/exams, 7 command, DTO ở trên; UC-04/05/16/24/26/27; BR-01..07/13..16/59/60/64.
- **Prompt giao codex:** “Đối chiếu migration 001, DI/UoW, scripts và primitive với mục hợp đồng. Chốt Q2 với điều phối viên, ghi quyết định chưa có là NEED_INPUT; lập manifest không trùng file, mirror DTO Rust/TS, thống nhất payload req và result null. Không viết runtime bypass BR-08; không thay dependency/router. Baseline thất bại phải báo rõ Sprint 00.”
- **Chấp nhận / Lệnh:** AC-SIZE; có manifest, G0 decisions và DTO mapping; fixture wire dùng chung `tests/fixtures/wire/subject-exam.json` và test serde/TS theo summary §8; đủ cột/batch/index/FK thực tế; `pnpm lint`, `pnpm build`, `cargo test --manifest-path src-tauri/Cargo.toml`; đối chiếu `sqlite_master` trong migration test. G0 không pass nhánh còn quyết định thiếu.

### S01-T02 — Repository môn
- **Mục tiêu:** persist/read môn và counts đúng.
- **Thực thi bởi:** subagent codex
- **Nhóm:** P1/W1; **Phụ thuộc:** S01-T01 phần subject + Q2.
- **File:** `src-tauri/src/repositories/subject_repo.rs`, `repositories/subject_repo_tests.rs`; chỉ file này, không mod.rs.
- **Truy vết:** UC-04/05; BR-01..07/59/60; SubjectCard; subject_list/create/update; subjects/exams, questions chỉ COUNT; domain §4.2/5.1, structure-be §4, db.dbml subjects/index.
- **Prompt giao codex:** “Cài trait/SQLite repo list/create/update/count tên trên active rows theo G0. Parameterize SQL, count không nhân do join, sort tạo ASC, update giữ created_at, không lấy cả bản ẩn. Test SQLite in-memory migration thật: create/update, same-id rename, trùng tên, tên giải phóng sau soft delete và count chỉ exams sống. Không sở hữu cascade transaction.”
- **Chấp nhận / Lệnh:** AC-SIZE; dữ liệu và counts/sort chính xác, unique DB chặn ghi trực tiếp; `cargo test --manifest-path src-tauri/Cargo.toml subject_repo` sau đăng ký tại S01-T10; G1 review test/code trước đăng ký.

### S01-T03 — Repository bộ đề
- **Mục tiêu:** đọc get/list exam an toàn.
- **Thực thi bởi:** subagent codex
- **Nhóm:** P1/W1; **Phụ thuộc:** S01-T01 + Q2 chốt.
- **File:** `src-tauri/src/repositories/exam_repo.rs`, `repositories/exam_repo_tests.rs`; helper read riêng trong `repositories/exam/` nếu manifest G0 cần tách ≤200 dòng; không mod.rs chung.
- **Truy vết:** UC-05/16; BR-13..16/59/60/64; ExamCard/ExamOverviewHeader; exam_list/get; exams/subjects, descendants chỉ đọc; domain §5.2, structure-be §4/6.2, db.dbml FK/index.
- **Prompt giao codex:** “Cài list/get với join cha sống, count questions/attempts đúng và thứ tự created_at DESC ổn định. Không cài create/update/save. Test bằng fixture đề hợp lệ: cha ẩn, thiếu id, timestamp, thứ tự và unique index cùng/khác môn.”
- **Chấp nhận / Lệnh:** AC-SIZE; repo không mở đường đọc/ghi bản ẩn, dữ liệu con giữ nguyên; `cargo test --manifest-path src-tauri/Cargo.toml exam_repo` tại S01-T10; G1 review trước đăng ký.

### S01-T04 — Component dùng chung
- **Mục tiêu:** UI xóa và breadcrumb tái sử dụng.
- **Thực thi bởi:** subagent codex
- **Nhóm:** P1/W1; **Phụ thuộc:** S01-T01 phần props, primitive Sprint 00.
- **File:** `src/features/subject/DeleteConfirmDialog.tsx`, `src/components/layout/BreadcrumbHeader.tsx` (export Breadcrumb), `src/features/exam/EmptyState.tsx`; không sửa routes/Sidebar.
- **Truy vết:** UC-24/26/27; BR-60, §5.7/§7 reset; DeleteConfirmDialog/Breadcrumb/EmptyState; caller subject_delete/exam_delete; không ghi DB; design §4.23/4.28/4.58/6.8.
- **Prompt giao codex:** “Xây component thuần props theo hợp đồng, dùng tokens/ModalShell Sprint 00, không invoke trong component. Nút xóa có pending, focus an toàn, Escape/backdrop cancel, thông tin tên dài, aria labels; Breadcrumb hỗ trợ reset crumb hiện tại. Không copy JSX ref-ui; không thêm restore/purge.”
- **Chấp nhận / Lệnh:** AC-SIZE; props khớp G0, không tạo nested button, callback confirm chỉ một lần khi pending; `pnpm build`, `pnpm lint`; interaction thực tế S01-T11.

### S01-T05 — Service môn
- **Mục tiêu:** validate tên/màu và lỗi tiếng Việt.
- **Thực thi bởi:** subagent codex
- **Nhóm:** P2/W2; **Phụ thuộc:** S01-T02/G1.
- **File:** `src-tauri/src/services/subject_service.rs`, `services/subject_service_tests.rs`; không error.rs/state.rs/mod.rs.
- **Truy vết:** UC-04; BR-01..07/59; CreateSubjectForm/ColorSwatchGrid; subject_list/create/update; subjects; domain §5.1, structure-be §4.
- **Prompt giao codex:** “Cài service qua trait repo/Clock, trim tên, reject rỗng, validate đủ 8 preset trong BR-02, sinh UUIDv7, giữ màu khi rename. Unique theo G0; loại chính id khi update và map DB duplicate cuối cùng. Unit test mock trait cho empty/preset/duplicate/not-found và clock. Chỉ cung cấp điểm gọi UoW xóa theo hợp đồng S01-T08, không tự viết SQL.”
- **Chấp nhận / Lệnh:** AC-SIZE; input invalid không ghi, lỗi tiếng Việt, created_at bất biến khi sửa; `cargo test --manifest-path src-tauri/Cargo.toml subject_service` sau S01-T10; G2 review trước đăng ký.

### S01-T06 — Service bộ đề
- **Mục tiêu:** đọc bộ đề đúng contract.
- **Thực thi bởi:** subagent codex
- **Nhóm:** P2/W2; **Phụ thuộc:** S01-T03/G1, Q2 đã chốt.
- **File:** `src-tauri/src/services/exam_service.rs`, `services/exam_service_tests.rs`; không sửa file S01-T05.
- **Truy vết:** UC-16; BR-13..16/59/64; ExamOverviewHeader; exam_list/get; subjects/exams; domain §5.2, structure-be §4/6.2.
- **Prompt giao codex:** “Cài list/get qua trait repo; cha/con ẩn trả NotFound. includeAnswers=false loại isCorrect khỏi wire DTO, true trả đáp án cho Sprint 02. Test fixture có câu/options hợp lệ, counts, cha ẩn và serialize/deserialize theo summary §8; không cài exam_save.”
- **Chấp nhận / Lệnh:** AC-SIZE; các case test đúng G0, không sửa/xóa câu ngoài scope; `cargo test --manifest-path src-tauri/Cargo.toml exam_service` sau S01-T10; G2 review trước đăng ký.

### S01-T07 — SCREEN-02 và form môn
- **Mục tiêu:** tạo/sửa/xem/xóa môn qua UI.
- **Thực thi bởi:** subagent codex
- **Nhóm:** P2/W2; **Phụ thuộc:** S01-T04/G1, DTO G0.
- **File:** `src/features/subject/{SubjectListScreen,SubjectCard,CreateSubjectForm,ColorSwatchGrid}.tsx`, `src/hooks/useSubjects.ts`; không DeleteConfirmDialog/commands.ts/routes.
- **Truy vết:** UC-04/05/26; BR-01..07/59/60; SCREEN-02, 4 component trên; subject_list/create/update/delete; subjects; design §4.24..26/SCREEN-02.
- **Prompt giao codex:** “Dùng hooks gọi commands.ts, list loading/error/retry; môn rỗng render lưới trống, không EmptyState (BR-49); form inline đúng design, reuse form cho rename không đổi màu. Có tên/count/màu, action sửa/xóa không kích hoạt mở card. Hủy giữ tên, thành công xóa tên/đóng form/giữ màu; lỗi duplicate inline aria-invalid và toast wrapper, giữ input. Button pending ngăn submit lặp; invalidation theo hợp đồng. Navigation nhận callback, không sửa router.”
- **Chấp nhận / Lệnh:** AC-SIZE; màu 8 preset, keyboard mở card được, error không mất form; `pnpm build`, `pnpm lint`; smoke mutation thật tại S01-T11.

### S01-T08 — UoW xóa mềm nguyên tử
- **Mục tiêu:** cascade/batch đúng để Sprint 05 khôi phục.
- **Thực thi bởi:** subagent codex
- **Nhóm:** P3/W3; **Phụ thuộc:** S01-T02/S01-T03/S01-T05/S01-T06/G2.
- **File:** adapter UoW đã chốt trong manifest G0, mặc định `src-tauri/src/repositories/delete_uow.rs`, `repositories/delete_uow_tests.rs`; không sửa service files song song; S01-T10 nối DI/call sites.
- **Truy vết:** UC-26/27; BR-60, BR-71 hợp đồng tương lai, NFR-14; DeleteConfirmDialog; subject_delete/exam_delete; subjects/exams; structure-be §4/5.5/7.3 với hiệu chỉnh schema nêu trên.
- **Prompt giao codex:** “Cài trait UoW và adapter SQLite trên một connection/transaction: active subject rồi active exams cùng now/batch; exam xóa riêng batch mới; preserve exam đã ẩn. Lỗi bất kỳ rollback toàn bộ; không update nonexistent deleted_at ở descendants. Fixture có question/option/attempt/attempt_answer; test xóa đơn, cascade, stale id, parent ẩn, fail giữa thao tác và rows/FK vẫn nguyên. Inject lỗi ở bước sau ghi đầu để chứng minh rollback thật.”
- **Chấp nhận / Lệnh:** AC-SIZE; timestamp/batch đồng nhất, batch cũ nguyên, no physical delete, rollback không còn nửa cascade; `cargo test --manifest-path src-tauri/Cargo.toml delete_uow` sau S01-T10; G3 review transaction/test.

### S01-T09 — SCREEN-03/04 cơ bản
- **Mục tiêu:** xem/xóa bộ đề từ môn và tổng quan.
- **Thực thi bởi:** subagent codex
- **Nhóm:** P3/W3; **Phụ thuộc:** S01-T04/S01-T06/G2.
- **File:** `src/features/exam/{ExamListScreen,ExamCard,ExamOverviewScreen,ExamOverviewHeader}.tsx`, `src/hooks/{useExams,useExamDetail}.ts`, `src/lib/time.ts`; không EmptyState/commands.ts/routes.
- **Truy vết:** UC-05/16/27; BR-13..16/59/60/64 theo phạm vi đọc/xóa; SCREEN-03/04 và component tương ứng; exam_list/get/delete; subjects/exams; design §4.27..31/SCREEN-03/04.
- **Prompt giao codex:** “Dựng danh sách mới trước, EmptyState cho môn chưa có đề; overview có môn/tên/count/xóa. Tạo/sửa đề chỉ nối ở Sprint 02, không có nút giả chạy. Dùng fixture hợp lệ để smoke đọc/xóa; timezone cố định, invalidate counts/detail, cancel giữ nguyên; nhận navigation callbacks.”
- **Chấp nhận / Lệnh:** AC-SIZE; empty/loading/error đúng, list/get/delete dùng wrapper, không thay dữ liệu câu; `pnpm build`, `pnpm lint`; test thời gian và smoke thật tại S01-T11.

### S01-T10 — Tích hợp toàn bộ command/DI/nav và dev seed
- **Mục tiêu:** luồng end-to-end không mock.
- **Thực thi bởi:** subagent codex
- **Nhóm:** tuần tự W4; **Phụ thuộc:** S01-T02..S01-T09/G3.
- **File:** `src-tauri/src/commands/{subject_cmds,exam_cmds}.rs`, `lib.rs`, `state.rs`, `error.rs`, các `mod.rs` liên quan; nối service S01-T05/S01-T06 với S01-T08; `src/lib/tauri/commands.ts`, `src/{App,main}.tsx`, `src/routes/{index.tsx,paths.ts}`, `src/components/layout/{Sidebar,AppShell}.tsx`, state nav hiện có theo G0. Không đổi config/dependency.
- **Truy vết:** toàn bộ 7 command/UC sprint; Breadcrumb/Sidebar/SCREEN-02..04; BR-01..07/13..16/59/60/64, §5.7 reset; structure-be §3/4/6.2/8.
- **Prompt giao codex:** “Đăng ký 7 command mỏng qua State, map AppError, nối UoW đúng lifetime, đăng ký tất cả test modules; mirror Rust/TS không any. Gắn màn vào router/state đã có, breadcrumb reset đúng cấp và Sidebar giữ vị trí; xử lý stale route sau delete, response cũ và cache. Không thêm router/store mới. Kiểm tra scopes theo phạm vi đọc/xóa, không hardcode thành công.”
- **Chấp nhận / Lệnh:** AC-SIZE; invoke đúng payload/serde, không command thiếu registration, mọi module tests thực sự chạy; `pnpm lint`, `pnpm build`, `cargo fmt --manifest-path src-tauri/Cargo.toml -- --check`, `cargo build --manifest-path src-tauri/Cargo.toml`, `cargo test --manifest-path src-tauri/Cargo.toml`; G4 phải xanh.

### S01-T11 — Kiểm thử cuối sprint và bàn giao
- **Mục tiêu:** chứng minh DoD, thu bằng chứng và checklist Hyan.
- **Thực thi bởi:** subagent codex
- **Nhóm:** tuần tự W5; **Phụ thuộc:** S01-T10/G4.
- **File:** `src-tauri/tests/sprint01_crud.rs` (fixture/helper tách file nếu cần), `src/test/sprint01-crud.test.tsx`, `src/test/time.test.ts`, `docs/sprint/sprint-01-crud-subject-exam.md` (kết quả). Sửa lỗi runtime giao lại chủ task, không sửa vượt phạm vi.
- **Truy vết:** 6 UC/7 command, BR-01..07/13..16/59/60/64 + NFR-14 và batch BR-71; SCREEN-02..04, mọi component sprint; subjects/exams, descendants fixture; summary DoD/§8.
- **Prompt giao codex:** “Chạy toàn bộ tests, thêm integration public service→repo→SQLite và FE smoke dùng harness Sprint 00. FE mock invoke chỉ kiểm tra wiring, không thay thế chạy Tauri với SQLite thật. Kiểm tra matrix ACCEPTANCE bên dưới, reopen app, ghi log/lệnh/exit code/số test và mục chưa chạy. Không cài framework mới để chạy smoke; thiếu harness dùng checklist app thật và báo hạn chế. Không ghi DONE khi Q2 hay kiểm thử còn pending.”
- **Chấp nhận / Lệnh:** AC-SIZE; `pnpm lint`, `pnpm build`, script test FE đã khóa ở G0 (nếu có `test`: `pnpm test`), `cargo fmt --manifest-path src-tauri/Cargo.toml -- --check`, `cargo build --manifest-path src-tauri/Cargo.toml`, `cargo test --manifest-path src-tauri/Cargo.toml`, `pnpm tauri dev`; rà file/hàm ≤200/40, không `.skip`/test module bỏ đăng ký; G5 có checklist và log thực tế.

## ACCEPTANCE / Definition of Done
- [ ] G0 quyết định Q2 được ghi rõ; G1..G5 pass; đủ 7 command gọi qua Tauri và DTO mirror; UC-06/UC-15 thuộc Sprint 02, preview UC-16 hoàn thiện Sprint 02/04.
- [ ] Rust repo + service tests: tên môn trắng bị chặn, đủ palette, rename chính nó hợp lệ; tên trùng create/update bị chặn, khác môn được trùng exam, unique exam được kiểm tra bằng fixture/index; fallback title kiểm tra ở Sprint 02; active/deleted names và normalization theo Q2 được test ở cả service lẫn DB constraint.
- [ ] Rust tests: list/get fixture đề hợp lệ, sort/counts đúng; cha/con ẩn không đọc được; includeAnswers=false không rò isCorrect; không đăng ký exam_save.
- [ ] Dev seed hợp lệ nạp theo hướng dẫn trên, chỉ trong debug và opt-in; release không chứa seed; smoke xem/xóa bộ đề không phụ thuộc Sprint 02.
- [ ] Rust UoW integration: cascade cùng timestamp/batch, giữ batch exam xóa riêng, dữ liệu descendants/attempt snapshots nguyên, FK bật; failure giữa transaction rollback cả cha/con; đọc public API sau xóa không còn item/count ẩn.
- [ ] FE smoke: tạo môn/màu → sửa tên môn → xem tổng quan bộ đề từ fixture hợp lệ → hủy xóa → xác nhận xóa → UI/cache/count/điều hướng đúng; duplicate giữ form + lỗi Việt; pending không gọi hai mutation; lỗi DB không xóa card giả.
- [ ] Breadcrumb root/môn/exam reset đúng state kể cả bấm chính cấp đang mở; Sidebar trở lại đúng vị trí; card/action dùng bàn phím được, dialog focus “Giữ lại”, Escape/backdrop không xóa và focus trở lại nơi hợp lệ.
- [ ] UTC `2026-10-23T18:30:00.000Z` hiển thị `2026-10-24 01:30` bất kể timezone OS; đóng/mở app giữ edits và trạng thái ẩn; lint/build/Rust tests/FE checks pass, không có test đã yêu cầu nhưng bỏ chạy.
- [ ] Code ≤200 dòng/file, ≤40 dòng/hàm; không SQL ở command/service, không invoke trực tiếp ngoài wrapper, không copy ref-ui; handoff có contract cho Sprint 02/05 và sai khác tài liệu.

**Checklist nghiệm thu thủ công — Hyan:** mở app 1280×800 rồi thu về 1024px; tạo 2 môn khác màu, thử trắng/trùng/đổi tên; vào môn rỗng kiểm tra EmptyState, dùng fixture 2 bộ đề hợp lệ để xem/xóa; kiểm tra thứ tự, ngày VN và counts; hủy xóa bằng cả nút/Escape/backdrop; xóa riêng 1 đề rồi xóa môn và kiểm tra ẩn hết; reopen app; thử breadcrumb cùng cấp/root và đổi tab quay lại; Tab/Enter tới card, sửa/xóa, focus dialog. Ghi PASS/FAIL từng bước, phiên bản app và lỗi cụ thể; codex không tự đánh dấu thay Hyan.

**Rủi ro:** transaction qua nhiều connection gây cascade nửa chừng → S01-T08 rollback test; overwritten batch khiến restore sai → fixture exam xóa trước; partial unique khác normalization FE → Q2 và DB direct-write test; cached data hồi sinh sau delete → S01-T10/S01-T11; BR-08 được giữ nguyên bằng cách chuyển tạo/lưu đề sang Sprint 02. Không thêm dependency; nếu baseline thiếu migration/index thì escalate Sprint 00, không chỉnh 001 đã phát hành.

## STOP CONDITIONS (DỪNG NGAY khi đạt 1 trong các điều này)
- Tất cả ACCEPTANCE pass → DỪNG, báo "SPRINT DONE"
- Retry 1 task quá 2 lần mà vẫn fail → DỪNG, escalate
- Phát hiện task cần design decision không có trong spec → DỪNG, hỏi
- Cần thêm dependency ngoài list đã cho → DỪNG, hỏi
- Task vượt quá 30 phút ước tính → DỪNG, chia nhỏ lại

## RETRY BUDGET (giới hạn số lần thử)
- Mỗi task: tối đa 2 lần thử
- Mỗi lần thử: phải thay đổi approach, KHÔNG được lặp y hệt
- Sau lần 2 fail: DỪNG task đó, chuyển sang task khác
- Cuối sprint: list ra các task chưa xong + lý do

## ESCALATION TRIGGERS (khi nào hỏi user)
DỪNG và hỏi user khi:
1. Lỗi không rõ nguyên nhân sau 2 lần debug
2. Cần chọn giữa 2 approach (A vs B) mà spec không nói
3. Cần thay đổi kiến trúc hiện tại (folder structure, store shape)
4. Phát hiện bug ở sprint trước ảnh hưởng sprint này
5. Cần user test thủ công (visual, UX, performance)

## OUT OF SCOPE
Không refactor ngoài manifest task, thêm feature ngoài GOAL, đổi UI ngoài spec/quyết định G0, optimize sớm, viết test không nằm trong task, sửa README/tài liệu nền. Chỉ cập nhật kế hoạch này với quyết định và bằng chứng đã yêu cầu; ghi sai khác nguồn trong handoff để xử lý riêng.

## HANDOFF FORMAT
`STATUS: DONE | PARTIAL | BLOCKED | NEED_INPUT` · `SPRINT: 01`.
- **COMPLETED:** từng mã task, file đổi, hợp đồng/DTO bàn giao, G0 decisions; chỉ ghi việc thực tế xong.
- **VALIDATION:** lệnh, exit code/số test, các gate, checklist Hyan PASS/FAIL/PENDING; ghi rõ test mock và app SQLite thật.
- **FAILED:** task, lỗi, hai approach đã thử, phụ thuộc bị chặn và hỗ trợ cần thiết.
- **NEED_INPUT:** câu hỏi, phương án A/B, tác động scope/migration; kèm sai khác normalization, deleted_at/batch nếu chưa giải quyết.
- **NEXT ACTION:** DONE → “SPRINT DONE — Ready for sprint 02, paste next prompt” (Sprint 05 cũng nhận hợp đồng soft delete); BLOCKED → “Waiting for user response on X”; PARTIAL → “Continue task Y after user confirms”.

**Acceptance wire liên sprint (summary §8):** AC-SIZE; mọi task tạo/sửa DTO phải chạy fixture serialize/deserialize Rust và mapper TS dùng chung; tên JSON camelCase, câu `ask`, option `text`, không rò `isCorrect` trước quiz/nếu includeAnswers=false. S01-T01 tạo fixture, S01-T10 tích hợp và S01-T11 nghiệm thu tuần tự; allowlist `tests/fixtures/wire/subject-exam.json`, `src-tauri/tests/wire_subject_exam.rs`, `src/test/wire-subject-exam.test.ts`; không đổi fixture sprint trước để che lỗi tương thích.
