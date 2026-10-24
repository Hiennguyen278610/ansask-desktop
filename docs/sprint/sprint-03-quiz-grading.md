# SPRINT 03 — QUIZ & CHẤM

═══════════════════════════════════════════════════════


**AC-SIZE — acceptance chung bắt buộc:** mọi task code/config/test phải kiểm tra file ≤~200 dòng và hàm ≤~40 dòng; báo số dòng/file và rà ranh giới hàm trong kết quả task, tách module khi vượt, không nén code để né giới hạn. Mọi acceptance task bên dưới viện dẫn AC-SIZE, gate không pass khi chưa kiểm tra.

**Quy tắc UI bắt buộc:** mọi task UI dùng CSS variables/token light và dark từ Sprint 00; không ghi màu hex trực tiếp trong component hoặc style UI.

## CONTEXT

Sprint 00 cung cấp khung Tauri/React, SQLite/migration, AppError, DI, primitive UI và lệnh kiểm tra; Sprint 01 cung cấp môn/bộ đề, điều hướng và soft delete; Sprint 02 cung cấp bộ đề có câu hỏi hợp lệ (≥2 option, ≥1 đáp án đúng).
Sprint này đưa dữ liệu đó vào phiên làm bài trong RAM, chấm ở Rust và ghi kết quả bền vững trong SQLite. Đây là prompt triển khai sau khi Sprint 02 nghiệm thu, không khẳng định các đầu vào đã tồn tại trong checkout hiện tại.

## GOAL

Người dùng bắt đầu phiên random on/off, làm bài radio/checkbox, điều hướng câu và nộp để nhận điểm exact-set cùng một `attempts` và đúng N `attempt_answers` lưu nguyên thứ tự câu/option trong một transaction.

### Phạm vi và phụ thuộc

- Trong phạm vi: SCREEN-06; cấu hình OVL-02 đi vào quiz từ SCREEN-04; `quiz_start` (R1); `attempt_submit` (Q-03/Q-10/Q-11); timer/progress; navigator và cảnh báo nộp; kết quả trả về và thông báo điểm sau commit.
- Ngoài phạm vi: xem lại, lịch sử, `attempt_list`, `attempt_review`, dashboard, SCREEN-07 đầy đủ và `ScoreBanner`/`ResultHistoryRow`/`ResultReviewRow` (Sprint 04); hard limit 200 Q-09 (Sprint 07); draft/resume ngoài phạm vi, để dành sau.
- Phụ thuộc trực tiếp: Sprint 02; kế thừa Sprint 00/01. Gate đầu vào phải kiểm tra migration có `attempt_answers.option_order`, `question_text`, `options_snapshot`, `correct_option_ids`, repo đọc bộ đề/option, `ModalShell`, wrapper invoke và scripts lint/build/test. Thiếu đầu vào thì báo blocker Sprint trước, không âm thầm dựng lại trong sprint này.
- UC: **UC-18, UC-19, UC-20, UC-29, UC-30, UC-31**.
- BR: **BR-17..BR-30, BR-61..BR-63, BR-67, BR-69, BR-72, BR-73**; BR-64/BR-68 là ràng buộc thời gian/persist liên quan.
- Bảng đọc: `subjects`, `exams`, `questions`, `answer_options`; bảng ghi: `attempts`, `attempt_answers`.
- Component: `QuizControlBar`, `QuizProgress`, `QuestionNavigatorDialog` variant quiz, `SubmitWarningDialog`, `QuizQuestionCard`, `QuizTimer`, `QuizProgressbar`; `QuizSetupDialog` hiện thực OVL-02, `QuestionNumberGrid` tái sử dụng giữa hai dialog.
- BR-28/29: Sprint này cung cấp dữ liệu và mốc nộp để lịch sử mới→cũ/empty state ở Sprint 04. BR-30: giữ giá trị cấu hình gần nhất để Sprint 04 mở lại; chưa triển khai nút Làm lại đề hay màn lịch sử. BR-27: hoàn tất state nộp + toast, bàn giao kết quả cho SCREEN-07 ở Sprint 04.

### Tài liệu nền bắt buộc đọc

| Tài liệu | Mục/mã cần đọc | Áp dụng |
|---|---|---|
| `docs/sprint/sprint-prompt-template.md` | Toàn bộ | Khuôn, stop/retry/escalation/handoff |
| `docs/sprint/sprint-plan-summarize.md` | §3, §4, §5 Sprint 03, §8 | Quy ước, phạm vi, hợp đồng kế tiếp |
| `docs/domain-core.md` | §4.6, §4.7, §4.8, §5.3; BR-61/62/63/67/69/72/73; §6 UC-18..20/29..31; §7 | Phiên, exact-set, luồng điều hướng |
| `docs/design-system.md` | §3.5; §4.43..4.48; §5 SCREEN-06; §6.1, §6.9, §6.14 | Bố cục quiz, giới hạn kết quả, hành vi dialog |
| `docs/design-system.md` | Bổ sung §4.53/54, §4.56/57 | Config, hợp đồng navigator và submit warning cập nhật |
| `docs/db.dbml` | `attempts`, `attempt_answers`, FK/index liên quan | Trường snapshot, JSON TEXT, position, transaction |
| `docs/structure-be.md` | §4 Strategy random/chấm, Unit of Work/DI; §6.2/6.3; §7.1/7.2; §8 `features/quiz` | Phân tầng, DTO và đồng bộ TS |
| `docs/ref-ui.tsx` | L856–862, L937–946, L1082–1158, L2571–2671, L2903–2991 | Chỉ đối chiếu UI; không chép code/cơ chế lặp câu cũ |

Ưu tiên quyết định cập nhật R1/Q-03/Q-10/Q-11/Q-19 và summary §8 khi ref cũ khác spec. Không sửa tài liệu nền; ghi chỗ lệch vào handoff.

## QUY ƯỚC CHO TẤT CẢ SPRINT

**Thực thi bằng subagent codex (bắt buộc).** Mọi công việc triển khai (code, config, migration, test, refactor) đều giao cho `subagent_codex`. Mỗi task có: Mã task, tên, mục tiêu, Thực thi bởi = `subagent codex`, Nhóm chạy (song song P1/P2… hay tuần tự) + Phụ thuộc, Phạm vi file (không giao trùng file giữa task song song), UC/BR/component/command/bảng liên quan (mã + mục tài liệu nền), Prompt giao cho codex (tự chứa), Tiêu chí chấp nhận + Lệnh kiểm tra.

