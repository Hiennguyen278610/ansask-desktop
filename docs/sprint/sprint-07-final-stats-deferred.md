═══════════════════════════════════════════════════════
SPRINT 07 — SPRINT CUỐI: THỐNG KÊ THẬT, Q-07/Q-09 & NGHIỆM THU
═══════════════════════════════════════════════════════


**AC-SIZE — acceptance chung bắt buộc:** mọi task code/config/test phải kiểm tra file ≤~200 dòng và hàm ≤~40 dòng; báo số dòng/file và rà ranh giới hàm trong kết quả task, tách module khi vượt, không nén code để né giới hạn. Mọi acceptance task bên dưới viện dẫn AC-SIZE, gate không pass khi chưa kiểm tra.

**Quy tắc UI bắt buộc:** mọi task UI dùng CSS variables/token light và dark từ Sprint 00; không ghi màu hex trực tiếp trong component hoặc style UI.

## CONTEXT

Sprint 03 đã lưu lượt làm và đáp án; Sprint 04 đã bàn giao lịch sử, xem lại và dashboard còn mock kỳ; Sprint 05/06 đã có thùng rác, theme và AI Guide. Sprint 07 thay dữ liệu thống kê giả bằng aggregate SQLite thật, hoàn thiện donut/metric và nghiệm thu toàn luồng.
Đây là prompt triển khai sau khi các sprint phụ thuộc hoàn tất, không phải xác nhận code hiện tại đã có các chức năng đó. Repo tại thời điểm soạn vẫn là scaffold; đường dẫn và lệnh phụ thuộc phải được đối chiếu ở gate đầu vào.

## GOAL

Bàn giao SCREEN-01 lọc đúng dữ liệu Tuần/Tháng/Năm theo Asia/Ho_Chi_Minh, donut đủ ba nhóm và chartMetric lọc series thật, với toàn bộ kiểm thử bắt buộc pass và Q-07/Q-09 được xử lý theo hợp đồng đã chốt.

### Phạm vi, phụ thuộc và truy vết

- **Trong phạm vi bắt buộc:** nâng cấp `stats_overview`; bỏ offset/mock series; điểm TB, tỉ lệ đúng, tổng câu và phổ điểm theo kỳ; donut ba segment; chuyển `both/score` thật; kiểm thử boundaries, hồi quy và E2E smoke.
- **Trong phạm vi bổ sung:** Q-07 đánh số lượt và Q-09 giới hạn 200; chốt semantics tại S07-T01, triển khai/kiểm thử tại S07-T05. Q-04 đã làm ở Sprint 03/04, chỉ kiểm thử hồi quy snapshot.
- **Ngoài phạm vi:** feature ngoài tài liệu, command mới, màn Settings, auth/cloud, retention tự động thùng rác (BR-80), đổi kiến trúc hoặc nâng dependency không phục vụ acceptance.
- **Phụ thuộc cứng:** Sprint 03, 04, 05, 06; kế thừa nền Sprint 00 và CRUD/import Sprint 01/02 để smoke toàn luồng.
- **UC:** UC-32 thật; UC-01/02/03 cập nhật dữ liệu thật. Các UC khác chỉ kiểm thử hồi quy.
- **BR:** BR-32..BR-35 bản đích, BR-64; BR-31 làm căn cứ công thức, BR-36 giữ sáu lượt gần nhất.
- **NFR:** NFR-04/05/08/09/10/11/13/15/18.
- **SCREEN/component:** SCREEN-01; cập nhật PeriodTabs, ComboChart, DonutGauge, DonutLegend; nối MetricCard, ChartMetricToggle, RecentAttemptList/Row hiện có.
- **Command/bảng:** chỉ nâng cấp `stats_overview`; đọc `attempts.submitted_at`, `score`, `total_questions`, `correct_count`; kế thừa visibility qua subjects/exams. Không thêm bảng cho phần thống kê.

### Tài liệu nền phải đọc

| Nguồn | Mục bắt buộc / mục đích |
|---|---|
| `docs/sprint/sprint-prompt-template.md` | Toàn bộ khuôn, stop/retry/escalation/handoff |
| `docs/sprint/sprint-plan-summarize.md` | §3 quy ước, §4 phụ thuộc, §5 Sprint 07, §8 hợp đồng; đối chiếu §6.7 và §9 để xác định phạm vi |
| `docs/domain-core.md` | §5.4 BR-31..36; §5.9 BR-64; §6 UC-01/02/03/32; §9 NFR-04/05/08/09/10/11/13/15/18; §10 Q-04/05/07/08/09/16/17/18 và §10.4 |
| `docs/design-system.md` | §4.15..4.23, §5 SCREEN-01; §4.19/4.20 và QDS-21 cho donut; §6.14 cho hồi quy dialog an toàn |
| `docs/db.dbml` | Bảng attempts, `submitted_at`, các index `idx_attempts_submitted_at`, `idx_attempts_exam_submitted`, `idx_attempts_subject_submitted`; subjects/exams soft delete; phụ lục Q-04/07/09/16 |
| `docs/structure-be.md` | §4 Strategy kỳ thống kê, §5.4, §6.2/6.3, §7.4, §8 phần dashboard/hooks/useStats, §10 sprint cuối |
| `docs/ref-ui.tsx` | Chỉ đối chiếu L1164–1238, L1490–1861; không chép logic mock làm nguồn thống kê |

**Sai khác tài liệu cần ghi nhận:** §6.14 design-system là dialog, không phải donut; §8 structure-be dùng `features/dashboard`, không có thư mục `features/stats` trong cây hiện tại. Dùng module đã bàn giao từ Sprint 04, không tạo feature song song chỉ vì khác tên. Domain §10.4 và yêu cầu Sprint 07 xác nhận Q-08/Q-18 đã thuộc bản đích dù mô tả cũ còn ghi chưa chốt/all-time. Note Q-05 trong DBML còn ghi giữ mock là mô tả cũ, không áp dụng cho Sprint 07.

