═══════════════════════════════════════════════════════
SPRINT 02 — CÂU HỎI & IMPORT
═══════════════════════════════════════════════════════


**AC-SIZE — acceptance chung bắt buộc:** mọi task code/config/test phải kiểm tra file ≤~200 dòng và hàm ≤~40 dòng; báo số dòng/file và rà ranh giới hàm trong kết quả task, tách module khi vượt, không nén code để né giới hạn. Mọi acceptance task bên dưới viện dẫn AC-SIZE, gate không pass khi chưa kiểm tra.

**Quy tắc UI bắt buộc:** mọi task UI dùng CSS variables/token light và dark từ Sprint 00; không ghi màu hex trực tiếp trong component hoặc style UI.

## CONTEXT

Sprint 00 cung cấp Tauri 2 + React 19 + TypeScript, SQLite/migration 001, Tailwind, lucide-react, wrapper invoke và bộ lệnh kiểm tra; Sprint 01 cung cấp CRUD môn, `exam_list`/`exam_get`/`exam_delete`, DTO, unique tên, soft delete và breadcrumb.
Sprint 02 hoàn thiện SCREEN-05: chỉnh cây câu hỏi trong draft RAM, đồng bộ Render ↔ JSON/TXT, validate rồi lưu SQLite; bàn giao dữ liệu và component cho Sprint 03/04.
Đây là prompt triển khai sau Sprint 01, không phải xác nhận các sprint trước đã chạy: tại thời điểm soạn tài liệu repository còn khung demo; phải kiểm tra đầu vào tại S02-T00 trước khi triển khai.

## GOAL

Hoàn thành SCREEN-05 để người dùng soạn inline, chèn/xóa câu và option, đổi tập đáp án đúng, chuyển JSON/TXT hai chiều có highlight và lỗi theo dòng, rồi lưu/mở lại bộ đề có ≥1 câu với mỗi câu ≥2 lựa chọn và ≥1 đáp án đúng, vượt qua parser unit tests và FE smoke JSON/TXT.

## PHẠM VI, PHỤ THUỘC VÀ TÀI LIỆU NỀN

- **Trong:** UC-06, UC-15, UC-07..UC-14; BR-08..BR-12, BR-37..BR-47, BR-65; SCREEN-05; `question_update`, `question_insert`, `question_delete`, `option_add`, `option_remove`, `option_set_correct`, `import_parse`; bảng `questions`, `answer_options`; triển khai `exam_save` tại sprint này, dùng `exam_get` Sprint 01.
- **Component:** QuestionCard, OptionRow, InlineEditableText, AnswerBadge, EditorTitleBar, EditorSplitPane, FormatTabs, CodeEditorTextarea, ParseErrorBanner, InsertQuestionGap, QuestionJumpPopover (editor, tên truy vết cũ), SyntaxHighlightedTextarea. Bản port của QuestionJumpPopover là **QuestionNavigatorDialog variant editor**, theo cập nhật R3; không xây thêm popover thứ hai.
- **Ngoài:** luồng quiz, timer, random, chấm điểm, attempt/history, thống kê, thùng rác, theme switch/AI Guide; import file, export file/backup, lưu draft, autosave, undo, drag/drop, giới hạn 200 câu, dependency mới. Serialize JSON/TXT trong editor thuộc phạm vi; xuất file không thuộc phạm vi.
- **Phụ thuộc:** Sprint 00 hoàn tất; Sprint 01 có `ExamDetail`, `QuestionDto`, `exam_get`, query invalidation và navigation. Không thay hợp đồng Sprint 01 âm thầm; nếu thiếu hoặc sai, ghi blocker cụ thể.

Đọc trước khi nhận task (không chép nguyên code ref):

| Tài liệu | Mục phải đọc và mục đích |
|---|---|
| `docs/sprint/sprint-prompt-template.md` | Toàn bộ; giữ GOAL/TASKS/ACCEPTANCE và các quy tắc dừng, retry, handoff |
| `docs/sprint/sprint-plan-summarize.md` | §3 quy ước, §4 thứ tự/phụ thuộc, §5 Sprint 02, §8 hợp đồng liên sprint |
| `docs/domain-core.md` | §4.4 Question, §4.5 AnswerOption; §5.5 BR-37..46; §5.6 BR-47; §5.9 BR-65 và cập nhật nhiều đáp án; §6 UC-06/15, UC-07..14; §7 điều hướng/reset; đối chiếu BR-08 và UC-15 khi nối Lưu |
| `docs/design-system.md` | §3.4 split pane; §4.32..4.42 tất cả component editor; §5 SCREEN-05; §6.5 inline edit, §6.6 insert gap; đọc thêm §4.56 navigator, §4.59 highlight, §2.1f màu token, §6.9 focus để áp cập nhật mới |
| `docs/db.dbml` | Toàn bộ định nghĩa/notes/index/FK của `questions`, `answer_options`; đối chiếu quan hệ exam và attempt khi sửa/xóa |
| `docs/structure-be.md` | §3 parsers và phân tầng; §4 Factory/Builder, Parser, DI, Unit of Work; §6.2 command, §6.3 mirror TS; §7 chỉ có luồng mẫu khác, **không có luồng riêng question/import**, không suy diễn autosave; §8 `features/import`, `features/exam`, wrapper |
| `docs/ref-ui.tsx` | Chỉ tham chiếu L39..141 parse/serialize; L505..788 card; L879..946 sync/chèn/focus; L984..1056 mở/lưu; L2330..2564 SCREEN-05 |

Cập nhật R4/BR-47/BR-65 và R3/Q-10 được ưu tiên so với hành vi ref cũ: TXT báo lỗi, Lưu validate, nhiều đáp án đúng hợp lệ, navigator dùng dialog.

## QUY ƯỚC CHO TẤT CẢ SPRINT

> Nội dung chung dưới đây giữ nguyên văn quy ước có trong summary §3. Khi giao task, đưa khối này cùng hợp đồng liên quan và prompt task vào **mọi prompt subagent**, không chỉ dẫn codex tự đoán từ task lân cận.

**Thực thi bằng subagent codex (bắt buộc).** Mọi công việc triển khai (code, config, migration, test, refactor) đều giao cho `subagent_codex`. Mỗi task có: Mã task, tên, mục tiêu, Thực thi bởi = `subagent codex`, Nhóm chạy (song song P1/P2… hay tuần tự) + Phụ thuộc, Phạm vi file (không giao trùng file giữa task song song), UC/BR/component/command/bảng liên quan (mã + mục tài liệu nền), Prompt giao cho codex (tự chứa), Tiêu chí chấp nhận + Lệnh kiểm tra.

**Song song hóa.** Phân tích đồ thị phụ thuộc, gom nhóm gọi nhiều codex cùng lúc. File dùng chung (`lib.rs`/`invoke_handler`, `mod.rs`, routes, `index.html`, config) gom vào **một task tích hợp** chạy sau cùng nhóm (một codex). Chốt hợp đồng (tên command/DTO/kiểu TS/component/props) trước khi song song. Mỗi sprint có sơ đồ ASCII wave + gate kiểm tra tổng sau mỗi wave. Cuối sprint: task kiểm thử & nghiệm thu (codex) + checklist nghiệm thu thủ công cho Hyan.

**Nội dung bắt buộc mỗi file sprint:** mục tiêu/phạm vi/phụ thuộc; tài liệu nền phải đọc (đường dẫn + mục/mã); hợp đồng tạo ra/dựa vào; sơ đồ wave + task; Definition of Done, checklist nghiệm thu, rủi ro, câu hỏi mở.

