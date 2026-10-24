# Sprint Plan Summary — ansask-desktop (Đợt 5)

> Tài liệu điều phối các sprint thực thi. Viết trước khi spawn subagent viết từng sprint.
> Tổng số sprint: **8** (Sprint 00..07). Mỗi sprint tạo ra phần mềm **chạy được và kiểm thử được**.
> Mọi task triển khai do **subagent `codex`** thực hiện (xem "QUY ƯỚC CHO TẤT CẢ SPRINT").

---

## 1. Mục tiêu sản phẩm và phạm vi

**ansask-desktop** là ứng dụng desktop (Tauri 2 + React 19 + TypeScript + SQLite local) giúp **một người** tự tạo bộ đề trắc nghiệm, làm bài, chấm điểm tức thì và theo dõi tiến độ. Dữ liệu nằm trong SQLite cục bộ ở thư mục app-data của OS, **không đăng nhập, không cloud, không phân quyền** (R5). Toàn bộ vòng đời dữ liệu: Môn → Bộ đề → Câu hỏi → Lựa chọn → Lượt làm bài → Chi tiết đáp án.

**In scope (theo domain-core §1.3 + đợt 2/3):** CRUD một phần môn/bộ đề/câu hỏi/lựa chọn; import JSON/TXT 2 chiều + tô màu cú pháp; làm bài có timer, xáo câu + xáo option (mặc định bật, có thể tắt), chấm exact-set, xem lại đáp án; thống kê dashboard; AI Guide + copy prompt; Theme 3 chế độ; Soft delete + Thùng rác/khôi phục/xóa vĩnh viễn; persist SQLite.

**Out of scope:** auth/cloud/API, import file, xuất file/in/chia sẻ, tìm kiếm/lọc theo từ khóa, phân trang, giới hạn thời gian/auto-submit, dạng câu khác ngoài trắc nghiệm 1 đáp án, giải thích đáp án, ảnh, tag/độ khó, lưu draft editor, font offline, retention tự động thùng rác.

---

## 2. Tài liệu nền (đường dẫn + vai trò)

| File | Vai trò | Mục cần đọc khi viết sprint |
|---|---|---|
| `docs/domain-core.md` | Nghiệp vụ, UC (UC-01..UC-38), BR (BR-01..BR-81), thực thể, luồng điều hướng, NFR, giả định/câu hỏi mở | §4 thực thể, §5 BR, §6 UC, §7 luồng, §8 ma trận, §9 NFR, §10 |
| `docs/design-system.md` | Design tokens, 63 component (4.1..4.63), 9 màn (SCREEN-01..09), overlay/dialog, pattern tương tác | §2 tokens, §3 layout, §4 component, §5 màn hình, §6 pattern, §7 ràng buộc, bảng truy vết |
| `docs/db.dbml` | Schema SQLite 7 bảng, FK, index, migration note | Bảng subjects/exams/questions/answer_options/attempts/app_settings/attempt_answers, FK, index, phụ lục |
| `docs/structure-be.md` | Kiến trúc Rust/FE, stack, cây thư mục, pattern, hợp đồng command (27), luồng mẫu, sprint roadmap, giả định | §1 nguyên tắc/kích thước, §2 stack, §3 cây Rust, §4 pattern, §5 dữ liệu, §6 command, §7 luồng, §8 FE, §9 hạ tầng, §10 lộ trình, §11 |
| `docs/ref-ui.tsx` | Nguồn sự thật UI (2994 dòng) — chỉ tham chiếu theo dòng, không chép code | Theo mã `ref-ui.tsx:Lxxx` trong tài liệu nền |
| `docs/sprint/sprint-prompt-template.md` | Khuôn bắt buộc cho mọi file sprint | Toàn bộ |

---

## 3. Quy ước chung cho mọi sprint

> Đưa **nguyên văn** vào mọi prompt subagent. Tóm tắt ở đây; chi tiết xem mục "QUY ƯỚC CHO TẤT CẢ SPRINT" trong prompt Đợt 5.

**Thực thi bằng subagent codex (bắt buộc).** Mọi công việc triển khai (code, config, migration, test, refactor) đều giao cho `subagent_codex`. Mỗi task có: Mã task, tên, mục tiêu, Thực thi bởi = `subagent codex`, Nhóm chạy (song song P1/P2… hay tuần tự) + Phụ thuộc, Phạm vi file (không giao trùng file giữa task song song), UC/BR/component/command/bảng liên quan (mã + mục tài liệu nền), Prompt giao cho codex (tự chứa), Tiêu chí chấp nhận + Lệnh kiểm tra.

**Song song hóa.** Phân tích đồ thị phụ thuộc, gom nhóm gọi nhiều codex cùng lúc. File dùng chung (`lib.rs`/`invoke_handler`, `mod.rs`, routes, `index.html`, config) gom vào **một task tích hợp** chạy sau cùng nhóm (một codex). Chốt hợp đồng (tên command/DTO/kiểu TS/component/props) trước khi song song. Mỗi sprint có sơ đồ ASCII wave + gate kiểm tra tổng sau mỗi wave. Cuối sprint: task kiểm thử & nghiệm thu (codex) + checklist nghiệm thu thủ công cho Hyan.

**Nội dung bắt buộc mỗi file sprint:** mục tiêu/phạm vi/phụ thuộc; tài liệu nền phải đọc (đường dẫn + mục/mã); hợp đồng tạo ra/dựa vào; sơ đồ wave + task; Definition of Done, checklist nghiệm thu, rủi ro, câu hỏi mở.

