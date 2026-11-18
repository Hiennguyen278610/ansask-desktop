# SSOT: ansask-desktop

> Ứng dụng desktop luyện đề trắc nghiệm. Tauri v2 + React + SQLite local.

## 0. Cách đọc tài liệu

`docs/design_system/` + `docs/ssot.md` + `` là đủ để dựng dự án. Hai file chia việc như sau:

| File                                                    | Là nguồn sự thật cho                                                                                                                        |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `design_system/layout_spec.md`                        | Bố cục UI, nhãn chữ, sự kiện từng nút, nội dung 2 prompt AI                                                                            |
| `design_system/color_pallete.svg`, `typography.svg` | Màu và kiểu chữ. Chép thành CSS variables ở `src/shared/styles/tokens.css`, không tự bịa giá trị                                  |
| `ssot.md` (file này)                                 | Công nghệ, cấu trúc thư mục, schema DB, hợp đồng IPC, pattern phân trang, định dạng đề TXT/JSON, hành vi làm bài/chấm điểm |
| `resource/icon_tag/`                                  | Bộ icon môn học. DB chỉ lưu tên file                                                                                                      |

Khi hai file mâu thuẫn: layout thì `layout_spec.md` thắng, còn dữ liệu và hành vi thì `ssot.md` thắng. Những chỗ `layout_spec.md` chưa rõ hoặc có vẻ copy nhầm được ghi ở mục 15. Hãy xác nhận trước khi code các màn đó.

---

## 1. Công nghệ

| Mảng        | Chọn                                                                  | Ghi chú                                              |
| ------------ | ---------------------------------------------------------------------- | ----------------------------------------------------- |
| Shell        | Tauri v2                                                               | Plugin: `dialog`, `fs`, `clipboard-manager`     |
| DB           | SQLite qua `rusqlite` (feature `bundled`) + `rusqlite_migration` | SQL nằm hết ở Rust                                 |
| Rust khác   | `serde`, `serde_json`, `thiserror`, `uuid` (v7)                |                                                       |
| UI           | React + TypeScript + Vite                                              |                                                       |
| Style        | Tailwind + shadcn/ui                                                   | Token từ design_system, class `dark` cho dark mode |
| Router       | `@tanstack/react-router` (code-based)                                | Layout lồng nhau, `staticData` cho breadcrumb      |
| Server state | `@tanstack/react-query` v5                                           | `useInfiniteQuery` cho mọi danh sách phân trang  |
| Virtualize   | `@tanstack/react-virtual`                                            | Chống nặng DOM                                      |
| Client state | `zustand` (+ `immer` cho editor)                                   | Editor, phiên làm bài, settings                    |
| Form         | `react-hook-form` + `zod`                                          | Dialog tạo môn, dialog cấu hình bài kiểm tra    |
| Editor text  | `@uiw/react-codemirror`                                              | Có sẵn undo/redo (Ctrl+Z, Ctrl+Shift+Z)             |
| Chart        | `recharts`                                                           | Dashboard                                             |
| Khác        | `nanoid`, `lucide-react`, `vitest`                               |                                                       |

**Vì sao SQL ở Rust mà không dùng `tauri-plugin-sql` từ FE:** tạo/sửa/import đề và xóa vĩnh viễn cần transaction nhiều bước. Plugin SQL gọi từng câu qua pool nên không đảm bảo atomic. FE chỉ gọi `invoke`.

---

## 2. Kiến trúc và quy tắc

```
pages  ->  features  ->  services  ->  shared
                \           |            ^
                 +----->  domain  -------+   (domain: thuần TS, không import gì ngoài chính nó)
```

| Lớp         | Chứa                                                                      | Được import                                                              |
| ------------ | -------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `app`      | provider, router                                                           | tất cả                                                                    |
| `layouts`  | khung sidebar/main, fullscreen                                             | `shared`, `services`, `features/settings` qua props/slot              |
| `pages`    | ghép feature, khai báo header actions                                    | `features`, `services`, `domain`, `shared`                          |
| `features` | UI + store của một nghiệp vụ                                           | `services`, `domain`, `shared`. **Không import feature khác** |
| `services` | gọi IPC, query keys, hook TanStack Query theo entity                      | `domain`, `shared`                                                      |
| `domain`   | type, parse/serialize đề, validate, chấm điểm, dựng phiên làm bài | không                                                                      |
| `shared`   | UI dùng chung, hook generic, `call()`                                   | không                                                                      |

Quy tắc bắt buộc:

1. Component không bao giờ gọi `invoke`. Chỉ `services/*/service.ts` gọi qua `shared/api/client.ts`. Chặn bằng ESLint `no-restricted-imports` cho `@tauri-apps/api/core`.
2. Feature cần data của feature khác thì lấy qua `services/`, hoặc `page` truyền props và callback.
3. Logic dễ sai (parse, validate, chấm điểm, dựng phiên) là hàm thuần trong `domain/` và có unit test.
4. Định dạng TXT/JSON chỉ có **một** implementation, ở TS (`domain/exam-format`). Rust không parse đề, chỉ lưu.
5. Mọi thay đổi dữ liệu đi qua mutation trong `services/`, và mutation chịu trách nhiệm invalidate (mục 7.4).

---

## 3. Cấu trúc thư mục

```
ansask-desktop/
├─ docs/
│  ├─ ssot.md
│  ├─ design_system/ (layout_spec.md, color_pallete.svg, typography.svg)
│  └─ resource/icon_tag/
│
├─ src-tauri/
│  ├─ Cargo.toml, tauri.conf.json
│  ├─ capabilities/default.json
│  └─ src/
│     ├─ main.rs, lib.rs               # builder, plugin, setup mở DB, generate_handler!
│     ├─ error.rs                      # AppError -> {code, message}
│     ├─ state.rs                      # struct Db(Mutex<Connection>)
│     ├─ db/
│     │  ├─ mod.rs                     # open(), PRAGMA, chạy migration, recount_*()
│     │  └─ migrations/0001_init.sql
│     ├─ models/                       # DTO (Serialize/Deserialize, camelCase)
│     │  ├─ common.rs                  # Page<T,C>, TimeCursor, finish_page()
│     │  └─ subject.rs exam.rs question.rs attempt.rs trash.rs stats.rs
│     └─ commands/
│        ├─ mod.rs
│        └─ subject.rs exam.rs question.rs attempt.rs trash.rs stats.rs
│
└─ src/
   ├─ main.tsx
   ├─ app/
   │  ├─ providers.tsx                 # QueryClientProvider, Toaster, useApplySettings()
   │  ├─ query-client.ts
   │  └─ router.tsx                    # cây route + staticData
   │
   ├─ layouts/
   │  ├─ AppLayout/
   │  │  ├─ index.tsx                  # body 2 phần: Sidebar | MainContent
   │  │  ├─ Sidebar/ index.tsx SidebarHeader.tsx SidebarNav.tsx SidebarFooter.tsx
   │  │  └─ MainContent/ index.tsx PageHeader.tsx Breadcrumb.tsx HeaderSlot.tsx ScrollContext.tsx
   │  └─ FullscreenLayout.tsx          # chỉ có <Outlet/>, dùng cho làm bài
   │
   ├─ pages/
   │  ├─ DashboardPage.tsx
   │  ├─ SubjectListPage.tsx           # /exams
   │  ├─ ExamListPage.tsx              # exam_by_subject
   │  ├─ ExamDetailPage.tsx
   │  ├─ ExamEditorPage.tsx            # create + edit dùng chung
   │  ├─ ExamTakingPage.tsx
   │  ├─ ExamResultPage.tsx
   │  └─ AiGuidePage.tsx
   │
   ├─ features/
   │  ├─ subject/    components/ SubjectCard.tsx CreateSubjectDialog.tsx IconPickerDialog.tsx · schema.ts
   │  ├─ exam/       components/ ExamCard.tsx ExamQuestionList.tsx ImportErrorDialog.tsx · hooks/ useExamIO.ts
   │  ├─ exam-editor/
   │  │  ├─ store/ editor.store.ts
   │  │  └─ components/ EditorHeader.tsx QuestionList.tsx QuestionBlock.tsx OptionRow.tsx
   │  │                 AddQuestionGap.tsx EditorPane.tsx
   │  ├─ exam-taking/
   │  │  ├─ store/ session.store.ts
   │  │  ├─ hooks/ useFullscreen.ts useStartSession.ts useSubmitSession.ts
   │  │  └─ components/ ExamConfigDialog.tsx TakingHeader.tsx Timer.tsx QuizView.tsx FlashcardView.tsx
   │  ├─ exam-result/  components/ ScoreDonut.tsx ResultActions.tsx
   │  ├─ dashboard/    components/ StatCards.tsx RecentScoreChart.tsx AvgBySubjectChart.tsx RecentAttempts.tsx
   │  ├─ settings/     store/ settings.store.ts · components/ SettingsDialog.tsx GeneralTab.tsx TrashTab.tsx DonateTab.tsx
   │  └─ ai-guide/     prompts.ts · components/ StepCard.tsx PromptCard.tsx
   │
   ├─ services/                        # mỗi entity: service.ts + keys.ts + queries.ts
   │  ├─ subject/  exam/  question/  attempt/  trash/  stats/
   │
   ├─ domain/
   │  ├─ types.ts
   │  ├─ exam-format/ text.ts json.ts validate.ts index.ts  (+ *.test.ts)
   │  ├─ session/ build-session.ts build-retry.ts shuffle.ts (+ *.test.ts)
   │  └─ scoring.ts                    # (+ scoring.test.ts)
   │
   └─ shared/
      ├─ api/ client.ts types.ts       # call(), AppError, Page<T,C>, PageParams<C>
      ├─ components/
      │  ├─ ui/                        # shadcn
      │  ├─ data/ InfiniteGrid.tsx IndexGridDialog.tsx
      │  ├─ feedback/ ConfirmDialog.tsx EmptyState.tsx GridSkeleton.tsx
      │  └─ form/ AutoGrowTextarea.tsx
      ├─ hooks/ useCursorInfiniteQuery.ts
      ├─ lib/ cn.ts subject-icons.ts
      └─ styles/ tokens.css globals.css
```

