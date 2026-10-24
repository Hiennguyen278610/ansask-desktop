═══════════════════════════════════════════════════════
SPRINT 04 — LỊCH SỬ & THỐNG KÊ (MOCK)
═══════════════════════════════════════════════════════


**AC-SIZE — acceptance chung bắt buộc:** mọi task code/config/test phải kiểm tra file ≤~200 dòng và hàm ≤~40 dòng; báo số dòng/file và rà ranh giới hàm trong kết quả task, tách module khi vượt, không nén code để né giới hạn. Mọi acceptance task bên dưới viện dẫn AC-SIZE, gate không pass khi chưa kiểm tra.

**Quy tắc UI bắt buộc:** mọi task UI dùng CSS variables/token light và dark từ Sprint 00; không ghi màu hex trực tiếp trong component hoặc style UI.

## CONTEXT

Sprint 03 đã bàn giao `quiz_start`, `attempt_submit`, kết quả chấm exact-set và transaction lưu `attempts` + `attempt_answers`, gồm `position`, `selected_option_ids`, `option_order`. Sprint 00..02 đã có SQLite, migration, khung UI, wrapper invoke và bộ đề có dữ liệu.
Sprint này đọc lịch sử từ DB để mở lại bài sau khi đóng ứng dụng, hoàn thiện SCREEN-07 và SCREEN-01; chỉ kỳ thống kê còn mock, dữ liệu lịch sử phải là dữ liệu thật.
Đây là prompt triển khai sau Sprint 03, không phải xác nhận các sprint trước đã chạy trong checkout hiện tại; kiểm tra bàn giao ở S04-T01 trước khi sửa code.

## GOAL

Người dùng mở lại app, chọn một lượt đã nộp để xem đúng điểm, thứ tự câu và đáp án đã lưu từ SQLite, làm lại đề qua cấu hình quiz, đồng thời xem đủ 4 metric, series mock theo 3 kỳ, phổ điểm và 6 lượt gần nhất trên dashboard.

## PHẠM VI, PHỤ THUỘC VÀ TÀI LIỆU NỀN

- Trong phạm vi: `attempt_list`, `attempt_review`, `stats_overview` mock; SCREEN-01, SCREEN-07; tích hợp OVL-05 ở SCREEN-04 và OVL-02 đã có để làm lại.
- UC chính: UC-01, UC-02, UC-03, UC-17, UC-21, UC-22. UC-16/20 là điểm tích hợp; UC-32 chỉ chuẩn bị hợp đồng, chưa nghiệm thu lọc thật.
- BR chính: BR-31..BR-36 (mock), BR-62, BR-68. Áp dụng thêm BR-60/64/72/74/75 khi đọc dữ liệu, định dạng thời gian, giữ thứ tự option.
- Component: MetricCard, PeriodTabs, ChartMetricToggle, ComboChart, DonutGauge, DonutLegend, RecentAttemptList, RecentAttemptRow, AttemptHistoryPanel, ShowAnswersSwitch, ScoreBanner, ResultHistoryRow, ResultReviewRow; ResultReview là composition các row, không phải màn mới.
- Bảng chính chỉ đọc: `attempts`, `attempt_answers`. Đọc liên quan `subjects`, `exams` để lọc soft delete; nội dung review chỉ đọc snapshot trong `attempt_answers`, không đọc `questions`/`answer_options` hiện tại. Không migration hay backfill snapshot trong sprint này.
- Phụ thuộc bắt buộc: Sprint 03 và các hợp đồng Sprint 00..02 mà Sprint 03 sử dụng. Không triển khai lại grading, random hay submit.
- Dependency phần mềm: chỉ dùng dependency Sprint 00..03 đã chốt/cài; React, TypeScript, Tauri, Tailwind, lucide-react, SQLite và hạ tầng query/test sẵn có. Biểu đồ dùng SVG/CSS, không thêm thư viện chart/router/test mới.

Đọc trước khi triển khai:

| Tài liệu | Mục bắt buộc và mục đích |
|---|---|
| `docs/sprint/sprint-prompt-template.md` | Toàn bộ: cấu trúc, stop/retry/escalation/handoff |
| `docs/sprint/sprint-plan-summarize.md` | §3 quy ước; §4 phụ thuộc; §5 Sprint 04; §8 hợp đồng; §6.7 hạng mục hoãn |
| `docs/domain-core.md` | §4.6 Attempt; §4.8 AttemptAnswer; §5.4 BR-31..36; §5.9 BR-60/62/64/68/72/74/75; §6 UC-01/02/03/17/21/22; §7 điều hướng/reset |
| `docs/design-system.md` | §4.15..4.23 dashboard/Breadcrumb; §4.30..4.31 switch/panel; §4.46..4.48 result; §5 SCREEN-01/07 và OVL-05; §6.10 sticky |
| `docs/db.dbml` | `attempts`, `attempt_answers`, FK mềm, index, ghi chú Q-04/Q-07/Q-19; quan hệ tới bộ đề/môn/câu/lựa chọn |
| `docs/structure-be.md` | §6.2 command; §6.3 mirror TS; §7.4 chỉ tham chiếu hợp đồng đích, chưa áp dụng lọc thật; §8 `features/attempt`, `features/dashboard`, hooks và wrapper |
| `docs/ref-ui.tsx` | L1163–1238 công thức mock; L1490–1861 dashboard; L2207–2288 switch/history; L2676–2781 result; chỉ tham chiếu, không chép nguyên khối code |

Ưu tiên quyết định đợt 2/3 và phạm vi Sprint 04 trong summary khi ref-ui còn RAM hoặc tài liệu mô tả đích Sprint 07. Không tự sửa tài liệu nền; ghi chênh lệch trong handoff.

## QUY ƯỚC CHO TẤT CẢ SPRINT

**Thực thi bằng subagent codex (bắt buộc).** Mọi công việc triển khai (code, config, migration, test, refactor) đều giao cho `subagent_codex`. Mỗi task có: Mã task, tên, mục tiêu, Thực thi bởi = `subagent codex`, Nhóm chạy (song song P1/P2… hay tuần tự) + Phụ thuộc, Phạm vi file (không giao trùng file giữa task song song), UC/BR/component/command/bảng liên quan (mã + mục tài liệu nền), Prompt giao cho codex (tự chứa), Tiêu chí chấp nhận + Lệnh kiểm tra.