**Quy tắc kỹ thuật chung:** phân tầng `commands → services → repositories → db`, DI qua `tauri::State`, Unit of Work cho thao tác nhiều bước; file ≤ ~200 dòng, hàm ≤ ~40 dòng; DRY/SOLID, không over-engineer; Tailwind + `lucide-react`; thời gian lưu UTC, hiển thị `Asia/Ho_Chi_Minh`; schema qua migration đánh số; test Rust SQLite in-memory.

**Sprint 00** phủ toàn bộ §9 `structure-be.md`: Tailwind + lucide-react, crate SQLite/migration/chrono-tz + crate đã chốt (verify version trước khi ghi), capabilities tối thiểu, `tauri.conf.json` 1280×800/minWidth 1024, thay `App.tsx` demo bằng khung app, lint/format/test, script `package.json`.

Bổ sung áp dụng Sprint 02:

- Chỉ dùng dependency đã cài/chốt ở Sprint 00/01. Không thêm Monaco/CodeMirror, parser crate, state store hay test runner. Nếu công cụ thiếu, báo thiếu cụ thể.
- Code ≤~200 dòng/file, ≤~40 dòng/hàm; test tách module/file khi cần và khai báo trong phạm vi task. Giới hạn này áp dụng code, không ép tài liệu sprint còn 200 dòng.
- Một owner cho mỗi file mỗi wave. Task cần sửa file ngoài danh sách phải báo coordinator; đổi đường dẫn theo cây Sprint 01 tại S02-T00 trước khi chạy song song. Không tự tạo implementation trùng tên.
- FE chỉ gọi BE qua `src/lib/tauri/commands.ts`. Rust/TS có tham chiếu chéo tên DTO theo structure-be §6.3; wire JSON camelCase, Rust snake_case + `#[serde(rename_all = "camelCase")]` theo summary §8.
- Không sửa tài liệu nền trong sprint; phát hiện lệch spec phải ghi handoff. Các task dưới đây đã yêu cầu rõ những test cần viết; không thêm test ngoài mục tiêu.

## HỢP ĐỒNG ĐẦU VÀO / BÀN GIAO

### 1. Vòng đời editor và persistence

1. Mở mới: title rỗng, tab JSON, hai câu mẫu theo UC-06/SCREEN-05. Mở sửa: gọi `exam_get` với `includeAnswers=true`, clone cây câu hỏi vào draft; không sửa trực tiếp query cache.
2. Inline/chèn/xóa/đổi option chỉ sửa draft RAM, rồi serialize toàn bộ format đang chọn. Không ghi SQLite từng keystroke, không persist draft/localStorage. Rời/reset editor xử lý như domain §7, không tự thêm dialog cảnh báo.
3. `import_parse` thuần parse, không DB; tạo ID mới khi parse thành công, giữ thứ tự gốc. ParsedExamDto không tự tạo bộ đề đã lưu.
4. Nút Lưu gửi toàn bộ cây qua **`exam_save` Sprint 02**. Validate ≥1 câu, mỗi câu ≥2 option và ≥1 đúng ở service, dù FE đã kiểm tra. `ask` và option text được rỗng; nhiều đúng hợp lệ. Validate thất bại hoặc DB lỗi → không ghi một phần, ở lại editor. Thành công → SCREEN-04, invalidate list/detail và cập nhật `updated_at` UTC theo hợp đồng Sprint 01.
5. Các command `question_*`/`option_*` trong §6.2 nhận ID của thực thể đã persist, được triển khai và kiểm thử riêng; **không dùng chúng để autosave draft**. Sửa text option trong editor đi qua draft và `exam_save`, vì spec không có `option_update`. Tổng cộng tám command mới, bao gồm exam_save; không thêm tên ngoài danh sách. Nếu Sprint 01 đã chọn cơ chế khác gây xung đột vòng đời, dừng ở S02-T00 để chốt.

### 2. Command và DTO

Wire DTO dưới đây dùng JSON camelCase theo summary §8; Rust dùng snake_case + `#[serde(rename_all = "camelCase")]`. Nội dung câu dùng `ask`, option dùng `text`; model UI riêng phải đi qua mapper, không đổi wire theo UI.

| Command | Request | Response / lỗi | Quy tắc |
|---|---|---|---|
| `exam_save` | `ExamSaveReq { id?, subjectId, title, questions: QuestionUpsertReq[] }` | `ExamDetail`; NotFound/Validation/DuplicateName | Tạo/cập nhật atomic; ≥1 câu, ≥2 options/câu, ≥1 đúng; unique title trong môn; giữ createdAt khi sửa, touch updatedAt |
| `question_update` | `QuestionUpdateReq { id, ask }` | `QuestionDto`; NotFound | `ask` map về DB `ask` và UI `ask`; được rỗng |
| `question_insert` | `QuestionInsertReq { examId, position, ask, options }` | `QuestionDto`; NotFound/Validation | position 0..N, validate options; shift thứ tự trong transaction |
| `question_delete` | `IdReq { id }` | Ok; NotFound | Xóa câu/option và đánh lại position; draft được xóa đến 0, Lưu 0 câu bị chặn |
| `option_add` | `OptionAddReq { questionId, text }` | `QuestionDto`; NotFound/Validation | Thêm cuối; đúng chỉ khi trước đó chưa có option |
| `option_remove` | `IdReq { id }` | `QuestionDto`; NotFound/Validation | ID option; từ chối khi còn ≤2; xóa option đúng thì gán option đầu đúng theo BR-45; không xóa các cờ đúng khác |
| `option_set_correct` | `OptionSetCorrectReq { questionId, correctOptionIds: Vec<String> }` | `QuestionDto`; NotFound/Validation | Nhận tập không rỗng thuộc chính câu hỏi; không ép singleton; không đổi text/thứ tự |
| `import_parse` | `ImportParseReq { format: "txt" hoặc "json", raw }` | `ParsedExamDto`; Validation với dòng lỗi cú pháp | Không write DB; kết quả parse và validation tách biệt |

DTO dùng chung:

- `QuestionDto`: ID, `ask`, position và options có ID, text, `isCorrect`, position; tái sử dụng shape của `ExamDetail` Sprint 01. Nếu `QuestionDto` đã tồn tại, không tạo biến thể song song. `content` nếu còn trong model domain/UI cũ chỉ được chuyển bằng mapper sang `ask`; không xuất `content` trên wire.
- `QuestionUpsertReq { id?, ask, options: OptionUpsertReq[] }`, `OptionUpsertReq { id?, text, isCorrect }`; position theo thứ tự mảng. S02-T04 khai báo ExamSaveReq và các DTO ghi; S02-T08 triển khai lưu, không yêu cầu Sprint 01 đã có.
- `ParsedExamDto { title?: string, questions: QuestionDto[], issues: ParseIssueDto[] }`; title không được suy diễn từ câu đầu. Hai format mảng/TXT không mang title nên để trống, FE giữ title editor.
- `ParseIssueDto { line: number, message: string }`; **quy ước sprint: line 1-based**, là dòng vật lý trong raw input, không phải số thứ tự câu. JSON lỗi cú pháp dùng vị trí parser; lỗi validation dùng dòng bắt đầu object câu hỏi. TXT dùng dòng `ask`, hoặc dòng `ans.` đầu tiên tạo câu ngầm. Dữ liệu trống/JSON top-level sai quy về dòng 1. Không dùng tìm substring `ask` để suy dòng JSON vì giá trị có thể chứa key/text trùng.
- `lineErrors` của SyntaxHighlightedTextarea theo design §4.59 là **0-based**: adapter duy nhất chuyển `issue.line - 1`, lọc trùng và giá trị không hợp lệ; banner vẫn hiển thị 1-based.
- Quy ước kết quả parse được chốt tại S02-T00: parse được cấu trúc → trả `questions` cùng `issues` kể cả chưa đạt BR-47; lỗi JSON cú pháp/top-level không phải mảng → `AppError::Validation` chứa structured issues. FE không phải bóc số dòng từ chuỗi tiếng Việt. Giữ envelope AppError Sprint 01, bổ sung issues nếu thiếu trong task tích hợp.