**Quy tắc kỹ thuật chung:** phân tầng `commands → services → repositories → db`, DI qua `tauri::State`, Unit of Work cho thao tác nhiều bước; file ≤ ~200 dòng, hàm ≤ ~40 dòng; DRY/SOLID, không over-engineer; Tailwind + `lucide-react`; thời gian lưu UTC, hiển thị `Asia/Ho_Chi_Minh`; schema qua migration đánh số; test Rust SQLite in-memory.

**Package manager chốt: pnpm.** Dùng `pnpm-lock.yaml`; chuẩn kiểm tra FE là `pnpm build`, `pnpm lint`, `pnpm test` (script không watch), chi tiết thiết lập tại Sprint 00.

**Quy tắc UI:** Sprint 00 định nghĩa CSS variables cho cả light/dark và Tailwind v4 `@custom-variant dark`; mọi task UI chỉ dùng token, không hex trực tiếp. Sprint 06 chỉ chuyển đổi/persist/chống nháy theme.

**Sprint 00** phủ toàn bộ §9 `structure-be.md`: Tailwind + lucide-react, crate SQLite/migration/chrono-tz + crate đã chốt (verify version trước khi ghi), capabilities tối thiểu, `tauri.conf.json` 1280×800/minWidth 1024, thay `App.tsx` demo bằng khung app, lint/format/test, script `package.json`.

---

## 4. Bảng tổng quan sprint

| Mã | Tên | Mục tiêu một câu | Phụ thuộc | File chi tiết |
|---|---|---|---|---|
| 00 | Hạ tầng | Dựng nền Tauri+React+SQLite+Tailwind+lucide, lint/test/CI, khung app chạy được | — | `sprint-00-infra.md` |
| 01 | CRUD Môn/Bộ đề | CRUD môn, xem/xóa mềm bộ đề, unique tên, cascade ẩn, dialog xác nhận | 00 | `sprint-01-crud-subject-exam.md` |
| 02 | Câu hỏi & Import | Tạo/lưu bộ đề có câu hỏi, soạn câu hỏi inline, chèn/xóa, option, parse JSON/TXT + tô màu + validate | 01 | `sprint-02-question-import.md` |
| 03 | Quiz & Chấm | Tạo bài ngẫu nhiên (xáo câu+option), làm bài, navigator, cảnh báo nộp, chấm exact-set, lưu attempt | 01, 02 | `sprint-03-quiz-grading.md` |
| 04 | Lịch sử & Thống kê (mock) | Lịch sử làm bài, xem lại đáp án, dashboard metric/series/phổ điểm (mock kỳ) | 03 | `sprint-04-history-stats-mock.md` |
| 05 | Thùng rác | Xem/khôi phục/xóa vĩnh viễn/dọn sạch, undo toast, badge sidebar | 03 (kế thừa 01) | `sprint-05-trash.md` |
| 06 | Theme & AI Guide & Polish | Theme 3 chế độ + chống nháy trắng, AI Guide, sidebar collapse, a11y polish | 00 (theme độc lập) | `sprint-06-theme-guide-polish.md` |
| 07 | Sprint cuối | Lọc thống kê Tuần/Tháng/Năm thật, Q-07/Q-09, kiểm thử tổng thể | 03, 04, 05, 06 | `sprint-07-final-stats-deferred.md` |

> Sprint 05 chạy sau Sprint 03 (attempts/answers thật để kiểm thử purge), kế thừa soft delete Sprint 01. Sprint 06 có thể chạy song song từ Sprint 02 (theme độc lập) nhưng nghiệm thu gom Sprint 07.

---

## 5. Tóm tắt từng sprint (self-contained)

### Sprint 00 — Hạ tầng
- **Mục tiêu:** Dựng khung app chạy được: Tauri 2 + React 19 + TS + Vite + Tailwind v4 + lucide-react + SQLite (rusqlite + migration + pool) + chrono-tz + lint/format/test.
- **Phạm vi trong:** §9 `structure-be.md` toàn bộ; `App.tsx` thay demo bằng khung app; window 1280×800 minWidth 1024; capabilities tối thiểu; script `package.json`.
- **Phạm vi ngoài:** không có feature nghiệp vụ.
- **UC/BR/SCREEN:** không có UC; NFR-01, NFR-03, NFR-06, NFR-12, NFR-14, NFR-16, NFR-17.
- **Phụ thuộc đầu vào:** không.
- **Bàn giao:** app chạy, DB mở + migration 001 tạo 7 bảng, gồm `attempt_answers.question_text`, `options_snapshot`, `correct_option_ids` (Q-04/BR-81), lint/build/test pass.
- **DoD:** `pnpm build`, `pnpm lint`, `cargo build`, `cargo test` pass; app mở cửa sổ đúng kích thước.
- **Rủi ro:** phiên bản crate/Tailwind v4 chưa verify (A1/A9).