**Song song hóa.** Phân tích đồ thị phụ thuộc, gom nhóm gọi nhiều codex cùng lúc. File dùng chung (`lib.rs`/`invoke_handler`, `mod.rs`, routes, `index.html`, config) gom vào **một task tích hợp** chạy sau cùng nhóm (một codex). Chốt hợp đồng (tên command/DTO/kiểu TS/component/props) trước khi song song. Mỗi sprint có sơ đồ ASCII wave + gate kiểm tra tổng sau mỗi wave. Cuối sprint: task kiểm thử & nghiệm thu (codex) + checklist nghiệm thu thủ công cho Hyan.

**Nội dung bắt buộc mỗi file sprint:** mục tiêu/phạm vi/phụ thuộc; tài liệu nền phải đọc (đường dẫn + mục/mã); hợp đồng tạo ra/dựa vào; sơ đồ wave + task; Definition of Done, checklist nghiệm thu, rủi ro, câu hỏi mở.

**Quy tắc kỹ thuật chung:** phân tầng `commands → services → repositories → db`, DI qua `tauri::State`, Unit of Work cho thao tác nhiều bước; file ≤ ~200 dòng, hàm ≤ ~40 dòng; DRY/SOLID, không over-engineer; Tailwind + `lucide-react`; thời gian lưu UTC, hiển thị `Asia/Ho_Chi_Minh`; schema qua migration đánh số; test Rust SQLite in-memory.

**Sprint 00** phủ toàn bộ §9 `structure-be.md`: Tailwind + lucide-react, crate SQLite/migration/chrono-tz + crate đã chốt (verify version trước khi ghi), capabilities tối thiểu, `tauri.conf.json` 1280×800/minWidth 1024, thay `App.tsx` demo bằng khung app, lint/format/test, script `package.json`.

Quy ước chung không đổi giữa sprint: tên command `{entity}_{action}`; soft delete = set `deleted_at`; thời gian lưu UTC ISO-8601 TEXT; hiển thị `Asia/Ho_Chi_Minh`; file ≤ ~200 dòng, hàm ≤ ~40 dòng; test Rust SQLite in-memory; FE gọi BE qua `lib/tauri/commands.ts` duy nhất.

## HỢP ĐỒNG ĐẦU VÀO / ĐẦU RA

### Đầu vào giữ nguyên

- Sprint 00: DB pool, migration 001 đủ 7 bảng, AppError, DI, `lib/tauri/invoke.ts`, scripts lint/build/test, tokens và primitives.
- Sprint 01/02: `exam_get`, ExamDetail, query bộ đề/môn đang sống, QuestionCard/OptionRow, Breadcrumb, formatter giờ VN. Dùng formatter thực tế đã có; không tạo thêm `lib/format/time.ts` nếu đã có `lib/time.ts`.
- Sprint 03: `QuizStartReq/QuizStartRes`, `AttemptResultDto/GradedQuestionDto`, `attempt_submit`, OVL-02 và hook phiên quiz. Dùng `attempt_id` từ submit để gọi review; không dùng `per_question` trong RAM làm nguồn review lâu dài.
- `attempt_answers.position` là thứ tự câu 0-based, `option_order` là thứ tự ID option trong phiên, `selected_option_ids` là tập chọn (`[]` nghĩa là bỏ trống), `is_correct` là kết quả chấm bất biến. Cột đại diện `selected_option_id` không phải nguồn tập chọn.

### Command và DTO bàn giao cho Sprint 07

Các tên command/input dưới đây theo structure-be §6.2. Phần field chưa được spec liệt kê hết được cụ thể hóa ở đây để chốt tại S04-T01 trước khi song song; không thay đổi DTO Sprint 03. Wire JSON camelCase; Rust snake_case + `#[serde(rename_all = "camelCase")]` theo summary §8. DTO wire tách model UI, mapper chỉ chuyển ngữ nghĩa/props, không tạo wire snake_case. Fixture dùng chung kiểm tra Rust serialize/deserialize và TS adapter.

```ts
type StatsPeriod = 'week' | 'month' | 'year';
type ChartMetric = 'both' | 'score';
type AttemptListReq = { examId: string };
type IdReq = { id: string };
type StatsOverviewReq = { period: StatsPeriod; anchorUtc?: string };

type AttemptSummary = {
  id: string; examId: string; examTitle: string;
  subjectId: string; subjectName: string; submittedAt: string;
  totalQuestions: number; correctCount: number;
  score: number; durationSec: number;
};
type ReviewOptionDto = { id: string; text: string; isCorrect: boolean };
type AttemptReviewQuestionDto = {
  position: number; questionId: string | null; ask: string | null;
  selectedOptionIds: string[]; optionOrder: string[];
  isCorrect: boolean; options: ReviewOptionDto[];
  questionText: string | null; optionsSnapshot: { id: string; text: string }[];
  correctOptionIds: string[];
};
type AttemptReviewDto = {
  attempt: AttemptSummary; questions: AttemptReviewQuestionDto[];
};
type SeriesPointDto = { label: string; count: number; avgScore: number };
type ScoreDistributionDto = {
  excellentPct: number; goodPct: number; averagePct: number;
};
type StatsOverviewDto = {
  totalExams: number; totalAttempts: number; totalQuestions: number;
  avgScore: number; accuracy: number; series: SeriesPointDto[];
  scoreDistribution: ScoreDistributionDto;
  recentAttempts: AttemptSummary[];
};
```