Page rất mỏng: chỉ lấy param, gọi hook, đặt `<HeaderActions>`, ghép component của feature.

---

## 4. Mô hình dữ liệu

### 4.1 Type miền (`domain/types.ts`)

```ts
export type Id = string;                       // uuid v7 sinh ở Rust
export type AttemptMode = 'quiz' | 'flashcard';

export interface Subject { id: Id; name: string; icon: string; examCount: number; questionCount: number; createdAt: number }
export interface ExamSummary { id: Id; subjectId: Id; title: string; questionCount: number; createdAt: number; updatedAt: number }
export interface Option { id: Id; content: string; isCorrect: boolean }
export interface Question { id: Id; content: string; options: Option[] }   // thứ tự mảng = position

// Payload tạo/sửa đề: không có id
export interface ExamInput { title: string; questions: { content: string; options: { content: string; isCorrect: boolean }[] }[] }

// Draft trong editor: thêm uid ổn định (nanoid) làm React key và đích scroll
export interface DraftOption { uid: string; content: string; isCorrect: boolean }
export interface DraftQuestion { uid: string; content: string; options: DraftOption[] }
export interface DraftExam { title: string; questions: DraftQuestion[] }

// Chấm điểm
export interface AnswerRecord { selectedOptionId: Id | null; correct: boolean }
export interface AttemptDetail {
  id: Id; examId: Id; subjectId: Id; examTitle: string; mode: AttemptMode;
  total: number; correct: number; score: number; elapsedSec: number; submittedAt: number;
  questions: Question[];                       // snapshot đúng thứ tự đã làm
  answers: Record<Id, AnswerRecord>;           // key = question.id
}
```

Quy ước: thời gian là unix **mili giây** (integer). Tên field qua IPC là **camelCase** (`#[serde(rename_all = "camelCase")]` trên mọi DTO).

### 4.2 SQLite (`migrations/0001_init.sql`)

```sql
CREATE TABLE subjects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT NOT NULL,                          -- tên file trong docs/resource/icon_tag
  exam_count INTEGER NOT NULL DEFAULT 0,       -- denormalize, chỉ tính đề chưa xóa
  question_count INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  deleted_at INTEGER
);

CREATE TABLE exams (
  id TEXT PRIMARY KEY,
  subject_id TEXT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  question_count INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  deleted_at INTEGER
);

CREATE TABLE questions (
  id TEXT PRIMARY KEY,
  exam_id TEXT NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  content TEXT NOT NULL
);

CREATE TABLE options (
  id TEXT PRIMARY KEY,
  question_id TEXT NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  content TEXT NOT NULL,
  is_correct INTEGER NOT NULL DEFAULT 0 CHECK (is_correct IN (0, 1))
);

-- Chỉ ghi khi nộp bài. Snapshot độc lập với đề (đề sửa sau đó không làm hỏng kết quả cũ).
CREATE TABLE attempts (
  id TEXT PRIMARY KEY,
  exam_id TEXT NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  mode TEXT NOT NULL CHECK (mode IN ('quiz', 'flashcard')),
  snapshot_json TEXT NOT NULL,                 -- Question[] theo thứ tự đã làm
  answers_json TEXT NOT NULL,                  -- Record<questionId, AnswerRecord>
  total INTEGER NOT NULL,
  correct INTEGER NOT NULL,
  score REAL NOT NULL,                         -- thang 10, 2 chữ số thập phân
  elapsed_sec INTEGER NOT NULL,
  started_at INTEGER NOT NULL,
  submitted_at INTEGER NOT NULL
);

-- Index phục vụ keyset pagination
CREATE INDEX idx_subjects_page ON subjects (deleted_at, created_at DESC, id DESC);
CREATE INDEX idx_exams_page    ON exams (subject_id, deleted_at, created_at DESC, id DESC);
CREATE INDEX idx_questions_exam ON questions (exam_id, position);
CREATE INDEX idx_options_question ON options (question_id, position);
CREATE INDEX idx_attempts_recent ON attempts (submitted_at DESC);
CREATE INDEX idx_attempts_exam ON attempts (exam_id);
-- Thùng rác
CREATE INDEX idx_subjects_trash ON subjects (deleted_at DESC, id DESC) WHERE deleted_at IS NOT NULL;
CREATE INDEX idx_exams_trash    ON exams (deleted_at DESC, id DESC) WHERE deleted_at IS NOT NULL;
```

Quy tắc dữ liệu:

- Bật khi mở kết nối: `PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL;`.
- **Thùng rác = soft delete** bằng `deleted_at`. Khôi phục = set `NULL`. Xóa vĩnh viễn = `DELETE` thật, FK cascade xuống exams, questions, options, attempts.
- Xóa môn chỉ set `deleted_at` của môn. Đề bên trong giữ nguyên nhưng bị ẩn vì mọi query đề đều đi qua môn chưa xóa. Khôi phục môn thì mọi thứ quay lại.
- `exam_count`, `question_count` của môn do Rust cập nhật bằng `recount_subject(tx, subject_id)` **trong cùng transaction** với mọi thao tác tạo, sửa, xóa, khôi phục, xóa vĩnh viễn đề. Không dùng trigger.

```sql
-- recount_subject
UPDATE subjects SET
  exam_count     = (SELECT COUNT(*) FROM exams WHERE subject_id = ?1 AND deleted_at IS NULL),
  question_count = (SELECT COALESCE(SUM(question_count), 0) FROM exams WHERE subject_id = ?1 AND deleted_at IS NULL)
WHERE id = ?1;
```