**Song song hóa.** Phân tích đồ thị phụ thuộc, gom nhóm gọi nhiều codex cùng lúc. File dùng chung (`lib.rs`/`invoke_handler`, `mod.rs`, routes, `index.html`, config) gom vào **một task tích hợp** chạy sau cùng nhóm (một codex). Chốt hợp đồng (tên command/DTO/kiểu TS/component/props) trước khi song song. Mỗi sprint có sơ đồ ASCII wave + gate kiểm tra tổng sau mỗi wave. Cuối sprint: task kiểm thử & nghiệm thu (codex) + checklist nghiệm thu thủ công cho Hyan.

**Nội dung bắt buộc mỗi file sprint:** mục tiêu/phạm vi/phụ thuộc; tài liệu nền phải đọc (đường dẫn + mục/mã); hợp đồng tạo ra/dựa vào; sơ đồ wave + task; Definition of Done, checklist nghiệm thu, rủi ro, câu hỏi mở.

**Quy tắc kỹ thuật chung:** phân tầng `commands → services → repositories → db`, DI qua `tauri::State`, Unit of Work cho thao tác nhiều bước; file ≤ ~200 dòng, hàm ≤ ~40 dòng; DRY/SOLID, không over-engineer; Tailwind + `lucide-react`; thời gian lưu UTC, hiển thị `Asia/Ho_Chi_Minh`; schema qua migration đánh số; test Rust SQLite in-memory.

**Sprint 00** phủ toàn bộ §9 `structure-be.md`: Tailwind + lucide-react, crate SQLite/migration/chrono-tz + crate đã chốt (verify version trước khi ghi), capabilities tối thiểu, `tauri.conf.json` 1280×800/minWidth 1024, thay `App.tsx` demo bằng khung app, lint/format/test, script `package.json`.

Khi giao task, gửi kèm nguyên khối quy ước này, hợp đồng bên dưới, phạm vi file, acceptance và các giới hạn STOP/RETRY/OUT OF SCOPE. Không giao task chỉ bằng tham chiếu tới hội thoại. Không tự thêm dependency: dùng stack/lockfile đã chốt ở Sprint 00 (React/TS/Tauri, Tailwind/lucide, rusqlite/migration/pool, serde, rand, chrono/chrono-tz và hạ tầng test sẵn có); thiếu crate cần thiết thì escalate.

## Hợp đồng tạo ra và dựa vào

### 1. Gate chốt hợp đồng trước khi song song

S03-T01 đối chiếu các tên dưới đây với repository Sprint 02. Đường dẫn là phạm vi dự kiến theo `structure-be.md`; nếu repository dùng tên tương đương, lập ánh xạ sở hữu file trước P1, không tạo implementation trùng. Mỗi file dùng chung chỉ có một người ghi ở task tích hợp. Các trường bổ sung dưới đây cụ thể hóa DTO rút gọn của §6.2; ghi chúng trong bàn giao cho Sprint 04/05/07.

Tên field Rust dùng snake_case; JSON/TS dùng camelCase với `#[serde(rename_all = "camelCase")]` theo summary §8, kiểm tra hai chiều bằng fixture chung. TS dưới đây là wire contract; `optionOrder: string[]` là mảng ID xuyên suốt quiz_start/attempt_submit/attempt_review. JSON string chỉ tồn tại trong SQLite; mapper Rust encode/decode, FE không JSON.parse/stringify trường này.

```ts
type QuizStartReq = { examId: string; count?: number; randomize?: boolean };
type QuizOptionDto = { id: string; text: string };
type QuizQuestionDto = {
  id: string;                 // ID trong RAM: quiz-q-{position}-{questionId}
  questionId: string;         // ID gốc trong questions, gửi khi submit
  position: number;           // 0..N-1 trong phiên
  ask: string;
  selectionMode: 'single' | 'multiple';
  options: QuizOptionDto[];   // thứ tự hiển thị BE đã quyết định
  optionOrder: string[];      // options.map(o => o.id)
};
type QuizStartRes = { questions: QuizQuestionDto[]; total: number };
type AttemptAnswerReq = {
  questionId: string;
  selectedOptionIds: string[];
  position: number;
  optionOrder: string[];
};
type AttemptSubmitReq = {
  examId: string;
  startedAt: string;          // ISO-8601 UTC, lúc nhận quiz_start thành công
  answers: AttemptAnswerReq[];
};
type GradedQuestionDto = {
  questionId: string;
  position: number;
  selectedOptionIds: string[];
  questionText: string;       // snapshot từ DB lúc nộp
  optionsSnapshot: QuizOptionDto[]; // toàn bộ options {id,text}
  correctOptionIds: string[]; // snapshot, chỉ trả sau nộp
  optionOrder: string[];
  isCorrect: boolean;
};
type AttemptResultDto = {
  attemptId: string;
  examId: string;
  subjectId: string;
  examTitle: string;
  subjectName: string;
  submittedAt: string;
  totalQuestions: number;
  correctCount: number;
  score: number;
  durationSec: number;
  perQuestion: GradedQuestionDto[];
};
```

- Command duy nhất: `quiz_start(req) → QuizStartRes`, `attempt_submit(req) → AttemptResultDto`; frontend chỉ gọi wrapper `quizStart`/`attemptSubmit` trong `src/lib/tauri/commands.ts`.
- `selectionMode` là metadata tối thiểu để chọn control, BE tính từ số đáp án đúng; không trả `is_correct`/`isCorrect`, `correctOptionIds` hoặc cờ đúng trên option trong `QuizStartRes`. Không dùng DTO editor chứa đáp án đúng làm nguồn render quiz.
- `quiz_start`: pool active và không rỗng; `count` thiếu mặc định `min(25, pool.length)`; FE parse số không hợp lệ thành 1; số nguyên ≤0 clamp 1; ≥pool lấy toàn bộ. BE validate kiểu input, không phát sinh câu lặp. `randomize` thiếu = true; false giữ thứ tự gốc cả câu và option, lấy N câu đầu. Không bổ sung hard limit 200 trong code.
- `position` phiên độc lập position gốc; UI nhãn câu = position+1, nhãn A/B/C/D theo index option đang hiển thị; chọn/chấm dùng ID, không dùng chữ cái. FE không shuffle/sort lại option.
- `answers` luôn có đủ N dòng kể cả bỏ trống (`selectedOptionIds: []`); toàn bộ bỏ trống hợp lệ, nhưng `answers: []` là phiên không hợp lệ. Không gửi ID `quiz-q-*` vào FK `question_id`.
- BE kiểm tra exam/subject còn active, câu thuộc exam, không trùng câu, position duy nhất và phủ 0..N-1; option chọn thuộc câu; `optionOrder` là mảng ID không lặp, là hoán vị đầy đủ option của câu. Reject dữ liệu hỏng bằng `Validation`/`NotFound`, không âm thầm bỏ dòng. Không tin điểm/tập đáp án đúng từ client.
- Chấm tập hợp không phụ thuộc thứ tự chọn: một đáp án đúng dùng `SingleChoice`, nhiều đáp án dùng `MultiChoiceExactSet`; thiếu/dư/chọn sai/bỏ trống đều sai, đảo thứ tự của cùng tập vẫn đúng. Điểm `round(correct / total * 10, 1)`; không partial credit.
- Unit of Work: begin transaction → đọc/validate đề và đáp án đúng → chấm → insert parent → insert đủ N child → commit → trả result. Repo nhận cùng transaction/connection; lỗi bất kỳ rollback cả parent/child. Nguồn chấm là DB tại lúc nộp, không snapshot khi bắt đầu.
- `submitted_at` lấy UTC ở BE; `duration_sec` từ chênh lệch mốc nộp với `started_at`, làm tròn xuống giây, không âm; kiểm tra timestamp hợp lệ. Timer FE hiển thị elapsed từ thời điểm bắt đầu, không cộng dồn tick. Bàn giao giới hạn: thời lượng BE có thể lệch vài giây với UI vì độ trễ invoke.
- `NotFound`, `Validation`, `Db` dùng AppError có sẵn. Start fail giữ config; submit fail giữ đáp án, vị trí và phiên để làm tiếp/thử lại. Chỉ chuyển trạng thái submitted/toast điểm sau commit; khóa nút và guard handler trong lúc submit để chặn hai invoke đồng thời, không tự retry mutation.