### Sprint 01 — CRUD Môn/Bộ đề
- **Mục tiêu:** CRUD môn, xem/xóa mềm bộ đề, unique tên, cascade ẩn, dialog xác nhận, breadcrumb cơ bản.
- **Phạm vi trong:** Subject CRUD + soft delete cascade; exam_list/exam_get/exam_delete trong môn; unique tên (Q-15); DeleteConfirmDialog; SCREEN-02/03/04 cơ bản; breadcrumb reset.
- **Phạm vi ngoài:** tạo/lưu/sửa bộ đề (UC-06/UC-15, exam_save), câu hỏi (Sprint 02), import, quiz.
- **UC:** UC-04, UC-05, UC-16, UC-24, UC-26, UC-27.
- **BR:** BR-01..BR-07, BR-13..BR-16, BR-59, BR-60 (soft delete), BR-64 (hiển thị thời gian).
- **SCREEN:** SCREEN-02, SCREEN-03, SCREEN-04.
- **Component:** SubjectCard, CreateSubjectForm, ColorSwatchGrid, ExamCard, EmptyState, ExamOverviewHeader, Breadcrumb, DeleteConfirmDialog, Sidebar (nav cơ bản).
- **Command:** subject_list, subject_create, subject_update, subject_delete, exam_list, exam_get, exam_delete.
- **Bảng:** subjects, exams (schema từ Sprint 00; feature dùng).
- **Phụ thuộc đầu vào:** Sprint 00 (khung, DB, Tailwind).
- **Bàn giao:** CRUD môn và xem/xóa bộ đề chạy được, xóa mềm ẩn khỏi danh sách, unique tên chặn trùng.
- **DoD:** test Rust repo+service unique/soft delete; FE smoke tạo/sửa môn, xem/xóa đề từ dev seed hợp lệ (debug + opt-in, DB dev trống; không vào release), theo S01-T10/S01-T11.
- **Rủi ro:** cascade soft delete transaction (Unit of Work).

### Sprint 02 — Câu hỏi & Import
- **Mục tiêu:** Tạo/lưu bộ đề có câu hỏi, soạn câu hỏi inline, chèn/xóa, thêm/xóa option, đổi đáp án đúng, parse JSON/TXT 2 chiều, tô màu `ask`/`ans.`, validate ≥2 đáp án & ≥1 đáp án đúng.
- **Phạm vi trong:** exam_save tạo/cập nhật đề và cây câu hỏi atomic; Question/option commands; parsers tokenizer→parser→validator; import_parse; SyntaxHighlightedTextarea; QuestionCard các mode; Editor split pane.
- **Phạm vi ngoài:** quiz.
- **UC:** UC-06, UC-15, UC-07, UC-08, UC-09, UC-10, UC-11, UC-12, UC-13, UC-14.
- **BR:** BR-08..BR-12, BR-37..BR-47, BR-65 (validate TXT + highlight).
- **SCREEN:** SCREEN-05.
- **Component:** QuestionCard, OptionRow, InlineEditableText, AnswerBadge, EditorTitleBar, EditorSplitPane, FormatTabs, CodeEditorTextarea, ParseErrorBanner, InsertQuestionGap, QuestionJumpPopover (editor), SyntaxHighlightedTextarea.
- **Command:** exam_save, question_update, question_insert, question_delete, option_add, option_remove, option_set_correct, import_parse.
- **Bảng:** exams, questions, answer_options.
- **Phụ thuộc đầu vào:** Sprint 01 (exam_get, exam_list, exam_delete, unique và soft delete).
- **Bàn giao:** editor lưu bộ đề ≥2 đáp án/≥1 đáp án đúng; parse JSON/TXT báo lỗi theo dòng; highlight token.
- **DoD:** parser unit test lỗi theo dòng; FE smoke import JSON/TXT.
- **Rủi ro:** parser TXT edge case (dòng nối).

### Sprint 03 — Quiz & Chấm
- **Mục tiêu:** Tạo bài ngẫu nhiên (xáo câu + option, mặc định bật, có thể tắt), làm bài radio/checkbox, navigator, cảnh báo nộp, chấm exact-set, lưu attempt + attempt_answers (option_order và snapshot question_text/options_snapshot/correct_option_ids).
- **Phạm vi trong:** quiz_start (R1), attempt_submit transaction (Q-03/Q-10/Q-11), QuestionNavigatorDialog (quiz), SubmitWarningDialog, QuizScreen render theo position, timer/progress.
- **Phạm vi ngoài:** xem lại (Sprint 04).
- **UC:** UC-18, UC-19, UC-20, UC-29, UC-30, UC-31.
- **BR:** BR-17..BR-30, BR-61..BR-63, BR-67, BR-69, BR-72, BR-73.
- **SCREEN:** SCREEN-06.
- **Component:** QuizConfigModal (QuizSetupDialog), PresetCountGrid, QuizControlBar, QuizProgress, QuestionNavigatorDialog (quiz), SubmitWarningDialog, QuizQuestionCard (radio/checkbox), QuizTimer, QuizProgressbar.
- **Command:** quiz_start, attempt_submit.
- **Bảng:** attempts, attempt_answers (ghi).
- **Phụ thuộc đầu vào:** Sprint 02 (bộ đề có dữ liệu).
- **Bàn giao:** làm bài + nộp + chấm + lưu attempt chạy được; random on/off; checkbox cho câu nhiều đáp án đúng.
- **DoD:** grading_service test exact-set (thiếu/dư/sai); quiz_start test shuffle/clamp.
- **Rủi ro:** option shuffle lưu option_order đúng.