---

## 5. Hợp đồng IPC

Quy ước: tên command `snake_case` dạng `<entity>_<verb>`. Mọi command có input nhận **đúng 1 tham số tên `req`**. FE gọi `call('exam_list', { req: {...} })`. Command không có input thì không có tham số.

```ts
type TimeCursor  = { createdAt: number; id: Id };
type TrashCursor = { deletedAt: number; id: Id };
```

| Command                   | `req`                                                                                | Trả về                                                             |
| ------------------------- | -------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| `subject_list`          | `{ cursor: TimeCursor \| null, limit, query?: string }`                               | `Page<Subject, TimeCursor>`                                        |
| `subject_create`        | `{ name, icon }`                                                                     | `Subject`                                                          |
| `subject_rename`        | `{ id, name }`                                                                       | `Subject`                                                          |
| `subject_soft_delete`   | `{ id }`                                                                             | `void`                                                             |
| `exam_list`             | `{ subjectId, cursor: TimeCursor \| null, limit, query?: string }`                    | `Page<ExamSummary, TimeCursor>`                                    |
| `exam_get`              | `{ id }`                                                                             | `ExamSummary`                                                      |
| `exam_create`           | `{ subjectId, input: ExamInput }`                                                    | `ExamSummary`                                                      |
| `exam_update`           | `{ id, input: ExamInput }`                                                           | `ExamSummary` (thay toàn bộ câu hỏi)                           |
| `exam_soft_delete`      | `{ id }`                                                                             | `void`                                                             |
| `question_list_all`     | `{ examId }`                                                                         | `Question[]` (đúng thứ tự `position`)                        |
| `attempt_save`          | `{ examId, mode, questions, answers, total, correct, score, elapsedSec, startedAt }` | `{ id }`                                                           |
| `attempt_get`           | `{ id }`                                                                             | `AttemptDetail` (join exam để lấy `subjectId`, `examTitle`) |
| `attempt_list`          | `{ cursor: {submittedAt,id} \| null, limit, examId?, subjectId? }`                    | `Page<AttemptListItem, {submittedAt,id}>`                         |
| `session_save`          | `{ examId, mode, questions, answers, firstTry, currentIndex, startedAt, elapsedSec }` | `{ id }` (upsert một phiên dở mỗi đề)                              |
| `session_get`           | `{ examId }`                                                                         | `SessionDraft \| null`                                            |
| `session_delete`        | `{ examId }`                                                                         | `void`                                                             |
| `trash_list`            | `{ kind: 'subject' \| 'exam', cursor: TrashCursor \| null, limit }`                    | `Page<TrashItem, TrashCursor>`                                     |
| `trash_restore`         | `{ kind, id }`                                                                       | `void`                                                             |
| `trash_purge`           | `{ kind, id }`                                                                       | `void`                                                             |
| `stats_totals`          | không                                                                                 | `{ subjects, exams, questions, attempts }`                         |
| `stats_recent_attempts` | `{ limit }`                                                                          | `{ id, examTitle, subjectName, mode, score, submittedAt }[]`       |
| `stats_avg_by_subject`  | không                                                                                 | `{ subjectId, subjectName, avgScore, attempts }[]`                 |

`TrashItem` = `{ id, kind, name, parentName?: string, deletedAt }`. Với `kind='exam'`, `parentName` là tên môn, và chỉ liệt kê đề có môn **chưa** bị xóa.

Thống kê và lịch sử chỉ tính attempt của đề và môn chưa xóa. `SessionDraft` có các trường của `session_save` cộng `id, updatedAt`. `AttemptListItem` gồm `id, examId, subjectId, examTitle, subjectName, mode, score, total, correct, submittedAt`. `attempt_save` xóa phiên dở của đề trong cùng transaction. Migration `0002_sessions.sql` bổ sung `session_drafts` và index lịch sử.

---

## 6. Backend Rust

### 6.1 Khởi tạo

```rust
// state.rs
pub struct Db(pub std::sync::Mutex<rusqlite::Connection>);

// lib.rs
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .setup(|app| {
            let dir = app.path().app_data_dir()?;
            std::fs::create_dir_all(&dir)?;
            app.manage(db::open(dir.join("ansask.db"))?);   // PRAGMA + migrations::to_latest
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![ /* mọi command ở mục 5 */ ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

Một `Mutex<Connection>` là đủ cho app desktop một người dùng với WAL.

**Bắt buộc dùng `#[tauri::command(async)]`** cho mọi command DB. Command không async chạy trên main thread và làm đứng UI khi import đề lớn.

### 6.2 Lỗi

```rust
#[derive(Debug, thiserror::Error)]
pub enum AppError {
    #[error("Không tìm thấy dữ liệu")] NotFound,
    #[error("{0}")] Validation(String),
    #[error(transparent)] Db(#[from] rusqlite::Error),
    #[error(transparent)] Json(#[from] serde_json::Error),
    #[error(transparent)] Io(#[from] std::io::Error),
}
impl serde::Serialize for AppError {
    fn serialize<S: serde::Serializer>(&self, s: S) -> Result<S::Ok, S::Error> {
        #[derive(serde::Serialize)] struct E<'a> { code: &'a str, message: String }
        let code = match self { Self::NotFound => "NOT_FOUND", Self::Validation(_) => "VALIDATION", _ => "INTERNAL" };
        E { code, message: self.to_string() }.serialize(s)
    }
}
```

### 6.3 Phân trang dùng chung

```rust
#[derive(Serialize)] #[serde(rename_all = "camelCase")]
pub struct Page<T, C> { pub items: Vec<T>, pub next_cursor: Option<C> }

#[derive(Serialize, Deserialize)] #[serde(rename_all = "camelCase")]
pub struct TimeCursor { pub created_at: i64, pub id: String }

/// Query lấy `limit + 1` dòng. Dòng dư chỉ để biết còn trang sau.
pub fn finish_page<T, C>(mut rows: Vec<T>, limit: usize, cursor_of: impl Fn(&T) -> C) -> Page<T, C> {
    let has_more = rows.len() > limit;
    if has_more { rows.truncate(limit); }
    let next_cursor = if has_more { rows.last().map(cursor_of) } else { None };
    Page { items: rows, next_cursor }
}
```

### 6.4 Mẫu command phân trang (subject, trash viết cùng khuôn)

```rust
#[tauri::command(async)]
pub fn exam_list(db: State<'_, Db>, req: ExamListReq) -> Result<Page<ExamSummary, TimeCursor>, AppError> {
    let conn = db.0.lock().unwrap();
    let limit = req.limit.clamp(1, 100) as usize;
    // Không có cursor thì dùng (MAX, "") để điều kiện đầu tiên luôn đúng, tránh "?2 IS NULL OR ..." làm hỏng index
    let (c_at, c_id) = req.cursor.map(|c| (c.created_at, c.id)).unwrap_or((i64::MAX, String::new()));
    let mut stmt = conn.prepare_cached(
        "SELECT id, subject_id, title, question_count, created_at, updated_at
         FROM exams
         WHERE subject_id = ?1 AND deleted_at IS NULL
           AND (created_at < ?2 OR (created_at = ?2 AND id < ?3))
         ORDER BY created_at DESC, id DESC
         LIMIT ?4")?;
    let rows = stmt.query_map(params![req.subject_id, c_at, c_id, (limit + 1) as i64], map_exam)?
        .collect::<Result<Vec<_>, _>>()?;
    Ok(finish_page(rows, limit, |e| TimeCursor { created_at: e.created_at, id: e.id.clone() }))
}
```

### 6.5 Command ghi

