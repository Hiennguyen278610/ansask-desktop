═══════════════════════════════════════════════════════
SPRINT 05 — THÙNG RÁC
═══════════════════════════════════════════════════════


**AC-SIZE — acceptance chung bắt buộc:** mọi task code/config/test phải kiểm tra file ≤~200 dòng và hàm ≤~40 dòng; báo số dòng/file và rà ranh giới hàm trong kết quả task, tách module khi vượt, không nén code để né giới hạn. Mọi acceptance task bên dưới viện dẫn AC-SIZE, gate không pass khi chưa kiểm tra.

**Quy tắc UI bắt buộc:** mọi task UI dùng CSS variables/token light và dark từ Sprint 00; không ghi màu hex trực tiếp trong component hoặc style UI.

## CONTEXT

**Thứ tự bắt buộc:** chạy sau Sprint 03 để test restore/purge với attempts và attempt_answers thật (gồm snapshot Q-04); dùng soft delete/batch từ Sprint 01.

Sprint 01 đã bàn giao CRUD môn/bộ đề, unique tên cho bản ghi đang sống, soft delete và `delete_batch_id`; Sprint 00 cung cấp SQLite, migration, DI, invoke wrapper và khung UI. Dữ liệu con của môn/bộ đề đã xóa mềm vẫn nằm trong DB nhưng bị ẩn khỏi danh sách, thống kê và lịch sử.
Sprint này bổ sung vòng đời thùng rác trên SCREEN-09. Có thể bắt đầu sau Sprint 01; không buộc đợi UI Sprint 03/04 để kiểm thử vì fixture SQLite tạo được attempts/attempt_answers theo schema Sprint 00.

## GOAL

Hoàn thành UC-33..UC-38 end-to-end: xem, khôi phục đúng đợt, đổi tên khi xung đột, chặn khi cha bị xóa, purge/dọn sạch atomic, hoàn tác qua toast và đồng bộ badge, với toàn bộ checklist ACCEPTANCE đạt.

## Phạm vi, phụ thuộc và tài liệu bắt buộc

**Trong phạm vi:** `trash_list`, `subject_restore`, `exam_restore`, `trash_purge_item`, `trash_empty`; SCREEN-09; TrashList, TrashItemRow, RestoreDialog, NavBadge; DeleteConfirmDialog biến thể vĩnh viễn; toast Hoàn tác; tìm theo tên/lọc loại **chỉ trong thùng rác** theo UC-33. Không mở rộng tìm kiếm toàn ứng dụng dù summary §1 có dòng ngoài phạm vi tìm kiếm chung.

**Ngoài phạm vi:** retention tự động, cron/timer dọn DB, phân trang, lọc kỳ thống kê thật, thay đổi chấm điểm/xáo câu, snapshot nội dung bài làm, theme, auth/cloud, export/backup và dependency mới.

**Đầu vào phải kiểm tra:** schema 7 bảng, `foreign_keys=ON` trên mọi connection; hai cột `deleted_at`, `delete_batch_id` trên subjects/exams; partial unique indexes; soft delete môn chỉ gán batch mới cho exams đang sống, không ghi đè batch của exams đã xóa riêng; DeleteConfirmDialog/ModalShell; wrapper `src/lib/tauri/commands.ts`; query/cache và script kiểm tra từ Sprint 00/01. Nếu hợp đồng Sprint 01 sai, báo bug đầu vào, không âm thầm mở rộng sprint để sửa.

| Tài liệu | Phần phải đọc | Áp dụng |
|---|---|---|
| `docs/sprint/sprint-prompt-template.md` | Toàn bộ | Khuôn, stop/retry/escalation/handoff |
| `docs/sprint/sprint-plan-summarize.md` | §3, §4, §5 Sprint 05, §8 | Quy ước, phụ thuộc, bàn giao Sprint 07 |
| `docs/domain-core.md` | §4.1–4.3; §5.9 BR-71, BR-74..80; §6 UC-33..38; §7; §9 NFR-18 | Vòng đời, batch, restore, purge, undo, điều hướng |
| `docs/design-system.md` | §4.58 và biến thể; §4.60..4.63; §5 SCREEN-09; §6.1, §6.14 | UI, trạng thái, focus và xác nhận |
| `docs/db.dbml` | subjects/exams, FK, index và ghi chú purge | deleted_at/delete_batch_id, unique, RESTRICT, CASCADE |
| `docs/structure-be.md` | §3 trash module; §4 UoW; §5.5; §6.2; §7.6–7.7; §8 features/trash | Phân tầng, DTO, command, transaction, FE |

### Ma trận truy vết UC

| UC | Hành vi | Command / component |
|---|---|---|
| UC-33 | Xem, tìm/lọc thùng rác, badge | trash_list; TrashList, TrashItemRow, NavBadge |
| UC-34 | Khôi phục môn đúng batch | subject_restore; RestoreDialog |
| UC-35 | Khôi phục bộ đề, chặn cha xóa, đổi tên | exam_restore; RestoreDialog |
| UC-36 | Xóa vĩnh viễn một mục | trash_purge_item; DeleteConfirmDialog permanent |
| UC-37 | Dọn sạch toàn thùng rác | trash_empty; DeleteConfirmDialog permanent/all |
| UC-38 | Hoàn tác soft delete trong toast | subject_restore/exam_restore; Toast |