### Sprint 04 — Lịch sử & Thống kê (mock)
- **Mục tiêu:** Lịch sử làm bài, xem lại đáp án chi tiết từ snapshot DB, không phụ thuộc câu/option hiện tại, dashboard metric/series/phổ điểm (kỳ còn mock), làm lại đề.
- **Phạm vi trong:** attempt_list, attempt_review, ScoreBanner, ResultReview, AttemptHistoryPanel, dashboard SCREEN-01 (mock kỳ), SCREEN-07.
- **Phạm vi ngoài:** lọc kỳ thật (Sprint 07).
- **UC:** UC-01, UC-02, UC-03, UC-17, UC-21, UC-22.
- **BR:** BR-31..BR-36 (mock), BR-62, BR-68.
- **SCREEN:** SCREEN-01, SCREEN-07.
- **Component:** MetricCard, PeriodTabs, ChartMetricToggle, ComboChart, DonutGauge, DonutLegend, RecentAttemptList, RecentAttemptRow, AttemptHistoryPanel, ShowAnswersSwitch, ScoreBanner, ResultHistoryRow, ResultReviewRow.
- **Command:** attempt_list, attempt_review, stats_overview (mock).
- **Bảng:** attempts, attempt_answers (đọc).
- **Phụ thuộc đầu vào:** Sprint 03.
- **Bàn giao:** xem lại đáp án sau đóng/mở app; dashboard hiển thị mock kỳ.
- **DoD:** attempt_review test từ DB; FE smoke xem lại.
- **Rủi ro:** attempt cũ không có attempt_answers → chỉ điểm/tổng.

### Sprint 05 — Thùng rác
- **Mục tiêu:** Xem/khôi phục/xóa vĩnh viễn/dọn sạch thùng rác, undo toast, badge sidebar, phân biệt cascade theo đợt.
- **Phạm vi trong:** trash_list, subject_restore, exam_restore, trash_purge_item, trash_empty; RestoreDialog đổi tên khi xung đột; SCREEN-09; NavBadge.
- **Phạm vi ngoài:** retention tự động (không làm).
- **UC:** UC-33, UC-34, UC-35, UC-36, UC-37, UC-38.
- **BR:** BR-71, BR-74, BR-75, BR-76, BR-77, BR-78, BR-79, BR-80.
- **SCREEN:** SCREEN-09.
- **Component:** TrashList, TrashItemRow, RestoreDialog, NavBadge; DeleteConfirmDialog biến thể vĩnh viễn.
- **Command:** trash_list, subject_restore, exam_restore, trash_purge_item, trash_empty.
- **Bảng:** subjects, exams (deleted_at, delete_batch_id).
- **Phụ thuộc đầu vào:** Sprint 03 (attempts/answers/snapshot); kế thừa Sprint 01 (soft delete, delete_batch_id).
- **Bàn giao:** thùng rác chạy end-to-end; khôi phục chặn khi cha bị xóa + đổi tên khi xung đột; purge transaction.
- **DoD:** purge integration test transaction; restore conflict test.
- **Rủi ro:** hard delete cascade thứ tự FK (attempts trước).

### Sprint 06 — Theme & AI Guide & Polish
- **Mục tiêu:** Theme 3 chế độ + chống nháy trắng, AI Guide + copy prompt, sidebar collapse, polish a11y; giữ môn rỗng là lưới trống theo BR-49, polish empty state các danh sách khác.
- **Phạm vi trong:** setting_get/set, ThemeToggle, inline script index.html, AI Guide SCREEN-08, sidebar collapse, polish.
- **Phạm vi ngoài:** feature mới.
- **UC:** UC-23, UC-25, UC-28.
- **BR:** BR-57, BR-58, BR-66.
- **SCREEN:** SCREEN-08.
- **Component:** ThemeToggle, GuideStepCard, PromptBox, CopyPromptButton, Sidebar (collapse).
- **Command:** setting_get, setting_set.
- **Bảng:** app_settings.
- **Phụ thuộc đầu vào:** Sprint 00 (theme độc lập; có thể chạy từ Sprint 02).
- **Bàn giao:** theme persist + không nháy trắng; AI Guide copy prompt.
- **DoD:** theme test light/dark/system + prefers-color-scheme listener; manual checklist.
- **Rủi ro:** localStorage cache vs DB nguồn sự thật.

### Sprint 07 — Sprint cuối (lọc thống kê thật + Q-07/Q-09 + kiểm thử tổng thể)
- **Mục tiêu:** Lọc thống kê Tuần/Tháng/Năm thật (bỏ offset ảo), donut đủ 3 segment, chartMetric lọc series, Q-07/Q-09, kiểm thử tổng thể.
- **Phạm vi trong:** stats_overview lọc thật theo kỳ (Asia/Ho_Chi_Minh boundaries), điểm TB theo kỳ, phổ điểm theo kỳ; Q-07 đánh số, Q-09 giới hạn 200; E2E smoke.
- **Ngoài phạm vi, để dành sau:** Q-16 draft, Q-17 font offline, export/backup. Q-04 đã làm ở Sprint 03/04, chỉ kiểm thử hồi quy.
- **UC:** UC-32 (thật), UC-01..UC-03 (cập nhật dữ liệu thật).
- **BR:** BR-32..BR-35 (thật), BR-64 (ranh giới kỳ).
- **SCREEN:** SCREEN-01 (cập nhật).
- **Component:** PeriodTabs, ComboChart, DonutGauge, DonutLegend (cập nhật).
- **Command:** stats_overview (nâng cấp).
- **Bảng:** attempts (đọc submitted_at).
- **Phụ thuộc đầu vào:** Sprint 03, 04, 05, 06.
- **Bàn giao:** dashboard lọc thật; kiểm thử tổng thể pass.
- **DoD:** stats_service test boundaries; E2E smoke toàn luồng.
- **Rủi ro:** dữ liệu mock cũ cần migration/seed.