### 3. Parser, serializer và trạng thái lỗi

**TXT — tokenizer → parser → validator:** split LF/CRLF, giữ số dòng gốc kể cả dòng trống; trim để nhận token không phân biệt hoa thường. Kiểm tra lần lượt `^ask\s*:`, `^ans\.\*`, `^ans\.`; còn lại là Text. `ask` mở câu; `ans.*` đúng, `ans.` sai; đáp án trước câu tạo câu ask rỗng. Text nối vào ask nếu chưa có option, ngược lại nối option cuối bằng một dấu cách; text trước câu/đáp án đầu tiên bị bỏ qua theo ref L129..136. Không tự biến mọi dòng lạ thành lỗi cú pháp. Validator liệt kê mọi câu <2 option hoặc không có đáp án đúng cùng số dòng mở câu; không thêm fallback 4 option cho TXT.

**JSON:** phải là mảng, sai báo “JSON phải là một mảng [...]”. `ask` không string → rỗng, `answer` không array → rỗng; không option → fallback 4 option rỗng, đầu tiên đúng (BR-39). Option có own key `true` → đúng, ưu tiên text từ `true`, còn lại từ `false` hoặc chuỗi rỗng, chuyển text theo quy tắc ref. Serialize luôn đúng một key `true`/`false` trên mỗi object lựa chọn. Câu có một option hoặc toàn false bị validator báo lỗi; nhiều true hợp lệ. Dữ liệu phần tử null/scalar ngoài mô tả cần chốt xử lý tại gate hợp đồng, không panic.

**Serialize:** JSON `[{ ask, answer: [{ "true": text }, { "false": text }] }]`, indent tab; TXT `ask : …`, `ans.* …`, `ans. …`, các câu cách đúng một dòng trống. Không nhúng ID/position nội bộ vào hai format. Round-trip so nội dung, thứ tự và tập đúng, không so ID; TXT nối dòng nên không bảo đảm giữ nguyên whitespace/newline. Text có dòng bắt đầu giống token có thể không round-trip lossless: không tự thêm escape grammar.

**State transition bắt buộc:**

| Sự kiện | Raw text | Draft Render | Lưu |
|---|---|---|---|
| JSON đúng cú pháp | Giữ người dùng đang gõ | Thay bằng cây parse; hiện issues validation nếu có | Chỉ khi draft đạt BR-47/BR-08 |
| JSON sai cú pháp/top-level | Giữ nguyên | Giữ bản parse được gần nhất | Lỗi cú pháp riêng không chặn lưu bản draft hợp lệ; không lưu raw hỏng |
| TXT bất kỳ, kể cả dở dang | Giữ nguyên | Cập nhật cây parse được, kể cả 0/1 option | Chặn khi có lỗi validation hoặc 0 câu |
| Inline/chèn/xóa/đổi option | Serialize lại toàn bộ draft | Áp thao tác tương ứng | Xóa lỗi cú pháp cũ nhưng tính lại validation; không xóa lỗi thật |
| Đổi tab JSON ↔ TXT | Serialize draft hiện tại, ghi đè raw dở dang | Giữ nội dung draft | Clear lỗi cú pháp, chạy lại validation; không biến TXT chưa hợp lệ thành hợp lệ chỉ do đổi tab |

Async invoke cần sequence/revision: chỉ response tương ứng raw/format/draft mới nhất được áp. Inline edit, đổi tab, reset, unmount vô hiệu hóa response cũ; Lưu không chạy dựa trên draft cũ trong lúc parse raw mới chưa xong. Không thêm debounce làm đổi ngữ nghĩa mỗi keystroke nếu chưa có spec.

### 4. Component/props và bố cục bàn giao

| Component | Hợp đồng tối thiểu |
|---|---|
| `QuestionCard` | `question`, `index`, `mode: editor|preview|quiz|result`, `showAnswer?`, `isFocused?`, callbacks cập nhật/xóa; props chọn đáp án mảng cho mode quiz/result chỉ là render/callback thuần, không có session/chấm/DB |
| `OptionRow` | `opt`, `index`, `mode`, `selectionType: single|multi`, `isSelected`, `showAnswer`, `onSelect`, `onSetCorrect`, `onRemove`, `onEditText` |
| `InlineEditableText` | `value`, `kind: ask|option`, `onChange`, placeholder; ask textarea rows=2 blur thoát, Enter xuống dòng; option input blur/Enter thoát; không thêm Escape hoàn tác |
| `AnswerBadge` | `variant: correct-soft|correct-solid|new|sync` theo §4.35 |
| `EditorTitleBar` | `title`, `questionCount`, `onTitleChange`, `onSave`; nối lỗi tên trùng từ exam_save Sprint 02 |
| `EditorSplitPane` | Slots/header/list/input hoặc props tương đương chốt tại S02-T00; hai pane 640px, grid 1 cột/`lg:grid-cols-2`, gap-6, radius 26px, p-5; không divider kéo |
| `FormatTabs` | `value: txt|json`, `onChange`; mặc định JSON |
| `CodeEditorTextarea` | `value`, `format`, `onChange`, `placeholder`; JSON thuần, spellCheck=false, Tab chuyển focus |
| `ParseErrorBanner` | `format`, `parseError`, `issues`; `id="parse-error"`, role=status, aria-live=polite; hiện “Dòng N: …” |
| `InsertQuestionGap` | `insertIndex`, `onInsert`; N+1 vùng chèn, hiện khi hover/focus |
| `QuestionNavigatorDialog` | `open`, `variant=editor`, `questions`, `onSelect(index)`, `onClose`; kế thừa tên chuẩn §4.56, lưới 4 cột + trích ask, không quiz flags trong sprint này |
| `SyntaxHighlightedTextarea` | `value`, `onChange`, `lineErrors?: number[]`, `placeholder`, `onCaretMove?`; lineErrors 0-based, aria-describedby tới banner |

QuestionCard cung cấp các mode hiển thị theo §4.32 nhưng chỉ nối editor/preview vào app; Sprint 03/04 nối quiz/result. Radio với câu một đáp án đúng chọn singleton; checkbox với câu nhiều đúng toggle từng phần tử, không ép về singleton. Không thêm field `questionType` hoặc nút đổi loại ngoài spec; tạo câu nhiều đúng qua import. Draft không còn đáp án đúng vẫn phải hiện lỗi/chặn Lưu.

Chèn câu tại vị trí: `Câu hỏi mới #{length+1}`, bốn option, B đúng; focus + scroll sau render (~80ms). All(n) mở dialog chuẩn, chọn đóng dialog rồi scroll/focus, ring 2.2s, clear timer cũ; Escape/backdrop/X đóng, focus trap và trả focus đúng.

Highlight TXT dùng `<pre>` + native textarea trong suốt, CSS variables `--syntax-ask` đỏ và `--syntax-ans` xanh. Chỉ tô token đầu dòng, cùng quy tắc nhận token của BE; continuation không tô. Hai lớp dùng cùng font/padding/line-height/wrap, sync scroll; caret/selection thấy rõ, Tab không bị nuốt. Render text bằng React text nodes, không chèn raw HTML; pre aria-hidden, textarea có nhãn, focus-visible, aria-invalid/describedby.

### 5. DB và transaction