### QUY ƯỚC CHO TẤT CẢ SPRINT

**Thực thi bằng subagent codex (bắt buộc).** Mọi công việc triển khai (code, config, migration, test, refactor) đều giao cho `subagent_codex`. Mỗi task có: Mã task, tên, mục tiêu, Thực thi bởi = `subagent codex`, Nhóm chạy (song song P1/P2… hay tuần tự) + Phụ thuộc, Phạm vi file (không giao trùng file giữa task song song), UC/BR/component/command/bảng liên quan (mã + mục tài liệu nền), Prompt giao cho codex (tự chứa), Tiêu chí chấp nhận + Lệnh kiểm tra.

**Song song hóa.** Phân tích đồ thị phụ thuộc, gom nhóm gọi nhiều codex cùng lúc. File dùng chung (`lib.rs`/`invoke_handler`, `mod.rs`, routes, `index.html`, config) gom vào **một task tích hợp** chạy sau cùng nhóm (một codex). Chốt hợp đồng (tên command/DTO/kiểu TS/component/props) trước khi song song. Mỗi sprint có sơ đồ ASCII wave + gate kiểm tra tổng sau mỗi wave. Cuối sprint: task kiểm thử & nghiệm thu (codex) + checklist nghiệm thu thủ công cho Hyan.

**Nội dung bắt buộc mỗi file sprint:** mục tiêu/phạm vi/phụ thuộc; tài liệu nền phải đọc (đường dẫn + mục/mã); hợp đồng tạo ra/dựa vào; sơ đồ wave + task; Definition of Done, checklist nghiệm thu, rủi ro, câu hỏi mở.

**Quy tắc kỹ thuật chung:** phân tầng `commands → services → repositories → db`, DI qua `tauri::State`, Unit of Work cho thao tác nhiều bước; file ≤ ~200 dòng, hàm ≤ ~40 dòng; DRY/SOLID, không over-engineer; Tailwind + `lucide-react`; thời gian lưu UTC, hiển thị `Asia/Ho_Chi_Minh`; schema qua migration đánh số; test Rust SQLite in-memory.

**Sprint 00** phủ toàn bộ §9 `structure-be.md`: Tailwind + lucide-react, crate SQLite/migration/chrono-tz + crate đã chốt (verify version trước khi ghi), capabilities tối thiểu, `tauri.conf.json` 1280×800/minWidth 1024, thay `App.tsx` demo bằng khung app, lint/format/test, script `package.json`.

FE chỉ invoke qua `src/lib/tauri/commands.ts`. Không tự thêm dependency. Mỗi prompt giao task phải kèm các quy ước này, hợp đồng đã chốt, fixture liên quan và đúng danh sách file của task; không giao một câu “làm như sprint trước”.

### Hợp đồng đầu vào và đầu ra

**Đầu vào:** Sprint 03 cung cấp `quiz_start`, `attempt_submit`, `AttemptResultDto`, `GradedQuestionDto`, `attempt_answers.option_order`; Sprint 04 cung cấp `attempt_list`, `attempt_review`, DTO thống kê và SCREEN-01/07; Sprint 05 cung cấp trash/restore/purge và quy tắc visibility; Sprint 06 cung cấp `setting_get/set`, theme, AI Guide. Giữ nguyên tên 27 command theo summary §8, không phát sinh command stats theo từng kỳ.

**Đầu ra:** cùng `stats_overview`, cùng wrapper FE, dữ liệu thật theo hợp đồng dưới đây; báo cáo nghiệm thu và bảng quyết định Q-07/Q-09. Không tuyên bố hoàn tất các mục đang NEED_INPUT.