### 2. Hợp đồng SQLite và bàn giao liên sprint

| Dữ liệu | Quy tắc ghi | Bên dùng tiếp |
|---|---|---|
| `attempts` | ID theo helper sẵn có; FK exam/subject thật; snapshot `exam_title`, `subject_name`; `submitted_at` UTC; `total_questions=N`, `correct_count`, `score`, `duration_sec`; `created_at=updated_at` | Sprint 04 lịch sử/thống kê, Sprint 07 lọc kỳ |
| `attempt_answers` | Một dòng mỗi câu; `question_id` gốc; `position` 0-based; `selected_option_ids` JSON TEXT, trống `[]`; `option_order` JSON TEXT giữ thứ tự phiên kể cả random OFF; `question_text` snapshot nội dung; `options_snapshot` JSON TEXT toàn bộ options `{id,text}`; `correct_option_ids` JSON TEXT tập đúng; `is_correct` snapshot; `created_at=updated_at` | Sprint 04 xem lại, Sprint 05 purge |
| `selected_option_id` | Cột tương thích: option đã chọn có position gốc nhỏ nhất, hoặc NULL khi trống; không dùng để chấm | FK/index hiện hữu |
| Tập lựa chọn | Chuẩn hóa không lặp, lưu theo position gốc option; so sánh theo tập ID, thứ tự hiển thị chỉ lấy từ `option_order` | Không lẫn vị trí gốc với vị trí phiên |
| Ràng buộc | UNIQUE(attempt_id, position), FK parent CASCADE; FK question/selected option nullable SET NULL theo schema | Không đổi schema hoặc thêm FK cho JSON |

`quiz_start` không ghi attempt. Attempt/answer bất biến trong luồng quiz; không thêm sửa/xóa lượt. Không lưu flag, answers đang làm hay config vào DB. Không thêm các nhãn period/day/month/year đã bị bỏ khỏi schema.

Q-04/BR-81 đã chốt: trong cùng transaction nộp bài, BE đọc dữ liệu đã validate để ghi question_text, options_snapshot, correct_option_ids; không nhận snapshot/đáp án đúng do client cung cấp. AttemptSubmitReq chỉ gửi lựa chọn và thứ tự; AttemptResultDto.perQuestion trả GradedQuestionDto với snapshot vừa lưu. Sprint 04 đọc snapshot, kể cả question_id thành NULL sau xóa câu; không join câu/option hiện tại để dựng review.

### 3. Hợp đồng component/state

| Component/state | Props/dữ liệu | Hành vi bắt buộc |
|---|---|---|
| `QuizSetupDialog` (thay QuizConfigModal §4.53) | open, poolTotal, countInput, randomize, pending, onChangeCount, onChangeRandomize, onStart, onClose | min(25,n), preset 25/32/40/Tất cả, input min=1/max=200 theo UI; công tắc chung “Xáo câu hỏi & đáp án” mặc định bật |
| `PresetCountGrid` (§4.54) | value, total, onSelect | 25/32/40/Tất cả, dùng trong QuizSetupDialog |
| `useQuizSession` | questions, answers `Record<sessionId, string[]>`, startedAt, elapsedSec, currentIndex, flags, status, lastResult | RAM; reset câu trả lời/timer/flag khi start thành công; giữ config cho lượt kế tiếp; map sessionId→questionId khi submit |
| `QuizQuestionCard` | question, selectedOptionIds, onChange, disabled | radio khi single (đổi lựa chọn); checkbox khi multiple (toggle về rỗng được); không lộ đúng/sai trước submit |
| `QuizControlBar` | elapsedSec, answeredCount, total, pending, onOpenAll, onSubmit | sticky top-2 z-20; đếm theo câu có ≥1 lựa chọn; nộp được dù 0 câu đã chọn |
| `QuizProgress` / `QuizProgressbar` | answered, total | text “Đã chọn: N / M câu”, progress theo N/M; tái sử dụng thanh con, không đếm số option |
| `QuizTimer` | elapsedSec | mm:ss; tick 1s từ timestamp; không giới hạn/auto-submit; dọn interval khi rời phiên |
| `QuestionNavigatorDialog` | open, variant editor/quiz, questions, currentIndex?, answers?, flags?, onToggleFlag?, onSelect(index), onClose | quiz lưới 5 cột, số theo position+1; trạng thái đã/chưa làm, hiện tại, flag; editor cũ giữ API/hành vi |
| `QuestionNumberGrid` | items có index gốc, trạng thái, variant normal/muted, onSelect?, onToggleFlag? | Một implementation dùng cho navigator và warning; danh sách trống không đánh số lại từ 1 |
| `SubmitWarningDialog` | open, unansweredIndexes, total, pending, onBack, onConfirm | Số lượng + số thứ tự câu trống; “Quay lại làm tiếp” bên trái/focus mặc định, “Vẫn nộp” bên phải |