### Đối chiếu tài liệu và giả định phải giữ rõ

- Dùng mã nghiệp vụ đúng theo **domain-core §5.9**: BR-76 = UI; BR-77 = chặn cha bị xóa; BR-78 = xung đột tên; BR-79 = ẩn/khôi phục nguyên vẹn; BR-80 = purge/không retention. DB/BE có chỗ gọi đổi tên là BR-77 hoặc chặn cha là BR-76: hành vi không đổi, không sửa tài liệu nền trong sprint này.
- BR-74/75 nói về option_id/thứ tự quiz, không phải chức năng mới của thùng rác. Chúng là ràng buộc bảo toàn: restore không sửa `selected_option_ids`, `option_order`, `position` hay điểm; purge xóa dữ liệu theo quan hệ, không theo nhãn A/B/C/D.
- `attempts` và `attempt_answers` **không có** `deleted_at`/`delete_batch_id`; mô tả “update attempts.deleted_at” trong BE §5.5 là lệch schema. Ẩn/hiện qua join subjects/exams, không thêm cột soft delete vào bảng con.
- Summary §8 đặt `delete_batch_id` ở đầu vào Sprint 01; không làm lại migration cột này theo ghi chú cũ BE §5.5. `option_order` thuộc hợp đồng Sprint 03, không triển khai ở Sprint 05.
- Design gọi số câu/lượt là snapshot lúc xóa, nhưng schema không lưu snapshot đếm. Dùng COUNT dữ liệu còn được bảo toàn trong DB, không thêm cột snapshot. Nếu purge riêng một bộ đề trong môn đã xóa, số của môn phải phản ánh descendants còn lại để xác nhận purge chính xác; ghi chênh lệch thuật ngữ này vào handoff.
- Không có bản đầy đủ “prompt Đợt 5” riêng trong đầu vào; khối QUY ƯỚC dưới đây giữ nguyên nội dung thực thi của summary §3 và bổ sung cách đóng gói prompt tự chứa.

## QUY ƯỚC CHO TẤT CẢ SPRINT

**Thực thi bằng subagent codex (bắt buộc).** Mọi công việc triển khai (code, config, migration, test, refactor) đều giao cho `subagent_codex`. Mỗi task có: Mã task, tên, mục tiêu, Thực thi bởi = `subagent codex`, Nhóm chạy (song song P1/P2… hay tuần tự) + Phụ thuộc, Phạm vi file (không giao trùng file giữa task song song), UC/BR/component/command/bảng liên quan (mã + mục tài liệu nền), Prompt giao cho codex (tự chứa), Tiêu chí chấp nhận + Lệnh kiểm tra.

**Song song hóa.** Phân tích đồ thị phụ thuộc, gom nhóm gọi nhiều codex cùng lúc. File dùng chung (`lib.rs`/`invoke_handler`, `mod.rs`, routes, `index.html`, config) gom vào **một task tích hợp** chạy sau cùng nhóm (một codex). Chốt hợp đồng (tên command/DTO/kiểu TS/component/props) trước khi song song. Mỗi sprint có sơ đồ ASCII wave + gate kiểm tra tổng sau mỗi wave. Cuối sprint: task kiểm thử & nghiệm thu (codex) + checklist nghiệm thu thủ công cho Hyan.

**Nội dung bắt buộc mỗi file sprint:** mục tiêu/phạm vi/phụ thuộc; tài liệu nền phải đọc (đường dẫn + mục/mã); hợp đồng tạo ra/dựa vào; sơ đồ wave + task; Definition of Done, checklist nghiệm thu, rủi ro, câu hỏi mở.

**Quy tắc kỹ thuật chung:** phân tầng `commands → services → repositories → db`, DI qua `tauri::State`, Unit of Work cho thao tác nhiều bước; file ≤ ~200 dòng, hàm ≤ ~40 dòng; DRY/SOLID, không over-engineer; Tailwind + `lucide-react`; thời gian lưu UTC, hiển thị `Asia/Ho_Chi_Minh`; schema qua migration đánh số; test Rust SQLite in-memory.

FE gọi BE qua `lib/tauri/commands.ts` duy nhất; giữ stack đã chốt Sprint 00, không cài dependency. Không tạo event bus/store server-state mới. Khi dispatch **mỗi** task, chép nguyên khối quy ước này, hợp đồng dưới đây, file ownership, tài liệu liên quan, prompt riêng, acceptance và stop/retry/escalation vào prompt gửi codex; không chỉ gửi mã task hay nhắc “xem chat trước”. Task ước tính >30 phút phải chia nhỏ trước khi giao. Đường dẫn là theo kiến trúc đích; S05-T01 đối chiếu repo thật rồi khóa mapping tương đương, không tự đổi cấu trúc.

## Hợp đồng tạo ra và dựa vào

### Command / DTO

Giữ tên command đúng BE §6.2; các hàm trả `Result<DTO, AppError>`, lỗi serialize `{ code, message }` theo wrapper hiện hành. `Ok` dùng cùng quy ước unit/void của command xóa Sprint 01, không tự tạo envelope mới.