1. **Wire contract:** `StatsOverviewReq { period: 'week'|'month'|'year', anchor_utc? }` → `StatsOverviewDto { total_exams, total_attempts, avg_score, accuracy, series, score_distribution }` theo structure-be §6.2. Đối chiếu tên thực tế Sprint 04 trước khi sửa: cây Rust §3 gọi `StatsPeriodReq { period, anchor? }`, không được tạo hai định dạng JSON cạnh tranh. `anchor_utc` bỏ trống dùng clock được inject, UI không thêm date picker. Giữ lỗi `AppError` và serializer hiện có; invalid input không được trả số mock thành công.
2. **Khoảng thời gian:** chuyển anchor UTC sang Asia/Ho_Chi_Minh, dựng `[from_local, to_local)`, đổi hai biên về UTC rồi query `submitted_at >= from AND submitted_at < to`. Tuần bắt đầu thứ Hai 00:00, kết thúc thứ Hai tiếp theo; tháng từ ngày 1 đến ngày 1 tháng kế; năm lịch từ 01/01 đến 01/01 năm kế cho metric/distribution; series năm chỉ hiển thị T5..T10 theo contract G0 dưới đây. Không dùng timezone hệ điều hành, không lọc bằng `created_at`, không lấy 7/30/365 ngày trượt.
3. **Công thức:** với tập attempt hợp lệ A trong kỳ, số bài = `|A|`; số câu = `SUM(total_questions)`; TB = `AVG(score)` trên từng lượt, không phải trung bình có trọng số câu; accuracy = `100 * SUM(correct_count) / SUM(total_questions)`. Làm tròn khi hiển thị một chữ số; tập rỗng trả 0, hiển thị `0 / 0.0 / 0 / 0.0%`, không NaN/Infinity.
4. **Điểm thiếu DTO cần chốt G0:** output liệt kê `total_exams` nhưng không có trường rõ nghĩa cho tổng câu. Không gán tổng câu vào `total_exams`, không hiểu tổng bộ đề là tổng lượt. Dùng trường tổng câu Sprint 04 đã chốt nếu có; nếu thiếu, đề xuất bổ sung additive `total_questions` và xác nhận ngữ nghĩa `total_exams` trước khi khóa Rust/TS. Không đổi tên command để xử lý thiếu trường.
5. **Series — quyết định G0 đã khóa:** `SeriesPointDto` wire camelCase theo summary §8, model UI `{ label, count, avgScore }`. Tuần đủ T2..CN. Bucket tháng = tuần trong tháng theo Asia/Ho_Chi_Minh: ngày 1–7, 8–14, 15–21, 22–28, 29–cuối tháng; nhãn Tuần 1..4/5 (tháng 2 có 28 ngày chỉ 4 bucket). Năm = đúng sáu bucket T5..T10 của năm anchor. Metric/distribution vẫn tính cả năm lịch; series chỉ tính các lượt tháng 5..10, lượt tháng 1..4/11..12 không bị mất khỏi metric và không dồn vào bucket khác. Vì vậy tổng count series bằng số bài kỳ với tuần/tháng, còn năm bằng số bài trong cửa sổ T5..T10. Nhãn chart phải nêu “Tháng 5–10 / năm YYYY”, metric là “Năm YYYY”. Bucket rỗng count/avgScore=0. Đây là quyết định thực thi, không chờ chọn 12 điểm tại G0.
6. **Phổ điểm:** `score >= 8.5`, `7 <= score < 8.5`, `score < 7`; chia cho tổng lượt trong kỳ. Đổi “All Time” thành nhãn kỳ đang chọn. Donut dùng tỷ trọng chưa làm tròn và offset cộng dồn, legend format một chữ số; ba nhóm có cùng màu với legend, không lấy track làm nhóm thứ ba. Nhóm 0% không vẽ chấm giả; dữ liệu rỗng chỉ track và tâm `0.0đ`.
7. **chartMetric:** `both` vẽ cột số bài và đường điểm; `score` chỉ đường điểm, bỏ cột và tooltip số bài tương ứng. Nhấn lại `score` trở về `both`, nhấn `both` luôn chọn `both` (UC-03). Không thêm chế độ `count`, không đổi aggregate hoặc gọi command mới. Count 0 không được có cột chiều cao tối thiểu giả.
8. **Visibility và thời gian:** DBML attempts không có `deleted_at`, dù pseudo-SQL §7.4 có điều kiện này. Tái sử dụng cơ chế Sprint 05: join/lọc subjects/exams đang sống nếu schema thực tế không có cột trên attempts; không query cột không tồn tại hay tự thêm migration cho nó. Đổi UTC TEXT theo formatter lưu thống nhất để so sánh đúng, không bọc `submitted_at` bằng hàm làm mất lợi ích index. Lịch sử gần đây giữ sáu lượt toàn cục đang hiển thị, mới nhất trước theo BR-36; chỉ metric/chart/donut theo kỳ.
9. **FE:** query key gồm period và anchor nếu có; response cũ không ghi đè kỳ mới khi click nhanh. Sau submit, soft delete, restore hoặc purge phải invalidate stats và lịch sử liên quan. Loading/error theo pattern hiện có, không biến lỗi DB thành kỳ rỗng hoặc fallback mock.

### Q-07/Q-09 trong phạm vi

| Mục | Hợp đồng đầu vào | Gate và kiểm thử |
|---|---|---|
| Q-07 đánh số | Mặc định tài liệu: mới nhất = #1, ORDER BY submitted_at DESC, id DESC; S07-T01 ghi quyết định hiện hành hoặc quyết định thay thế đã được cung cấp | S07-T05 đồng bộ nhãn lịch sử; test thêm lượt, timestamp bằng nhau, restart |
| Q-09 giới hạn 200 | Tài liệu nền còn mở về hard limit; S07-T01 chốt reject hay clamp và tầng áp dụng với Hyan nếu chưa có quyết định trong bàn giao | S07-T05 triển khai đúng quyết định, kiểm tra 199/200/201 ở UI và invoke trực tiếp; không tự thêm CHECK làm hỏng lịch sử cũ |

Q-07/Q-09 là đầu việc bắt buộc; thiếu quyết định chặn nhánh tương ứng và nghiệm thu cuối, không tự chuyển thành Deferred. Các task thống kê độc lập vẫn tiếp tục.

### Ngoài phạm vi, để dành sau

- Q-16 draft editor: chưa autosave/phục hồi draft.
- Q-17 font offline: giữ fallback hiện có, chưa bundle font.
- Export/backup: không thêm nút, command hoặc auto-backup.
- Retention thùng rác: không làm theo BR-80.

Q-04 không phải hạng mục hoãn: schema Sprint 00, ghi snapshot Sprint 03, đọc snapshot Sprint 04; Sprint 07 chỉ chạy hồi quy sau sửa/xóa câu.

## TASKS

### Sơ đồ wave và quyền sở hữu file

```text
W0 tuần tự: S07-T01 khóa hợp đồng/đầu vào ── G0
                       |
W1 song song P1: S07-T02 backend     || S07-T03 UI thuần props
                       └──────────────┬──────────────┘
                         G1 (test riêng + đối chiếu contract)
                                      |
W2 tuần tự: S07-T04 tích hợp ── G2 (build + test kết nối)
                                      |
W3 tuần tự: S07-T05 Q-07/Q-09 ── G3
                                      |
W4 tuần tự: S07-T06 kiểm thử tổng thể ── G4 (Hyan nghiệm thu)
                                      |
                              HANDOFF SPRINT CUỐI
```

Mỗi task ước tính 15–30 phút; nếu vượt phải chia thành task con có một đầu ra, owner và file list riêng trước khi chạy. Không để hai codex sửa chung file; S07-T02/S07-T03 chỉ chạy đồng thời sau G0. Mọi file dùng chung chỉ S07-T04 sửa; S07-T05 cần chúng phải bàn giao patch cho lượt tích hợp S07-T04 tiếp theo, chạy tuần tự rồi lặp G2. S07-T06 chỉ sửa test/report, không lén sửa nghiệp vụ để xanh test.