- `attempt_list(AttemptListReq) → AttemptSummary[]`: xác nhận bộ đề và môn đang sống; `ORDER BY submitted_at DESC, id DESC`; chưa có lượt trả `[]`, bộ đề thiếu/ẩn trả `NotFound` theo AppError hiện có.
- `attempt_review(IdReq) → AttemptReviewDto`: chỉ trả lượt thuộc bộ đề/môn đang sống; thiếu/ẩn trả `NotFound`. JSON hỏng hoặc lỗi DB trả lỗi theo AppError hiện có, không giả thành “không có chi tiết”.
- `stats_overview(StatsOverviewReq) → StatsOverviewDto`: đọc toàn bộ lượt hợp lệ, không lọc thời gian. Nhận `anchor_utc` để giữ hợp đồng cho Sprint 07 nhưng chưa dùng tính kỳ. Không thêm command lấy recent riêng.
- `total_exams` là số bộ đề đang sống, không dùng làm ô “Đã làm”; ô này lấy `total_attempts`. `total_questions` và `recent_attempts` bổ sung phần dữ liệu cần cho SCREEN-01 mà DTO rút gọn §6.2 chưa liệt kê. `recent_attempts` tối đa 6, toàn cục và không đổi khi đổi kỳ.
- Số trên wire là number; UI format điểm, accuracy, phần trăm 1 chữ số thập phân. Thời điểm wire UTC ISO-8601; UI `YYYY-MM-DD HH:mm` ở `Asia/Ho_Chi_Minh`, không theo timezone máy. `duration_sec` là khoảng thời gian, hiển thị số giây, không đổi múi giờ.
- Tất cả truy vấn lượt/aggregate JOIN kiểm tra `exams.deleted_at IS NULL` và `subjects.deleted_at IS NULL`. `attempts` không có cột `deleted_at`. Snapshot tên lấy từ attempts, không thay bằng tên live.

### Quy tắc dựng review và trạng thái thiếu dữ liệu

1. Đọc attempt summary và chi tiết từ DB trong cùng luồng đọc nhất quán; câu `ORDER BY position ASC`; không xáo lại.
2. Dựng option bằng `option_order`, gán A/B/C/D theo vị trí hiển thị, đối chiếu lựa chọn bằng ID. Không sort theo vị trí gốc của answer_options khi đã có thứ tự phiên.
3. Giữ `is_correct`, điểm và tổng đã lưu; tuyệt đối không chấm lại bằng đáp án hiện tại. Q-04/BR-81: đọc question_text, options_snapshot, correct_option_ids; mapper Rust decode JSON TEXT thành mảng; ask lấy từ questionText, options[].isCorrect suy ra từ correctOptionIds snapshot.
4. FK câu null hoặc option live đã bị xóa: vẫn dựng đầy đủ nội dung từ snapshot, không phụ thuộc bản live. Chỉ bản legacy thực sự thiếu snapshot mới giữ dòng position/kết quả và báo nội dung không còn khả dụng; không backfill từ đề hiện tại. Nếu `option_order=[]` của dữ liệu cũ, không hứa tái hiện được thứ tự; hiện trạng thái thiếu chi tiết lựa chọn, không tự suy đoán nhãn gốc.
5. Attempt cũ không có dòng chi tiết: `questions=[]`; banner điểm/tổng vẫn hiển thị, thông báo “Lượt làm này chưa có chi tiết đáp án được lưu.” Không dựng bài từ đề hiện tại thay thế.
6. Option đúng tô xanh/check; option đã chọn sai tô đỏ/X; câu bỏ trống không có lựa chọn đỏ. Nhiều đáp án dùng tập ID; trạng thái đúng/sai cả câu lấy snapshot, chọn thiếu vẫn sai dù một số option đã chọn đúng. Review chỉ đọc, không nhận onSelect.

### Hành vi dashboard mock cố định

Gọi A là số lượt hợp lệ, Q là tổng câu, C là tổng câu đúng, S là điểm TB (0 nếu A=0). Điểm TB là trung bình điểm các lượt; accuracy là `100*C/Q` (0 nếu Q=0), không lấy trung bình phần trăm từng lượt.

| Kỳ | total_attempts | total_questions | Series `(label,count,avg_score)` |
|---|---|---|---|
| week | A | Q | (T2,3,8.2), (T3,5,8.6), (T4,2,7.9), (T5,6,9.0), (T6,4,8.5), (T7,7,9.1), (CN,max(3,A−2),S) |
| month | A+59 | Q+1420 | (Tuần 1,12,8.1), (Tuần 2,18,8.4), (Tuần 3,15,8.8), (Tuần 4,19+A,S) |
| year | A+242 | Q+6150 | (T5,28,7.8), (T6,35,8.1), (T7,42,8.3), (T8,38,8.5), (T9,50,8.7), (T10,54+A,S) |

S và accuracy không đổi giữa kỳ. Điểm cuối series dùng S làm tròn 1 chữ số như ref-ui. Phổ điểm All Time: xuất sắc ≥8.5; khá giỏi ≥7 và <8.5; cần cố gắng <7; phần trăm `100*count/max(1,A)`. Donut giữ 2 segment như spec, legend đủ 3 nhóm; segment thứ ba ở Sprint 07. Toggle `both/score` chỉ đổi style, vẫn vẽ cả cột và đường; bấm score lần nữa về both.

DB rỗng: tuần hiện `0 / 0.0 / 0 / 0.0%`; tháng/năm vẫn có offset trên; chart vẫn có series mock; donut track và `0.0đ`, 3 legend `0.0%`, bảng recent giữ header và tbody rỗng. Không seed lượt giả vào DB để làm đẹp dashboard.

### Props và điều hướng chốt trước khi song song