Navigator dùng ModalShell: Escape/backdrop/X đóng, focus trap và trả focus, role/aria đầy đủ; ô đã làm có ✓ ngoài màu, hiện tại có ring. Chọn câu đóng trước, sau 80ms smooth-scroll block:center và focus câu; highlight 2.2s, clear timeout cũ và khi unmount. Flag toggle bằng icon lucide có nhãn, chỉ trong RAM. Warning dùng cùng lưới muted không tương tác (jump từ warning là tùy chọn nâng cao, không thuộc sprint), max-h-40 khi danh sách dài, không lồng backdrop; Esc/backdrop tương đương quay lại, không invoke.

Breadcrumb về bộ đề bỏ phiên chưa nộp, đóng dialog và tắt show answers; sidebar chỉ đổi tab, giữ state theo domain §7.3. Timer chỉ chạy khi mode quizActive; đóng app mất phiên chưa nộp. Sau nộp giữ `lastResult` và context phiên cho bàn giao; hiển thị toast điểm, kết thúc điều khiển làm bài, không tự xây màn review trước Sprint 04.

## TASKS

### Sơ đồ wave và gate

```text
Sprint 02 DONE
     |
S03-T01: chốt hợp đồng + quyền sở hữu file (tuần tự)
     | G0: đầu vào đủ, DTO/props/đường dẫn không mâu thuẫn
     +------------------+------------------+
P1   S03-T02 random      S03-T03 grading     S03-T04 dialogs
     +------------------+------------------+
S03-T05: tích hợp P1 (một codex; chỉ sau cả ba)
     | G1: cargo test/check + pnpm lint/build
     +------------------+
P2   S03-T06 submit      S03-T07 quiz UI/state
     +------------------+
S03-T08: tích hợp P2 (một codex)
     | G2: hai command thật + quiz end-to-end, checks pass
S03-T09: kiểm thử/đối chiếu bàn giao (codex)
     | G3: automated pass + bằng chứng manual Hyan
   SPRINT DONE
```

Mỗi task ước tính ≤30 phút; trước khi vượt ngưỡng phải chia thành phần nối tiếp với file ownership rõ, không mở rộng scope. Lệnh dưới chạy từ root repository; sau mỗi lệnh test lọc phải xác nhận có test thực sự được chạy (không chấp nhận “0 tests” là pass). Chỉ task tích hợp sửa `mod.rs`, `lib.rs`, state wiring, routes, `App.tsx`, wrapper dùng chung. Không sửa `index.html`, config hay dependency trong sprint này.

### 1. S03-T01 — Chốt hợp đồng đầu vào (15–20 phút)

- **Mục tiêu:** lập manifest sở hữu file + kiểm tra đầu vào.
- **Thực thi bởi:** subagent codex
- **Nhóm / phụ thuộc:** tuần tự, sau Sprint 02; gate cho P1.
- **Phạm vi file:** chỉ đọc các tài liệu nền, `src/lib/tauri/commands.ts`, `src/components/ui/*`, `src/features/exam/*`, `src-tauri/src/{dto,repositories,db}/*`, manifests và lockfiles; không sửa file.
- **Truy vết:** toàn bộ UC/BR của sprint; `quiz_start`, `attempt_submit`; `attempts`, `attempt_answers`; summary §8, structure §6.2/7.1/7.2.
- **Prompt giao codex:** Đối chiếu hợp đồng Sprint 03 ở trên với DTO, serde, repo, schema, UI primitive của Sprint 02. Chốt mapping tên field/ID, `selectionMode`, mảng ID `optionOrder: string[]`, API transaction, tên/path navigator dùng chung và signature wrapper. Báo manifest file rời nhau cho P1/P2 và danh sách file tích hợp. Kiểm tra rand và test scripts đã có, không cài dependency hoặc sửa kiến trúc. Mọi thiếu hụt đầu vào phải ghi blocker cụ thể trước khi giao P1.
- **Chấp nhận:** AC-SIZE; mapping đủ request/response/props, không lộ đáp án, không dùng session ID làm FK, không giao trùng file song song; migration có option_order; đầu vào chạy được.
- **Lệnh kiểm tra:** `rg -n 'option_order|attempt_answers' src-tauri/src`; `rg -n 'rand|rusqlite|chrono' src-tauri/Cargo.toml`; `pnpm lint`; `pnpm build`; `cargo test --manifest-path src-tauri/Cargo.toml`.

### 2. S03-T02 — Tạo phiên quiz ở backend (20–30 phút)

- **Mục tiêu:** sinh N câu + option theo random on/off.
- **Thực thi bởi:** subagent codex
- **Nhóm / phụ thuộc:** P1, sau G0; song song S03-T03/S03-T04.
- **Phạm vi file:** `src-tauri/src/dto/quiz_dto.rs`, `services/quiz_service.rs`, `services/quiz_service/tests.rs`, `commands/quiz_cmds.rs` dưới `src-tauri/src/`. Không sửa repo dùng chung hoặc `mod.rs`.
- **Truy vết:** UC-18/31; BR-17..22, BR-61/62/72/73; `quiz_start`/QuizSetupDialog; đọc exams/questions/answer_options; structure §4 Strategy, §7.1.
- **Prompt giao codex:** Hiện thực QuizStartReq/Res và QuizOrderingStrategy Shuffle/Preserved theo hợp đồng. Đọc đề active qua repo Sprint 02; clamp count, không lặp; random chạy ở Rust với rand sẵn có, inject RNG để test deterministic. Tạo session ID và giữ ID gốc riêng, position 0..N-1, optionOrder khớp options, selectionMode từ DB; mapper loại sạch is_correct. Không ghi DB, không mutate bộ đề gốc. Viết test trong phạm vi này cho clamp/shuffle/preserved/DTO.
- **Chấp nhận:** AC-SIZE; count thiếu/0/âm/1/nhỏ hơn/bằng/lớn hơn pool đúng; pool rỗng Validation, đề không tồn tại NotFound; random OFF lấy N đầu đúng thứ tự; ON áp cả hai shuffle kể cả lấy hết; response không có đáp án đúng.
- **Lệnh kiểm tra:** sau S03-T05 đăng ký module: `cargo test --manifest-path src-tauri/Cargo.toml quiz_service`; `cargo check --manifest-path src-tauri/Cargo.toml`.

### 3. S03-T03 — Chấm exact-set và repository ghi kết quả (20–30 phút)