| Command | Request | Thành công | Lỗi cần FE xử lý |
|---|---|---|---|
| `trash_list` | `TrashListReq { kind?: 'subject' \| 'exam' }` | `TrashItemDto[]` | `Db` |
| `subject_restore` | `RestoreReq { id, new_name? }` | `SubjectSummary` Sprint 01 | `NotFound`, `DuplicateName`, `Validation`, `Db` |
| `exam_restore` | `RestoreReq { id, new_name? }` | `ExamDetail` Sprint 01 | `NotFound`, `Blocked`, `DuplicateName`, `Validation`, `Db` |
| `trash_purge_item` | `PurgeReq { kind: 'subject' \| 'exam', id }` | `Ok` | `NotFound`, `Db` |
| `trash_empty` | `{}` | `Ok` | `Db` |

```ts
// Wire TS camelCase; Rust snake_case + #[serde(rename_all = "camelCase")] (summary §8).
type TrashKind = 'subject' | 'exam';
type TrashListReq = { kind?: TrashKind };
type RestoreReq = { id: string; newName?: string };
type PurgeReq = { kind: TrashKind; id: string };
type TrashItemDto = {
  id: string;
  kind: TrashKind;
  name: string;                    // subjects.name hoặc exams.title
  subjectId: string | null;       // exam: ID môn cha kể cả đã xóa; subject: null
  subjectName: string | null;           // tên môn gốc, cả khi môn đang xóa
  deletedAt: string;              // UTC ISO-8601, luôn có trong trash
  deleteBatchId: string | null;
  questionCount?: number;         // implementation trả count cho cả hai loại
  attemptCount?: number;
  deletedByParent: boolean;
};
```

Không thêm `trash_count`, `undo` command hay bắt `trash_list` nhận query tên. Query không truyền kind lấy toàn bộ danh sách, dùng chung làm nguồn badge; filter loại/tên ở FE không thay đổi tổng badge. Adapter UI ánh xạ `kind→type`, `subjectName→originSubjectName`, `deletedByParent→deletedWithSubject`; giữ subjectId/deletedAt và các count camelCase.

`TrashItemDto` Rust bắt buộc có `subject_id: Option<String>` và `subject_name: Option<String>`; wire là `subjectId`/`subjectName` nullable. Exam trả ID/tên môn cha kể cả cha đã xóa; subject trả null. `exam_get` chỉ đọc active, không dùng để đọc mục xóa: dữ liệu mục xóa và parent ID lấy qua `trash_list`. Nút “Khôi phục cả môn” dùng trực tiếp `item.subjectId` khi Blocked, không suy từ tên/batch/message. Test fixture cha/con đã xóa phải restore được qua ID này.

### Bất biến nghiệp vụ và transaction

1. `trash_list` đọc subjects/exams với `deleted_at IS NOT NULL`, gồm cả exam xóa riêng và cascade. Đếm câu/lượt bằng query không nhân bản count do join nhiều bảng. `deleted_by_parent` dựa trên cùng batch **khác NULL** với môn cha; không coi mọi exam dưới môn đã xóa là cascade. Thứ tự ổn định theo `deleted_at DESC`, rồi kind/id.
2. Restore bắt đầu transaction, đọc lại bản ghi xóa và cha, validate tên trong transaction. Exam có cha đã xóa → `Blocked`, không sửa dữ liệu; nút “Khôi phục cả môn” gọi subject_restore cho đúng id cha và đi qua cùng luồng đổi tên. Exam đã xóa riêng vẫn nằm trong trash sau restore cha, người dùng khôi phục exam riêng tiếp.
3. Restore subject ghi tên mới nếu có, set `deleted_at=NULL` rồi chỉ restore exams còn xóa với `subject_id` đúng và `delete_batch_id` bằng batch gốc khác NULL. Không dùng thời điểm xóa hoặc `IS NULL = IS NULL` thay batch. Giữ batch gốc đến khi chọn đủ descendants; metadata active theo convention Sprint 01. Không phục hồi exam đã purge, không khôi phục exams xóa riêng trước đó.
4. Unique đúng SQL `lower(trim(name))` toàn cục với môn, `(subject_id, lower(trim(title)))` với exam; chỉ so bản active, không tự thay bằng Unicode normalization khác SQLite. Không tự thêm hậu tố rồi commit. DuplicateName → người dùng nhập tên; tên rỗng hoặc vẫn trùng bị chặn; partial unique index là bảo vệ cuối, lỗi phải rollback toàn bộ. Giữ id, created_at, câu hỏi/options, attempts, attempt_answers nguyên vẹn.
5. Purge chỉ nhận root đang xóa; kiểm tra lại trong transaction. Purge môn xóa **tất cả** exams thuộc môn, kể cả exam xóa riêng khác batch. Batch chỉ giới hạn restore, không giới hạn purge. Xóa `attempt_answers → attempts → answer_options → questions → exams → subjects` theo scope; có thể dùng CASCADE đã khai báo cho descendants nhưng attempts phải xóa trước exams/subjects vì RESTRICT. Không tắt FK.
6. `trash_empty` chọn tập mục trong cùng **một transaction cho toàn bộ thao tác**, loại trùng exams đã nằm dưới môn được purge. Không gọi public purge_item tự commit từng root. Lỗi ở root sau rollback cả root trước; dữ liệu active ngoài tập purge không đổi; app_settings không bị đụng.
7. Sau mutation thành công, invalidate/refetch trash, subjects, exams/detail, attempts/review và stats đã tồn tại. Không triển khai lọc kỳ Sprint 07. Không báo thành công/giảm badge trước commit; khi lỗi giữ dữ liệu cũ và cho thử lại.
8. Undo chỉ sau soft delete thành công, toast có “Hoàn tác” trong **2.8 giây** (UC-38); gọi restore chung theo kind/id vừa xóa, không tạo bản sao. Hết toast vẫn restore ở SCREEN-09. Conflict/Blocked khi undo đi qua cùng flow; purge không có undo.