- MetricCard `{label,value,delta,icon}`; PeriodTabs `{value:StatsPeriod,onChange}`; ChartMetricToggle `{value:ChartMetric,onChange}`; ComboChart `{series}`; DonutGauge `{distribution,avgScore}`; DonutLegend `{distribution}`.
- RecentAttemptList `{attempts,onSeeAll}` và RecentAttemptRow `{attempt,index}`: row tĩnh; nút “Làm đề mới” chuyển tab exams và giữ điều hướng hiện tại theo spec.
- AttemptHistoryPanel `{attempts,onClose,onReview(attemptId)}`: panel inline, không backdrop/focus trap; chọn lượt bằng nút/link có nhãn để vào SCREEN-07. Đây là cập nhật cần thiết của UC-21 sau mở lại app, ưu tiên hơn ref-ui row tĩnh.
- ScoreBanner `{result,onBack,onRetry}`; ResultHistoryRow `{attempt,index,isLatest}`; ResultReview `{questions}`; ResultReviewRow `{question}`. `isLatest` chỉ true cho lượt vừa submit trong phiên đang chạy, không dán “Vừa xong” cho lượt mở lại sau restart.
- ShowAnswersSwitch `{checked,onChange}` chỉ dùng preview SCREEN-04, reset OFF khi về tổng quan đề; không tắt đáp án đúng ở review.
- SCREEN-07 nhận `attemptId` qua cơ chế điều hướng đã có, gọi review từ DB, không phụ thuộc `lastQuizResult` còn trong RAM. ResultHistoryRow vẫn tĩnh; đường mở lượt cũ bắt buộc nằm ở OVL-05.
- “Làm lại đề” mở OVL-02, giữ số câu đang có trong phiên; sau restart dùng default hiện có của Sprint 03, không thêm persist cấu hình. Chỉ khi xác nhận mới gọi `quiz_start`, reset đáp án/timer; hủy config giữ review và attempt cũ.
- Hook history key gồm exam ID, review key gồm attempt ID, stats key gồm period/anchor nếu có. Sau submit invalidate history/stats; bỏ response cũ khi chuyển lượt/kỳ nhanh. Dùng loading/error pattern sẵn có cho IPC, không hiển thị lỗi như danh sách rỗng.
- Không thêm sticky cho dashboard/result/Breadcrumb. Chỉ QuizControlBar giữ sticky theo design-system §6.10.

## TASKS

Mỗi task dưới đây giao cho **subagent codex**, kèm nguyên khối quy ước chung và hợp đồng ở trên. Đường dẫn là allowlist theo structure-be; S04-T01 đối chiếu checkout để khóa tên file tương đương trước khi chạy song song. Không đổi kiến trúc để ép cây file theo tài liệu. Mỗi task ước tính ≤30 phút; nếu vượt phải tách nhỏ và cập nhật ownership trước khi triển khai.

```text
Sprint 03 bàn giao
       |
W0  S04-T01 Chốt DTO, API/props và ownership (tuần tự)
       | G0: hợp đồng + prerequisite đã xác nhận
W1  +-- S04-T02 BE lịch sử/review --------+
    +-- S04-T03 BE dashboard mock -------+  P1, file không trùng
    +-- S04-T04 UI lịch sử/result -------+
    +-- S04-T05 UI dashboard ------------+
       | G1: rà diff/ownership, kiểm tra leaf và fixtures
W2  S04-T06 Tích hợp module, invoke, hooks, routes (tuần tự)
       | G2: build/lint/cargo test pass, 3 command gọi được
W3  S04-T07 Kiểm thử DB + FE smoke + nghiệm thu (tuần tự)
       | G3: toàn bộ acceptance + Hyan checklist có bằng chứng
       +--> SPRINT DONE / báo blocker cụ thể
```

Có thể xếp hàng P1 theo giới hạn số agent; không giảm kiểm tra gate. G1 chưa yêu cầu app build khi module mới chưa được S04-T06 đăng ký; không cho worker tự sửa `mod.rs` để làm build xanh. Nếu test leaf không chạy trước đăng ký, ghi rõ và chạy bắt buộc tại G2.

### S04-T01 — Chốt hợp đồng triển khai

- **Mục tiêu:** khóa DTO/props/API và allowlist thực tế để các worker không sửa trùng file.
- **Thực thi bởi:** subagent codex. **Nhóm:** W0 tuần tự. **Phụ thuộc:** Sprint 03.
- **Phạm vi file:** `src-tauri/src/dto/attempt_dto.rs`, `src-tauri/src/dto/stats_dto.rs` (DTO); chưa sửa file dùng chung. Nếu model khác tên, khóa tên hiện có trong bàn giao G0. Không sửa DTO submit đang dùng.
- **Truy vết:** structure-be §6.2/6.3/§8; summary §8; toàn bộ 3 command và hai bảng chính.
- **Prompt giao cho codex:** “Kiểm tra DB schema, wrapper invoke, scripts và hợp đồng Sprint 03; chốt các DTO/props của Sprint 04 theo phần hợp đồng trong prompt này. Bổ sung DTO Rust cần thiết, giữ API cũ, liệt kê mapping snake_case/camelCase, ownership file cho W1 và file tích hợp cho W2. Xác nhận mọi package cần dùng đã có. Không triển khai tính năng hay sửa bug sprint trước; thiếu prerequisite thì báo BLOCKED cùng bằng chứng.”
- **Chấp nhận:** AC-SIZE; G0 có field/type/nullability và input envelope phù hợp wrapper hiện tại; 4 nhánh W1 không chung file; xác nhận `option_order` có trong dữ liệu nộp.
- **Kiểm tra:** AC-SIZE; `rg -n 'attempt_submit|option_order|selected_option_ids|generate_handler' src-tauri/src`; `cat package.json`; `cargo check --manifest-path src-tauri/Cargo.toml` để ghi baseline trước khi module mới đăng ký.

### S04-T02 — Đọc lịch sử và review từ SQLite

- **Mục tiêu:** triển khai hai command đọc bảo toàn dữ liệu lượt làm.
- **Thực thi bởi:** subagent codex. **Nhóm:** W1/P1. **Phụ thuộc:** G0.
- **Phạm vi file:** `src-tauri/src/repositories/attempt_repo.rs`, `attempt_answer_repo.rs` trong cùng thư mục; `src-tauri/src/services/attempt_service.rs`; `src-tauri/src/commands/attempt_cmds.rs`. Giữ nguyên đường ghi submit. Không sửa dto/mod.rs/lib.rs.
- **Truy vết:** UC-17/21; BR-62/68/60/72; domain §4.6/4.8; db.dbml attempts/attempt_answers; structure-be §6.2; AttemptHistoryPanel, ResultReviewRow.
- **Prompt giao cho codex:** “Thực hiện attempt_list và attempt_review qua command → service → repository, DI hiện có. Danh sách mới trước, lọc bộ đề/môn bị ẩn. Review đọc DB, giữ position, option_order, selected_option_ids và is_correct snapshot, đọc question_text/options_snapshot/correct_option_ids, không join câu/options live; nullable FK không làm mất snapshot. Áp dụng đầy đủ quy tắc thiếu chi tiết trong hợp đồng; không chấm lại, không ghi DB, không thêm snapshot migration. Giữ nguyên submit của Sprint 03 và trả AppError hiện có.”
- **Chấp nhận:** AC-SIZE; summary/history trả đúng tên snapshot; lượt cũ chỉ điểm/tổng; thiếu nội dung không panic; không cần RAM; response đúng DTO G0.
- **Kiểm tra:** AC-SIZE; `rustfmt --check --edition 2021 src-tauri/src/repositories/attempt_repo.rs src-tauri/src/repositories/attempt_answer_repo.rs src-tauri/src/services/attempt_service.rs src-tauri/src/commands/attempt_cmds.rs` (dùng edition thực tế trong Cargo.toml nếu khác); sau G2 chạy test DB S04-T07.