- **Mục tiêu:** cung cấp grading thuần và repo dùng chung transaction.
- **Thực thi bởi:** subagent codex
- **Nhóm / phụ thuộc:** P1, sau G0; song song S03-T02/S03-T04.
- **Phạm vi file:** dưới `src-tauri/src/`: `dto/attempt_dto.rs`, `domain/attempt.rs`, `domain/attempt_answer.rs`, `services/grading_service.rs`, `services/grading_service/tests.rs`, `repositories/attempt_repo.rs`, `repositories/attempt_answer_repo.rs` (chỉ insert của sprint này).
- **Truy vết:** UC-20/30; BR-24..27/62/63/72; `attempt_submit`; attempts/attempt_answers; domain §4.6/4.8/5.3, DB hai bảng, structure §4 Strategy/Unit of Work.
- **Prompt giao codex:** Hiện thực DTO result/graded/request theo hợp đồng và strategy SingleChoice/MultiChoiceExactSet. Grade bằng tập ID, trống luôn sai, không partial credit; trả score một chữ số. Repo insert nhận transaction do caller quản lý, không mở/commit riêng. Map selected IDs/optionOrder từ mảng wire sang JSON TEXT SQLite bằng mapper Rust; ghi question_text/options_snapshot/correct_option_ids từ snapshot lúc nộp và cột đại diện selected_option_id đúng schema. Viết unit test grading đúng/thiếu/dư/sai/trống/đảo thứ tự và làm tròn; không viết attempt_list/review hay sửa schema.
- **Chấp nhận:** AC-SIZE; cùng tập đảo thứ tự vẫn đúng, chọn sai ID không được tính đúng; 2/3 đúng = 6.7; repo có thể được gọi trong cùng transaction và không commit sớm.
- **Lệnh kiểm tra:** sau S03-T05: `cargo test --manifest-path src-tauri/Cargo.toml grading_service`; `cargo check --manifest-path src-tauri/Cargo.toml`.

### 4. S03-T04 — Dựng navigator và cảnh báo nộp dùng chung (20–30 phút)

- **Mục tiêu:** hai dialog và một lưới câu tái sử dụng.
- **Thực thi bởi:** subagent codex
- **Nhóm / phụ thuộc:** P1, sau G0; song song S03-T02/S03-T03.
- **Phạm vi file:** `src/features/quiz/QuestionNavigatorDialog.tsx`, `QuestionNumberGrid.tsx`, `SubmitWarningDialog.tsx` cùng thư mục; nếu navigator Sprint 02 đã ở path khác, chỉ sửa path được G0 xác nhận, không tạo bản thứ hai.
- **Truy vết:** UC-29/30; BR-67/69; QuestionNavigatorDialog/SubmitWarningDialog; không command/DB; design §4.45/4.56/4.57, §6.1/6.9/6.14.
- **Prompt giao codex:** Dùng ModalShell hiện hữu, thực thi props và accessibility đã chốt. Navigator quiz có 5 cột và trạng thái đã/chưa làm/hiện tại/flag, giữ variant editor nếu có. Tách QuestionNumberGrid dùng lại trong warning để hiển thị index phiên thật; warning focus Quay lại làm tiếp, Esc/backdrop không nộp, pending vô hiệu hóa xác nhận. Không tạo popover cũ, không lồng backdrop; callback jump để parent điều phối. Không sửa store/routes hoặc consumer editor trong task này.
- **Chấp nhận:** AC-SIZE; không duplicate lưới; danh sách câu trống như [2,6] (index 0-based) hiện 3/7; focus/aria/close đúng spec; editor contract không bị phá.
- **Lệnh kiểm tra:** `pnpm build`; `pnpm lint`; smoke bàn phím thực hiện tại S03-T09 khi có consumer.

### 5. S03-T05 — Tích hợp wave P1 (15–20 phút)

- **Mục tiêu:** nối module và hợp đồng chung cho P2.
- **Thực thi bởi:** subagent codex (owner tích hợp duy nhất).
- **Nhóm / phụ thuộc:** tuần tự sau S03-T02/S03-T03/S03-T04.
- **Phạm vi file:** `src-tauri/src/{dto,domain,services,repositories,commands}/mod.rs`, `src-tauri/src/{lib.rs,state.rs}`, `src/lib/tauri/commands.ts`; consumer `src/features/exam/QuestionJumpPopover.tsx` hoặc `ExamEditorScreen.tsx` chỉ nếu cần chuyển import sang navigator dùng chung đã có ở G0.
- **Truy vết:** UC-18/20/29/30/31; BR-61/63/69/72/73; hai command/DTO, navigator; structure §6.2/6.3/8.
- **Prompt giao codex:** Export module P1 và đăng ký quiz_start/DI theo hạ tầng hiện hữu. Mirror toàn bộ DTO Rust↔TS, thêm quizStart/attemptSubmit wrapper qua invoke duy nhất (attempt_submit chỉ được gọi sau G2). Đồng bộ consumer navigator editor nếu cần, không thay UX editor. Kiểm tra mọi file P1 hợp đồng khớp nhau; không sửa implementation task khác để che lỗi, trả lỗi về owner khi cần.
- **Chấp nhận / G1:** AC-SIZE; DTO compile, tests P1 thực sự chạy/pass, build/lint pass; không có invoke mới ngoài wrapper; không đăng ký command stub làm giả kết quả.
- **Lệnh kiểm tra:** `cargo test --manifest-path src-tauri/Cargo.toml`; `cargo check --manifest-path src-tauri/Cargo.toml`; `pnpm lint`; `pnpm build`.

### 6. S03-T06 — Nộp bài atomic và lưu thứ tự phiên (20–30 phút)

- **Mục tiêu:** transaction hoàn chỉnh cho attempt_submit.
- **Thực thi bởi:** subagent codex
- **Nhóm / phụ thuộc:** P2 sau G1, song song S03-T07.
- **Phạm vi file:** `src-tauri/src/services/attempt_service.rs`, `services/attempt_service/tests.rs`, `commands/attempt_cmds.rs` dưới `src-tauri/src/`; không sửa modules/wrapper dùng chung.
- **Truy vết:** UC-20/30; BR-24..27/62/63/67/72; attempt_submit; attempts/attempt_answers; structure §7.2, DB schema.
- **Prompt giao codex:** Implement submit theo hợp đồng: transaction đọc active exam/subject + options, validate tất cả dòng, grade, snapshot tên/UTC/thời lượng và nội dung câu/options/tập đúng (Q-04/BR-81), ghi parent và N answers bằng repo P1 rồi commit. Nhận câu trống hợp lệ, giữ optionOrder chính xác; trả DTO chỉ sau commit. Viết test SQLite in-memory bật FK: happy path, toàn trống, invalid membership/positions/order, và lỗi insert child sau khi parent đã insert để chứng minh rollback. Không thêm session persistence, auto retry, idempotency protocol ; snapshot nội dung là bắt buộc.
- **Chấp nhận:** AC-SIZE; một submit hợp lệ tạo một parent/N child, position và option_order khớp đầu vào; lỗi child tạo 0 dòng mới ở cả hai bảng; lỗi không thay state quiz FE.
- **Lệnh kiểm tra:** sau S03-T08 export module: `cargo test --manifest-path src-tauri/Cargo.toml attempt_service`; `cargo check --manifest-path src-tauri/Cargo.toml`.