### 1. S07-T01 — Khóa hợp đồng Sprint 07

- **Mục tiêu:** lập bản contract thực thi không còn mơ hồ ở các nhánh bắt buộc.
- **Thực thi bởi:** subagent codex.
- **Nhóm/phụ thuộc:** W0 tuần tự; cần bàn giao Sprint 03/04/05/06.
- **Phạm vi file:** chỉ ghi `docs/sprint/sprint-07-contract.md`; đọc sources, manifest, migrations và tài liệu nền. Không sửa tài liệu nền.
- **Truy vết:** UC-01/02/03/32, BR-31..36/64; NFR-04/15; SCREEN-01; `stats_overview`; attempts/index; summary §8, structure-be §5.4/6.2/7.4.
- **Prompt giao codex:** “Đối chiếu bàn giao 03–06 với hợp đồng trong prompt này. Chốt tên request/response, trường tổng câu, semantics total_exams, props PeriodTabs/ComboChart/Donut*, bucket tháng/năm, clock, visibility và định dạng UTC. Ghi đường dẫn thực tế của từng file task, runner/script đã có, phiên bản dependency kế thừa và baseline tests. Ghi quyết định có căn cứ cho Q-07/Q-09; nếu spec mâu thuẫn, đưa phương án cụ thể cho Hyan, không tự sửa domain/schema hoặc bật feature. Chỉ phát hành contract khi các nhánh bắt buộc đã rõ.”
- **Acceptance/G0:** AC-SIZE; đủ dependencies; Rust/TS và props có bảng mapping; bucket tháng Tuần 1..4/5 và năm T5..T10 có expected fixtures bên dưới; không câu hỏi chặn stats; file ownership và lệnh FE/E2E là đường dẫn/lệnh thật. Nếu thiếu baseline, báo BLOCKED.
- **Lệnh kiểm tra:** `pnpm run`; `cargo metadata --manifest-path src-tauri/Cargo.toml --no-deps --format-version 1`; `pnpm build`; `cargo test --manifest-path src-tauri/Cargo.toml`; đọc migration thực tế và scripts để khóa các alias bên dưới.

### 2. S07-T02 — Tính thống kê theo kỳ từ SQLite

- **Mục tiêu:** thay service/repository thống kê mock bằng aggregate thật có boundaries được kiểm chứng.
- **Thực thi bởi:** subagent codex.
- **Nhóm/phụ thuộc:** W1/P1-BE; sau G0; song song S07-T03.
- **Phạm vi file:** `src-tauri/src/services/stats_service.rs`, `src-tauri/src/repositories/stats_repo.rs`, `src-tauri/src/services/stats_mock.rs` (bỏ mock, Sprint 04 tạo), `src-tauri/src/utils/time.rs`; test con cùng module được liệt kê ở contract. Không sửa DTO/mod.rs/state.rs/lib.rs/command hoặc migration ở task này.
- **Truy vết:** UC-32, BR-31..34/64, NFR-04/15; `stats_overview`; attempts đọc, subjects/exams visibility; domain §5.4, structure-be §4/5.4/7.4, DBML index.
- **Prompt giao codex:** “Theo contract G0, dùng Strategy PeriodKind và clock đã có để dựng khoảng nửa mở theo Asia/Ho_Chi_Minh rồi query tham số UTC. Tính số lượt, tổng câu, AVG score, accuracy theo tổng câu, series và ba nhóm điểm từ cùng tập visible attempts. Loại mọi offset và count cố định; không đổi dữ liệu attempt. Viết tests được yêu cầu ở ma trận fixture: unit service với clock cố định, integration repo SQLite in-memory có schema/migration thật và FK. Chỉ sửa file được giao; gửi nhu cầu re-export/DI/DTO cho S07-T04.”
- **Acceptance:** AC-SIZE; fixtures đúng từng biên; không nhân bản count do join; ngày nhuận/chuyển tháng/năm đúng; empty hữu hạn; soft delete/restore nhất quán; query tận dụng index submitted_at phù hợp.
- **Lệnh kiểm tra:** `cargo test --manifest-path src-tauri/Cargo.toml stats`; `cargo test --manifest-path src-tauri/Cargo.toml time`; chạy `EXPLAIN QUERY PLAN` trong test/fixture repo, lưu output. Mỗi filter phải thực sự chạy test, không chấp nhận “0 tests”.

### 3. S07-T03 — Hiển thị chart và donut đúng dữ liệu

- **Mục tiêu:** cập nhật component thuần props để render đủ ba nhóm và lọc series thực sự.
- **Thực thi bởi:** subagent codex.
- **Nhóm/phụ thuộc:** W1/P1-FE; sau G0; song song S07-T02.
- **Phạm vi file:** các file hiện có tương ứng `src/features/dashboard/{PeriodTabs,ChartMetricToggle,ComboChart,DonutGauge,DonutLegend}.tsx` và test component cạnh file; G0 ánh xạ tên khác nếu Sprint 04 dùng PeriodSwitcher/ScoreChart. Không sửa DashboardScreen, hooks, commands.ts, CSS chung hoặc config.
- **Truy vết:** UC-01/02/03; BR-33..35; NFR-10/11/13; design-system §4.16..4.20, SCREEN-01, QDS-21; nhận DTO stats qua props, không truy cập DB.
- **Prompt giao codex:** “Giữ bố cục/tokens SCREEN-01 và props G0. Render count/score từ dữ liệu thật được truyền; both hiện cột+đường, score bỏ cột và nội dung số bài, bấm score lần nữa quay both. Count 0 không vẽ cột giả. Donut có ba segment đúng threshold, offset cộng dồn và tỷ trọng chưa làm tròn; legend cùng nguồn, tâm là TB kỳ, nhãn kỳ thay All Time. Empty chỉ track, không NaN. Giữ keyboard/focus/aria đã có Sprint 06, bổ sung accessible label dữ liệu khi cập nhật component. Viết test cho toggle, ba nhóm/nhóm 100%/0%, empty và props đổi kỳ; không tự gọi invoke.”
- **Acceptance:** AC-SIZE; kiểm tra DOM/SVG xác nhận cột thật sự biến mất; đủ ba segment khi mỗi nhóm >0; không dot giả nhóm 0; tổng cung kín với tập không rỗng; text và aria khớp dữ liệu.
- **Lệnh kiểm tra:** lệnh test FE đã khóa ở G0 (ví dụ nếu runner Vitest hiện có: `pnpm test src/features/dashboard`); `pnpm build`; `pnpm lint`. Không cài runner mới nếu chưa được chốt.