### S04-T03 — Tính dashboard mock qua stats_overview

- **Mục tiêu:** cấp toàn bộ dữ liệu SCREEN-01 bằng một hợp đồng ổn định.
- **Thực thi bởi:** subagent codex. **Nhóm:** W1/P1. **Phụ thuộc:** G0.
- **Phạm vi file:** `src-tauri/src/repositories/stats_repo.rs`, `src-tauri/src/services/stats_service.rs`, `src-tauri/src/services/stats_mock.rs`, `src-tauri/src/commands/stats_cmds.rs`. Không sửa attempt_repo.rs của S04-T02.
- **Truy vết:** UC-01/02/03; BR-31..36 (mock), BR-60; structure-be §6.2/7.4 (đích); attempts, exams, subjects; dashboard components §4.15..22.
- **Prompt giao cho codex:** “Đọc các lượt hợp lệ từ DB, tổng hợp bốn metric, distribution All Time, sáu lượt mới nhất và total_exams. Dựng series/offset đúng bảng mock trong hợp đồng, gồm DB rỗng; nhận nhưng chưa dùng anchor_utc để lọc. Tách constants mock để Sprint 07 thay thế, không lưu mock vào DB. Dùng DTO G0, AppError/DI có sẵn, không bổ sung thư viện hay sửa repo worker khác.”
- **Chấp nhận:** AC-SIZE; đúng offset 59/1420 và 242/6150, 7/4/6 điểm series, accuracy có trọng số theo câu, recent ≤6 và lọc ẩn; không WHERE theo kỳ.
- **Kiểm tra:** AC-SIZE; `rustfmt --check --edition 2021 src-tauri/src/repositories/stats_repo.rs src-tauri/src/services/stats_service.rs src-tauri/src/services/stats_mock.rs src-tauri/src/commands/stats_cmds.rs` (edition theo repo); test fixture ở S04-T07 sau đăng ký.

### S04-T04 — Dựng UI lịch sử và kết quả

- **Mục tiêu:** render SCREEN-07 và panel lịch sử từ props đã chốt.
- **Thực thi bởi:** subagent codex. **Nhóm:** W1/P1. **Phụ thuộc:** G0.
- **Phạm vi file:** `src/features/attempt/{AttemptReviewScreen,AttemptHistoryPanel,ScoreBanner,ResultHistoryRow,ResultReview,ResultReviewRow}.tsx`; `src/features/exam/ShowAnswersSwitch.tsx`. Tái sử dụng component đã có, không tạo bản trùng; chưa sửa màn exam/quiz/router.
- **Truy vết:** UC-17/21/22; BR-62/68; design-system §4.30/31/46..48, SCREEN-07, §6.10; attempt_list/review; attempts/attempt_answers qua props.
- **Prompt giao cho codex:** “Dựng các component theo props hợp đồng, tokens/Tailwind/lucide hiện có. Panel inline có mở/đóng, empty text và nút chọn lượt; banner điểm/thời lượng có Back/Retry; ResultReview chỉ đọc, hỗ trợ tập nhiều đáp án, thứ tự đã lưu và thiếu dữ liệu. ShowAnswersSwitch chỉ preview. Không thêm sticky hay logic shuffle/grading; không invoke trực tiếp trong presentational component. Chuẩn bị loading/error và nhận dữ liệu/callback để S04-T06 nối hook.”
- **Chấp nhận:** AC-SIZE; đủ các component trong allowlist; điểm 0 vẫn badge hoàn thành; thiếu chi tiết không crash; màu đúng/sai/blank theo hợp đồng; selected review không tự coi là vừa nộp.
- **Kiểm tra:** AC-SIZE; `pnpm exec tsc --noEmit` sau G2; G1 rà import/props, giới hạn file/hàm và không gọi raw invoke bằng `rg -n 'invoke|sticky|shuffle' src/features/attempt`.

### S04-T05 — Dựng UI dashboard

- **Mục tiêu:** render SCREEN-01 từ StatsOverviewDto và state kỳ/metric.
- **Thực thi bởi:** subagent codex. **Nhóm:** W1/P1. **Phụ thuộc:** G0.
- **Phạm vi file:** `src/features/dashboard/{DashboardScreen,MetricCard,PeriodTabs,ChartMetricToggle,ComboChart,DonutGauge,DonutLegend,RecentAttemptList,RecentAttemptRow}.tsx`. Không sửa tokens/global CSS/routes/hooks.
- **Truy vết:** UC-01/02/03; BR-31..36; design-system §4.15..23, SCREEN-01, §6.10; stats_overview; attempts qua DTO.
- **Prompt giao cho codex:** “Dựng SCREEN-01 đúng thứ tự bốn metric, combo chart, donut/legend, recent table. Dữ liệu nhận qua props; không nhân đôi công thức mock ở FE. PeriodTabs phát callback, ChartMetricToggle chỉ đổi style theo hợp đồng. SVG/CSS theo design-system, donut hai segment/legend ba nhóm, recent row tĩnh, bảng rỗng giữ header. Giữ layout responsive và callback chuyển tab exams; dùng pattern loading/error hiện có để nhận IPC ở bước tích hợp.”
- **Chấp nhận:** AC-SIZE; 4 metric, 3 period, 2 toggle; mọi nhãn/tooltip lấy DTO; không phụ thuộc state quiz; recent table cuộn ngang; không thêm chart dependency.
- **Kiểm tra:** AC-SIZE; `pnpm exec tsc --noEmit` sau G2; G1 rà props và `rg -n 'invoke|59|1420|6150|sticky' src/features/dashboard` để phát hiện logic BE hoặc sticky lọt vào UI.