### 7. S03-T07 — Dựng phiên làm bài SCREEN-06 (20–30 phút)

- **Mục tiêu:** UI/state quiz hoàn chỉnh qua wrapper.
- **Thực thi bởi:** subagent codex
- **Nhóm / phụ thuộc:** P2 sau G1, song song S03-T06.
- **Phạm vi file:** `src/hooks/useQuizSession.ts`; `src/features/quiz/{QuizSetupDialog,PresetCountGrid,QuizScreen,QuizQuestionCard,QuizControlBar,QuizProgress,QuizTimer,QuizProgressbar}.tsx`; helper cục bộ `src/features/quiz/useQuestionFocus.ts` nếu cần chia kích thước. Không sửa file dialog P1, routes, uiStore hoặc commands.ts.
- **Truy vết:** UC-18/19/20/29/30/31; BR-17..27/30/61/62/63/67/69/72/73; mọi component quiz, hai wrapper; không SQL; design SCREEN-06, structure §8.
- **Prompt giao codex:** Dựng config mặc định random ON và presets; nhận phiên backend, render theo position/options, state answers là mảng ID và metadata selectionMode quyết định radio/checkbox. Timer tính từ timestamp, progress theo số câu đã chọn. Nối navigator/flag/jump và cleanup highlight. Nộp còn câu trống phải qua warning, hết trống gọi thẳng; payload đủ N câu gồm optionOrder, map ID gốc. Pending guard khóa submit/selection, giữ state khi lỗi, thành công giữ lastResult/toast callback và kết thúc quiz. Không tự grade/shuffle, không dựng lịch sử/review; không đẩy server state vào global store.
- **Chấp nhận:** AC-SIZE; đổi radio, toggle nhiều checkbox về rỗng, progress và warning đồng bộ; không đáp án đúng trước nộp; timer/dialog không reset answers; gọi wrapper đúng một lần cho một thao tác nộp.
- **Lệnh kiểm tra:** `pnpm lint`; `pnpm build`; các ca UI/manual ở S03-T09.

### 8. S03-T08 — Tích hợp wave P2 vào app (15–20 phút)

- **Mục tiêu:** nối hai command thật và đường vào quiz.
- **Thực thi bởi:** subagent codex (owner tích hợp duy nhất).
- **Nhóm / phụ thuộc:** tuần tự sau S03-T06/S03-T07.
- **Phạm vi file:** `src-tauri/src/{lib.rs,state.rs}`, `src-tauri/src/{commands,services}/mod.rs`; `src/lib/tauri/commands.ts`; `src/App.tsx`, `src/routes/{index.tsx,paths.ts}` nếu đã có, `src/features/exam/ExamOverviewScreen.tsx`. Không bổ sung router mới.
- **Truy vết:** UC-18/19/20/29/30/31; BR-22/23/27/30/67; SCREEN-04→OVL-02→SCREEN-06; domain §7, summary §8.
- **Prompt giao codex:** Đăng ký attempt_submit/DI, nối mở cấu hình từ exam overview và render QuizScreen theo điều hướng hiện hữu. Đồng bộ state khi breadcrumb/sidebar theo hợp đồng. Nộp thành công phát toast điểm và giữ AttemptResultDto cho Sprint 04, kết thúc controls làm bài; dùng primitive thông báo kết quả hiện hữu trong nhánh quizResult nếu cần để không có màn trống. Không xây ScoreBanner, history/review hoặc gọi command Sprint 04 chưa tồn tại. Không thay signature DTO đã chốt nếu không có blocker được báo.
- **Chấp nhận / G2:** AC-SIZE; app thật start→chọn→nộp→toast điểm, không command missing; random ON/OFF hoạt động; không màn trống sau nộp; kiểm tra tự động pass.
- **Lệnh kiểm tra:** `cargo test --manifest-path src-tauri/Cargo.toml`; `cargo build --manifest-path src-tauri/Cargo.toml`; `pnpm lint`; `pnpm build`; `pnpm tauri dev` cho smoke.

### 9. S03-T09 — Kiểm thử và nghiệm thu bàn giao (20–30 phút)

- **Mục tiêu:** xác minh DoD và ghi bằng chứng.
- **Thực thi bởi:** subagent codex
- **Nhóm / phụ thuộc:** tuần tự sau G2.
- **Phạm vi file:** chỉ các test `src-tauri/src/services/{quiz_service,grading_service,attempt_service}/tests.rs` để bổ sung ca thiếu đã yêu cầu; đọc implementation, DB thử nghiệm và báo cáo qua handoff; không chỉnh docs/README hay dữ liệu cá nhân.
- **Truy vết:** toàn bộ acceptance bên dưới, đặc biệt R1/Q-03/Q-10/Q-11/Q-19; summary §8 cho Sprint 04/05/07.
- **Prompt giao codex:** Chạy test shuffle/clamp, exact-set, transaction/rollback và DTO; đọc lại dữ liệu SQLite của lượt smoke để đối chiếu thứ tự option hiển thị với JSON lưu. Kiểm tra file/hàm giới hạn, typed wrapper và không thêm dependency. Thực hiện smoke có thể tự động bằng công cụ sẵn có; gửi checklist cụ thể cho Hyan với kết quả chưa kiểm được đánh dấu PENDING, không đánh pass thay người dùng. Handoff gồm DTO, đường dẫn implementation, lệnh/kết quả, lỗi nguồn spec và bằng chứng snapshot Q-04.
- **Chấp nhận / G3:** AC-SIZE; toàn bộ automated pass, bằng chứng đủ các invariants, manual có kết quả xác nhận; thiếu manual thì NEED_INPUT, chưa SPRINT DONE.
- **Lệnh kiểm tra:** `cargo fmt --manifest-path src-tauri/Cargo.toml -- --check`; `cargo test --manifest-path src-tauri/Cargo.toml`; `cargo build --manifest-path src-tauri/Cargo.toml`; `pnpm lint`; `pnpm build`. Chạy script format FE đã chốt ở Sprint 00 nếu có; không tự cài formatter.

## ACCEPTANCE — Definition of Done

- [ ] Q-04/BR-81: submit ghi đủ question_text/options_snapshot/correct_option_ids cùng transaction; GradedQuestionDto trả snapshot vừa lưu và optionOrder dạng mảng; lỗi ghi snapshot rollback toàn bộ.