- Dùng schema Sprint 00: `questions(id, exam_id, ask, position, created_at, updated_at)`; `answer_options(id, question_id, text, is_correct, position, created_at, updated_at)`. Không thêm `deleted_at` vào hai bảng này, không đổi schema để chỉ cho một đáp án đúng.
- `position` 0-based, đọc ORDER BY position; unique `(exam_id, position)` và `(question_id, position)`, CHECK không âm; không update dịch position ngây thơ gây unique collision giữa chừng. Reorder dùng vùng position tạm không âm hoặc chiến lược tương đương trong cùng transaction.
- Service kiểm tra tồn tại, quan hệ cha và trạng thái active của exam/subject; options thuộc câu đang đổi. Multi-step insert/delete/reorder/set-correct + touch exam phải atomic, lỗi rollback. Dùng connection/transaction được truyền xuống repo; không mở connection mới giữa transaction.
- `exam_save` validate toàn bộ trước commit, áp chính sách ID/upsert của Sprint 02 đã chốt ở trên. Không tự xóa/reinsert cả cây nếu làm hỏng quan hệ lịch sử. ID sinh lại khi import và ảnh hưởng attempt là rủi ro Q-04, không triển khai snapshot ở đây.

## TASKS

### Sơ đồ wave và gate

```text
W0  S02-T00 Chốt đầu vào + hợp đồng (tuần tự)
     └─ G0: Sprint 01 sẵn sàng, DTO/props/error/ownership rõ
W1  P1: S02-T01 Parser     || P2: S02-T02 Repository || P3: S02-T03 Card primitives
     └─ S02-T04 Tích hợp W1 (một codex) → G1
W2  P1: S02-T05 Import API || P2: S02-T06 Question API || P3: S02-T07 Import UI
     └─ S02-T08 Tích hợp W2 (một codex) → G2
W3  S02-T09 Editor state → S02-T10 Screen/navigation/Lưu (tuần tự)
     └─ G3: luồng tạo/sửa/parse/lưu đã nối
W4  S02-T11 Kiểm thử & nghiệm thu (codex)
     └─ G4: automated checks + checklist Hyan → handoff
```

Mỗi task ước tính ≤30 phút; nếu vượt, chia nhỏ theo file/chức năng trước khi code. Chỉ mở wave sau khi gate trước pass; không lấy test filter chạy 0 test làm bằng chứng pass. File mới chưa được wire vào module ở nhánh song song chưa thể được xác nhận bằng `cargo test`; task tích hợp phải đăng ký rồi chạy test thật.

Lệnh dùng từ repo root: `pnpm lint`, `pnpm build`, `pnpm exec tsc --noEmit`, `pnpm test <file>`, `cargo fmt --manifest-path src-tauri/Cargo.toml --check`, `cargo test --manifest-path src-tauri/Cargo.toml [filter]`, `cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets -- -D warnings`. Nếu script/tool khác Sprint 00 đã chốt, S02-T00 ghi lệnh tương đương; không cài thêm để lấp thiếu.

### S02-T00 — Khóa hợp đồng và phạm vi file

- **Mục tiêu:** xác nhận đầu vào đủ, quyết định nào đã có trong spec và điểm nào cần escalate.
- **Thực thi bởi:** subagent codex; **Nhóm:** tuần tự W0; **Phụ thuộc:** Sprint 00/01.
- **File:** đọc tài liệu nền và code đầu vào; chỉ task này được cập nhật phần hợp đồng/ánh xạ đường dẫn của `docs/sprint/sprint-02-question-import.md` nếu cần ghi kết luận. Không sửa implementation.
- **Truy vết:** UC-06/15, UC-07..14, BR-37..47/65; toàn bộ component/command/bảng Sprint 02; summary §3/8, structure-be §6.2/8.
- **Prompt giao codex:** “Đọc tài liệu nền liệt kê trong sprint. Kiểm tra exam_get(includeAnswers=true), hợp đồng exam_save sẽ tạo ở S02-T08, migration questions/options, AppError, wrapper và runner thực tế. Khóa casing, QuestionDto, line 1-based/adapter 0-based, semantic parse-success-with-issues, draft-only editor và ID-based commands; xác nhận owner file từng wave. Đối chiếu các câu hỏi mở cuối prompt, không tự quyết nghiệp vụ thiếu spec. Không đổi kiến trúc, thêm command, dependency hay sửa Sprint 01. Trả bảng hợp đồng và blocker có dẫn nguồn.”
- **Chấp nhận/lệnh:** AC-SIZE; G0 chỉ pass khi đầu vào tồn tại, mọi ambiguity chặn triển khai đã được giải quyết; `pnpm build`, `cargo test --manifest-path src-tauri/Cargo.toml` baseline pass. Nếu repo vẫn demo, ghi BLOCKED Sprint 01, không giả lập API.

### S02-T01 — Xây parser có nguồn dòng

- **Mục tiêu:** parse TXT/JSON thành cây raw + issues theo pipeline.
- **Thực thi bởi:** subagent codex; **Nhóm:** P1/W1; **Phụ thuộc:** G0.
- **File:** `src-tauri/src/parsers/{tokenizer,txt_parser,json_parser,validator,raw_question}.rs`, `src-tauri/src/parsers/tests/{txt,json,validation}.rs`; không sửa `mod.rs`.
- **Truy vết:** UC-12/13, BR-39/40/47/65; import_parse; questions/options chưa persist; domain §5.5/5.6, structure-be §3/4.
- **Prompt giao codex:** “Viết tokenizer TXT giữ số dòng vật lý, parser dòng nối và validator dùng chung theo hợp đồng trên. JSON giữ fallback BR-39, nhiều true, tracking dòng object và lỗi cú pháp. Không truy cập DB, không sinh title từ ask. Trả raw tree với provenance và mọi issue, không drop câu sai. Viết unit tests LF/CRLF, dòng trống, case/trim, ans.* trước ans., continuation vào ask/option, ans trước ask, text đầu bị bỏ qua, 0/1 option, không/nhiều đúng, JSON không array/sai cú pháp/fallback. Assert số dòng cụ thể, không chỉ assert có lỗi. Gửi danh sách module cần tích hợp.”
- **Chấp nhận/lệnh:** AC-SIZE; fixture bên dưới đúng; không panic; chạy `cargo test --manifest-path src-tauri/Cargo.toml parsers` tại G1 sau đăng ký, phải có test thực chạy.

### S02-T02 — Xây repository thứ tự câu và option

- **Mục tiêu:** CRUD/reorder có transaction, không vi phạm unique position.
- **Thực thi bởi:** subagent codex; **Nhóm:** P2/W1; **Phụ thuộc:** G0.
- **File:** `src-tauri/src/repositories/{question_repo,option_repo}.rs`, các file test `question_repo_tests.rs`, `option_repo_tests.rs` cùng thư mục; không sửa parent `mod.rs`.
- **Truy vết:** UC-07..11, BR-44..47; question_*/option_*; `questions`, `answer_options`; db.dbml hai bảng, structure-be §3/4.
- **Prompt giao codex:** “Dùng repo trait/SQLite và connection transaction của Sprint 01. Implement đọc theo position, insert/delete/reindex, update ask, option add/remove/set flags; xác thực quan hệ qua service/repo lookup, lọc cha soft-deleted. Không hard-delete exam/subject, không migration. Kiểm tra shift ở đầu/giữa/cuối không đụng unique và không dùng position âm. Viết test SQLite in-memory có schema thật/FK, rollback và không có option mồ côi; gửi chữ ký API cho S02-T06.”
- **Chấp nhận/lệnh:** AC-SIZE; G1 chạy `cargo test --manifest-path src-tauri/Cargo.toml repositories`; assert position liên tục/đúng thứ tự và rollback dữ liệu thực.