- `exam_create` / `exam_update`: một transaction. Insert/replace exam, questions, options (`position` = index mảng), set `exam.question_count`, `recount_subject`. `exam_update` xóa toàn bộ questions cũ (cascade options) rồi insert lại, set `updated_at`.
- Rust chỉ canh bất biến: title không rỗng, mỗi câu có 1 đến 10 lựa chọn và **đúng 1** lựa chọn đúng. Lỗi trả `AppError::Validation`. Validate chi tiết cho người dùng nằm ở `domain/exam-format/validate.ts`.
- `exam_soft_delete`, `trash_restore`, `trash_purge` (kind=exam): sau khi đổi, gọi `recount_subject`.
- `attempt_save`: `snapshot_json` và `answers_json` nhận dưới dạng `serde_json::Value` rồi ghi nguyên, Rust không cần model hóa.

### 6.6 Capabilities (`capabilities/default.json`)

```json
{
  "identifier": "default",
  "windows": ["main"],
  "permissions": [
    "core:default",
    "core:window:allow-set-fullscreen",
    "dialog:default",
    "fs:allow-read-text-file",
    "fs:allow-write-text-file",
    "clipboard-manager:allow-write-text"
  ]
}
```

Đường dẫn người dùng chọn qua dialog sẽ được plugin cho phép đọc/ghi.

---

## 7. Tầng service ở FE

### 7.1 Client

```ts
// shared/api/client.ts
import { invoke } from '@tauri-apps/api/core';

export class AppError extends Error {
  constructor(public code: string, message: string) { super(message); this.name = 'AppError'; }
}
export async function call<T>(cmd: string, args?: Record<string, unknown>): Promise<T> {
  try { return await invoke<T>(cmd, args); }
  catch (e) {
    const x = e as { code?: string; message?: string };
    throw new AppError(x?.code ?? 'UNKNOWN', x?.message ?? String(e));
  }
}

// shared/api/types.ts
export interface Page<T, C> { items: T[]; nextCursor: C | null }
export interface PageParams<C> { cursor: C | null; limit: number }
```

### 7.2 Service: một file mỗi entity, chỉ gọi IPC

```ts
// services/exam/service.ts
export const examService = {
  list: (p: { subjectId: Id } & PageParams<TimeCursor>) =>
    call<Page<ExamSummary, TimeCursor>>('exam_list', { req: p }),
  get: (id: Id) => call<ExamSummary>('exam_get', { req: { id } }),
  create: (subjectId: Id, input: ExamInput) => call<ExamSummary>('exam_create', { req: { subjectId, input } }),
  update: (id: Id, input: ExamInput) => call<ExamSummary>('exam_update', { req: { id, input } }),
  softDelete: (id: Id) => call<void>('exam_soft_delete', { req: { id } }),
};
```

`subjectService`, `questionService.listAll`, `attemptService.save/get`, `trashService.list/restore/purge`, `statsService.*` viết cùng khuôn.

Nếu sau này đổi sang `tauri-plugin-sql` hay REST thì chỉ sửa `service.ts`, component và hook không đổi.

### 7.3 Query keys và hook

```ts
// services/exam/keys.ts
export const examKeys = {
  all: ['exams'] as const,
  lists: () => [...examKeys.all, 'list'] as const,
  list: (subjectId: Id) => [...examKeys.lists(), subjectId] as const,
  detail: (id: Id) => [...examKeys.all, 'detail', id] as const,
  questions: (id: Id) => [...examKeys.detail(id), 'questions'] as const,
};
// subjectKeys: all, list()  ·  trashKeys: all, list(kind)  ·  statsKeys: all, totals, recent, avgBySubject
// attemptKeys: all, detail(id)

// services/exam/queries.ts
export const useExamList = (subjectId: Id) =>
  useCursorInfiniteQuery({ queryKey: examKeys.list(subjectId), fetchPage: (p) => examService.list({ subjectId, ...p }) });

export const useExam = (id: Id) => useQuery({ queryKey: examKeys.detail(id), queryFn: () => examService.get(id) });

export const useExamQuestions = (examId: Id) =>
  useQuery({ queryKey: examKeys.questions(examId), queryFn: () => questionService.listAll(examId) });

export function useDeleteExam() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: Id) => examService.softDelete(id),
    onSuccess: () => invalidate(qc, [examKeys.lists(), subjectKeys.list(), trashKeys.all, statsKeys.all]),
  });
}
```

### 7.4 Ma trận invalidate

| Mutation                | Invalidate                                                                                                                 |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `subject_create`      | `subjectKeys.list`                                                                                                       |
| `subject_soft_delete` | `subjectKeys.list`, `trashKeys.all`, `statsKeys.all`                                                                 |
| `exam_create`         | `examKeys.list(subjectId)`, `subjectKeys.list`, `statsKeys.all`                                                      |
| `exam_update`         | `examKeys.list(subjectId)`, `examKeys.detail(id)`, `examKeys.questions(id)`, `subjectKeys.list`, `statsKeys.all` |
| `exam_soft_delete`    | `examKeys.lists`, `subjectKeys.list`, `trashKeys.all`, `statsKeys.all`                                             |
| `trash_restore`       | `trashKeys.all`, `subjectKeys.list`, `examKeys.lists`, `statsKeys.all`                                             |
| `trash_purge`         | `trashKeys.all`, `statsKeys.all`                                                                                       |
| `attempt_save`        | `statsKeys.all`                                                                                                          |

### 7.5 QueryClient

```ts
new QueryClient({
  defaultOptions: { queries: { staleTime: Infinity, gcTime: 5 * 60_000, refetchOnWindowFocus: false, retry: false } },
  queryCache: new QueryCache({ onError: toastError }),
  mutationCache: new MutationCache({ onError: toastError }),
});
```

Dữ liệu chỉ đổi qua chính app này nên cache vô hạn rồi invalidate chủ động. IPC local mang tính tất định nên không retry.

---

## 8. Phân trang và lazy loading

### 8.1 Cái nào phân trang, cái nào không

| Dữ liệu                 | Quy mô dự kiến   | Chiến lược                                                             |
| ------------------------- | ------------------- | ------------------------------------------------------------------------- |
| Môn học                 | chục đến trăm   | cursor + `useInfiniteQuery` + virtual                                   |
| Bộ đề trong một môn  | trăm đến nghìn  | cursor + `useInfiniteQuery` + virtual                                   |
| Thùng rác               | tùy                | cursor + `useInfiniteQuery` + virtual (`columns=1`)                   |
| Câu hỏi trong một đề | tối đa vài trăm | **load một lần** (`question_list_all`), virtualize phần render |
| Dashboard                 | cố định nhỏ     | query tổng hợp riêng từng widget                                      |

Lý do:

- SQLite local trả 30 dòng trong vài ms. Điểm nghẽn thật là **DOM** (hàng nghìn card) và `OFFSET` lớn. Vì vậy dùng **keyset (cursor)** để mọi trang đều nhanh như nhau, và **virtualize** để DOM chỉ có vài hàng đang nhìn thấy.
- Câu hỏi của một đề bị chặn trên, cả đề chỉ là vài trăm chuỗi. Phân trang chúng chỉ thêm độ phức tạp mà không có lợi. Làm bài, xuất file, editor đều cần đủ câu.
- Không dùng phân trang kiểu số trang, vì spec là lưới cuộn.

### 8.2 Hook generic

```ts
// shared/hooks/useCursorInfiniteQuery.ts
export function useCursorInfiniteQuery<T, C>(opts: {
  queryKey: QueryKey;
  fetchPage: (p: PageParams<C>) => Promise<Page<T, C>>;
  limit?: number;        // mặc định 30, nên là bội của số cột
  enabled?: boolean;
}) {
  const { queryKey, fetchPage, limit = 30, enabled } = opts;
  const q = useInfiniteQuery({
    queryKey, enabled,
    initialPageParam: null as C | null,
    queryFn: ({ pageParam }) => fetchPage({ cursor: pageParam, limit }),
    getNextPageParam: (last) => last.nextCursor,    // null = hết trang
  });
  const items = useMemo(() => q.data?.pages.flatMap((p) => p.items) ?? [], [q.data]);
  return { ...q, items };
}
```