---

## 6. Ma trận phủ

### 6.1 UC → Sprint
| Sprint | UC |
|---|---|
| 00 | (không có UC nghiệp vụ) |
| 01 | UC-04, UC-05, UC-16, UC-24, UC-26, UC-27 |
| 02 | UC-06, UC-15, UC-07, UC-08, UC-09, UC-10, UC-11, UC-12, UC-13, UC-14 |
| 03 | UC-18, UC-19, UC-20, UC-29, UC-30, UC-31 |
| 04 | UC-01, UC-02, UC-03, UC-17, UC-21, UC-22 |
| 05 | UC-33, UC-34, UC-35, UC-36, UC-37, UC-38 |
| 06 | UC-23, UC-25, UC-28 |
| 07 | UC-32 (thật), UC-01..UC-03 (cập nhật dữ liệu thật) |

> Tất cả UC-01..UC-38 được gán. UC-32 mock ở Sprint 04 (qua stats_overview mock), thật ở Sprint 07.

### 6.2 SCREEN → Sprint
| Sprint | SCREEN |
|---|---|
| 00 | AppShell khung (không SCREEN nghiệp vụ) |
| 01 | SCREEN-02, SCREEN-03, SCREEN-04 |
| 02 | SCREEN-05 |
| 03 | SCREEN-06 |
| 04 | SCREEN-01, SCREEN-07 |
| 05 | SCREEN-09 |
| 06 | SCREEN-08 |
| 07 | SCREEN-01 (cập nhật) |

### 6.3 Command → Sprint
| Sprint | Command |
|---|---|
| 00 | (không có) |
| 01 | subject_list, subject_create, subject_update, subject_delete, exam_list, exam_get, exam_delete |
| 02 | exam_save, question_update, question_insert, question_delete, option_add, option_remove, option_set_correct, import_parse |
| 03 | quiz_start, attempt_submit |
| 04 | attempt_list, attempt_review, stats_overview (mock) |
| 05 | trash_list, subject_restore, exam_restore, trash_purge_item, trash_empty |
| 06 | setting_get, setting_set |
| 07 | stats_overview (nâng cấp lọc thật) |

> 27 tên command phủ đủ.

### 6.4 Bảng DB → Sprint
| Sprint | Bảng | Ghi chú |
|---|---|---|
| 00 | subjects, exams, questions, answer_options, attempts, app_settings, attempt_answers | Migration 001 tạo toàn bộ schema (7 bảng) |
| 01 | subjects, exams | CRUD môn; đọc/xóa mềm đề |
| 02 | exams, questions, answer_options | Tạo/lưu đề và soạn câu |
| 03 | attempts, attempt_answers | Ghi khi nộp |
| 04 | attempts, attempt_answers | Đọc lịch sử/xem lại |
| 05 | subjects, exams | deleted_at, delete_batch_id |
| 06 | app_settings | Theme |
| 07 | attempts | submitted_at cho lọc kỳ |

### 6.5 Component → Sprint (theo ID design-system §4.1..4.63)

Trạng thái dưới đây là phương án triển khai trong kế hoạch, không xác nhận code đã hoàn tất. `implemented` = triển khai component; `replaced`/`removed` nêu rõ tên thay thế.