- [ ] G0–G3 có kết quả, không task BLOCKED/PENDING; build/lint/format/test theo scripts Sprint 00 pass.
- [ ] `quiz_start` default random=true; số câu clamp đúng, không trùng ID gốc, không “Lượt ôn”; không ghi attempt và không đổi position/option gốc trong DB.
- [ ] Test random OFF giữ thứ tự câu/option; ON gọi cả hai strategy shuffle với RNG kiểm soát được, kể cả N≥pool. Không dùng assertion “hai lần random luôn khác” vì hoán vị cũ vẫn có thể xảy ra hợp lệ.
- [ ] Serialize QuizStartRes không có `is_correct`/`isCorrect` hoặc correctOptionIds; selectionMode đủ quyết định radio/checkbox; position liên tục 0..N-1, optionOrder khớp chính xác mảng options.
- [ ] Cùng bộ câu trong UI, navigator, progress và payload submit; labels câu theo position+1, labels option theo thứ tự phiên; không chấm theo A/B/C/D.
- [ ] Exact-set được test với tập đúng {a,c}: {a,c} và {c,a} đúng; {a}, {a,c,b}, {b,c}, [] sai; câu single đúng/sai/trống và điểm 0, 10, làm tròn 2/3→6.7 pass.
- [ ] Submit cả bài trống được điểm 0 và vẫn N dòng; không chia cho 0 khi payload rỗng (Validation).
- [ ] Submit success persist 1 attempts + N attempt_answers, JSON đầy đủ, đúng position/option_order cho random ON và OFF; selected_option_id chỉ là đại diện theo schema.
- [ ] Test invalid question/option membership, duplicate/missing position và malformed/incomplete optionOrder không ghi dở; lỗi insert child sau insert parent rollback hoàn toàn.
- [ ] Điểm, tên đề/môn và thời điểm/thời lượng do BE tạo; UTC được lưu, mốc hiển thị dùng Asia/Ho_Chi_Minh; không lưu nhãn kỳ thừa.
- [ ] Warning liệt kê đúng số thứ tự câu trống; quay lại/Esc/backdrop không invoke; làm hết nộp thẳng; pending không double-submit; error không mất câu trả lời.
- [ ] Navigator và warning tái sử dụng một lưới; dialog đạt focus/aria/keyboard; jump đóng trước/cuộn/focus/highlight 2.2s và dọn timers; editor variant vẫn dùng được.
- [ ] Hợp đồng request/response Rust↔TS, ID gốc/session, JSON order và ownership file được bàn giao; Sprint 04 có thể đọc dữ liệu sau khởi động lại để dựng review.
- [ ] Không triển khai màn xem lại, lịch sử, thống kê hoặc hard limit 200; không phát sinh dependency mới; file ≤~200 dòng/hàm ≤~40 dòng.

### Checklist nghiệm thu thủ công cho Hyan

Dùng DB thử nghiệm, một đề ≥5 câu có cả câu 1 đáp án đúng và câu nhiều đáp án đúng. Ghi PASS/FAIL/PENDING và bằng chứng cho mỗi dòng; câu nhiều đáp án tạo bằng import từ Sprint 02.

1. Từ SCREEN-04 mở config: số mặc định min(25,n), các preset đúng, random mặc định ON; thử 0/âm/>n và đối chiếu số thực tế. OFF hiển thị nguyên thứ tự câu/option; ON có thể xáo cả hai, không nhân bản câu.
2. Chọn/đổi radio; chọn nhiều checkbox rồi bỏ tất cả: progress tăng/giảm theo câu, không theo số tick. Không thấy đáp án đúng. Đồng hồ mm:ss tăng, không tự nộp.
3. Mở “Danh sách câu”: đủ câu phiên, đã làm có ✓, hiện tại có ring, flag toggle; chọn câu đóng dialog và cuộn/focus đúng vị trí. Thử liên tiếp để highlight không bị timer cũ tắt sớm.
4. Tab/Shift+Tab không thoát dialog; Esc/backdrop đóng và trả focus. Trong warning, focus đầu ở “Quay lại làm tiếp”; số câu trống đúng kể cả sau khi bỏ checkbox.
5. Bấm quay lại: answers/timer không reset, chưa có attempt. “Vẫn nộp” khi trống toàn bộ nhận 0; nộp đủ không hiện warning. Nhấp nộp nhanh hai lần chỉ tạo một lượt qua UI.
6. Tạo một lượt thiếu/thừa đáp án đa chọn và một lượt đúng đủ; đối chiếu điểm exact-set và toast sau commit. Lỗi submit trong môi trường thử nghiệm phải giữ phiên để tiếp tục.
7. Codex hỗ trợ đọc DB thử nghiệm: đối chiếu N dòng, position 0..N-1, IDs chọn và option_order với thứ tự UI đã ghi nhận; đóng/mở app rồi đọc lại thấy dữ liệu còn nguyên. Chưa yêu cầu màn review Sprint 04.
8. Breadcrumb về đề kết thúc phiên chưa nộp, không tạo attempt; sidebar giữ state; bắt đầu phiên mới reset answers/flag/timer; editor navigator cũ không hỏng.

### Rủi ro và câu hỏi mở

| Vấn đề | Cách xử lý trong Sprint 03 |
|---|---|
| Option shuffle lệch UI/DB | Chỉ BE xáo; giữ ID gốc và optionOrder từ start→submit→DB; test round-trip cả ON/OFF; không sort lại options khi render |
| Bảng structure §6.2 thiếu option_order; §3 gọi QuizConfigReq khác QuizStartReq | Theo §7.2/Q-19 + summary §8: chốt QuizStartReq và AttemptAnswerReq có optionOrder như trên, báo lệch nguồn |
| Ẩn is_correct nhưng FE cần chọn control | Bổ sung selectionMode trong DTO, không gửi tập đáp án đúng lúc start |
| domain BR-25/63 có chữ “đảo/sai vị trí” gây hiểu nhầm | Exact-set so tập ID, đảo thứ tự cùng tập vẫn đúng; vị trí hiển thị không là khóa chấm |
| structure §5.5 nói option_order migration ở sprint thùng rác | Summary §3/§8 yêu cầu schema Sprint 00 đã có; G0 kiểm tra, thiếu thì báo blocker, không đợi Sprint 05 mới lưu |
| Q-04/BR-81 đã chốt | Snapshot đầy đủ trong transaction submit; test đối chiếu DB/DTO và rollback; Sprint 04 nghiệm thu review sau sửa/xóa câu |
| Đề bị sửa hoặc xóa giữa start và submit | Validate active/membership/order trong transaction; dữ liệu không còn hợp lệ trả lỗi, không ghi một phần; không tự thiết kế version/session backend |
| Không có server-side quiz session/idempotency token | Hợp đồng hiện tại không chứng minh payload là đúng phiên đã cấp; app local dùng state FE chuẩn và guard double-submit. Retry sau crash/không rõ commit chưa có exactly-once guarantee; không mở rộng protocol trong sprint |
| Lịch sử/SCREEN-07 thuộc Sprint 04 | Sprint 03 chỉ bàn giao kết quả, toast và nhánh hoàn tất tối thiểu; không đánh dấu acceptance review là đã xong |