### Component / state / điều hướng

- `TrashScreen`: composition SCREEN-09, `activeTab='trash'`, breadcrumb root › Thùng rác; tab sau AI Guide, trước utility footer, icon Trash2. Quay lại Đề kiểm tra giữ examViewMode theo domain §7, không đưa người dùng vào detail đã purge.
- `TrashList`: items, query, filter `all|subject|exam`, callbacks query/filter/restore/purge/empty, status `idle|loading|error|processing`. Callback mutation mang cả kind/id. Hai nhóm “Môn đã xóa”, “Bộ đề đã xóa”; tìm tên không phân biệt hoa/thường, debounce 200ms theo giả định design; không phân trang.
- `TrashItemRow`: item adapter, processing, callbacks; tên truncate/title, môn gốc, thời điểm giờ VN, số câu/lượt, nhãn “Xóa cùng môn”; chỉ nút tương tác, không click cả hàng.
- `RestoreDialog`: open, item, conflict, suggestedName?, processing, error?, onCancel, onConfirm(newName?). Không conflict: không input, focus Hủy; conflict: input có label/error, focus input, gợi ý “(khôi phục)” chưa chắc unique; BE kiểm tra lại. Blocked có thông báo và nút “Khôi phục cả môn”.
- `NavBadge`: count, max mặc định 99; 0 không render, >99 hiển thị `99+`, accessible name vẫn số thật. Tổng số **row** môn + exam đã xóa, bao gồm cascade; không phải số root và không phụ thuộc filter.
- `DeleteConfirmDialog`: giữ mặc định `variant='soft'`, thêm `permanent`, `targetType='all'` cho dọn sạch và cascadeCount; cảnh báo “KHÔNG THỂ HOÀN TÁC”, nút xác nhận rose. Dọn sạch áp dụng toàn trash dù đang filter, nêu rõ phạm vi trong dialog; không cộng đúp count descendants của môn và exam con.
- Modal: Escape/backdrop/Hủy không mutation trước xác nhận, focus trap, trả focus nút mở hoặc điểm focus hợp lệ nếu hàng đã mất, role/aria-modal/labelledby/describedby, khóa scroll. Disable + spinner khi xử lý, chống double-submit.
- Năm trạng thái: empty (Trash2 56px, “Thùng rác trống”, dọn sạch disabled, badge ẩn); loading (3 skeleton mỗi nhóm); data; error (“Không tải được thùng rác. [Thử lại]”, giữ dữ liệu cũ); processing (hàng opacity-60, spinner, disable). Filter không kết quả dùng “Không tìm thấy mục nào khớp.”, không giả báo toàn trash rỗng.

## TASKS

### Đồ thị wave và quyền sửa file

```text
W0 tuần tự: S05-T01 khóa hợp đồng / kiểm tra Sprint 01 và 03
                │ Gate G0: DTO, parent-id, path ownership rõ
                ├────────────────────────────┐
W1 song song: P1 S05-T02 repository/UoW        P2 S05-T03 UI thuần
                └──────────────┬─────────────┘
W2 tuần tự: S05-T04 service/commands
                │ Gate G1: review 02/03/04; module chưa nối có thể chưa compile
W3 tuần tự: S05-T05 tích hợp duy nhất
                │ Gate G2: build/lint + cargo check/test pass
W4 tuần tự: S05-T06 kiểm thử & nghiệm thu codex
                │ Gate G3: test rollback/conflict + checklist Hyan
                └── DONE hoặc PARTIAL/BLOCKED/NEED_INPUT
```

Nếu task cần chia nhỏ để ≤30 phút, dùng hậu tố a/b và giữ thứ tự phụ thuộc/quyền file; không phát hai task ghi chung file cùng lúc. Sau W1 kiểm tra phạm vi diff và giao diện repo/props trước khi sang W2; G1 không được báo build pass cho module chưa được đăng ký.

### 1. S05-T01 — Khóa hợp đồng đầu vào và giao diện triển khai

- **Mục tiêu:** phát hiện thiếu tiền đề, khóa Rust/TS/props và parent id trước song song.
- **Thực thi bởi:** subagent codex. **Nhóm:** W0 tuần tự. **Phụ thuộc:** Sprint 03 hoàn tất; kế thừa Sprint 00/01.
- **File:** chỉ đọc `src-tauri/src/{dto,repositories,services,db,commands}/`, `src/lib/tauri/`, `src/hooks/`, `src/components/`, `src/routes/`, package/config; không sửa file dùng chung.
- **Truy vết:** UC-33..38; BR-71,74..80; toàn component/command của hợp đồng; subjects/exams và FK descendants; summary §8, BE §3–6, DBML.
- **Prompt giao codex:** “Đối chiếu schema/soft delete Sprint 01 và API với hợp đồng Sprint 05 trong prompt này. Xác nhận batch không ghi đè exam đã xóa, FK bật, unique partial, wrapper và ModalShell hiện hữu. Chốt mapping đường dẫn thực, serde casing, error code và cách chuyển parent id cho Blocked; không tự thêm API chưa duyệt. Báo thiếu tiền đề, mâu thuẫn cần quyết định, danh sách ownership chính xác và các task con ≤30 phút. Chưa viết tính năng.”
- **Chấp nhận:** AC-SIZE; có bảng mapping không trùng file P1/P2; parent-id flow thực hiện được; baseline và lỗi nền phân biệt rõ. Chưa chốt parent-id → G0 NEED_INPUT, không chặn việc hoàn thiện tài liệu kế hoạch này.
- **Lệnh kiểm tra:** `rg -n 'delete_batch_id|deleted_at|foreign_keys|DuplicateName|Blocked' src-tauri/src`; `rg -n 'invoke|DeleteConfirmDialog|ModalShell|useQuery' src`; `pnpm build`; `cargo check --manifest-path src-tauri/Cargo.toml`.