| ID | Component nguồn | Sprint / task owner | Trạng thái | Component triển khai / thay thế |
|---|---|---|---|---|
| 4.1 | AppShell | 00 / S00-T05 | implemented | AppShell |
| 4.2 | Sidebar | 00 / S00-T05 | implemented | Sidebar |
| 4.3 | BrandLogo | 00 / S00-T05 | implemented | BrandLogo |
| 4.4 | SidebarToggle | 00 / S00-T05 | implemented | SidebarToggle |
| 4.5 | ProfileCard | 00 / S00-T05 | implemented | ProfileCard |
| 4.6 | NavItem | 00 / S00-T05 | implemented | NavItem |
| 4.7 | SidebarUtilityButton | 00 / S00-T05 | removed | ThemeToggle (§4.55, Sprint 06); Sprint 00 bỏ nút utility cũ |
| 4.8 | Toast | 00 / S00-T04 | implemented | Toast |
| 4.9 | Card | 00 / S00-T04 | implemented | Card |
| 4.10 | InsetPanel | 00 / S00-T04 | implemented | InsetPanel |
| 4.11 | Pill / Chip | 00 / S00-T04 | implemented | Pill / Chip |
| 4.12 | IconButton | 00 / S00-T04 | implemented | IconButton |
| 4.13 | PrimaryActionButton | 00 / S00-T04 | implemented | PrimaryActionButton |
| 4.14 | ScrollArea (scrollbar tuỳ biến) | 00 / S00-T04 | implemented | ScrollArea (scrollbar tuỳ biến) |
| 4.15 | MetricCard | S04-T05 | implemented | MetricCard |
| 4.16 | PeriodTabs (Tuần / Tháng / Năm) | S04-T05 | implemented | PeriodTabs (Tuần / Tháng / Năm) |
| 4.17 | ChartMetricToggle | S04-T05 | implemented | ChartMetricToggle |
| 4.18 | ComboChart (bar + line + grid + axis) | S04-T05 | implemented | ComboChart (bar + line + grid + axis) |
| 4.19 | DonutGauge | S04-T05 | implemented | DonutGauge |
| 4.20 | DonutLegend | S04-T05 | implemented | DonutLegend |
| 4.21 | RecentAttemptList | S04-T05 | implemented | RecentAttemptList |
| 4.22 | RecentAttemptRow | S04-T05 | implemented | RecentAttemptRow |
| 4.23 | Breadcrumb | S01-T04, S01-T10 | implemented | Breadcrumb |
| 4.24 | SubjectCard | S01-T07 | implemented | SubjectCard |
| 4.25 | CreateSubjectForm | S01-T07 | implemented | CreateSubjectForm |
| 4.26 | ColorSwatchGrid | S01-T07 | implemented | ColorSwatchGrid |
| 4.27 | ExamCard | S01-T09 | implemented | ExamCard |
| 4.28 | EmptyState | S01-T09 | implemented | EmptyState |
| 4.29 | ExamOverviewHeader | S01-T09 | implemented | ExamOverviewHeader |
| 4.30 | ShowAnswersSwitch | S04-T04 | implemented | ShowAnswersSwitch |
| 4.31 | AttemptHistoryPanel | S04-T04 | implemented | AttemptHistoryPanel |
| 4.32 | QuestionCard | S02-T03 | implemented | QuestionCard |
| 4.33 | OptionRow | S02-T03 | implemented | OptionRow |
| 4.34 | InlineEditableText | S02-T03 | implemented | InlineEditableText |
| 4.35 | AnswerBadge | S02-T03 | implemented | AnswerBadge |
| 4.36 | EditorTitleBar | S02-T10 | implemented | EditorTitleBar |
| 4.37 | EditorSplitPane | S02-T10 | implemented | EditorSplitPane |
| 4.38 | FormatTabs (TXT / JSON) | S02-T07 | implemented | FormatTabs (TXT / JSON) |
| 4.39 | CodeEditorTextarea | S02-T07 | implemented | CodeEditorTextarea (JSON); SyntaxHighlightedTextarea (§4.59) cho TXT |
| 4.40 | ParseErrorBanner | S02-T07 | implemented | ParseErrorBanner |
| 4.41 | InsertQuestionGap | S02-T03 | implemented | InsertQuestionGap |
| 4.42 | QuestionJumpPopover (editor) | S02-T10 | replaced | QuestionNavigatorDialog (§4.56), variant editor |
| 4.43 | QuizControlBar | S03-T07 | implemented | QuizControlBar |
| 4.44 | QuizProgress | S03-T07 | implemented | QuizProgress |
| 4.45 | QuestionJumpPopover (quiz) | S03-T04 | replaced | QuestionNavigatorDialog (§4.56), variant quiz |
| 4.46 | ScoreBanner | S04-T04 | implemented | ScoreBanner |
| 4.47 | ResultHistoryRow | S04-T04 | implemented | ResultHistoryRow |
| 4.48 | ResultReviewRow | S04-T04 | implemented | ResultReviewRow |
| 4.49 | GuideStepCard | S06-T03 | implemented | GuideStepCard |
| 4.50 | PromptBox | S06-T03 | implemented | PromptBox |
| 4.51 | CopyPromptButton | S06-T03 | implemented | CopyPromptButton |
| 4.52 | ModalShell | 00 / S00-T04 | implemented | ModalShell |
| 4.53 | QuizConfigModal | S03-T07 | replaced | QuizSetupDialog |
| 4.54 | PresetCountGrid | S03-T07 | implemented | PresetCountGrid |
| 4.55 | ThemeToggle | S06-T02 | implemented | ThemeToggle |
| 4.56 | QuestionNavigatorDialog | S02-T10, S03-T04 | implemented | QuestionNavigatorDialog |
| 4.57 | SubmitWarningDialog | S03-T04 | implemented | SubmitWarningDialog |
| 4.58 | DeleteConfirmDialog | S01-T04 | implemented | DeleteConfirmDialog |
| 4.59 | SyntaxHighlightedTextarea | S02-T07 | implemented | SyntaxHighlightedTextarea |
| 4.60 | TrashList | S05-T03 | implemented | TrashList |
| 4.61 | TrashItemRow | S05-T03 | implemented | TrashItemRow |
| 4.62 | RestoreDialog | S05-T03 | implemented | RestoreDialog |
| 4.63 | NavBadge | S05-T05 | implemented | NavBadge |

### 6.6 BR → Sprint (gộp theo nhóm)

Tổng cộng **81 BR (BR-01..BR-81)**; BR-81 snapshot thuộc Sprint 00/03/04.
| Sprint | BR |
|---|---|
| 00 | BR-81 (schema snapshot), NFR-01, NFR-03, NFR-06, NFR-12, NFR-14, NFR-16, NFR-17 |
| 01 | BR-01..BR-07, BR-13..BR-16, BR-59, BR-60, BR-64 (hiển thị) |
| 02 | BR-08..BR-12, BR-37..BR-47, BR-65 |
| 03 | BR-17..BR-30, BR-61..BR-63, BR-67, BR-69, BR-72, BR-73, BR-81 (ghi snapshot) |
| 04 | BR-31..BR-36 (mock), BR-62, BR-68, BR-81 (đọc snapshot) |
| 05 | BR-71, BR-74..BR-80 |
| 06 | BR-57, BR-58, BR-66 |
| 07 | BR-32..BR-35 (thật), BR-64 (ranh giới kỳ), NFR-04, NFR-05, NFR-08, NFR-09, NFR-10, NFR-11, NFR-13, NFR-15, NFR-18 |