### S04-T06 — Tích hợp command, hooks và điều hướng

- **Mục tiêu:** nối các leaf W1 thành luồng app chạy được.
- **Thực thi bởi:** subagent codex. **Nhóm:** W2 tuần tự. **Phụ thuộc:** G1, tất cả S04-T02..S04-T05.
- **Phạm vi file:** `src-tauri/src/lib.rs`, `src-tauri/src/{commands,dto,services,repositories}/mod.rs`; `src/lib/tauri/commands.ts`; `src/hooks/{useAttemptHistory,useStats,useQuizSession}.ts`; `src/App.tsx`, `src/routes/{index.tsx,paths.ts}` nếu tồn tại; `src/features/exam/ExamOverviewScreen.tsx`, `src/features/quiz/QuizScreen.tsx`, `src/features/attempt/AttemptReviewScreen.tsx`, `src/features/dashboard/DashboardScreen.tsx`. Chỉ nối DI/exports/IPC/navigation/invalidation; không sửa config/index.html/store shape.
- **Truy vết:** cả 6 UC; domain §7; structure-be §8; 3 command mới + quiz_start/attempt_submit/exam_get đã có; SCREEN-01/04/06/07, OVL-02/05.
- **Prompt giao cho codex:** “Đăng ký module/DI và 3 command một lần tại vị trí có sẵn; mirror DTO và wrapper trong commands.ts. Nối hooks keyed theo ID/kỳ, loading/error và xử lý response cũ. Submit thành công lấy attempt_id gọi review; history mở lượt cũ bằng ID kể cả sau restart. Retry mở config giữ input trong phiên, chỉ xác nhận mới start/reset; Back reset switch/panel/config. Invalidate stats/history sau submit. Không đổi kiến trúc navigation/query và không raw invoke ngoài wrapper.”
- **Chấp nhận:** AC-SIZE; gọi được ba command; điều hướng đến review không yêu cầu RAM quiz; không đăng ký trùng attempt_submit; scripts/build không regression; hoàn tất checks bị hoãn tại G1.
- **Kiểm tra G2:** `pnpm lint`; `pnpm build`; `cargo fmt --manifest-path src-tauri/Cargo.toml --check`; `cargo test --manifest-path src-tauri/Cargo.toml`; `cargo build --manifest-path src-tauri/Cargo.toml`. Scripts thiếu do chưa có Sprint 00 phải báo prerequisite, không tự mở rộng scope để cài.

### S04-T07 — Kiểm thử DB và nghiệm thu FE

- **Mục tiêu:** chứng minh review persist và dashboard mock đúng hợp đồng.
- **Thực thi bởi:** subagent codex. **Nhóm:** W3 tuần tự. **Phụ thuộc:** G2.
- **Phạm vi file:** test Rust trong module `#[cfg(test)]` của attempt/stats service/repo đã liệt kê; test helper trong cùng phạm vi; `src/test/attempt-history.smoke.test.tsx` nếu harness FE đã có từ Sprint 00. Được viết các test được yêu cầu dưới đây; không tạo framework mới, không sửa docs/README.
- **Truy vết:** DoD summary Sprint 04; UC-01/02/03/17/21/22; BR-31..36/62/68; hai bảng chính và bảng live dùng join.
- **Prompt giao cho codex:** “Viết test qua service/repo thật với SQLite in-memory và migration hiện có, không mock repository cho bằng chứng review từ DB. Seed hoặc submit một lượt, bỏ dữ liệu phiên và tạo service đọc mới trên cùng DB để review; kiểm tra thứ tự câu/option, tập chọn và điểm snapshot. Thực hiện ma trận dưới đây, chạy FE smoke qua wrapper với harness sẵn có nếu có; kiểm tra restart thật bằng app-data DB qua checklist Hyan. Ghi từng kết quả/lệnh/lỗi; không tuyên bố restart đã pass chỉ từ in-memory test. Nếu cần Hyan thao tác, báo NEED_INPUT với bước cụ thể.”
- **Chấp nhận:** AC-SIZE; các test bắt buộc pass; smoke history → review → retry/back pass; checklist thủ công có kết quả hoặc đánh dấu pending, không báo DONE khi còn acceptance chưa xác minh.
- **Lệnh kiểm tra:** `cargo test --manifest-path src-tauri/Cargo.toml attempt`; `cargo test --manifest-path src-tauri/Cargo.toml stats`; `pnpm test -- src/test/attempt-history.smoke.test.tsx` nếu script/harness tồn tại; `pnpm tauri dev` cho smoke thật. Chạy lại lint/build/test bị tác động bởi test/edit mới; không lặp mọi check nếu không có thay đổi liên quan.

## ACCEPTANCE / DEFINITION OF DONE