### 2. S05-T02 — Repository và thao tác DB trong UoW

- **Mục tiêu:** cung cấp đọc trash, restore và purge cùng connection/transaction.
- **Thực thi bởi:** subagent codex. **Nhóm:** W1/P1. **Phụ thuộc:** G0.
- **File sở hữu:** `src-tauri/src/repositories/trash_repo.rs`, `trash_queries.rs`, `trash_restore.rs`, `trash_purge.rs` (tách helper theo giới hạn kích thước); không sửa `mod.rs`, pool/migration hay repo Sprint 01.
- **Truy vết:** UC-33..37; BR-71,77..80; 5 command; subjects/exams, questions/options, attempts/attempt_answers; DBML FK/index, BE §4, §7.6–7.7.
- **Prompt giao codex:** “Viết SQL/repository theo hợp đồng đã khóa. Query counts không nhân bản, lấy tên cha đã xóa, suy cascade bằng batch non-null. Restore đúng batch và unique; nhận transaction từ service, không tự commit. Purge attempts trước exams/subjects; empty dùng tập root loại trùng và chung transaction. Chỉ root đã xóa được thao tác. Không tắt FK, không thêm deleted_at ở attempts. Đọc index đã có; thiếu index báo tích hợp để migration đánh số, không sửa migration cũ.”
- **Chấp nhận:** AC-SIZE; SQL có scope/bind params; batch xóa riêng được bảo toàn; không lấy pool connection thứ hai trong UoW; có primitive purge tái dùng không nested commit.
- **Lệnh kiểm tra:** `rustfmt --check --edition 2021 src-tauri/src/repositories/trash_repo.rs src-tauri/src/repositories/trash_queries.rs src-tauri/src/repositories/trash_restore.rs src-tauri/src/repositories/trash_purge.rs`; kiểm thử DB bắt buộc ở S05-T06 sau đăng ký module.

### 3. S05-T03 — Component thùng rác thuần UI

- **Mục tiêu:** dựng component theo design, nhận props, không gọi invoke trực tiếp.
- **Thực thi bởi:** subagent codex. **Nhóm:** W1/P2, song song S05-T02. **Phụ thuộc:** G0.
- **File sở hữu:** `src/features/trash/{TrashList,TrashItemRow,RestoreDialog}.tsx`, `src/features/trash/trashViewTypes.ts`, `src/components/ui/NavBadge.tsx`; chỉ các file mới này.
- **Truy vết:** UC-33..38; BR-76..78; TrashList/TrashItemRow/RestoreDialog/NavBadge; SCREEN-09; DTO 5 command qua props; không SQL; design §4.60..63, §6.1/6.14.
- **Prompt giao codex:** “Dựng 4 component theo props đã khóa và tokens hiện có, Tailwind/lucide-react. Bao phủ đủ 5 trạng thái và filter không kết quả, label cascade, giờ VN, count 0/99/100. Dialog conflict/Blocked không tự restore; callback parent restore do integration cấp. Focus/aria theo ModalShell, không copy UI ref vì SCREEN-09 chưa có ref. Không sửa Sidebar, shared dialog, routes hay commands.ts.”
- **Chấp nhận:** AC-SIZE; render bằng props; không hardcode dữ liệu sản phẩm; nút disabled thật khi processing; input/aria và nhãn tiếng Việt đúng; filter không tác động badge.
- **Lệnh kiểm tra:** `pnpm exec tsc --noEmit`; `pnpm exec eslint src/features/trash src/components/ui/NavBadge.tsx` (dùng cấu hình Sprint 00); thiếu primitive đầu vào báo G1, không cài thư viện.

### 4. S05-T04 — Service, DTO và command adapter