### S02-T03 — Xây QuestionCard và primitives

- **Mục tiêu:** component render/inline edit thuần props cho bốn mode.
- **Thực thi bởi:** subagent codex; **Nhóm:** P3/W1; **Phụ thuộc:** G0.
- **File:** `src/features/exam/{QuestionCard,OptionRow,InlineEditableText,AnswerBadge,InsertQuestionGap}.tsx`, `src/features/exam/questionCard.types.ts`.
- **Truy vết:** UC-07..11, BR-44..47; design §4.32..35/4.41/6.5/6.6; command qua callbacks, không DB trực tiếp.
- **Prompt giao codex:** “Dùng props đã chốt để xây QuestionCard editor/preview/quiz/result và primitives đúng ma trận màu/badge design-system. Editor sửa ask/option, thêm/xóa, radio singleton/checkbox nhiều đúng; preview/result chỉ hiển thị, quiz phát callback lựa chọn, không có luồng quiz/chấm. Ask blur thoát/Enter xuống dòng; option blur/Enter thoát; placeholder đúng; xóa option ẩn khi ≤2. Insert gap hover/focus gọi insertIndex. Không invoke, không sửa state global, không ghép screen.”
- **Chấp nhận/lệnh:** AC-SIZE; `pnpm exec tsc --noEmit`, `pnpm lint` sau G1; callback không mutate props; nghiệm thu tương tác tại S02-T11.

### S02-T04 — Tích hợp W1

- **Mục tiêu:** đăng ký module/DTO dùng chung và kiểm tra tổng W1.
- **Thực thi bởi:** subagent codex; **Nhóm:** tuần tự cuối W1; **Phụ thuộc:** S02-T01/S02-T02/S02-T03.
- **File:** `src-tauri/src/{domain,dto,repositories,parsers}/mod.rs`, `src-tauri/src/lib.rs` (module declarations), `src-tauri/src/dto/{question_dto,import_dto,exam_dto}.rs` (khai báo ExamSaveReq/QuestionUpsertReq/OptionUpsertReq trước W2), `src-tauri/src/domain/{question,answer_option}.rs` nếu chưa có, `src/lib/tauri/commands.ts` (types); `src-tauri/src/parsers/tests/mod.rs` nếu cần.
- **Truy vết:** toàn bộ DTO/cây câu, structure-be §3/6.3, summary §8; không UI mới.
- **Prompt giao codex:** “Là owner duy nhất file chung wave này, wire parser/repo/test modules và DTO theo G0; tái dùng entity/DTO Sprint 01, giữ wire ask, mapper domain content→ask nếu có, mirror TS. Đăng ký chỉ module đã có, không khai báo module chưa triển khai. Chạy parser/repo tests thật và FE check; trả gate G1 kèm số test. Không sửa UI/logic task khác để che lệch hợp đồng.”
- **Chấp nhận/lệnh:** AC-SIZE; G1 = `cargo test --manifest-path src-tauri/Cargo.toml`, `pnpm exec tsc --noEmit`, `pnpm lint` pass; fixtures lỗi dòng đúng.

### S02-T05 — Cung cấp import_parse và Factory

- **Mục tiêu:** nối pipeline thành command thuần parse và mapper sang cây lưu.
- **Thực thi bởi:** subagent codex; **Nhóm:** P1/W2; **Phụ thuộc:** G1.
- **File:** `src-tauri/src/services/import_service.rs`, `src-tauri/src/commands/import_cmds.rs`, `src-tauri/src/services/import_service_tests.rs`.
- **Truy vết:** UC-12/13, BR-39/40/47/65; import_parse/ParsedExamDto/ParseIssueDto; structure-be §4 Factory/Parser/§6.2; không bảng được ghi.
- **Prompt giao codex:** “Nhận ImportParseReq, chọn parser, trả ParsedExamDto với questions/issues theo G0. Factory build_exam_from_parsed map cây đã validate sang phần questions của ExamSaveReq, sinh ID bằng helper sẵn có và position theo thứ tự; không tự gọi exam_save. Parse TXT có issue vẫn trả cây; JSON syntax/top-level lỗi trả Validation chứa line/message. Command mỏng DI State, không SQL. Test DTO/error serialization và xác nhận import không ghi DB.”
- **Chấp nhận/lệnh:** AC-SIZE; G2 chạy `cargo test --manifest-path src-tauri/Cargo.toml import`; kiểm tra cả success-with-issues và lỗi có dòng được FE đọc.

### S02-T06 — Cung cấp question/option commands

- **Mục tiêu:** service thực thi sáu thao tác mutation đúng tập đáp án và transaction.
- **Thực thi bởi:** subagent codex; **Nhóm:** P2/W2; **Phụ thuộc:** G1.
- **File:** `src-tauri/src/services/question_service.rs`, `src-tauri/src/services/option_service.rs` (helper nếu cần giới hạn dòng), `src-tauri/src/commands/question_cmds.rs`, `src-tauri/src/services/{question_service_tests,option_service_tests}.rs`.
- **Truy vết:** UC-07..11, BR-44..47; question_update/insert/delete, option_add/remove/set_correct; questions/options; domain §4.4/4.5/§6, structure-be §6.2.
- **Prompt giao codex:** “Implement đúng request/response G0 trên ID persist, service dùng repo và transaction. Kiểm tra cha active, option thuộc câu, tập đúng không rỗng; cho nhiều đúng. Chặn remove khi ≤2; fallback option đầu khi xóa option đúng. Chèn/xóa đánh lại thứ tự, touch exam.updated_at cùng transaction. Không dùng service này autosave editor; không thêm option_update. Test SQLite in-memory NotFound, ID option câu khác, tập rỗng/nhiều đúng, xóa/chèn ở các vị trí và rollback.”
- **Chấp nhận/lệnh:** AC-SIZE; G2 chạy `cargo test --manifest-path src-tauri/Cargo.toml question` và filter `option`; sáu command callable sau S02-T08, không đổi dữ liệu khi thất bại.

### S02-T07 — Xây vùng nhập và highlight

- **Mục tiêu:** UI nhập TXT/JSON, serialize và lỗi theo dòng khớp parser BE.
- **Thực thi bởi:** subagent codex; **Nhóm:** P3/W2; **Phụ thuộc:** G1.
- **File:** `src/features/import/{FormatTabs,CodeEditorTextarea,ParseErrorBanner}.tsx`, `src/features/import/{serializeQuestions,highlightTokens,lineErrors}.ts`, `src/features/import/serializeQuestions.test.ts`, `src/features/exam/SyntaxHighlightedTextarea.tsx`.
- **Truy vết:** UC-12..14, BR-37..43/65; design §4.38..40/4.59; import_parse DTO đọc, không write DB.
- **Prompt giao codex:** “Implement serializer JSON indent tab/TXT đúng BR-37/38, không serialize ID. Viết native textarea overlay cho TXT, token đầu dòng case-insensitive, ans.* trước ans.; JSON vẫn textarea thường. Đồng bộ scroll/font/wrap/caret/selection, pre aria-hidden, không raw HTML. Banner hiện issues dòng 1-based; adapter sang lineErrors 0-based. Dùng token CSS đã có; gửi yêu cầu bổ sung token cho integrator. Viết test serializer round-trip fixture theo giới hạn whitespace TXT và map dòng; chưa invoke hoặc quản lý draft.”
- **Chấp nhận/lệnh:** AC-SIZE; `pnpm test src/features/import/serializeQuestions.test.ts`, FE typecheck/lint tại G2; visual tại S02-T11.