**Gate G1:** tổng hợp kết quả BE/FE, đối chiếu field/type/props, không file xung đột; thiếu re-export tạm thời phải được liệt kê rõ cho S07-T04, không báo build tổng pass khi chưa chạy.

### 4. S07-T04 — Tích hợp `stats_overview` với SCREEN-01

- **Mục tiêu:** kết nối backend/FE và cache invalidation theo cùng hợp đồng.
- **Thực thi bởi:** subagent codex.
- **Nhóm/phụ thuộc:** W2 tuần tự, sau G1; owner duy nhất của file dùng chung.
- **Phạm vi file:** `src-tauri/src/dto/stats_dto.rs`, `commands/stats_cmds.rs`, các `mod.rs` liên quan, `state.rs`, `lib.rs`; `src/lib/tauri/commands.ts`, `src/hooks/useStats.ts`, `useQuizSession.ts`, `useSubjects.ts`, `useExams.ts`, `useTrash.ts`; `src/features/dashboard/DashboardScreen.tsx`, `StatsOverviewCard.tsx`, `ScoreChart.tsx` nếu là composer. Config, `index.html`, migrations chỉ được sửa khi contract Q-07/Q-09 đã chỉ rõ patch; routes không đổi nếu không cần.
- **Truy vết:** UC-01/02/03/32, BR-32..36/64; PeriodTabs/MetricCard/ComboChart/Donut*/RecentAttempt*; `stats_overview` nâng cấp, commands submit/trash chỉ invalidation; summary §8, structure-be §6.2/6.3/8.
- **Prompt giao codex:** “Mirror chính xác Rust DTO và TS G0, nối service qua State và wrapper duy nhất, giữ tên stats_overview và danh sách command. Nối props UI và query key period/anchor; đổi kỳ nhanh không hiển thị response kỳ cũ dưới nhãn kỳ mới. Dùng loading/error có sẵn, không fallback mock. Sau submit/delete/restore/purge invalidate stats và recent attempts, giữ recent sáu lượt toàn cục. Tích hợp patch shared-file do các task bàn giao; schema stats vốn đủ, chỉ migration số tiếp theo khi có bằng chứng cần và kế hoạch được chốt, không sửa migration đã phát hành hoặc reset DB.”
- **Acceptance/G2:** AC-SIZE; Rust/TS serialize khớp; đổi kỳ chạy qua invoke thật; submit làm dashboard đổi ngay; delete/restore/purge cập nhật đúng; restart không mất dữ liệu; không command mới.
- **Lệnh kiểm tra:** `pnpm build`; `pnpm lint`; `pnpm test`; `cargo build --manifest-path src-tauri/Cargo.toml`; `cargo test --manifest-path src-tauri/Cargo.toml`; `cargo fmt --manifest-path src-tauri/Cargo.toml -- --check`.

### 5. S07-T05 — Hoàn thiện Q-07 và Q-09

- **Mục tiêu:** thống nhất đánh số lượt và giới hạn số câu theo quyết định G0.
- **Thực thi bởi:** subagent codex.
- **Nhóm/phụ thuộc:** W3 tuần tự sau G2; quyết định Q-07/Q-09 ở S07-T01 là đầu vào bắt buộc.
- **Phạm vi file:** các file hiện hữu chứa AttemptHistoryPanel/ResultHistoryRow, quiz_service, QuizSetupDialog và tests tương ứng; S07-T01 ghi chính xác từng đường dẫn trước khi giao. File dùng chung vẫn thuộc S07-T04; không sửa schema đã phát hành.
- **Truy vết:** domain §10 Q-07/Q-09, BR-28, NFR-09; attempt_list, quiz_start; attempts chỉ đọc.
- **Prompt giao codex:** “Áp dụng quyết định Q-07/Q-09 trong contract G0. Giữ thứ tự đánh số ổn định khi timestamp bằng nhau và sau restart; áp dụng giới hạn theo reject/clamp và tầng đã chốt, không chỉ dựa HTML max nếu quyết định là hard limit. Test 199/200/201 và pool nhỏ qua UI/wrapper và service; không ảnh hưởng attempt cũ trên 200 câu. Tuân thủ mục Ngoài phạm vi; không thêm snapshot mới. Bàn giao patch file chung cho S07-T04 tích hợp tuần tự rồi chạy lại G2.”
- **Acceptance/G3:** AC-SIZE; cả Q-07/Q-09 có implementation hoặc giữ hành vi hiện hành theo quyết định rõ ràng, kèm test tương ứng; không để quyết định còn mở khi đóng sprint.
- **Lệnh kiểm tra:** `pnpm test`; `pnpm build`; `pnpm lint`; `cargo test --manifest-path src-tauri/Cargo.toml`; chạy lại G2 sau tích hợp.

### 6. S07-T06 — Kiểm thử tổng thể và lập bàn giao cuối