- **Mục tiêu:** hoàn thành orchestration và mapping lỗi cho 5 command.
- **Thực thi bởi:** subagent codex. **Nhóm:** W2 tuần tự. **Phụ thuộc:** S05-T02, G0.
- **File sở hữu:** `src-tauri/src/dto/trash_dto.rs`, `src-tauri/src/services/trash_service.rs`, helper `trash_restore_service.rs`/`trash_purge_service.rs` nếu cần; `src-tauri/src/commands/trash_cmds.rs`. Không sửa registry/shared error/state.
- **Truy vết:** UC-33..38; BR-71,74..80; 5 command/DTO; mọi bảng descendants; BE §3/4/6.2/7.6/7.7.
- **Prompt giao codex:** “Viết service mở một UoW cho restore, purge_item, toàn bộ empty. Đọc lại trạng thái trong tx, kiểm tra cha trước restore exam, trim/unique rồi ghi. DuplicateName rollback và để FE yêu cầu đổi tên; Blocked chỉ exam có cha xóa. Trả SubjectSummary/ExamDetail cũ, không đổi chấm/xáo. Command mỏng dùng State, không chứa SQL. Chuẩn bị danh sách export/DI/AppError cần S05-T05 nối, không tự sửa shared files.”
- **Chấp nhận:** AC-SIZE; command đúng tên/DTO, restore/empty atomic, lỗi index map DuplicateName; không sinh bản ghi mới khi restore; không public commit từng item của empty.
- **Lệnh kiểm tra:** `rustfmt --check --edition 2021 src-tauri/src/dto/trash_dto.rs src-tauri/src/services/trash_service.rs src-tauri/src/commands/trash_cmds.rs`; G1 review đối chiếu chữ ký với S05-T02; full cargo check tại G2 sau module wiring.

### 5. S05-T05 — Tích hợp SCREEN-09, cache, sidebar và undo

- **Mục tiêu:** nối toàn bộ FE→command→DB và đồng bộ UI sau mutation.
- **Thực thi bởi:** subagent codex. **Nhóm:** W3 tuần tự, **chủ sở hữu duy nhất file dùng chung**. **Phụ thuộc:** S05-T02/S05-T03/S05-T04, G1.
- **File sở hữu:** `src-tauri/src/{lib,state,error}.rs`, `src-tauri/src/{commands,dto,repositories,services}/mod.rs`; `src/lib/tauri/commands.ts`; `src/hooks/{useTrash,useSubjects,useExams}.ts`; `src/features/trash/{TrashScreen.tsx,trashAdapter.ts}`; `src/components/layout/{Sidebar,AppShell,ToastHost}.tsx`; `src/features/subject/DeleteConfirmDialog.tsx` (Sprint 01 tạo), `src/components/ui/Toast.tsx`; `src/App.tsx`, route file hiện hữu được G0 khóa. Chỉ khi thiếu index schema: migration SQL đánh số kế tiếp và registry `db/migrations.rs`, không thêm cột đã có. Không sửa index.html/config không liên quan.
- **Truy vết:** UC-33..38 (UC-26/27 là điểm gắn toast); BR-71,76..80; SCREEN-09 và toàn bộ component; 5 command; BE §8, domain §7, design §4.58/§5/§6.
- **Prompt giao codex:** “Đăng ký exports/DI/invoke_handler một lần, mirror DTO trong commands.ts. Tạo useTrash query chung toàn bộ để cấp badge và screen, adapter dữ liệu, mutations invalidate các cache đã tồn tại. Nối tab sau AI Guide; dùng shared DeleteConfirmDialog permanent/all, chống cộng đúp cascade count. Undo 2.8s sau soft-delete gọi cùng restore flow, xử lý conflict/Blocked; nút khôi phục cả môn lấy id từ hợp đồng G0. Giữ nguyên kiểu soft mặc định. Loading/error không mất dữ liệu cũ. Chỉ bổ sung index bằng migration kế tiếp nếu chưa có; không tái tạo cột batch hay làm option_order của Sprint 03.”
- **Chấp nhận:** AC-SIZE; 5 command gọi thật được, SCREEN-09 qua sidebar, cả soft-delete ngoài trash cũng cập nhật badge; filtered empty không giới hạn phạm vi trash_empty; mở lại app đọc đúng DB; không import invoke trong feature.
- **Lệnh kiểm tra/G2:** `pnpm lint`; `pnpm build`; `cargo fmt --manifest-path src-tauri/Cargo.toml -- --check`; `cargo check --manifest-path src-tauri/Cargo.toml`; `cargo test --manifest-path src-tauri/Cargo.toml`; `rg -n 'invoke' src/features/trash src/hooks/useTrash.ts` (không có lời gọi invoke trực tiếp).

### 6. S05-T06 — Kiểm thử transaction, conflict và nghiệm thu

- **Mục tiêu:** chứng minh DoD bằng integration test SQLite và luồng desktop thật.
- **Thực thi bởi:** subagent codex. **Nhóm:** W4 tuần tự. **Phụ thuộc:** G2.
- **File sở hữu:** `src-tauri/tests/trash_restore.rs`, `trash_purge.rs`, `trash_list.rs`, `src-tauri/tests/common/trash_fixture.rs`; nếu convention crate dùng unit-test module nội bộ, G0 khóa vị trí tương đương và S05-T05 nối declaration. Không mở public API chỉ để test. Không sửa production ngoài task sửa lỗi được giao lại đúng owner.
- **Truy vết:** UC-33..38; BR-71,74..80; NFR-18; 5 command + SCREEN-09/components; 6 bảng nghiệp vụ, app_settings đối chứng.
- **Prompt giao codex:** “Dùng SQLite :memory: với migration thật, FK ON và repository/service thật. Viết test restore batch/conflict/Blocked, purge và empty commit/rollback theo ma trận dưới. Tạo attempts/answers fixture ngay cả khi Sprint 03 chưa có UI. Tiêm lỗi deterministic sau khi đã xóa một phần bằng trigger test RAISE(ABORT) hoặc seam hiện hữu, không thêm fault injection production. Chạy kiểm tra bắt buộc, thực hiện smoke tự động có sẵn, bàn giao checklist manual cho Hyan; không đánh pass manual chưa chạy.”
- **Chấp nhận:** AC-SIZE; test fail được khi bỏ rollback/batch guard, so sánh toàn bộ dữ liệu trước/sau lỗi, `PRAGMA foreign_key_check` rỗng; lưu kết quả từng case, hạn chế môi trường được báo rõ.
- **Lệnh kiểm tra/G3:** `cargo test --manifest-path src-tauri/Cargo.toml trash`; `cargo test --manifest-path src-tauri/Cargo.toml`; `cargo build --manifest-path src-tauri/Cargo.toml`; `pnpm lint`; `pnpm build`; `cargo fmt --manifest-path src-tauri/Cargo.toml -- --check`; `pnpm tauri dev` để nghiệm thu desktop. Nếu script Sprint 00 đặt tên khác, ghi lệnh tương đương đã kiểm chứng; không tự cài runner mới.