### S02-T08 — Tích hợp W2 và validation khi lưu

- **Mục tiêu:** tám command được đăng ký, wrapper/error thống nhất, `exam_save` áp validator dùng chung.
- **Thực thi bởi:** subagent codex; **Nhóm:** tuần tự cuối W2; **Phụ thuộc:** S02-T05/S02-T06/S02-T07.
- **File:** `src-tauri/src/{lib,state,error}.rs`, `src-tauri/src/{commands,services,dto}/mod.rs`, `src-tauri/src/services/exam_service.rs`, `src-tauri/src/services/exam_save.rs`, `src-tauri/src/repositories/exam_repo.rs`, `src-tauri/src/repositories/exam_save_uow.rs`, `src-tauri/src/commands/exam_cmds.rs`, `src-tauri/src/dto/exam_dto.rs`, `src-tauri/tests/exam_save.rs`, `tests/fixtures/wire/question-import.json`, `src-tauri/tests/wire_question_import.rs`, `src/test/wire-question-import.test.ts`; `src/lib/tauri/{commands,invoke}.ts`, `src/styles/tokens.css` chỉ hai token syntax nếu thiếu.
- **Truy vết:** tám command/DTO, BR-47/65 và BR-08/UC-15 tích hợp; questions/options + exam.updated_at; structure-be §6.2/6.3, summary §8.
- **Prompt giao codex:** “Là owner duy nhất file chung wave này, inject services qua State, register đúng tám tên command trong registry đang dùng (không đăng ký option_toggle_correct), thêm wrapper typed. Giữ structured issues trong AppError mapping. Triển khai mới exam_save (UC-06/UC-15): thiếu id tạo mới, id có phải tồn tại/active và không đổi môn; trim title/fallback Chưa có tiêu đề, unique title trong môn, giữ created_at khi sửa/touch updated_at; dùng UoW ghi exam/questions/options cùng transaction. Nối validator chung vào exam_save, không đổi DTO đọc Sprint 01 hay chính sách unique tên; validate/ghi cây atomic. Test save 0 câu, <2 option, 0 đúng đều không ghi; rỗng text/nhiều đúng lưu được; reload exam_get includeAnswers=true giữ thứ tự/cờ. Thêm token màu đúng design nếu thiếu, không triển khai theme.”
- **Chấp nhận/lệnh:** AC-SIZE; G2 = `cargo test --manifest-path src-tauri/Cargo.toml`, `pnpm test src/features/import/serializeQuestions.test.ts`, `pnpm lint`, `pnpm build`; mirror DTO/error pass, test lưu rollback pass.

### S02-T09 — Nối state editor hai chiều

- **Mục tiêu:** một draft và raw input đồng bộ đúng bảng transition, an toàn response đến sai thứ tự.
- **Thực thi bởi:** subagent codex; **Nhóm:** tuần tự W3; **Phụ thuộc:** G2.
- **File:** `src/features/exam/{useExamEditor,editorActions,editorValidation,editorParseState}.ts`, `src/features/exam/useExamEditor.test.ts`.
- **Truy vết:** UC-06/15, UC-07..14, BR-37..47/65; toàn bộ callback editor, import_parse/exam_save; domain §6/7, design SCREEN-05.
- **Prompt giao codex:** “Implement draft clone/new 2 mẫu, inline actions/default insert B đúng, option guards, serialize sau thao tác. Gọi importParse qua wrapper mỗi raw change; TXT dùng parsed tree dở dang+issues, JSON syntax lỗi giữ draft. Revision guard chặn stale response sau keystroke/inline/tab/reset/unmount; Lưu chờ parse hiện hành rồi validate cây, không gửi raw lỗi. Chuyển tab serialize draft, clear syntax error nhưng tính lại validation. Không invoke question/option mutations từ draft. Viết test có promises trả đảo thứ tự và case tab/reset, TXT lỗi chặn save, JSON syntax lỗi vẫn save draft hợp lệ, multi đúng không bị mất.”
- **Chấp nhận/lệnh:** AC-SIZE; `pnpm test src/features/exam/useExamEditor.test.ts`, `pnpm exec tsc --noEmit`; test khẳng định payload save và không autosave từng phím.

### S02-T10 — Ghép SCREEN-05 và navigation

- **Mục tiêu:** editor chạy end-to-end từ tạo/sửa đến Lưu về overview.
- **Thực thi bởi:** subagent codex; **Nhóm:** tuần tự W3, owner tích hợp cuối; **Phụ thuộc:** S02-T09.
- **File:** `src/features/exam/{ExamEditorScreen,EditorTitleBar,EditorSplitPane,QuestionNavigatorDialog,QuestionNumberGrid}.tsx`; `src/features/exam/{ExamListScreen,ExamOverviewScreen}.tsx` chỉ entry/preview; `src/routes/{index.tsx,paths.ts}`, `src/App.tsx`, `src/components/layout/BreadcrumbHeader.tsx`, `src/hooks/useExamDetail.ts` chỉ nối editor theo cấu trúc thực tế G0.
- **Truy vết:** SCREEN-05, UC-06/15, UC-07..14, UC-15/24 tích hợp; BR-42..47/65; design §3.4/4.36/4.37/4.42→4.56/§5; exam_get/exam_save, dữ liệu questions/options.
- **Prompt giao codex:** “Ghép components/hook đã có đúng split pane 640px và format JSON mặc định. New 2 mẫu/edit clone includeAnswers=true; count/title/Lưu, lỗi tên trùng giữ editor, success về SCREEN-04/invalidate cache. Navigator tên chuẩn variant editor, lưới 4 cột+trích ask, focus trap/Escape/backdrop, chọn đóng rồi scroll/highlight 2.2s và clear timer. N+1 insert gaps, delete không confirm, breadcrumb reset/rời không persist draft. Bổ sung nhãn/aria theo design; không ghép quiz/result routes, không thay shell ngoài entry editor.”
- **Chấp nhận/lệnh:** AC-SIZE; G3 = `pnpm lint`, `pnpm build`, hai FE test files trên pass; `pnpm tauri dev` mở được tạo/sửa SCREEN-05 với BE thật, không mock command ở bản chạy.

### S02-T11 — Kiểm thử và nghiệm thu bàn giao

- **Mục tiêu:** chứng minh tất cả acceptance bằng automated checks và FE smoke thực.
- **Thực thi bởi:** subagent codex; **Nhóm:** tuần tự W4; **Phụ thuộc:** G3.
- **File:** `src/test/editorImport.smoke.test.tsx` với runner có sẵn; `docs/sprint/sprint-02-question-import.md` chỉ ghi kết quả nghiệm thu nếu được dùng làm ledger. Task này không sửa production code; lỗi trả owner theo retry budget.
- **Truy vết:** toàn bộ UC-06/15, UC-07..14/BR-37..47/65, SCREEN-05, tám command và ba bảng exams/questions/answer_options; summary §5 Sprint 02 DoD/§8.
- **Prompt giao codex:** “Chạy parser/service/SQLite tests và FE smoke import JSON/TXT fixtures bên dưới; test UI có thể mock wrapper để kiểm tra state nhưng phải ghi rõ. Chạy smoke Tauri BE thật dán→sửa→đổi tab→Lưu→mở lại, kiểm tra DB qua exam_get. Test invalid không ghi dữ liệu; multi đúng không mất; đếm lineErrors đúng offset. Chạy lint/build/format/clippy/test, ghi exit code và số test, không ghi pass nếu không chạy. Chuẩn bị checklist Hyan cho highlight/caret/focus/scroll. Không thêm runner/dependency; thiếu desktop thì báo NEED_INPUT riêng mục manual, vẫn hoàn thành mọi check độc lập.”
- **Chấp nhận/lệnh:** AC-SIZE; `pnpm test src/test/editorImport.smoke.test.tsx src/features/import/serializeQuestions.test.ts src/features/exam/useExamEditor.test.ts`; `pnpm lint`; `pnpm build`; `cargo fmt --manifest-path src-tauri/Cargo.toml --check`; `cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets -- -D warnings`; `cargo build --manifest-path src-tauri/Cargo.toml`; `cargo test --manifest-path src-tauri/Cargo.toml`; `pnpm tauri dev` smoke. G4 pass khi mọi acceptance gồm manual được xác nhận.