- **Mục tiêu:** chứng minh thống kê thật và các luồng đã bàn giao hoạt động trên app Tauri với SQLite thật.
- **Thực thi bởi:** subagent codex.
- **Nhóm/phụ thuộc:** W4 tuần tự, sau G3; G4 cần Hyan xác nhận phần thủ công.
- **Phạm vi file:** test E2E và fixtures trong thư mục runner đã khóa G0; test hồi quy Rust trong `src-tauri/tests/` theo danh sách G0; `docs/sprint/sprint-07-verification.md`. Chỉ dữ liệu test/temp app-data, không ghi/xóa DB cá nhân; phát hiện bug source → giao lại owner task và rerun gate liên quan.
- **Truy vết:** UC-01..03/32 và hồi quy UC-04..38 đã triển khai; BR-32..35/64/80; NFR-04/05/08/09/10/11/13/15/18; toàn bộ màn và command hiện có ở smoke.
- **Prompt giao codex:** “Chạy ma trận fixture và E2E dưới đây với app-data test cô lập, clock/seed xác định. Smoke phải đi qua Tauri invoke và SQLite thật; FE mock chỉ được ghi là component test. Ghi OS, revision, runner, lệnh, số test, expected/actual, log và đường dẫn evidence. Kiểm tra restart, offline nghiệp vụ, rollback purge, thời gian VN, keyboard/theme/responsive. Không ghi PASS cho test chưa chạy; driver/OS thiếu thì báo BLOCKED và hướng dẫn Hyan chạy bản dựng. Kết thúc lập bảng coverage, giới hạn còn lại, checklist Hyan và handoff sprint cuối.”
- **Acceptance/G4:** AC-SIZE; toàn bộ automated bắt buộc pass; smoke Tauri thật pass; lỗi bắt buộc đã xử lý; Hyan xác nhận checklist thủ công; báo cáo phân biệt PASS/FAIL/BLOCKED/NOT RUN.
- **Lệnh kiểm tra:** `pnpm lint`; `pnpm build`; `pnpm test`; `cargo fmt --manifest-path src-tauri/Cargo.toml -- --check`; `cargo build --manifest-path src-tauri/Cargo.toml`; `cargo test --manifest-path src-tauri/Cargo.toml`; lệnh E2E native đã khóa G0; `pnpm tauri dev` cho nghiệm thu tương tác. Không giả định repo hiện tại đã có `test:e2e`; thiếu runner phải nêu tại G0, không tự thêm dependency.

### Ma trận fixture bắt buộc

| Nhóm | Dữ liệu / thao tác | Kết quả xác minh |
|---|---|---|
| Biên tuần | Anchor `2026-10-24T05:00:00.000Z`; đầu tuần VN 19/10 00:00 | UTC `[2026-10-18T17:00:00.000Z, 2026-10-25T17:00:00.000Z)` |
| Nửa mở | Seed tại from−1 ms, from, to−1 ms, to; lặp cho tuần/tháng/năm đã chốt | Chỉ hai dòng giữa được đếm, không double-count kỳ kế |
| Biên tháng | Tháng 10/2026; thêm lượt ngày 29/30/31 | UTC `[2026-09-30T17:00:00.000Z, 2026-10-31T17:00:00.000Z)`; không rơi mất cuối tháng |
| Nhuận/chuyển năm | 29/02/2024, tháng 2/2025, 31/12→01/01 | Đúng tháng/ngày thực; năm lịch 2026 có UTC `[2025-12-31T17:00:00.000Z, 2026-12-31T17:00:00.000Z)` |
| Khác ngày UTC/VN | `2026-10-18T16:59:59.999Z` và `2026-10-18T17:00:00.000Z` | CN 23:59:59.999 và T2 00:00 VN; đổi TZ máy không đổi kết quả |
| Công thức | Hai lượt (10 câu, 9 đúng, 9.0đ) và (20 câu, 10 đúng, 5.0đ) | 2 bài, 30 câu, TB 7.0; accuracy 63.3%, không 70.0% |
| Ba kỳ khác nhau | Seed thêm lượt ngoài tuần nhưng trong tháng, ngoài tháng nhưng trong năm hợp đồng | Metric/TB/accuracy/distribution đổi theo tập kỳ; series count cộng đúng tổng tuần/tháng hoặc cửa sổ T5..T10 với năm |
| Ngưỡng điểm | 6.9, 7.0, 8.4, 8.5, 10.0 | Cần cố gắng 1/5, Khá giỏi 2/5, Xuất sắc 2/5 |
| Donut | Mỗi nhóm 1/3; chỉ một nhóm 100%; toàn bộ <7; không lượt | Cung từ tỷ trọng thô, legend 33.3% có thể tổng 99.9%; nhóm 0 không có chấm, empty chỉ track |
| Bucket tháng G0 | Anchor tháng 10/2026; 5 lượt lúc 00:00 VN ngày 1/8/15/22/29, điểm lần lượt 1/2/3/4/5 | Tuần 1..5 có count `[1,1,1,1,1]`, avgScore `[1,2,3,4,5]`; ngày 31 cùng Tuần 5; tháng 2/2025 chỉ Tuần 1..4, 29/02/2024 vào Tuần 5. |
| Bucket năm G0 | Anchor 2026; mỗi tháng T1..T12 một lượt điểm 6, mỗi lượt 10 câu/6 đúng | Metric năm: 12 bài, 120 câu, TB 6, accuracy 60%; series T5..T10 count `[1,1,1,1,1,1]`, avgScore toàn 6; tổng series 6, không phải 12. |
| Bucket rỗng | Có lượt ở một bucket, các bucket còn lại rỗng | Bucket rỗng count/TB = 0; không count tối thiểu giả |
| Visibility | Xóa mềm đề/môn → restore → purge trên fixture riêng | Stats ẩn → phục hồi → loại vĩnh viễn; không dùng cột attempts.deleted_at nếu schema không có |
| Đồng thời UI | Chuyển nhanh week→month→year, response trả ngược thứ tự | Nhãn kỳ và dữ liệu luôn cùng request; không stale overwrite |
| Dữ liệu cũ | DB trước Sprint 07, lượt không có attempt_answers, timestamp hợp lệ | Aggregate vẫn từ attempts; không mất điểm/lịch sử; migration nếu có phải giữ bản ghi |