Không còn câu hỏi mở cho random chung, checkbox, exact-set hoặc cảnh báo nộp: các quyết định đã chốt. Q-04 snapshot được ghi ở Sprint 03 và đọc ở Sprint 04; Q-07 đánh số lịch sử, Q-09 hard limit 200 thuộc Sprint 07; không lấy chúng làm lý do chặn công việc đã xác định. Nếu G0 phát hiện hợp đồng Sprint 02 không thể ánh xạ mà không đổi kiến trúc, gửi câu hỏi cụ thể kèm hai phương án và ảnh hưởng; không âm thầm chọn thiết kế mới.

───────────────────────────────────────────────────────

## 🛑 STOP CONDITIONS (DỪNG NGAY khi đạt 1 trong các điều này)

- Tất cả ACCEPTANCE pass → DỪNG, báo "SPRINT DONE"
- Retry 1 task quá 2 lần mà vẫn fail → DỪNG, escalate
- Phát hiện task cần design decision không có trong spec → DỪNG, hỏi
- Cần thêm dependency ngoài list đã cho → DỪNG, hỏi
- Task vượt quá 30 phút ước tính → DỪNG, chia nhỏ lại

## 🔁 RETRY BUDGET (giới hạn số lần thử)

- Mỗi task: tối đa 2 lần thử
- Mỗi lần thử: phải thay đổi approach, KHÔNG được lặp y hệt
- Sau lần 2 fail: DỪNG task đó, chuyển sang task khác
- Cuối sprint: list ra các task chưa xong + lý do

Chỉ tiếp tục task độc lập không bị blocker; không bắt đầu wave sau khi gate trước fail. Không có lần thử thứ ba.

## 🚨 ESCALATION TRIGGERS (khi nào hỏi user)

DỪNG và hỏi user khi:

1. Lỗi không rõ nguyên nhân sau 2 lần debug
2. Cần chọn giữa 2 approach (A vs B) mà spec không nói
3. Cần thay đổi kiến trúc hiện tại (folder structure, store shape)
4. Phát hiện bug ở sprint trước ảnh hưởng sprint này
5. Cần user test thủ công (visual, UX, performance)

Hoàn thành và ghi bằng chứng các kiểm tra tự động trước khi gửi checklist Hyan. Handoff NEED_INPUT phải nêu mục spec/đầu vào bị thiếu và tác động, không hỏi lại quyết định đã chốt.

## 🚫 OUT OF SCOPE (KHÔNG được làm)

- KHÔNG refactor code ngoài file list ở TASKS
- KHÔNG thêm feature ngoài GOAL
- KHÔNG đổi UI/UX ngoài spec
- KHÔNG optimize premature (chỉ làm khi ACCEPTANCE yêu cầu)
- KHÔNG viết test (trừ khi task yêu cầu rõ)
- KHÔNG update README/docs (trừ khi task yêu cầu)

Test được yêu cầu rõ ở S03-T02/S03-T03/S03-T06/S03-T09. Không thêm màn review/history, resume/draft, đồng bộ cloud/auth, countdown/auto-submit, hai công tắc random độc lập, parser/editor mới, export hoặc migration tùy tiện.

## 📤 HANDOFF FORMAT (khi DỪNG, báo cáo theo format này)

```text
STATUS: [DONE | PARTIAL | BLOCKED | NEED_INPUT]
SPRINT: 03

✅ COMPLETED:
- [task]: [file changed] | [bằng chứng acceptance]
- [gate]: [lệnh kiểm tra, số test thực chạy, pass/fail]
- Hợp đồng bàn giao: quiz_start/QuizStartRes; attempt_submit/
  AttemptResultDto/GradedQuestionDto; attempt_answers.position/option_order;
  QuestionNavigatorDialog/SubmitWarningDialog/QuestionNumberGrid.

❌ FAILED (nếu có):
- [task]: [lỗi gì] | [đã thử gì, tối đa 2 lần] | [cần gì từ user]

🤔 NEED_INPUT (nếu có):
- [câu hỏi]: [mục nguồn yêu cầu] | Option A: [...] | Option B: [...]
- Manual Hyan: [ca còn PENDING và thao tác cần xác minh]
- Lệch tài liệu nền/bằng chứng Q-04: [phát hiện, cách xử lý, sprint nhận tiếp]

📋 NEXT ACTION:
- Nếu DONE → "SPRINT DONE. Ready for sprint 04, paste next prompt"
- Nếu BLOCKED → "Waiting for user response on X"
- Nếu PARTIAL → "Continue task Y after user confirms"
- Nếu NEED_INPUT → [câu hỏi/checklist cụ thể còn chờ]
```

═══════════════════════════════════════════════════════

**Acceptance wire liên sprint (summary §8):** AC-SIZE; mọi task tạo/sửa DTO phải chạy fixture serialize/deserialize Rust và mapper TS dùng chung; tên JSON camelCase, câu `ask`, option `text`, không rò `isCorrect` trước quiz/nếu includeAnswers=false. Tích hợp cuối sprint sở hữu allowlist `tests/fixtures/wire/quiz-attempt.json`, `src-tauri/tests/wire_quiz_attempt.rs`, `src/test/wire-quiz-attempt.test.ts`; không đổi fixture sprint trước để che lỗi tương thích.

**Fixture Q-04/Q-19 bắt buộc:** fixture wire dùng `optionOrder: ["o2", "o1"]` là mảng ID ở quiz_start, AttemptSubmitReq, AttemptResultDto/GradedQuestionDto và attempt_review; từ chối chuỗi JSON trên wire. Rust mapper round-trip SQLite JSON TEXT; TS dùng mảng trực tiếp. Fixture graded/review chứa `questionText`, `optionsSnapshot: [{id:"o1",text:"A"},{id:"o2",text:"B"}]`, `correctOptionIds: ["o2"]`; snapshot không được có trong quiz_start hoặc request submit. Test submit atomic ghi đủ ba cột, lỗi ghi snapshot rollback cả parent/child; review sau sửa/xóa câu/options và tạo lại service vẫn giữ nội dung/tập đúng/thứ tự ban đầu.