## ACCEPTANCE / DEFINITION OF DONE

### Fixture nghiệm thu bắt buộc

TXT hợp lệ (LF và CRLF đều cùng nghĩa; dòng nối được gộp):

```text
ask : Chọn đáp án đúng
phần tiếp của câu hỏi
ans.* A
phần tiếp của A
ans. B

ASK : Câu nhiều đáp án
ANS.* X
ans.* Y
ans. Z
```

Kỳ vọng: 2 câu; ask đầu = `Chọn đáp án đúng phần tiếp của câu hỏi`; option đầu = `A phần tiếp của A`; câu 2 có 3 option/2 đúng; không issue. Round-trip JSON ↔ TXT giữ thứ tự và tập đúng, bỏ qua ID.

TXT lỗi (dòng trống vẫn được tính):

```text
ask : Chỉ có một lựa chọn
ans.* A

ask : Không có đáp án đúng
ans. B
ans. C

ask : Không có lựa chọn
```

Kỳ vọng: draft có 3 câu; issues tại dòng **1, 4, 8** (dòng 8 có thể có hai thông điệp cho hai vi phạm); overlay tô dòng index **0, 3, 7**; Lưu bị chặn, DB không đổi.

JSON hợp lệ:

```json
[
  { "ask": "Câu đơn", "answer": [{ "true": "A" }, { "false": "B" }] },
  { "ask": "Câu nhiều đúng", "answer": [{ "true": "X" }, { "true": "Y" }, { "false": "Z" }] }
]
```

Các biến thể cần kiểm tra: thiếu `]` báo đúng dòng cú pháp, giữ draft cũ và raw hỏng; `{}` báo không phải mảng ở dòng 1; `[{"ask":"Fallback"}]` có 4 option rỗng/đầu đúng; một option báo vi phạm; 2 false báo không có đúng; `[]` không lưu được. JSON multiline có hai câu vi phạm phải trả đúng dòng object tương ứng, không dồn tất cả về dòng 1.

### Checklist tự động

- [ ] **UC-07 / BR-42:** ask/option inline đúng phím thoát, cho text rỗng, cập nhật raw; không write DB trước Lưu.
- [ ] **UC-08 / BR-44:** chèn đầu/giữa/cuối đúng index, mặc định 4 option/B đúng, số câu/nhãn/position cập nhật.
- [ ] **UC-09:** xóa không confirm; 0 câu vẫn sửa draft được nhưng `exam_save` từ chối.
- [ ] **UC-10 / BR-45:** thêm cuối, default text; không xóa xuống dưới 2; xóa option đúng áp fallback đầu; nhãn theo vị trí.
- [ ] **UC-11 / BR-46 + Q-10:** radio singleton; checkbox không làm mất các đáp án đúng khác; command nhận nhiều ID đúng và chặn ID câu khác/tập rỗng.
- [ ] **UC-12 / BR-39/41:** JSON success/fallback/syntax-error và giữ bản gần nhất đúng bảng transition, có dòng lỗi.
- [ ] **UC-13 / BR-40/65:** TXT continuation, case/trim, LF/CRLF, ans trước ask, 0/1/multi option được test; mọi câu vi phạm có đúng số dòng, nhập không bị chặn.
- [ ] **UC-14 / BR-37/38/43:** serialize đúng format/indent/blank line; chuyển tab ghi đè raw dở dang từ draft, validation vẫn chạy.
- [ ] **BR-47:** FE và BE chặn <2 option/0 đúng; ≥1 câu và nhiều đúng hợp lệ; không ép ask/text non-empty.
- [ ] **Persistence:** lưu tạo mới/cập nhật rồi `exam_get`/khởi động lại giữ nội dung, thứ tự và cờ đúng; failed save/mutation rollback; không ghi nửa cây.
- [ ] **Race:** response parse cũ không ghi đè input mới, inline/tab/reset hoặc dữ liệu sau Lưu.
- [ ] **API:** đúng tám tên command, DTO Rust/TS cùng shape, AppError giữ structured issues, includeAnswers=true khi sửa; không có invoke trực tiếp ngoài wrapper.
- [ ] **Chất lượng:** test parser lỗi theo dòng và FE smoke JSON/TXT thực chạy; lint/build/Rust fmt/clippy/test pass; không dependency/schema mới, code tuân thủ giới hạn kích thước.

### Checklist nghiệm thu thủ công cho Hyan

- [ ] Từ môn chọn tạo bộ đề: hai câu mẫu, title rỗng, tab JSON; mở sửa đề đã lưu có đúng dữ liệu/cờ đúng.
- [ ] Click sửa ask, Enter xuống dòng, blur thoát; sửa option Enter/blur thoát; xóa text thấy placeholder; raw đổi theo.
- [ ] Chèn đầu/giữa/cuối và All(n): cuộn/focus đúng câu, highlight hết sau 2.2s; dialog đóng bằng Escape/backdrop/X và trả focus; nút gap hiện khi Tab tới.
- [ ] Dán lần lượt fixture JSON/TXT hợp lệ, đổi tab hai chiều, sửa trực quan rồi kiểm tra raw; câu nhiều đúng dùng checkbox và không mất cờ đúng.
- [ ] Dán TXT lỗi: banner đúng dòng 1/4/8, nền lỗi đúng dòng, vẫn gõ được, Lưu bị chặn. Sửa lỗi rồi lưu thành công.
- [ ] JSON sai cú pháp giữ raw và draft gần nhất; nếu draft hợp lệ, Lưu chỉ lưu draft đó; không lưu một phần raw lỗi.
- [ ] TXT `ask` đỏ, `ans.`/`ans.*` xanh qua CSS variable; continuation màu thường; caret/selection, dòng dài, wrap, cuộn, tiếng Việt và dòng trống cuối không lệch overlay; Tab chuyển focus.
- [ ] Cửa sổ 1280×800 và min-width 1024: hai pane/header/cuộn đúng spec; nếu kiểm tra dưới lg thì xếp dọc, không thêm splitter.
- [ ] Lưu đề hợp lệ về overview, mở sửa/đóng mở app giữ dữ liệu; đề trùng tên báo lỗi đúng Sprint 01. Rời/reset editor trước Lưu không ghi thay đổi.

**DoD:** mọi checkbox trên có bằng chứng; parser unit test lỗi theo dòng + FE smoke import cả hai format pass; hợp đồng summary §8 được bàn giao; không còn blocker hoặc task fail không khai báo. Chỉ khi đạt toàn bộ mới báo **SPRINT DONE**. Nếu chưa có xác nhận visual/manual, ghi NEED_INPUT/PARTIAL phù hợp, không gọi sprint DONE.

## RỦI RO VÀ CÂU HỎI MỞ