### E2E smoke toàn luồng

1. Mở app với DB test mới: dashboard rỗng, đổi ba kỳ không có số giả; tạo môn/bộ đề, kiểm tra trùng tên.
2. Import JSON/TXT, lỗi theo dòng, chuyển hai định dạng; sửa câu/option và lưu; không cần tính năng import file.
3. Bắt đầu quiz random on/off: câu/option đúng thứ tự hoặc xáo theo cấu hình, radio/checkbox, navigator, timer; bỏ một câu để kiểm tra dialog “Quay lại làm tiếp” rồi “Vẫn nộp”.
4. Chấm exact-set thiếu/dư/sai, lưu một attempt và chi tiết; kiểm tra result, lịch sử, review, làm lại; đóng/mở app vẫn đọc được dữ liệu DB và option_order.
5. Quay dashboard: dữ liệu vừa nộp được tính ngay; ba kỳ đối chiếu expected fixture, chartMetric thật, ba nhóm donut, recent tối đa sáu lượt. Đổi timezone OS trong môi trường test hoặc formatter test vẫn hiển thị VN.
6. Xóa mềm, undo, restore; trường hợp cha bị xóa và conflict tên; purge item/dọn sạch trên test DB. Integration fault injection giữa các bước purge phải rollback toàn bộ; `PRAGMA foreign_key_check` không có lỗi (NFR-18).
7. Theme sáng/tối/hệ thống, mở lại app, đổi OS theme, AI Guide/copy, sidebar, breadcrumb. Ngắt mạng vẫn tạo/làm/lưu/xem thống kê.
8. Fixture 42 và 200 câu: thao tác/cuộn/chọn/nộp, không crash; đo thời gian quan sát thay vì tự đặt SLA. Timer so thời gian trôi thực sai số ≤1s. Với 201 câu ghi đúng quyết định Q-09; chưa duyệt chặn BE thì không báo test chặn đã pass.

## ACCEPTANCE — DEFINITION OF DONE

- [ ] G0 khóa contract không command mới; mọi task có codex owner, phụ thuộc, file, prompt và lệnh thực tế.
- [ ] `stats_overview` dùng submitted_at và `[from,to)` theo VN; boundaries service/repo tests pass, không phụ thuộc clock/TZ máy.
- [ ] Bốn metric, series và phổ điểm tính từ cùng tập visible attempts; không offset +59/+1420/+242/+6150, không series hard-code/fallback mock trong runtime dashboard.
- [ ] Tổng count bucket bằng số bài tuần/tháng hoặc số bài trong cửa sổ T5..T10 với năm; tổng câu/TB/accuracy đúng fixture; metric năm vẫn gồm tháng ngoài T5..T10, nhãn chart nêu cửa sổ rõ ràng.
- [ ] Donut đủ ba segment khi ba nhóm có dữ liệu, legend khớp, empty đúng; chartMetric ẩn/hiện thật với keyboard và trạng thái chọn đúng.
- [ ] Submit/delete/restore/purge làm cache thống kê cập nhật; recent sáu lượt và lịch sử/review không hồi quy; DB cũ không bị reset/reseed tự động.
- [ ] G1/G2/G3 pass; Q-07/Q-09 đã có quyết định và kiểm thử tương ứng; không dùng mục để dành sau làm điều kiện mở rộng sprint.
- [ ] Build/lint/format/unit/integration và E2E smoke Tauri thật toàn luồng pass; test không chạy/thiếu môi trường được ghi BLOCKED, không tính pass.
- [ ] NFR-04/05 được kiểm tra với số bucket đã chốt và fixture 42/200 câu; NFR-08 timer ≤1s; NFR-09 theo quyết định; NFR-10/11/13/15/18 có evidence.
- [ ] Hyan hoàn tất checklist thủ công; báo cáo có kết quả, rủi ro còn lại, phiên bản và đường dẫn evidence; chỉ lúc đó được báo “SPRINT DONE”.

### Checklist nghiệm thu thủ công cho Hyan

- [ ] Mở bản dựng với dữ liệu test được chuẩn bị, đối chiếu expected bốn metric của từng kỳ; xem ngày VN ở lịch sử, kiểm tra kỳ rỗng.
- [ ] Bật `both/score`, nhìn cột biến mất/quay lại; kiểm tra ba màu donut, nhất là toàn bộ lượt <7, và nhãn kỳ thay All Time.
- [ ] Hoàn tất tạo môn → import/sửa đề → quiz → nộp → review → mở lại app → dashboard; ghi lỗi nếu có.
- [ ] Dùng Tab/Enter/Space cho tabs, metric, radio/checkbox; dialog focus nút an toàn, Escape không phá hủy, trả focus; toast có thông báo trợ năng.
- [ ] Xem ở 1280×800 và minWidth 1024, sidebar thu gọn/mở; kiểm tra layout responsive qua viewport test nếu cửa sổ không cho nhỏ hơn; chart/legend không cắt chữ, bảng cuộn được.
- [ ] Theme sáng/tối/hệ thống đúng, không flash trắng; AI Guide copy được; chạy nghiệp vụ khi offline theo phạm vi đã chốt.
- [ ] Với DB test riêng, thử undo/restore/conflict/purge; kiểm tra dashboard cập nhật và không còn bản ghi mồ côi theo evidence.
- [ ] Xác nhận review snapshot không đổi sau sửa/xóa câu; quyết định Q-07/Q-09; ghi ngày và kết quả nghiệm thu.

### Rủi ro và câu hỏi mở