Subject, exam và trash đều dùng lại hook này.

### 8.3 Scroll container

`MainContent` giữ phần thân cuộn và cung cấp qua context để `InfiniteGrid` biết cuộn trên phần tử nào.

```tsx
// layouts/AppLayout/MainContent/ScrollContext.tsx
export const ScrollContext = createContext<HTMLElement | null>(null);
export const useScrollContainer = () => useContext(ScrollContext);
```

Dialog có vùng cuộn riêng (tab Thùng rác) tự bọc `<ScrollContext.Provider value={dialogBodyEl}>` quanh nội dung.

### 8.4 `InfiniteGrid` (dùng cho cả lưới 3 cột lẫn danh sách 1 cột)

```tsx
// shared/components/data/InfiniteGrid.tsx
interface Props<T> {
  items: T[];
  columns?: number;                 // 3 theo spec; 1 cho danh sách dọc
  rowHeight: number;                // chiều cao ước lượng, thực tế đo bằng measureElement
  gap?: number;                     // px
  getKey: (item: T) => string;
  renderItem: (item: T) => React.ReactNode;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  isError?: boolean;                // dừng tự fetch tiếp khi lỗi, tránh vòng lặp
  fetchNextPage: () => void;
  isLoading?: boolean;
  empty?: React.ReactNode;
}

export function InfiniteGrid<T>({ items, columns = 3, rowHeight, gap = 16, getKey, renderItem,
  hasNextPage, isFetchingNextPage, isError, fetchNextPage, isLoading, empty }: Props<T>) {
  const scrollEl = useScrollContainer();
  const listRef = useRef<HTMLDivElement>(null);
  const rowCount = Math.ceil(items.length / columns);

  const v = useVirtualizer({
    count: rowCount,
    getScrollElement: () => scrollEl,
    estimateSize: () => rowHeight + gap,
    overscan: 3,
    scrollMargin: listRef.current?.offsetTop ?? 0,   // an toàn khi phía trên còn phần tử khác
  });
  const vRows = v.getVirtualItems();
  const lastIndex = vRows.at(-1)?.index ?? -1;

  useEffect(() => {
    if (lastIndex >= rowCount - 2 && hasNextPage && !isFetchingNextPage && !isError) fetchNextPage();
  }, [lastIndex, rowCount, hasNextPage, isFetchingNextPage, isError, fetchNextPage]);

  if (isLoading) return <GridSkeleton columns={columns} />;
  if (!items.length) return <>{empty}</>;

  return (
    <div ref={listRef} style={{ height: v.getTotalSize(), position: 'relative' }}>
      {vRows.map((row) => (
        <div key={row.key} data-index={row.index} ref={v.measureElement}
          className="absolute left-0 top-0 grid w-full"
          style={{
            gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
            columnGap: gap, paddingBottom: gap,
            transform: `translateY(${row.start - v.options.scrollMargin}px)`,
          }}>
          {items.slice(row.index * columns, row.index * columns + columns).map((it) => (
            <div key={getKey(it)}>{renderItem(it)}</div>
          ))}
        </div>
      ))}
    </div>
  );
}
```

### 8.5 Cách dùng ở page

```tsx
// pages/ExamListPage.tsx
const { subjectId } = useParams({ from: '/exams/$subjectId' });
const q = useExamList(subjectId);
const del = useDeleteExam();

return (
  <>
    <HeaderActions>
      <ImportExamButton subjectId={subjectId} />                      {/* features/exam */}
      <Button onClick={() => navigate({ to: '/exams/$subjectId/new', params: { subjectId } })}>
        <Plus /> Tạo đề
      </Button>
    </HeaderActions>
    <InfiniteGrid
      items={q.items} rowHeight={140} getKey={(e) => e.id}
      renderItem={(e) => <ExamCard exam={e} onDelete={() => del.mutate(e.id)} />}
      hasNextPage={q.hasNextPage} isFetchingNextPage={q.isFetchingNextPage}
      isError={q.isFetchNextPageError} fetchNextPage={q.fetchNextPage} isLoading={q.isLoading}
      empty={<EmptyState title="Chưa có bộ đề" />}
    />
  </>
);
```

`SubjectListPage` giống hệt, chỉ khác hook và card.

---

## 9. Layout shell, routing, header

### 9.1 Cây route

| Path                                            | Page                    | Layout               | `crumb`         | `headerMode`   |
| ----------------------------------------------- | ----------------------- | -------------------- | ----------------- | ---------------- |
| `/`                                           | DashboardPage           | App                  | "Tổng quan"      | default          |
| `/exams`                                      | SubjectListPage         | App                  | "Đề bài"       | default          |
| `/exams/$subjectId`                           | ExamListPage            | App                  | tên môn         | default          |
| `/exams/$subjectId/new`                       | ExamEditorPage (create) | App                  | "Tạo đề"       | **custom** |
| `/exams/$subjectId/$examId`                   | ExamDetailPage          | App                  | tên đề         | default          |
| `/exams/$subjectId/$examId/edit`              | ExamEditorPage (edit)   | App                  | "Sửa đề"       | **custom** |
| `/exams/$subjectId/$examId/result/$attemptId` | ExamResultPage          | App                  | "Kết quả"       | default          |
| `/guide`                                      | AiGuidePage             | App                  | "Hướng dẫn AI" | default          |
| `/take`                                       | ExamTakingPage          | **Fullscreen** | không có        | không có       |

`new` là segment tĩnh nên luôn thắng `$examId`.

```ts
declare module '@tanstack/react-router' {
  interface StaticDataRouteOption {
    crumb?: (match: { loaderData: any }) => string;
    headerMode?: 'default' | 'custom';
  }
}
```

Crumb động (tên môn, tên đề) lấy từ `loader`, và loader gọi `queryClient.ensureQueryData(...)` nên không fetch trùng với hook trong page. Route `/take` có `beforeLoad`: nếu `useSessionStore.getState().session` rỗng thì `redirect({ to: '/exams' })`.

### 9.2 Khung chính

```tsx
// layouts/AppLayout/MainContent/index.tsx
export function MainContent() {
  const [slot, setSlot] = useState<HTMLElement | null>(null);       // chỗ đặt feature_components
  const [scrollEl, setScrollEl] = useState<HTMLElement | null>(null);
  const custom = useMatches().some((m) => m.staticData?.headerMode === 'custom');
  return (
    <HeaderSlotContext.Provider value={slot}>
      <ScrollContext.Provider value={scrollEl}>
        <main className="flex h-full min-w-0 flex-1 flex-col overflow-hidden">
          {!custom && <PageHeader slotRef={setSlot} />}
          <div ref={setScrollEl} className="min-h-0 flex-1 overflow-y-auto"><Outlet /></div>
        </main>
      </ScrollContext.Provider>
    </HeaderSlotContext.Provider>
  );
}

// HeaderSlot.tsx: page tự khai báo nút chức năng, header không cần biết page nào đang mở
export function HeaderActions({ children }: { children: ReactNode }) {
  const slot = useContext(HeaderSlotContext);
  return slot ? createPortal(children, slot) : null;
}
```

- `PageHeader` = `Breadcrumb` căn trái (chạy `useMatches()`, lấy các match có `staticData.crumb`, nối bằng `>`) + vùng slot căn phải.
- Route `headerMode: 'custom'`: `PageHeader` không render. Page tự render `EditorHeader` ở đầu nội dung. Vùng thân của editor **không cuộn**, hai pane bên trong tự cuộn riêng.
- `AppLayout` = hai phần trái/phải, `overflow-hidden`. Sidebar và main tự cuộn phần của mình.

### 9.3 Sidebar