#### BR bổ sung — owner, task và acceptance bắt buộc

| BR | Owner sprint / task | Acceptance |
|---|---|---|
| BR-48 | 01 / S01-T07/S01-T09; 05 / S05-T04 | Không tìm kiếm/lọc từ khóa các màn thường; ngoại lệ Thùng rác theo BR-76/UC-33 chỉ lọc ở FE. |
| BR-49 | 01 / S01-T07/S01-T11; 06 / S06-T05 | subjects rỗng render lưới trống, không EmptyState; polish giữ nguyên ngoại lệ. |
| BR-50 | 00 / S00-T02/S00-T03/S00-T08; 07 / S07-T06 | SQLite app-data giữ dữ liệu 7 bảng qua restart; localStorage chỉ cache theme, không dữ liệu nghiệp vụ. |
| BR-51 | 01 / S01-T04/S01-T10; 02 / S02-T10; 03 / S03-T08 | Breadcrumb root/môn/đề đúng mode, editor dùng title trim hoặc Chưa có tiêu đề. |
| BR-52 | 01 / S01-T10/S01-T11 | Click root xóa selection/form/tên, giữ màu, remount và toast reset. |
| BR-53 | 01 / S01-T10/S01-T11 | Click môn xóa selectedExamId/reset counter; toast chỉ khi ở chính trang môn. |
| BR-54 | 01 / S01-T10/S01-T11; 03 / S03-T08; 04 / S04-T06 | Click đề về detail, OFF đáp án, đóng history/config; toast khi cùng cấp. |
| BR-55 | 00 / S00-T05; 01 / S01-T10/S01-T11; 03 / S03-T08 | Đổi tab rồi quay lại giữ view/selection, gồm quizResult; không reset state do unmount tab. |
| BR-56 | 00 / S00-T04/S00-T09 | Chỉ một toast; toast mới thay cũ, timeout 2800ms chỉ xóa message còn hiện hành. |
| BR-70 | 00 / S00-T02/S00-T03/S00-T08; 07 / S07-T06 | DB tại app-data, single-user, không users/auth/cloud; seed chỉ DB trống, không ghi đè dữ liệu. |

### 6.7 Phạm vi Sprint 07 và phần để dành sau
Sprint 07 chỉ làm lọc thống kê thật (Q-05/Q-18), donut đủ ba segment (QDS-21), chartMetric lọc series (Q-08), Q-07, Q-09 và kiểm thử tổng thể. Q-04 đã triển khai tại Sprint 03/04 trên schema Sprint 00.

**Ngoài phạm vi, để dành sau:** Q-16 draft editor, Q-17 font offline, export/backup (§5.6). Retention thùng rác không làm theo BR-80.

---

## 7. Sơ đồ phụ thuộc + đường găng

```text
Sprint 00 ──► Sprint 01 ──► Sprint 02 ──► Sprint 03
    │                                      ├──► Sprint 04 ──┐
    │                                      └──► Sprint 05 ──┤
    └──► Sprint 06 ─────────────────────────────────────────┤
                                                           ▼
                                                       Sprint 07
                                     (phụ thuộc 03, 04, 05, 06)
```

**Đường găng:** 00 → 01 → 02 → 03 → 04 → 07 (6 sprint). Sprint 05 và 06 có thể chạy song song với đường găng (05 sau 03, 06 sau 00/02) và hợp nhất vào 07.

**Ước lượng thời gian tương đối [GIẢ ĐỊNH]:** 00 (lớn, infra) ≈ 2× sprint thường; 01≈1×; 02≈1.5× (parser); 03≈1.5×; 04≈1×; 05≈1×; 06≈1×; 07≈1.5× (kiểm thử). Tổng ≈ 9.5× một sprint thường.

---

## 8. Hợp đồng giữa các sprint

| Từ sprint | Bàn giao | Sprint dùng |
|---|---|---|
| 00 | Khung app (AppShell, Tailwind, lucide), DB pool + migration 001 (7 bảng), lint/build/test scripts, `lib/tauri/invoke.ts` wrapper, `commands.ts` skeleton | 01..07 |
| 01 | subject_* + exam_list/exam_get/exam_delete + DTO (SubjectSummary, ExamDetail), DeleteConfirmDialog, unique tên, soft delete + delete_batch_id, Breadcrumb | 02, 03, 04, 05 |
| 02 | exam_save + ExamSaveReq/QuestionUpsertReq/OptionUpsertReq, question_*/option_* commands, import_parse + ParsedExamDto/ParseIssueDto, SyntaxHighlightedTextarea, editor components | 03, 04 |
| 03 | quiz_start + QuizStartRes (ẩn is_correct, position), attempt_submit + AttemptSubmitReq/AttemptResultDto/GradedQuestionDto, attempt_answers (option_order và ba cột snapshot Q-04), navigator/submit dialogs | 04, 05, 07 |
| 04 | attempt_list/attempt_review + DTO, dashboard mock stats_overview + DTO, SCREEN-01/07 | 07 |
| 05 | trash_* commands + TrashItemDto/RestoreReq, SCREEN-09, NavBadge, restore flow | 07 |
| 06 | setting_get/set + SettingValueDto, ThemeToggle, SCREEN-08, inline script theme | 07 |