- **Mock/seed cũ:** loại code mock không đồng nghĩa xóa dữ liệu người dùng. Seed chỉ dùng test/dev rõ ràng. Nếu timestamp cũ không chuẩn, kiểm kê và đề xuất migration có test trước; không suy đoán ngày từ nhãn tuần/tháng đã bỏ hoặc đổi điểm lịch sử. Schema submitted_at/index đúng thì không cần migration cho lọc kỳ.
- **Series năm/tháng:** G0 dùng bucket đã khóa và fixture dưới đây; cần ghi rõ chart T5..T10 khác metric năm lịch, không đổi sang 12 điểm.
- **DTO tổng câu:** cần xác nhận field tổng câu và total_exams, không lấy hai field đặt tên giống nhau làm đại diện khác nghĩa.
- **Visibility:** pseudo-SQL khác DBML; lấy schema thực tế và hợp đồng Sprint 05 làm căn cứ, kiểm chứng xóa/khôi phục/purge.
- **Q-07/Q-09:** dùng quyết định G0, không hỏi lại quyết định đã có. Q-04 đã làm ở 03/04; chỉ bản legacy thiếu snapshot không thể backfill chính xác.
- **E2E native:** xác nhận driver/OS từ G0; browser mock không chứng minh SQLite/Tauri persistence. Thiếu môi trường là blocker nghiệm thu, không là lý do tự thay dependency.
- **Sai khác tài liệu nền:** ghi ở verification/handoff thay vì sửa các file nền ngoài phạm vi. Q-08/Q-18/donut đã chốt bởi nhiệm vụ này, không đưa lại thành câu hỏi có làm hay không.

───────────────────────────────────────────────────────
## 🛑 STOP CONDITIONS (DỪNG NGAY khi đạt 1 trong các điều này)
───────────────────────────────────────────────────────

- Tất cả ACCEPTANCE pass → DỪNG, báo "SPRINT DONE".
- Retry 1 task quá 2 lần mà vẫn fail → DỪNG, escalate; không có lần thử thứ ba.
- Phát hiện task cần design decision không có trong spec → DỪNG nhánh phụ thuộc, hỏi bằng phương án cụ thể.
- Cần thêm dependency ngoài list đã cho → DỪNG, hỏi.
- Task vượt quá 30 phút ước tính → DỪNG, chia nhỏ lại trước khi giao codex.

───────────────────────────────────────────────────────
## 🔁 RETRY BUDGET (giới hạn số lần thử)
───────────────────────────────────────────────────────

- Mỗi task: tối đa 2 lần thử.
- Mỗi lần thử: phải thay đổi approach, KHÔNG được lặp y hệt.
- Sau lần 2 fail: DỪNG task đó, chuyển sang task độc lập; không vượt gate phụ thuộc đang fail.
- Cuối sprint: list task chưa xong + lý do + số lần thử + evidence.

───────────────────────────────────────────────────────
## 🚨 ESCALATION TRIGGERS (khi nào hỏi user)
───────────────────────────────────────────────────────

DỪNG và hỏi user khi:

1. Lỗi không rõ nguyên nhân sau 2 lần debug.
2. Cần chọn giữa 2 approach mà spec/bàn giao chưa nói: đặc biệt DTO tổng câu và Q-07/Q-09 có thay đổi hành vi.
3. Cần thay đổi kiến trúc hiện tại (folder structure, store shape).
4. Phát hiện bug sprint trước ảnh hưởng sprint này: ghi repro và owner, không tự refactor ngoài file list.
5. Cần user test thủ công (visual, UX, performance): chuẩn bị bản dựng, fixture và checklist cụ thể trước khi giao Hyan.

───────────────────────────────────────────────────────
## 🚫 OUT OF SCOPE (KHÔNG được làm)
───────────────────────────────────────────────────────

- KHÔNG refactor code ngoài file list ở TASKS/contract đã chốt.
- KHÔNG thêm feature ngoài GOAL hoặc command ngoài 27 command hiện có.
- KHÔNG đổi UI/UX ngoài spec, tự thêm date picker, bộ lọc môn/đề hoặc chế độ metric mới.
- KHÔNG optimize premature; không tự thêm virtualization/cache tầng mới để xử lý rủi ro chưa đo.
- KHÔNG viết test ngoài task yêu cầu; các tests stats, UI, regression/E2E đã nêu là bắt buộc.
- KHÔNG update README/docs ngoài contract và verification được task chỉ rõ.
- KHÔNG reset DB người dùng, xóa seed không phân biệt, sửa migration đã phát hành hay tự triển khai retention.

───────────────────────────────────────────────────────
## 📤 HANDOFF FORMAT (khi DỪNG, báo cáo theo format này)
───────────────────────────────────────────────────────

```text
STATUS: [DONE | PARTIAL | BLOCKED | NEED_INPUT]
SPRINT: 07

✅ COMPLETED:
- [task]: [file changed] | [gate/test/evidence]

❌ FAILED (nếu có):
- [task]: [lỗi] | [đã thử gì, số lần] | [cần gì từ user]

🤔 NEED_INPUT (nếu có):
- [câu hỏi]: [ảnh hưởng] | Option A: [...] | Option B: [...]

📋 DEFERRED:
- [Q-ID/hạng mục]: [Implemented/Kept default/Deferred/Needs input]
  | [căn cứ quyết định] | [rủi ro] | [bước tiếp theo]

🧪 VERIFICATION:
- [lệnh, môi trường, số test]: [PASS/FAIL/BLOCKED/NOT RUN] | [log]
- E2E native Tauri + SQLite: [kết quả/evidence]
- Hyan manual checklist: [kết quả/ngày]
- Sai khác tài liệu nền: [danh sách; không tự sửa]

📋 NEXT ACTION:
- Nếu DONE → "SPRINT DONE — Sprint cuối hoàn tất; bàn giao bản dựng và báo cáo nghiệm thu."
- Nếu BLOCKED/NEED_INPUT → "Waiting for user response on X" + phạm vi bị chặn.
- Nếu PARTIAL → "Continue task Y after user confirms" + phần còn thiếu.
```

Không dùng “Ready for sprint N+1” vì Sprint 07 là sprint cuối. DONE không đồng nghĩa các hạng mục được ghi nhận hoãn đã được triển khai.