- `SidebarHeader`: logo trái, giữa là title + subtitle xếp dọc, phải là nút icon thu gọn sidebar.
- `SidebarNav`: danh sách thẻ dọc, có cuộn. Mục: Tổng quan `/`, Đề bài `/exams` (active khi path bắt đầu bằng `/exams`), Hướng dẫn AI `/guide`.
- `SidebarFooter`: icon cài đặt + "Cài đặt", bấm mở `SettingsDialog`.

---

## 10. Định dạng đề TXT/JSON

Hai prompt AI trong `layout_spec.md` sinh ra đúng hai định dạng này. Nếu đổi định dạng thì phải sửa prompt.

### 10.1 TXT

```
ask : Thủ đô của Việt Nam là gì?
ans. Huế
ans.* Hà Nội
ans. Đà Nẵng
ans. TP. Hồ Chí Minh
```

Quy tắc parse:

- Dòng `ask :` mở câu mới. Chấp nhận `ask:` và khoảng trắng thừa, không phân biệt hoa thường.
- `ans.` là lựa chọn sai, `ans.*` là lựa chọn đúng. Nội dung là phần sau dấu đó, đã `trim`.
- Dòng không bắt đầu bằng `ask`/`ans` thì nối vào trường trước đó, ngăn bằng `\n` (nội dung nhiều dòng). Dòng trống bị bỏ qua.
- Văn bản không trống trước `ask` đầu tiên là lỗi.
- Serialize: mỗi câu một khối, cách nhau một dòng trống.

### 10.2 JSON

```json
[ { "ask": "Câu hỏi?", "answer": [ {"false": "Sai 1"}, {"true": "Đúng"}, {"false": "Sai 2"} ] } ]
```

Gốc là mảng. Mỗi phần tử `answer` là object **đúng một key** `"true"` hoặc `"false"`, giá trị là chuỗi.

### 10.3 Validate (áp cho cả hai, và cho nút Lưu đề)

- Tên đề không rỗng (chỉ kiểm khi lưu).
- Có ít nhất 1 câu. Nội dung câu không rỗng sau `trim`.
- Mỗi câu có 1 đến 10 lựa chọn, nội dung mỗi lựa chọn không rỗng.
- Mỗi câu có **đúng 1** lựa chọn đúng.

### 10.4 API (`domain/exam-format`)

```ts
type ParseError = { line?: number; path?: string; message: string };   // TXT dùng line, JSON dùng path như "[3].answer[1]"
type Result<T> = { ok: true; value: T } | { ok: false; errors: ParseError[] };

parseText(raw: string): Result<DraftQuestion[]>
parseJson(raw: string): Result<DraftQuestion[]>
toText(qs: Pick<Question,'content'|'options'>[]): string
toJson(qs: Pick<Question,'content'|'options'>[]): string
validateDraft(d: DraftExam): ParseError[]          // dùng chung cho parse và nút Lưu
toExamInput(d: DraftExam): ExamInput
```

Parser trả `DraftQuestion[]` (đã gắn `uid` mới), validate chạy ngay sau parse.

### 10.5 Import và export (`features/exam/hooks/useExamIO.ts`)

- **Import** ("Nhập bộ đề"): `open({ multiple: false, filters: [{ name: 'Đề', extensions: ['txt', 'json'] }] })` → `readTextFile` → chọn parser theo đuôi → ok thì gọi `useCreateExam` với `title` = tên file bỏ đuôi, lỗi thì mở `ImportErrorDialog` liệt kê `ParseError`.
- **Export** ("Xuất txt"): `questionService.listAll` (qua `queryClient.fetchQuery`) → `toText` → `save({ defaultPath: '<title>.txt' })` → `writeTextFile`.

---

## 11. Editor tạo/sửa đề

Hai trang `/new` và `/edit` dùng chung `ExamEditorPage`. Chế độ edit load `exam_get` + `question_list_all` rồi map sang `DraftExam` với `uid` mới.

### 11.1 Store

```ts
// features/exam-editor/store/editor.store.ts   (zustand + immer)
interface EditorState {
  draft: DraftExam;
  format: 'text' | 'json';                 // mặc định 'text'
  editorText: string;                      // nội dung pane editor
  lastEdited: 'form' | 'editor';           // ai vừa sửa, chống vòng lặp đồng bộ
  parseErrors: ParseError[];

  init(draft: DraftExam): void;
  setTitle(t: string): void;
  addQuestion(afterIndex?: number): void;               // mặc định thêm cuối; tạo sẵn 4 lựa chọn rỗng, chưa chọn đáp án
  removeQuestion(uid: string): void;
  setQuestionContent(uid: string, v: string): void;
  addOption(qUid: string): void;                        // tối đa 10
  removeOption(qUid: string, oUid: string): void;       // tối thiểu 1
  setOptionContent(qUid: string, oUid: string, v: string): void;
  setCorrect(qUid: string, oUid: string): void;         // radio: bỏ đúng ở các lựa chọn còn lại
  setFormat(f: 'text' | 'json'): void;                  // serialize lại draft sang định dạng mới
  setEditorText(raw: string): void;                     // lastEdited = 'editor'
}
```

### 11.2 Đồng bộ form và editor

`draft` là nguồn sự thật. `editorText` chỉ là cách nhìn của nó, trừ lúc người dùng đang gõ.

1. Form sửa thì `draft` đổi, `lastEdited='form'`. Sau debounce 300ms: `editorText = serialize(draft, format)`.
2. Editor gõ thì `setEditorText`, `lastEdited='editor'`. Sau debounce 300ms: parse.
   - Thành công: thay `draft.questions`, **tái dùng `uid` theo vị trí** (`old[i]?.uid ?? nanoid()`, lựa chọn tương tự). Nhờ vậy React key ổn định, ô đang focus không bị remount. `parseErrors = []`.
   - Thất bại: giữ nguyên `draft`, đặt `parseErrors` và hiển thị dưới editor kèm số dòng hoặc path. Không ghi đè nội dung người dùng đang gõ.
3. Khi `lastEdited === 'editor'`, bỏ qua bước serialize ở (1). Đây là cách chống vòng lặp.
4. Đổi switch TEXT/JSON: serialize `draft` hiện tại sang định dạng mới. Nếu editor đang có lỗi, dùng `draft` hợp lệ gần nhất và báo toast.

Ctrl+Z / Ctrl+Shift+Z do CodeMirror (`history()` + `historyKeymap`) lo. Form không cần undo.

### 11.3 Component

| Component                    | Việc                                                                                                                                                                                                                 |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `EditorHeader`             | `←` (quay lại), input tên đề căn đầy (placeholder "Tên bộ đề"), nút "Lưu đề"                                                                                                                        |
| `QuestionList`             | Virtualize bằng `useVirtualizer` + `measureElement` + `getItemKey = uid` (chiều cao đổi khi text xuống dòng). Giữ `scrollToIndex` cho dialog danh sách. Cuối danh sách luôn có `AddQuestionGap` |
| `QuestionBlock`            | Hàng đầu: "Câu j" (j từ 1), `AutoGrowTextarea` (placeholder "Nội dung câu hỏi"), nút xóa câu. Thân: các `OptionRow`. Chân: nút "Thêm lựa chọn"                                                  |
| `OptionRow`                | radio, nhãn A..J, `AutoGrowTextarea` (placeholder "Nội dung lựa chọn"), chữ "Đúng" chỉ hiện khi radio được chọn, nút xóa lựa chọn (disable khi chỉ còn 1)                                        |
| `AddQuestionGap`           | Nút "Thêm câu hỏi" viền nét đứt. Ở cuối luôn hiện, giữa hai câu chỉ hiện khi hover (CSS `group-hover` trên vùng nhạy mỏng)                                                                      |
| `EditorPane`               | Header: "editor" + switch TEXT/JSON. Thân: CodeMirror, cuộn riêng. Dưới cùng: danh sách `parseErrors`                                                                                                        |
| `IndexGridDialog` (shared) | Dialog lưới 5 cột, cuộn. Props: `count`, `onSelect(i)`, `isDone?(i)`. Dùng ở cả editor và làm bài                                                                                                     |