## ACCEPTANCE / Definition of Done

### Kiểm chứng tự động bắt buộc

- [ ] `trash_list` trả đúng hai loại, tên cha đã xóa, UTC và counts không bị nhân bản; kind filter không sai phạm vi; nhãn cascade phân biệt batch khác/NULL.
- [ ] Fixture S có E1 đã xóa riêng batch A; xóa S batch B với E2 đang sống → restore S chỉ đưa E2 trở lại, E1 giữ nguyên deleted_at/batch A. Thử lặp delete→restore→delete với batch mới.
- [ ] Restore exam khi cha xóa trả Blocked, không đổi bất kỳ bảng nào. Restore cha rồi restore exam xóa riêng thành công.
- [ ] Restore subject trùng tên active và exam trùng tên trong cùng môn trả DuplicateName; thử khác hoa/thường và khoảng trắng theo SQL; khác môn được phép. Rename hợp lệ thành công, rỗng/vẫn trùng không ghi. Partial unique failure rollback cả cascade.
- [ ] Restore bảo toàn id, created_at, questions/options, điểm, selected_option_ids, option_order, position; stats/history loại dữ liệu ẩn và đọc lại dữ liệu khôi phục nếu các module Sprint 04 đã có.
- [ ] Purge exam xóa toàn descendants, giữ cha và sibling; purge subject xóa cả exam xóa riêng khác batch và mọi attempt/answer. Root active không bị purge qua API trash.
- [ ] Purge item lỗi sau bước xóa attempts rollback cả attempts/answers/content/root; counts và nội dung bằng snapshot trước test, không chỉ kiểm tra exception.
- [ ] Empty gồm nhiều môn và exam riêng dưới môn sống; không xóa hai lần exam cascade. Tiêm lỗi ở root sau: toàn bộ root trước cũng rollback. Empty thành công chỉ xóa tập trash và descendants, giữ active ngoài scope và app_settings; empty rỗng không lỗi.
- [ ] Mọi test DB bật FK, `PRAGMA foreign_key_check` trả 0 dòng. Không có transaction mở dở hoặc commit giữa chừng.
- [ ] Full Rust test/build/fmt và FE lint/build pass; không còn module chưa đăng ký. File/hàm đạt ~200/~40 dòng; không dependency mới.

### Checklist nghiệm thu thủ công cho Hyan

- [ ] Tạo môn với hai bộ đề, mỗi bộ có câu/options và lượt làm; xóa riêng một đề rồi xóa môn. Mở trash: hai nhóm, nhãn cascade chỉ ở đề đúng batch; badge đếm từng row.
- [ ] Tab Trash2 sau AI Guide; breadcrumb đúng; tìm/lọc theo tên/loại hoạt động; filter không kết quả khác trash trống và không giảm badge; thời điểm hiển thị giờ VN.
- [ ] Restore môn: môn + đề cùng batch về danh sách chính, đề xóa riêng vẫn trong trash. Câu/options/lịch sử/điểm không đổi; đóng/mở app vẫn đúng.
- [ ] Tạo bản active trùng tên mục xóa: dialog yêu cầu đổi tên; thử tên rỗng/trùng, tên mới, Hủy/Escape/backdrop. Không tự đổi tên hoặc restore khi hủy.
- [ ] Restore exam khi cha xóa: bị chặn, “Khôi phục cả môn” đi đúng cha; xử lý được conflict tên cha; đề xóa riêng cần restore tiếp sau cha.
- [ ] Xóa mềm từ SCREEN-02/03: badge cập nhật, Hoàn tác trong 2.8s khôi phục đúng mục; hết toast vẫn restore qua trash; thử undo khi tên đã bị chiếm.
- [ ] Purge từng exam, môn và dọn sạch: cảnh báo mất dữ liệu cùng counts đúng; Hủy không đổi; Enter khi mở dialog focus Hủy không xóa; xác nhận xóa đúng phạm vi. Purge không có Hoàn tác.
- [ ] Khi đang filter, Dọn sạch cảnh báo và xóa toàn trash; không chỉ các hàng đang thấy. Sau empty badge ẩn, nút dọn sạch disabled.
- [ ] Badge 0/1/99/100 lần lượt ẩn/1/99/99+, tên truy cập đọc số thật; sidebar thu gọn vẫn truy cập tab được nếu khả năng này đã có.
- [ ] Loading skeleton, lỗi có Thử lại và giữ dữ liệu cũ, processing disable/spinner; click nhanh không gửi mutation trùng. Dialog trap Tab, có aria labels, trả focus hợp lệ khi đóng.