- [ ] S04-T01..S04-T07 có bằng chứng và G0..G3 pass; command/DTO/props đã đồng bộ, mọi thay đổi trong allowlist.
- [ ] `attempt_list` chỉ đúng bộ đề, mới→cũ; bộ đề rỗng trả []; không lộ lượt thuộc môn/bộ đề đã ẩn; snapshot tên giữ nguyên khi đổi tên live.
- [ ] `attempt_review` từ DB giữ position, option_order và tập chọn nhiều đáp án; không cần quiz RAM; nội dung/options/tập đúng/thứ tự và điểm/is_correct không đổi khi dữ liệu live bị sửa/xóa; mapper chỉ đọc snapshot.
- [ ] Không có attempt_answers → chỉ summary và thông báo thiếu chi tiết; câu FK null/option mất không panic và không dựng nội dung giả; ID thiếu/ẩn trả lỗi.
- [ ] SCREEN-07 có ScoreBanner, lịch sử bộ đề, ResultReview; mở được từ OVL-05 sau restart; “Vừa xong” chỉ cho lần nộp hiện tại.
- [ ] Retry mở config; hủy không tạo lượt; bắt đầu reset timer/answers; nộp lần mới giữ lượt cũ và cập nhật history/dashboard; Back reset ShowAnswersSwitch OFF.
- [ ] SCREEN-01 có đủ components, metric và series theo bảng mock, recent ≤6; đổi kỳ không lọc thời gian; toggle chỉ style; donut 2 segment/legend 3 nhóm.
- [ ] Hiển thị 1 chữ số thập phân, timestamps giờ VN kể cả OS khác timezone; duration là giây.
- [ ] Rust test SQLite in-memory, FE smoke, build/lint/cargo checks liên quan pass; không ghi “pass” cho bước chưa chạy.
- [ ] Không thêm dependency/schema/filter kỳ thật hay thay đổi ngoài phạm vi; file ≤~200 dòng, hàm ≤~40 dòng hoặc báo rõ điểm vượt để tách trong ownership.

Ma trận test bắt buộc của S04-T07:

| Ca kiểm thử | Kết quả cần chứng minh |
|---|---|
| Lượt 3 câu có thứ tự khác đề, option đảo, chọn nhiều/thiếu/blank | Service mới đọc lại đúng position, option_order, selected IDs, is_correct và score đã lưu |
| Sửa nội dung/option/đáp án đúng rồi xóa câu sau submit | question_id có thể NULL; nội dung, options, tập đúng, thứ tự, điểm và is_correct vẫn đúng snapshot ban đầu sau restart |
| Xóa câu/option qua FK mềm | Summary và toàn bộ snapshot còn nguyên, questionId nullable; chỉ fixture legacy thiếu snapshot hiển thị thiếu chi tiết |
| Lượt legacy không có chi tiết; ID không tồn tại | Legacy summary-only khác với NotFound |
| ≥7 lượt nhiều đề, có đề/môn ẩn | History lọc exam; recent lấy đúng 6 hợp lệ mới nhất; stats loại cả hai trường hợp ẩn |
| Điểm 6.9, 7.0, 8.4, 8.5; số câu mỗi lượt khác nhau | Biên distribution đúng; avg_score theo lượt, accuracy theo tổng câu |
| A=0, Q=0 cho cả 3 kỳ | Không NaN/chia 0; đúng offset/series và empty states đã chốt |
| 3 kỳ trên cùng fixture DB | Đúng 7/4/6 điểm và offset; S/accuracy/distribution/recent không đổi |
| FE chọn lượt A rồi B nhanh, đổi kỳ liên tiếp | Không hiển thị response cũ dưới ID/kỳ mới; lỗi IPC không biến thành rỗng |

### Checklist nghiệm thu thủ công cho Hyan

Chạy `pnpm tauri dev` trên DB thử nghiệm, không reset DB cá nhân để tạo fixture.

- [ ] Tạo/nộp bài có câu nhiều đáp án, câu bỏ trống và random bật; ghi điểm, thứ tự câu, nhãn option đã chọn.
- [ ] Thoát hoàn toàn app, mở lại cùng app-data DB; vào bộ đề → Lịch sử → chọn lượt; đối chiếu điểm/tổng/thứ tự/lựa chọn, xác nhận không có nhãn “Vừa xong” sai.
- [ ] Panel lịch sử bật/tắt và đóng khi đổi bộ đề; bộ đề chưa làm có đúng empty text.
- [ ] Review chỉ đọc, có xanh/check và đỏ/X đúng; lượt legacy thiếu chi tiết vẫn xem được điểm/tổng (dùng fixture test nếu có).
- [ ] Bấm Làm lại → hủy rồi mở lại → xác nhận; timer/đáp án reset, lượt cũ giữ nguyên; Back về overview tắt “Hiện đáp án”.
- [ ] Dashboard Tuần/Tháng/Năm đổi offset và nhãn đúng; toggle score đổi style nhưng vẫn giữ cả cột/đường; phổ điểm All Time, bảng tối đa 6 dòng.
- [ ] Kiểm tra lúc DB rỗng trên môi trường test riêng; kiểm tra giờ VN với mốc UTC biết trước; xem ở 1280×800 và chiều rộng 1024, không thêm sticky ngoài quiz.

## RỦI RO VÀ CÂU HỎI MỞ

- **Legacy không có attempt_answers:** fallback summary-only đã chốt theo UC-21; không backfill từ đề hiện tại.
- **Q-04 đã làm ở Sprint 03/04:** review độc lập nội dung live; không thể backfill chính xác lượt legacy thiếu snapshot. Chỉ lượt legacy có trạng thái thiếu chi tiết, không suy đoán từ đề hiện tại.
- **Q-07 đánh số lượt:** tạm mới nhất = #1, theo db.dbml; không đảo danh sách theo hình minh họa #3 của ref-ui. Quyết định khác thuộc Sprint 07.
- **Q-08/Q-18/QDS-21:** chartMetric lọc series thật, phổ điểm theo kỳ, donut segment thứ ba là hạng mục Sprint 07; không sửa sớm trong Sprint 04.
- **Chênh lệch tài liệu:** UC-02 đoạn ngoại lệ ghi nhầm offset “tuần/tháng”; dùng BR-32 và ref-ui L1216–1229 (tháng/năm) như bảng trên. structure-be §7.4 mô tả đích thật nên không áp dụng truy vấn kỳ ở sprint này.
- **Row lịch sử ref-ui tĩnh:** UC-21 mới yêu cầu chọn lượt sau restart; bổ sung điểm vào review ở OVL-05, không biến dashboard hay toàn bộ result history thành luồng mới.
- **Thay đổi mềm/hard delete trong lúc xem:** reload/NotFound theo hook hiện có; không hiển thị dữ liệu ẩn từ cache. Không triển khai chức năng thùng rác của Sprint 05.
- Không có câu hỏi mở nào chặn đường mặc định nêu trên; chỉ escalate nếu checkout thiếu hợp đồng đầu vào hoặc xuất hiện quyết định ngoài phạm vi đã chốt.