Ô "danh sách câu hỏi" ở header pane trái: nút icon list + text hiển thị **tổng số câu hiện có** (0 khi rỗng). Bấm mở `IndexGridDialog`, chọn số thì đóng dialog, `scrollToIndex` rồi focus ô nội dung câu đó.

### 11.4 Lưu

Nút "Lưu đề": `validateDraft` → nếu có lỗi thì hiện toast, cuộn tới câu lỗi đầu tiên (`scrollToIndex`) và không gọi IPC. Hợp lệ thì `toExamInput(draft)` → `examService.create/update` (qua hook trong `services/exam`, `page` truyền `onSave` xuống) → thành công thì điều hướng về `/exams/$subjectId/$examId`.

---

## 12. Làm bài

### 12.1 Bắt đầu phiên

`ExamConfigDialog` (nằm ở `features/exam-taking`, mở từ `ExamDetailPage` và từ nút "Luyện tập" ở trang kết quả):

- Props: `examId`, `subjectId`, `examTitle`, `total` (= `exam.questionCount`).
- Form (`zod`): `mode: 'quiz' | 'flashcard'`, `count` (số nguyên, 1 đến `total`), `shuffle: boolean`. Mặc định `count = min(10, total)`, `shuffle = false`.
- Nút chọn nhanh `[25, 32, 40]`: bật khi `total > value`, bấm thì ghi đè `count`. Nút "Tất cả" luôn bật và ghi `total`.
- "Làm bài": `useStartSession` → `questionService.listAll(examId)` → `buildSession(...)` → `useSessionStore.start(...)` → `navigate('/take')`.

```ts
// domain/session/build-session.ts
export function buildSession(qs: Question[], cfg: { count: number; shuffle: boolean; rng?: () => number }): Question[] {
  const n = Math.min(cfg.count, qs.length);
  if (!cfg.shuffle) return qs.slice(0, n);
  return shuffle(qs, cfg.rng).slice(0, n).map((q) => ({ ...q, options: shuffle(q.options, cfg.rng) }));
}

// domain/session/build-retry.ts: câu sai hoặc chưa chọn của một attempt, giữ nguyên thứ tự
export const buildRetrySession = (a: AttemptDetail): Question[] =>
  a.questions.filter((q) => !a.answers[q.id]?.correct);
```

### 12.2 Store

```ts
// features/exam-taking/store/session.store.ts
interface Session { examId: Id; subjectId: Id; examTitle: string; mode: AttemptMode; questions: Question[]; startedAt: number }
interface SessionState {
  session: Session | null;
  answers: Record<Id, Id | null>;          // questionId -> optionId đang chọn
  firstTry: Record<Id, boolean>;           // flashcard: kết quả lần xác nhận đầu tiên
  index: number;                           // flashcard: câu hiện tại
  wrongHint: boolean;                      // flashcard: hiện "Sai rồi, thử lại lần nữa"
  start(s: Session): void;
  select(qId: Id, oId: Id): void;          // đồng thời tắt wrongHint
  confirm(): 'correct' | 'wrong' | 'finished';   // flashcard
  reset(): void;
}
```

Phiên nằm trong bộ nhớ, không ghi DB cho đến khi nộp. Thoát giữa chừng thì mất phiên.

### 12.3 Chấm điểm (`domain/scoring.ts`)

```ts
export const toScore10 = (correct: number, total: number) =>
  total === 0 ? 0 : Math.round((correct / total) * 1000) / 100;       // 7/9 -> 7.78

export function evaluate(qs: Question[], answers: Record<Id, Id | null>, firstTry: Record<Id, boolean>, mode: AttemptMode) {
  const record: Record<Id, AnswerRecord> = {};
  let correct = 0;
  for (const q of qs) {
    const selected = answers[q.id] ?? null;
    const ok = mode === 'quiz'
      ? q.options.find((o) => o.id === selected)?.isCorrect === true
      : firstTry[q.id] === true;                     // flashcard: tính đúng ở lần xác nhận đầu tiên
    record[q.id] = { selectedOptionId: selected, correct: ok };
    if (ok) correct++;
  }
  return { answers: record, total: qs.length, correct, score: toScore10(correct, qs.length) };
}
```

Câu chưa chọn hoặc chưa làm tính là sai.

### 12.4 Màn làm bài (`FullscreenLayout`, `/take`)

- `useFullscreen()`: mount thì `getCurrentWindow().setFullscreen(true)`, cleanup thì `false`. Vì `/take` thuộc `FullscreenLayout` nên sidebar tự biến mất, không cần `if` rải rác. Nộp bài chuyển sang route dưới `AppLayout` thì tự thoát fullscreen và sidebar hiện lại.
- `TakingHeader` (dùng chung hai mode): icon khóa + `Timer`, "Đã chọn x/y" + thanh tiến độ, nút "Nộp bài" (căn phải). Mode quiz có thêm nút list + tổng số câu mở `IndexGridDialog` (`isDone(i)` = câu đã chọn đáp án).
- `Timer`: lưu `startedAt`, mỗi giây tính `Math.floor((Date.now() - startedAt) / 1000)` rồi định dạng `mm:ss`. Chỉ `Timer` re-render, không đếm cộng dồn nên không lệch khi webview bị throttle.
- `QuizView`: danh sách câu cuộn dọc, virtualize. Mỗi câu có "Câu j", nội dung, các lựa chọn dạng radio. Nội dung chỉ đọc.
- `FlashcardView`: một câu mỗi lần. Footer: dòng "Sai rồi, thử lại lần nữa" (ẩn mặc định, hiện khi `wrongHint`) bên trái, nút "Xác nhận" bên phải (disable khi chưa chọn).
  - `confirm()`: ghi `firstTry[q]` nếu chưa có. Đúng thì sang câu kế (`wrongHint=false`), sai thì `wrongHint=true`, ở lại câu đó. Đúng ở câu cuối trả về `'finished'` và tự nộp bài.

### 12.5 Nộp bài (`useSubmitSession`)

```ts
const s = useSessionStore.getState();
const r = evaluate(s.session!.questions, s.answers, s.firstTry, s.session!.mode);
const { id } = await attemptService.save({
  examId: s.session!.examId, mode: s.session!.mode, questions: s.session!.questions,
  answers: r.answers, total: r.total, correct: r.correct, score: r.score,
  elapsedSec: Math.floor((Date.now() - s.session!.startedAt) / 1000), startedAt: s.session!.startedAt,
});
const { subjectId, examId } = s.session!;
s.reset();
navigate({ to: '/exams/$subjectId/$examId/result/$attemptId', params: { subjectId, examId, attemptId: id } });
```

---

## 13. Trang kết quả

`ExamResultPage` đọc `attemptService.get(attemptId)` (`useAttempt`). Header theo `layout_spec.md`:

- `ScoreDonut`: `score` làm tròn 2 chữ số, hiển thị `score/10`.
- Tên đề và "Hoàn thành bài kiểm tra".
- "Về đề bài": `navigate('/exams/$subjectId/$examId')`.
- "Làm lại (n) câu sai": `n = total - correct` (gồm cả câu chưa chọn). Disable khi `n = 0`. Bấm thì `buildRetrySession(attempt)` rồi `start({ mode: 'flashcard', ... })` rồi `/take`.
- "Luyện tập": mở `ExamConfigDialog` với `total` của đề (lấy từ `useExam`).

Page ghép `ResultActions` (feature exam-result) với hàm `startSession` của feature exam-taking qua callback, không import chéo giữa hai feature.

---

## 14. Các màn còn lại