**Wire contract cố định:** command vẫn snake_case và payload `{ req: ... }` (trừ command không input đã ghi rõ). Mọi JSON request/response dùng **camelCase**: `ask`, `text`, `isCorrect`, `selectedOptionIds`, `optionOrder`, `subjectId`, `examId`, `deletedAt`, `deleteBatchId`, `includeAnswers`, `createdAt`, `updatedAt`. Rust struct dùng snake_case + `#[serde(rename_all = "camelCase")]`; nội dung câu dùng field `ask`, không xuất `content`. DTO wire là kiểu TS mirror IPC; model UI là kiểu riêng; mapper tường minh chuyển DTO ↔ model UI/domain, không đổi casing wire tùy màn. Tên cột SQLite vẫn snake_case.

**Fixture serialize/deserialize dùng chung:** task tích hợp Sprint 01..04 sở hữu lần lượt `tests/fixtures/wire/{subject-exam,question-import,quiz-attempt,history-stats}.json`; Rust dùng cùng JSON để deserialize và serialize so sánh structural equality, TS đọc chính fixture đó để kiểm tra kiểu/mapper, không sao chép fixture riêng. Fixture có optional absent/null, mảng nhiều đáp án đúng, selectedOptionIds rỗng/nhiều, thứ tự optionOrder và cờ đáp án bị ẩn. `quiz_start`, `attempt_submit` và `attempt_review` luôn dùng `optionOrder: string[]` trên wire, bao gồm AttemptSubmitReq và AttemptResultDto/GradedQuestionDto. JSON string chỉ ở SQLite `option_order`; mapper Rust encode/decode, UI dùng mảng trực tiếp. Snapshot ghi lúc nộp vào question_text/options_snapshot/correct_option_ids; graded/review trả questionText/optionsSnapshot/correctOptionIds; review không join nội dung live. Mọi fixture phải kiểm tra shape cụ thể của DTO, không chuyển kiểu ngầm giữa chúng. Test chạy trong gate tích hợp và suite hồi quy sprint sau.

**TrashItemDto (Sprint 05):** Rust có `subject_id: Option<String>`, `subject_name: Option<String>`; wire `subjectId: string | null`, `subjectName: string | null`, cùng `id`, `kind`, `name`, `deletedAt`, `deleteBatchId`, counts và `deletedByParent`. Exam luôn trả ID/tên môn gốc kể cả môn đã xóa; subject trả null. Đọc mục xóa và parent ID qua `trash_list`; `exam_get` vẫn chỉ đọc active. Nút khôi phục cả môn dùng subjectId từ trash_list, không dựa tên/message hay gọi exam_get với mục xóa.

**Opener/theme:** Sprint 00 giữ `tauri-plugin-opener`, JS package và capabilities opener:default cho AI Guide Sprint 06. Bootstrap/test Sprint 00 và Sprint 06 dùng duy nhất localStorage key `theme`; SQLite app_settings là nguồn bền vững, localStorage chỉ cache trước render.

**Quy ước chung (không đổi giữa sprint):** tên command `{entity}_{action}`; soft delete = set `deleted_at`; thời gian lưu UTC ISO-8601 TEXT; hiển thị `Asia/Ho_Chi_Minh`; file ≤ ~200 dòng, hàm ≤ ~40 dòng; test Rust SQLite in-memory; FE gọi BE qua `lib/tauri/commands.ts` duy nhất.

---

## 9. Rủi ro tổng thể & quyết định đã chốt

**Quyết định đã chốt (Đợt 5):** khôi phục bộ đề khi cha bị xóa = chặn + nút "Khôi phục cả môn" (BR-77); thùng rác không retention (BR-80); một công tắc random chung (BR-73); xung đột tên khôi phục = bắt đổi tên (BR-78); Q-04/BR-81 snapshot bắt buộc từ Sprint 03 và review Sprint 04; Sprint 07 theo phạm vi §6.7.

**Rủi ro tổng thể:**
- Phiên bản Tailwind v4 / crate chưa verify (A1/A9) → Sprint 00 phải verify trước khi ghi version cố định.
- Parser TXT edge case (dòng nối) → Sprint 02 test theo dòng.
- Cascade soft delete transaction (FK RESTRICT) → Sprint 01/05 integration test.
- Option shuffle + option_order phải khớp UI review → Sprint 03 test.
- Dashboard mock → thật ở Sprint 07 có thể vỡ series → cần migration/seed dữ liệu thật.

**Phát hiện cần sửa tài liệu nền (trạng thái sau A; B không sửa tài liệu nền):**
- **Đã xử lý bởi A:** descendants không có deleted_at, ẩn qua cha; batch có từ Sprint 01 trong structure-be §5.5/§7.3.
- **Đã xử lý bởi A:** BR-77 chặn khôi phục khi môn cha bị xóa; BR-78 yêu cầu đổi tên khi xung đột.
- **Đã xử lý bởi A:** cache theme dùng key `theme`, SQLite là nguồn bền vững; TrashItemDto có subjectId/subjectName; DTO serde camelCase.
- **Đã xử lý bởi A:** Q-04/BR-81 và ba cột snapshot; sprint đã đồng bộ schema 00 → ghi 03 → đọc 04.
- **Giữ theo dõi:** thống kê Năm dùng metric năm lịch, series T5..T10 là cửa sổ biểu đồ; Sprint 07 có fixture expected riêng, không coi tổng sáu bucket là tổng năm.