───────────────────────────────────────────────────────
## 🛑 STOP CONDITIONS (DỪNG NGAY khi đạt 1 trong các điều này)
───────────────────────────────────────────────────────

- Tất cả ACCEPTANCE pass → DỪNG, báo "SPRINT DONE".
- Retry 1 task quá 2 lần mà vẫn fail → DỪNG, escalate; không thực hiện lần thử thứ ba.
- Phát hiện task cần design decision không có trong spec → DỪNG, hỏi.
- Cần thêm dependency ngoài list đã cho → DỪNG, hỏi.
- Task vượt quá 30 phút ước tính → DỪNG, chia nhỏ lại.

───────────────────────────────────────────────────────
## 🔁 RETRY BUDGET (giới hạn số lần thử)
───────────────────────────────────────────────────────

- Mỗi task: tối đa 2 lần thử.
- Mỗi lần thử: phải thay đổi approach, KHÔNG được lặp y hệt.
- Sau lần 2 fail: DỪNG task đó, chuyển sang task khác không phụ thuộc task lỗi; không vượt gate bị chặn.
- Cuối sprint: list ra các task chưa xong + lý do.

───────────────────────────────────────────────────────
## 🚨 ESCALATION TRIGGERS (khi nào hỏi user)
───────────────────────────────────────────────────────

DỪNG và hỏi user khi:

1. Lỗi không rõ nguyên nhân sau 2 lần debug.
2. Cần chọn giữa 2 approach (A vs B) mà spec không nói.
3. Cần thay đổi kiến trúc hiện tại (folder structure, store shape).
4. Phát hiện bug ở sprint trước ảnh hưởng sprint này.
5. Cần user test thủ công (visual, UX, performance).

Hoàn thành các phần độc lập đã được phép trước khi gửi yêu cầu test cho Hyan; nêu bước, dữ liệu cần đối chiếu và bằng chứng còn thiếu. Không tự ghi DONE khi checklist còn pending.

───────────────────────────────────────────────────────
## 🚫 OUT OF SCOPE (KHÔNG được làm)
───────────────────────────────────────────────────────

- KHÔNG refactor code ngoài file list ở TASKS.
- KHÔNG thêm feature ngoài GOAL.
- KHÔNG đổi UI/UX ngoài spec.
- KHÔNG optimize premature (chỉ làm khi ACCEPTANCE yêu cầu).
- KHÔNG viết test trừ test được yêu cầu rõ tại S04-T07 và các lệnh kiểm tra nêu trên.
- KHÔNG update README/docs trong lúc triển khai sprint; handoff ghi báo cáo, không sửa tài liệu nền.
- Không lọc kỳ thật/ranh giới tuần tháng năm; không bỏ offset, không nâng cấp chartMetric/donut trước Sprint 07; snapshot nội dung đã thuộc Sprint 03/04.
- Không import/export/backup, auth/cloud, search/pagination, lời giải, lưu draft; không sửa grading, shuffle, schema hay chức năng thùng rác/theme.

───────────────────────────────────────────────────────
## 📤 HANDOFF FORMAT (khi DỪNG, báo cáo theo format này)
───────────────────────────────────────────────────────

```text
STATUS: [DONE | PARTIAL | BLOCKED | NEED_INPUT]
SPRINT: 04

✅ COMPLETED:
- [SNN-TNN]: [file changed] | [gate / lệnh / kết quả]
- Hợp đồng: attempt_list/attempt_review + DTO, stats_overview mock + DTO,
  SCREEN-01/07; [mapping wire/TS và đường dẫn thực tế]

❌ FAILED (nếu có):
- [task]: [lỗi gì] | [đã thử gì, số lần] | [cần gì từ user]

🤔 NEED_INPUT (nếu có):
- [quyết định thiếu hoặc checklist Hyan chưa xác minh]
- [chênh lệch tài liệu nền / giới hạn Q-04, legacy]

📋 NEXT ACTION:
- Nếu DONE → "SPRINT DONE. Ready for sprint 05, paste next prompt"
- Nếu BLOCKED → "Waiting for user response on X"
- Nếu PARTIAL → "Continue task Y after user confirms"
- Nếu NEED_INPUT → [bước kiểm tra cụ thể Hyan cần thực hiện]

BÀN GIAO SPRINT 07:
- [vị trí stats_mock/constants, DTO, queries/hooks và test fixtures]
- Còn mock: offset, series; chartMetric chỉ style; donut 2 segment;
  distribution/recent All Time; anchor_utc chưa dùng lọc.
- Còn giới hạn: dữ liệu legacy thiếu snapshot; đánh số lượt Q-07 thuộc Sprint 07.
```

═══════════════════════════════════════════════════════

**Acceptance wire liên sprint (summary §8):** AC-SIZE; mọi task tạo/sửa DTO phải chạy fixture serialize/deserialize Rust và mapper TS dùng chung; tên JSON camelCase, câu `ask`, option `text`, không rò `isCorrect` trước quiz/nếu includeAnswers=false. Tích hợp cuối sprint sở hữu allowlist `tests/fixtures/wire/history-stats.json`, `src-tauri/tests/wire_history_stats.rs`, `src/test/wire-history-stats.test.ts`; không đổi fixture sprint trước để che lỗi tương thích.

**Fixture Q-04/Q-19 bắt buộc:** fixture wire dùng `optionOrder: ["o2", "o1"]` là mảng ID ở quiz_start, AttemptSubmitReq, AttemptResultDto/GradedQuestionDto và attempt_review; từ chối chuỗi JSON trên wire. Rust mapper round-trip SQLite JSON TEXT; TS dùng mảng trực tiếp. Fixture graded/review chứa `questionText`, `optionsSnapshot: [{id:"o1",text:"A"},{id:"o2",text:"B"}]`, `correctOptionIds: ["o2"]`; snapshot không được có trong quiz_start hoặc request submit. Test submit atomic ghi đủ ba cột, lỗi ghi snapshot rollback cả parent/child; review sau sửa/xóa câu/options và tạo lại service vẫn giữ nội dung/tập đúng/thứ tự ban đầu.