**Môn học (`SubjectListPage`)**

- Header actions: nút "+ Tạo môn học" mở `CreateSubjectDialog`.
- Dialog: header tiêu đề + nút X, thân gồm "Tên môn học" + input, hàng "Icon nhận diện" + nút mở `IconPickerDialog` (xem trước icon đã chọn). Schema zod: `name` trim 1 đến 100 ký tự, `icon` bắt buộc.
- Icon lấy từ `docs/resource/icon_tag`:
  ```ts
  // shared/lib/subject-icons.ts
  const files = import.meta.glob('/docs/resource/icon_tag/*.{svg,png}', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;
  export const SUBJECT_ICONS = Object.entries(files).map(([p, url]) => ({ key: p.split('/').pop()!, url }));
  ```

  DB lưu `key`, hiển thị tra từ `SUBJECT_ICONS`.
- `SubjectCard`: header tên + nút xóa, thân "tổng bộ đề, tổng số câu", chân "Mở bộ đề" + `>`. Bấm card mở `/exams/$subjectId`. Nút xóa dừng nổi bọt, qua `ConfirmDialog`, rồi soft delete và toast "Đã chuyển vào thùng rác".

**Chi tiết đề (`ExamDetailPage`)**

- Header actions: "Hiện/Ẩn đáp án" (state `showAnswers` của page, không dùng `id` trong DOM), "Xuất txt", "Sửa đề" (`/edit`), "Làm đề" (mở `ExamConfigDialog`).
- Thân: `ExamQuestionList` virtualize, mỗi câu hiển thị nội dung + các lựa chọn, đáp án đúng chỉ hiện khi `showAnswers`.

**Settings**

```ts
// features/settings/store/settings.store.ts  (zustand/persist -> localStorage)
{ theme: 'light' | 'dark' | 'system'; fontScale: 100 | 110 | 120 }
```

- `useApplySettings()` (gọi ở `providers.tsx`): bật/tắt class `dark` trên `<html>`. Mode `system` nghe `matchMedia('(prefers-color-scheme: dark)')`. Đặt `document.documentElement.style.fontSize = fontScale + '%'`, nên toàn bộ kích thước phải dùng `rem`.
- `SettingsDialog`: `Tabs` dọc: "Cấu hình chung", "Thùng rác", "Ủng hộ".
- `GeneralTab`: nhóm nút Light/Dark/System và nhóm nút 100% (mặc định)/110%/120%.
- `TrashTab`: bộ lọc "Môn học | Bộ đề", dùng `useCursorInfiniteQuery` + `InfiniteGrid columns={1}` (bọc `ScrollContext` riêng của dialog). Mỗi dòng có "Khôi phục" và "Xóa vĩnh viễn" (qua `ConfirmDialog`).
- `DonateTab`: nội dung chưa định nghĩa (mục 15).

**Dashboard** (spec để mở, đề xuất tối thiểu, mỗi widget một query để cache độc lập)

1. `StatCards`: số môn, số đề, tổng câu, số lượt làm (`stats_totals`).
2. `RecentScoreChart`: line chart điểm 10 lượt làm gần nhất (`stats_recent_attempts`).
3. `AvgBySubjectChart`: bar chart điểm trung bình theo môn (`stats_avg_by_subject`).
4. `RecentAttempts`: danh sách lượt làm gần đây, bấm mở trang kết quả.

Bố cục: hàng 4 thẻ số, dưới là 2 cột (1 và 2 là line/bar), dưới cùng là danh sách. Dashboard rỗng (chưa có lượt làm) hiện `EmptyState`.

**Hướng dẫn AI (`AiGuidePage`)**

- `prompts.ts` xuất `PROMPT_TEXT` và `PROMPT_JSON`, chép **nguyên văn** từ `layout_spec.md` (mục ai_guide), cùng mảng `STEPS` (3 bước).
- `PromptCard` nhận `{ icon, title, content }`. Nút "sao chép" dùng `writeText` của plugin clipboard-manager rồi toast.

---

## 15. Giả định cần xác nhận

`layout_spec.md` có chỗ mơ hồ hoặc có vẻ copy nhầm từ màn khác. Mục này ghi cách hiểu, nếu sai thì sửa trước khi code màn đó.

1. **Cuộn của main:** spec ghi cả "main_content disable scroll" lẫn "page enable scroll". Hiểu là header cố định, thân cuộn (mục 9.2).
2. **Màn làm bài là chỉ đọc:** spec dùng lại `input_field` và nút `remove` từ editor. Ở màn làm bài, nội dung câu và lựa chọn hiển thị là chữ, không có nút xóa.
3. **Không lộ đáp án khi làm:** mode trắc nghiệm không hiện chữ "Đúng" khi chọn radio (khác với editor). Flashcard chỉ báo sai qua dòng "Sai rồi, thử lại lần nữa".
4. **"số câu <i bắt đầu từ 0>"** là tổng số câu hiện có (0 khi rỗng), không phải câu đang xem.
5. **Điểm flashcard:** tính đúng nếu đúng ở lần xác nhận đầu tiên; câu chưa làm tính sai.
6. **Flashcard xong câu cuối** thì tự nộp bài.
7. **Quy tắc nút chọn nhanh:** mỗi nút 25/32/40 bật khi `total > giá trị nút`. "Tất cả" luôn bật.
8. **Không xáo thì lấy N câu đầu** theo thứ tự đề.
9. **Sidebar:** tên các mục nav, title/subtitle và nút icon bên phải header (hiểu là thu gọn sidebar) là đề xuất.
10. **Sau khi lưu đề** thì điều hướng sang trang chi tiết đề.
11. **Trang kết quả** chỉ có header như spec, phần thân chưa định nghĩa nên để trống.
12. **Tab "Ủng hộ"** chưa có nội dung, tạm để placeholder.
13. **Xóa đề/môn** luôn là soft delete vào thùng rác, xóa vĩnh viễn chỉ có ở tab Thùng rác.

---

## 16. Mở rộng và ngoài phạm vi

Đợt mở rộng hiện tại triển khai: tìm kiếm môn/đề (tham số `query` tùy chọn vào `*_list` và query key) · đổi tên môn · trang lịch sử làm bài · lưu và tiếp tục phiên làm dở · import nhiều file một lúc · xuất JSON · cảnh báo rời editor khi chưa lưu.

Vẫn ngoài phạm vi: đa ngôn ngữ · đồng bộ đám mây.

---

## 17. Thứ tự triển khai và test

1. **Rust nền:** `db::open`, migration, `AppError`, `Page`/`finish_page`, command subject. Test bằng `Connection::open_in_memory()` cho phân trang (kể cả trang cuối và dữ liệu cùng `created_at`).
2. **Domain + test:** `parseText`, `parseJson`, `toText`, `toJson`, `validateDraft`, `buildSession`, `buildRetrySession`, `toScore10`, `evaluate`. Thêm test parse đúng ví dụ đầu ra trong hai prompt AI.
3. **Shell:** `AppLayout`, `MainContent` (slot, scroll context), `Breadcrumb`, router, `SettingsDialog` bản chung (theme, cỡ chữ).
4. **Môn học:** `shared/api`, `useCursorInfiniteQuery`, `InfiniteGrid`, `subject` service, màn Môn học, dialog tạo, icon picker.
5. **Đề:** command exam, màn danh sách đề, chi tiết đề, import/export.
6. **Editor:** store, đồng bộ form-editor, virtualize, lưu.
7. **Làm bài và kết quả:** config dialog, session store, quiz, flashcard, fullscreen, nộp bài, result, làm lại câu sai.
8. **Thùng rác, dashboard, AI guide.**

Kiểm tra hiệu năng sau bước 5: seed 5.000 đề vào một môn và 2.000 môn, xác nhận cuộn mượt, DOM không quá vài chục card, mỗi trang tải chỉ một query.