**DoD:** tất cả case tự động và manual trên có kết quả thực, không bỏ qua purge rollback hay restore conflict. Nếu thiếu desktop/display hoặc Hyan chưa test, ghi PARTIAL/NEED_INPUT; không tự đánh dấu SPRINT DONE. Bàn giao Sprint 07 gồm 5 command/DTO/wrapper, SCREEN-09, NavBadge, restore/undo flow, tests và các hạn chế còn mở.

## Rủi ro và câu hỏi mở

| Rủi ro / khoảng trống | Cách xử lý / gate |
|---|---|
| FK RESTRICT gây xóa nửa cây | attempts trước exams/subjects, FK ON, một UoW, test lỗi giữa chừng và empty nhiều root |
| Ghi đè batch exam đã xóa riêng | Kiểm tra đầu vào Sprint 01; batch equality khác NULL; test nhiều chu kỳ |
| Thiếu parent id trong TrashItemDto | G0 chốt nguồn id có cấu trúc; không đoán từ tên/batch, không mở rộng query active tùy tiện |
| Dữ liệu cũ batch NULL không xác định cascade | Không restore hàng loạt các NULL. Nếu dữ liệu thực có case này, hỏi chính sách legacy; không tự gán batch suy đoán |
| Counts được gọi “snapshot” nhưng schema không lưu | COUNT dữ liệu còn lại, xác nhận purge theo scope thật; ghi lệch thuật ngữ trong handoff, không tạo schema snapshot |
| Xung đột tên ở exam con khi restore môn do dữ liệu legacy/bất thường | Rollback toàn bộ; hợp đồng RestoreReq chỉ rename một root, không tự phát minh bulk rename. Nếu cần xử lý tình huống này ngoài invariant Sprint 01, escalate |
| Lệch mã BR/UC giữa design, summary và domain | Dùng UC-33 xem, 34 restore môn, 35 restore exam, 36 purge, 37 empty, 38 undo và mã BR từ domain; báo lệch nguồn |
| Cache cũ hiển thị detail đã purge | Invalidate detail/history/stats, xử lý NotFound; không thay store shape hoặc viết lại module khác |

Không hỏi lại quyết định đã chốt: chặn exam có cha xóa + nút khôi phục cả môn; rename bắt buộc khi conflict; không retention. Câu hỏi thực sự cần chốt ở G0 là cách truyền parent id trong hợp đồng hiện hữu; chính sách legacy chỉ hỏi nếu gặp dữ liệu thiếu batch.

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

Chỉ tiếp tục task độc lập; không vượt dependency gate khi task tiền đề fail, không mở lần thử thứ ba.

## 🚨 ESCALATION TRIGGERS (khi nào hỏi user)

DỪNG và hỏi user khi:

1. Lỗi không rõ nguyên nhân sau 2 lần debug
2. Cần chọn giữa 2 approach (A vs B) mà spec không nói
3. Cần thay đổi kiến trúc hiện tại (folder structure, store shape)
4. Phát hiện bug ở sprint trước ảnh hưởng sprint này
5. Cần user test thủ công (visual, UX, performance)

## 🚫 OUT OF SCOPE (KHÔNG được làm)

- KHÔNG refactor code ngoài file list ở TASKS
- KHÔNG thêm feature ngoài GOAL
- KHÔNG đổi UI/UX ngoài spec
- KHÔNG optimize premature (chỉ làm khi ACCEPTANCE yêu cầu)
- KHÔNG viết test (trừ khi task yêu cầu rõ)
- KHÔNG update README/docs (trừ khi task yêu cầu)

S05-T06 yêu cầu rõ integration test purge transaction/restore conflict và các kiểm chứng ở ACCEPTANCE; đây là phạm vi test được giao. Không triển khai code sản phẩm khi nhiệm vụ hiện tại chỉ là viết tài liệu sprint.

## 📤 HANDOFF FORMAT (khi DỪNG, báo cáo theo format này)

```text
STATUS: [DONE | PARTIAL | BLOCKED | NEED_INPUT]
SPRINT: 05

✅ COMPLETED:
- [task]: [file changed] | [lệnh kiểm tra + kết quả]
- Hợp đồng bàn giao: [commands/DTO, SCREEN-09, NavBadge, restore/undo flow]
- Nghiệm thu Hyan: [case đã chạy / case chưa chạy]

❌ FAILED (nếu có):
- [task]: [lỗi gì] | [đã thử gì, số lần] | [cần gì từ user]

🤔 NEED_INPUT (nếu có):
- [câu hỏi]: [mô tả] | Option A: [...] | Option B: [...]
- Lệch tài liệu nền: [mã/mục và tác động; không tự sửa tài liệu nền]

📋 NEXT ACTION:
- Nếu DONE → "SPRINT DONE. Ready for sprint 06, paste next prompt"
- Nếu BLOCKED → "Waiting for user response on X"
- Nếu PARTIAL → "Continue task Y after user confirms"
- Nếu NEED_INPUT → [quyết định hoặc checklist manual đang cần]
```

Sprint 06 có thể đã chạy độc lập; hợp đồng trực tiếp của Sprint 05 được dùng để nghiệm thu tổng thể Sprint 07.

═══════════════════════════════════════════════════════