| Điểm | Cách xử lý trong sprint |
|---|---|
| TXT dòng nối, dòng trống/CRLF, ans trước ask | Giữ provenance từ tokenizer đến validator; fixture khẳng định dòng vật lý và nội dung gộp |
| Dòng text có prefix giống token / multiline round-trip | Ghi rõ TXT không lossless, giữ grammar BR-40; nếu cần escape syntax thì design decision, hoãn và hỏi, không tự chế |
| Tên request cũ `content`, cây thư mục cũ `option_toggle_correct` | Wire dùng `ask`; mapper domain content→ask nếu cần; command công khai `option_set_correct`, không thêm alias hay đổi schema |
| Draft-only trong domain vs commands ID persist trong architecture | Hợp đồng trên tách đường draft/exam_save và API mutation; G0 kiểm tra Sprint 01 tương thích, không chuyển UI sang autosave |
| ParsedExamDto.issues vs Validation trong bảng command | G0 khóa parse được→DTO+issues, syntax/top-level lỗi→Validation; lỗi có structured line xuyên wrapper |
| JSON line mapping cho semantic errors | Cần source span theo object; test repeated keys/text và multiline; không substring heuristic, không tự thêm crate |
| Async parse/race Lưu | Revision guard; Lưu chờ response mới nhất; test đảo thứ tự |
| Nhiều đáp án đúng vs radio cũ | Ưu tiên cập nhật Q-10/design §4.32; không partial unique index, không singleton hóa dữ liệu import |
| ID sinh lại khi parse và lịch sử attempt (Q-04) | Dùng chính sách Sprint 01, ghi rủi ro handoff Sprint 03/04; snapshot hoãn Sprint 07, không tự xây ở đây |
| File chung do nhiều agent sửa | Chỉ integrator S02-T04/S02-T08/S02-T10 sửa tại wave tương ứng; module mới chưa wire không được báo test pass |

**Câu hỏi phải rà ở G0, chỉ escalate nếu chưa có câu trả lời trong code/spec:**

1. JSON phần tử `null`/scalar hoặc answer entry không object: spec BR-39 mô tả object nhưng chưa quy định mọi shape sai; chốt trả Validation theo dòng hay coercion tương thích trước khi implement nhánh này. Không panic hoặc âm thầm drop dữ liệu.
2. JSON text `true`/`false` không string: bảo đảm quy tắc chuyển chuỗi tương thích ref; trường hợp object/array cần xác nhận nếu contract Sprint 01 không nói rõ.
3. Nếu Sprint 01 đã làm command CRUD ghi ngay từ editor, cần điều chỉnh tích hợp hay sửa sprint trước để giữ UC-07 “chưa ghi vào exams”; không tự coi đó là autosave được phê duyệt.
4. Không có vấn đề cần hỏi về nhiều đáp án đúng, highlight, minimum options, hay đổi navigator thành dialog: tài liệu cập nhật đã chốt. Không yêu cầu xác nhận lại các điểm này.

## 🛑 STOP CONDITIONS (DỪNG NGAY khi đạt 1 trong các điều này)

- Tất cả ACCEPTANCE pass → DỪNG, báo "SPRINT DONE".
- Retry 1 task quá 2 lần mà vẫn fail → DỪNG, escalate; thực tế không chạy lần thứ ba theo retry budget dưới đây.
- Phát hiện task cần design decision không có trong spec → DỪNG task phụ thuộc, hỏi với nguồn/mục mâu thuẫn.
- Cần thêm dependency ngoài list đã cho → DỪNG, hỏi.
- Task vượt quá 30 phút ước tính → DỪNG, chia nhỏ lại trước khi thực thi.
- Gate thất bại → không mở wave phụ thuộc; chỉ tiếp tục task độc lập, không tuyên bố DONE.

## 🔁 RETRY BUDGET (giới hạn số lần thử)

- Mỗi task: tối đa 2 lần thử.
- Mỗi lần thử: phải thay đổi approach, KHÔNG được lặp y hệt.
- Sau lần 2 fail: DỪNG task đó, chuyển sang task khác độc lập; coordinator escalate blocker.
- Cuối sprint: list ra các task chưa xong + lý do, ghi lỗi/lệnh đã chạy và hai approach đã thử.

## 🚨 ESCALATION TRIGGERS (khi nào hỏi user)

DỪNG và hỏi user khi:

1. Lỗi không rõ nguyên nhân sau 2 lần debug.
2. Cần chọn giữa 2 approach (A vs B) mà spec không nói.
3. Cần thay đổi kiến trúc hiện tại (folder structure, store shape).
4. Phát hiện bug ở sprint trước ảnh hưởng sprint này.
5. Cần user test thủ công (visual, UX, performance): hoàn tất mọi check độc lập trước, gửi checklist cụ thể cho Hyan và báo các mục chưa xác nhận.

Mỗi escalation nêu file/mục gây vướng, bằng chứng đã kiểm tra, tác động và lựa chọn cụ thể; không hỏi lại quyết định đã chốt. Không tự sửa tài liệu nền để hợp thức hóa implementation.

## 🚫 OUT OF SCOPE (KHÔNG được làm)

- KHÔNG refactor code ngoài file list ở TASKS.
- KHÔNG thêm feature ngoài GOAL hoặc đổi UI/UX ngoài spec.
- KHÔNG optimize premature (chỉ làm khi ACCEPTANCE yêu cầu).
- KHÔNG viết test ngoài các test đã yêu cầu rõ trong TASKS/ACCEPTANCE.
- KHÔNG update README/docs ngoài ledger hợp đồng/nghiệm thu đã cho phép trong file sprint này.
- KHÔNG triển khai quiz/attempt/result workflow, autosave/draft persistence, import/export file, migration mới, max-200 policy, snapshot lịch sử hay cài dependency mới.

## 📤 HANDOFF FORMAT (khi DỪNG, báo cáo theo format này)

```text
STATUS: [DONE | PARTIAL | BLOCKED | NEED_INPUT]
SPRINT: 02

✅ COMPLETED:
- [SNN-TNN]: [file changed] — [UC/BR/hợp đồng bàn giao]
- [Gate/lệnh]: [exit code, số test, kết quả smoke]

❌ FAILED (nếu có):
- [task]: [lỗi gì] | [đã thử gì, tối đa 2 lần] | [cần gì từ user]

🤔 NEED_INPUT (nếu có):
- [câu hỏi hoặc mục manual]: [nguồn spec] | Option A: [...] | Option B: [...]
- [điểm tài liệu nền lệch]: [file/mục, không tự sửa]

📋 NEXT ACTION:
- Nếu DONE → "SPRINT DONE. Ready for sprint 03, paste next prompt"
- Nếu BLOCKED → "Waiting for user response on X"
- Nếu PARTIAL → "Continue task Y after user confirms"
- Nếu NEED_INPUT → [checklist Hyan/câu hỏi cần trả lời và task phụ thuộc]
```

Bàn giao Sprint 03/04 gồm tám command + DTO mirror/structured errors, `ParsedExamDto`/`ParseIssueDto`, SyntaxHighlightedTextarea, component editor/QuestionCard các mode và navigator editor dùng chung, bộ đề persist hợp lệ, test fixtures và bằng chứng nghiệm thu. Nêu rõ chưa nối quiz/result workflow, trạng thái Q-04 và các mục manual còn thiếu.

═══════════════════════════════════════════════════════

**Acceptance wire liên sprint (summary §8):** AC-SIZE; mọi task tạo/sửa DTO phải chạy fixture serialize/deserialize Rust và mapper TS dùng chung; tên JSON camelCase, câu `ask`, option `text`, không rò `isCorrect` trước quiz/nếu includeAnswers=false. Tích hợp cuối sprint sở hữu allowlist `tests/fixtures/wire/question-import.json`, `src-tauri/tests/wire_question_import.rs`, `src/test/wire-question-import.test.ts`; không đổi fixture sprint trước để che lỗi tương thích.
