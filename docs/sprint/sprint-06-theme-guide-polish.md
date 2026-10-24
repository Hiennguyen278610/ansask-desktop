**Quy tắc UI bắt buộc:** mọi task UI dùng token light/dark từ Sprint 00; không hex trực tiếp trong component/style UI.

═══════════════════════════════════════════════════════
SPRINT 06 — THEME & AI GUIDE & POLISH
═══════════════════════════════════════════════════════

CONTEXT:
Sprint 00 bàn giao khung Tauri + React, SQLite/migration, Tailwind + lucide-react và wrapper invoke. Sprint 06 chỉ cần nền này; có thể chạy từ Sprint 02, độc lập với quiz/lịch sử/thùng rác và hợp nhất nghiệm thu toàn app ở Sprint 07.
Sidebar cần hoàn thiện collapse và thay Settings/Power bằng ThemeToggle; SCREEN-08 cung cấp hướng dẫn tĩnh và copy prompt. DB là nguồn sự thật cho theme; cache đọc sớm chỉ hỗ trợ chống nháy trắng.
Đây là prompt thực thi tương lai, không xác nhận Sprint 00 hay các tính năng đã được triển khai trong checkout hiện tại.

GOAL:
Bàn giao theme light/dark/system persist SQLite, áp trước render và theo đổi theme OS, SCREEN-08 copy đúng prompt, sidebar collapse giữ nguyên điều hướng, cùng checklist a11y/empty state đạt các tiêu chí ACCEPTANCE bên dưới.


**AC-SIZE — acceptance chung bắt buộc:** mọi task code/config/test phải kiểm tra file ≤~200 dòng và hàm ≤~40 dòng; báo số dòng/file và rà ranh giới hàm trong kết quả task, tách module khi vượt, không nén code để né giới hạn. Mọi acceptance task bên dưới viện dẫn AC-SIZE, gate không pass khi chưa kiểm tra.

**Phạm vi theme:** chỉ chuyển light/dark/system, persist, listener OS và chống nháy; toàn bộ CSS variables hai theme và `@custom-variant dark` đã có từ Sprint 00, không định nghĩa token ở Sprint 06.

## Phạm vi và phụ thuộc

- **Trong:** `setting_get`, `setting_set`, `SettingValueDto`, `app_settings`; ThemeToggle, inline script `index.html`; AI Guide SCREEN-08, GuideStepCard, PromptBox, CopyPromptButton; sidebar collapse; polish focus, nhãn truy cập và empty state của các màn đã tồn tại.
- **Ngoài:** feature mới; màn Settings, nút Power/Settings; tích hợp AI/API, upload/import file, export/backup, tài khoản/cloud; shortcut theme chưa chốt; persist sidebar; thay đổi parser/chấm điểm/thống kê. Không dựng màn tương lai chỉ để polish.
- **Phụ thuộc bắt buộc:** Sprint 00: DB pool, migration 001 tạo 7 bảng (gồm `app_settings`), AppState/AppError, shell, tokens, Toast, scripts lint/build/test và wrapper `src/lib/tauri/invoke.ts`.
- **Đầu vào có điều kiện:** EmptyState và các màn Sprint 01..05 nếu đã hợp nhất. Nếu chạy sớm, ghi rõ màn chưa có để Sprint 07 kiểm tra; không coi là lỗi phụ thuộc của theme/guide, không đánh dấu các màn ấy đã nghiệm thu.
- **Bàn giao cho Sprint 07:** hai command + DTO, ThemeToggle/hook, SCREEN-08, inline script theme, bằng chứng test và danh sách checklist thủ công còn chờ.

## Tài liệu nền bắt buộc đọc

Đường dẫn tính từ root repo; đọc đúng các cập nhật đợt 2/3, không lấy hành vi ref cũ thay cho yêu cầu mới.

| Tài liệu | Mục/mã cần đọc |
|---|---|
| `docs/sprint/sprint-prompt-template.md` | Toàn bộ; giữ các khối CONTEXT, GOAL, TASKS, ACCEPTANCE, STOP, RETRY, ESCALATION, OUT OF SCOPE, HANDOFF |
| `docs/sprint/sprint-plan-summarize.md` | §3 quy ước, §4, §5 Sprint 06, §8 hợp đồng |
| `docs/domain-core.md` | §1.4; §4.10 AppSetting; §5.7 BR-57/58; §5.9 BR-66; §6 UC-23/25/28; §7 điều hướng; §9 NFR-16 |
| `docs/design-system.md` | §3.2/3.3 sidebar; §4.7 loại bỏ utility cũ; §4.49..4.51 GuideStepCard/PromptBox/CopyPromptButton; §4.55 ThemeToggle; §5 SCREEN-08; §6.7, §6.13, §6.15 |
| `docs/design-system.md` (bổ trợ) | §2.1e tokens dark, §6.2 toast, §6.3 menu, §6.11 empty state, §8.4 anti-flash, QDS-27/38/45/48 |
| `docs/db.dbml` | `app_settings`: key TEXT PK, value TEXT NOT NULL, updated_at TEXT UTC; seed theme=system |
| `docs/structure-be.md` | §3 các module settings/theme; §5 dữ liệu; §6.2 command, §6.3 TS mirror; §7.5; §8 features/theme, features/ai-guide, hook và shell |
| `docs/ref-ui.tsx` | L468–500 prompt; L1240–1249 copy; L1347–1480 sidebar; L2788–2897 guide. Chỉ tham chiếu UI, không chép nguyên component |

## QUY ƯỚC CHO TẤT CẢ SPRINT

**Thực thi bằng subagent codex (bắt buộc).** Mọi công việc triển khai (code, config, migration, test, refactor) đều giao cho `subagent_codex`. Mỗi task có: Mã task, tên, mục tiêu, Thực thi bởi = `subagent codex`, Nhóm chạy (song song P1/P2… hay tuần tự) + Phụ thuộc, Phạm vi file (không giao trùng file giữa task song song), UC/BR/component/command/bảng liên quan (mã + mục tài liệu nền), Prompt giao cho codex (tự chứa), Tiêu chí chấp nhận + Lệnh kiểm tra.

**Song song hóa.** Phân tích đồ thị phụ thuộc, gom nhóm gọi nhiều codex cùng lúc. File dùng chung (`lib.rs`/`invoke_handler`, `mod.rs`, routes, `index.html`, config) gom vào **một task tích hợp** chạy sau cùng nhóm (một codex). Chốt hợp đồng (tên command/DTO/kiểu TS/component/props) trước khi song song. Mỗi sprint có sơ đồ ASCII wave + gate kiểm tra tổng sau mỗi wave. Cuối sprint: task kiểm thử & nghiệm thu (codex) + checklist nghiệm thu thủ công cho Hyan.

**Nội dung bắt buộc mỗi file sprint:** mục tiêu/phạm vi/phụ thuộc; tài liệu nền phải đọc (đường dẫn + mục/mã); hợp đồng tạo ra/dựa vào; sơ đồ wave + task; Definition of Done, checklist nghiệm thu, rủi ro, câu hỏi mở.

**Quy tắc kỹ thuật chung:** phân tầng `commands → services → repositories → db`, DI qua `tauri::State`, Unit of Work cho thao tác nhiều bước; file ≤ ~200 dòng, hàm ≤ ~40 dòng; DRY/SOLID, không over-engineer; Tailwind + `lucide-react`; thời gian lưu UTC, hiển thị `Asia/Ho_Chi_Minh`; schema qua migration đánh số; test Rust SQLite in-memory.

**Sprint 00** phủ toàn bộ §9 `structure-be.md`: Tailwind + lucide-react, crate SQLite/migration/chrono-tz + crate đã chốt (verify version trước khi ghi), capabilities tối thiểu, `tauri.conf.json` 1280×800/minWidth 1024, thay `App.tsx` demo bằng khung app, lint/format/test, script `package.json`.

Áp dụng cho Sprint 06: orchestrator chốt hợp đồng và phân công; các thay đổi triển khai do codex thực hiện. Không tự thêm dependency. Dùng runner, router/nav-state và cơ chế state đã được Sprint 00 chốt; không thêm Zustand/router chỉ để làm theme. Nếu một task ước tính vượt 30 phút, tách thành các task con có một hành động, file owner và gate rõ ràng trước khi chạy; không mở rộng ngân sách âm thầm.

## Hợp đồng cần chốt trước wave P1

### C06-01 — Commands và persistence

| Command | Request | Response |
|---|---|---|
| `setting_get` | `SettingGetReq { key: string }` | `SettingValueDto { key: string, value: string }` |
| `setting_set` | `SettingSetReq { key: string, value: string }` | `SettingValueDto { key: string, value: string }` |

- Dùng tên `SettingGetReq` theo bảng §6.2, không tạo thêm alias `GetSettingReq` từ chú thích cây thư mục. DTO Rust/TS cùng field `key`, `value`; không đưa `updated_at` vào response.
- Wrapper duy nhất ở `src/lib/tauri/commands.ts`: `settingGet(req): Promise<SettingValueDto>` và `settingSet(req): Promise<SettingValueDto>`. Tauri command nhận tham số `req`, envelope invoke `{ req }`; đối chiếu convention Sprint 00 ở S06-T00 trước khi khóa.
- Key dùng trong sprint là `theme`. Giá trị hợp lệ là `light | dark | system`, default `system`. Không biến hai command thành màn quản trị settings tổng quát.
- `app_settings` đã có từ Sprint 00: không tạo lại bảng/migration 001, không có FK/soft delete. Seed idempotent không ghi đè lựa chọn cũ; upsert cập nhật `updated_at` UTC ISO-8601.
- Giá trị đọc hỏng/thiếu fallback `system` theo UC-28; lỗi DB thật trả `AppError { code, message }`, không giả làm đọc thành công. Chính sách key lạ/giá trị ghi không hợp lệ chưa mô tả đầy đủ trong bảng command: khóa ở S06-T00, đề xuất dùng `Validation` hiện có, không tự thêm error code.

### C06-02 — Theme và cache đọc sớm

```ts
type ThemeMode = 'light' | 'dark' | 'system';
type ResolvedTheme = 'light' | 'dark';
interface ThemeToggleProps {
  theme: ThemeMode;
  resolvedTheme: ResolvedTheme;
  onThemeChange: (mode: ThemeMode) => void;
  collapsed?: boolean;
}
```

- Hook `src/hooks/useTheme.ts` cung cấp mode, resolvedTheme và hành động đổi theme qua wrapper; component chỉ hiển thị và gọi callback. Một owner lifecycle listener, cleanup khi unmount; không tạo listener riêng cho mỗi ThemeToggle.
- Class `dark` trên `<html>` + CSS variables là cơ chế chung. Icon theo **mode**: Sun/Moon/Monitor; OS đổi không đổi mode `system` thành `dark` trong DB.
- **Quy ước cache của sprint:** dùng đúng một key `localStorage.theme` theo `structure-be §7.5/§8`, không dùng key cache khác. Đây là cache thay thế được, không là persistence nghiệp vụ. Tài liệu nền đã được A đồng bộ key `theme`.
- Inline script chạy trong head trước bundle: đọc cache có try/catch, validate ba mode, thiếu/hỏng thì resolve system bằng matchMedia; đặt class và nền ban đầu theo token. Không gọi SQLite đồng bộ trong inline script.
- Boot đọc DB qua `setting_get`, đồng bộ mode/class/cache; không mount nội dung app bằng theme mặc định rồi đợi useEffect sửa. Có thể giữ nền bootstrap đã resolve đến khi DB trả về; không tự thêm màn loading mới.
- Đổi theme áp RAM/class/cache ngay, persist DB; ghi thất bại giữ theme RAM + toast lỗi theo §4.55, không thông báo đã lưu. Khi restart DB thắng cache. Đồng bộ phải chống response boot cũ ghi đè lựa chọn mới và chống các lần set nhanh hoàn tất sai thứ tự; ưu tiên hàng đợi ghi trong hook, không đổi hợp đồng command.
- Listener `matchMedia('(prefers-color-scheme: dark)')` tự cập nhật resolvedTheme ở system; light/dark cố định không đổi theo OS; removeEventListener khi cleanup.
- Cache mất/lệch DB: inline script không biết theme DB trước IPC. Không tuyên bố bảo đảm tuyệt đối first paint đúng DB trong tình huống này. Kiểm tra và ghi kết quả riêng; nếu yêu cầu NFR-16 bao gồm bảo đảm đó, dừng để chốt startup gate/native window trước khi sửa cấu hình. Không tự hạ acceptance thành “đổi theme sau useEffect”.

### C06-03 — Guide và shell

- `GuideStepCard({ step: 1|2|3, title, children })`; `PromptBox({ children: string })`; `CopyPromptButton({ onCopy, label })`; `AiGuideScreen({ onNavigateExams: () => void })`.
- `FIXED_AI_PROMPT` là một constant duy nhất từ nội dung `ref-ui.tsx:L468–500`: yêu cầu 4 lựa chọn, đúng 1; JSON `ask`/`answer` và TXT `ask :`, `ans.`, `ans.*`. Hiển thị và copy dùng cùng chuỗi, giữ newline/tab; không viết lại prompt vì parser hỗ trợ nhiều đáp án.
- Ba bước: truy cập Gemini/ChatGPT/Claude; đính kèm tài liệu **trên dịch vụ AI ngoài**; dán prompt rồi nhập JSON/TXT ở tab Đề kiểm tra. Link ngoài mở riêng, không chuyển webview app sang website; dùng tauri-plugin-opener và capabilities opener:default đã giữ từ Sprint 00, không thêm plugin.
- Copy theo BR-58: textarea tạm → select → `document.execCommand('copy')` → cleanup. Thành công có toast đúng `Đã sao chép Prompt JSON vào bộ nhớ tạm!`; không đổi nhãn nút tạm thời, không tự chuyển Clipboard API. QDS-38 chưa chốt xử lý thất bại: ghi rõ kết quả thực tế và hỏi khi cần thay đổi UX; không coi toast là bằng chứng clipboard thành công.
- Chuyển sang `activeTab='guide'` hoặc callback về `exams` không reset `examViewMode`, selection hay draft; collapse chỉ đổi layout, `sidebarOpen` không persist.
- Desktop: mở `md:w-64 p-6`, thu gọn `md:w-20 p-4`, 300ms; ẩn nhãn/profile text, giữ avatar nếu shell có, logo hover PanelLeft và thao tác bằng keyboard. Dưới md giữ `w-full`; hành vi label theo UC-25, không thêm drawer mobile.
- ThemeToggle là utility duy nhất đáy sidebar, nút 40×40; menu neo `bottom-full mb-2 left-0 w-40`, không bị clipping khi collapsed. Không thêm tab cho màn chưa triển khai.

## TASKS

### Sơ đồ wave và gate

```text
Sprint 00
   |
S06-T00 (tuần tự: khóa hợp đồng, file map, scripts)
   | G0: hợp đồng + prerequisite + file ownership rõ
   +------------------+------------------+
   |                  |                  |
P1: S06-T01 BE      S06-T02 Theme       S06-T03 Guide
   +------------------+------------------+
   | G1: review module riêng; chưa coi module chưa đăng ký là đã test
S06-T04 (tuần tự: tích hợp tất cả file dùng chung + sidebar)
   | G2: compile/test + smoke theme/guide/collapse
S06-T05 (tuần tự: polish a11y/empty states các file đã khóa)
   | G3: lint/build + kiểm tra keyboard/empty states
S06-T06 (tuần tự: kiểm thử và nghiệm thu)
   | G4: test tự động + Hyan manual checklist
Sprint 07 (hợp nhất các màn chưa có khi chạy Sprint 06 sớm)
```

Không giao `index.html`, `commands.ts`, `lib.rs`, `mod.rs`, `state.rs`, routes, App/main hay config cho các task P1. Chỉ S06-T04 được sửa chúng sau P1. Nếu sprint khác cũng đang sửa shell/routes, điều phối lần lượt ở gate tích hợp; không ghi đè thay đổi người khác.

### 1. S06-T00 — Khóa đầu vào và hợp đồng triển khai

- **Mục tiêu:** tạo file map cụ thể từ checkout, xác nhận C06-01..03 và lệnh test trước khi chia việc.
- **Thực thi bởi:** subagent codex.
- **Nhóm/phụ thuộc:** tuần tự P0; Sprint 00.
- **Phạm vi file:** chỉ đọc tài liệu nền, `package.json`, `src/`, `src-tauri/`; không sửa code/config.
- **Truy vết:** UC-23/25/28, BR-57/58/66, NFR-16; tất cả component/command/bảng nêu tại phạm vi.
- **Prompt giao codex:** “Đọc các mục tài liệu nền trong sprint này. Đối chiếu Sprint 00, runner test, AppState, DTO envelope và đường dẫn thực. Khóa C06-01..03; liệt kê chính xác file owner cho từng task, file polish đã tồn tại và màn chưa có. Không tạo dependency, không sửa kiến trúc. Ghi rõ giả định cache, fallback, QDS-38 và startup; nếu cần quyết định chưa có spec thì báo NEED_INPUT với lựa chọn cụ thể. Bàn giao prompt mỗi worker gồm hợp đồng và file list, không yêu cầu worker suy ra từ chat trước.”
- **Chấp nhận:** AC-SIZE; file map không trùng giữa P1; DB/schema và test runner tồn tại; mọi quyết định còn chặn đã được giải quyết hoặc ghi BLOCKED.
- **Lệnh kiểm tra:** `rg --files src src-tauri`; `cat package.json`; `rg -n 'app_settings|setting_|generate_handler' src-tauri/src`; `rg -n 'Theme|Sidebar|EmptyState' src`.

### 2. S06-T01 — Triển khai module settings phân tầng

- **Mục tiêu:** đọc/ghi theme qua service/repository và DTO đã khóa.
- **Thực thi bởi:** subagent codex.
- **Nhóm/phụ thuộc:** P1 song song S06-T02/S06-T03; phụ thuộc G0.
- **Phạm vi file:** `src-tauri/src/domain/app_setting.rs`, `dto/settings_dto.rs`, `repositories/setting_repo.rs`, `services/setting_service.rs`, `commands/settings_cmds.rs` (các đường dẫn sau cùng dưới `src-tauri/src/`); unit test trong các module hoặc file test riêng đã khóa. Không sửa file đăng ký.
- **Truy vết:** UC-28, BR-66, NFR-16; ThemeToggle; setting_get/set, app_settings; domain §4.10/§6, structure-be §3/§5/§6.2/§7.5, db.dbml.
- **Prompt giao codex:** “Thực thi C06-01 bằng commands → services → repositories → db, DI theo AppState Sprint 00. Chỉ key theme dùng bởi sprint, seed system không ghi đè, upsert cập nhật UTC. DTO key/value phải khớp TS; SQL tham số hóa trong repo, không ở command. Đọc mode hỏng theo fallback đã khóa, lỗi DB không bị nuốt. Viết test Rust SQLite in-memory: seed idempotent, ba mode round-trip, upsert không tạo dòng trùng, updated_at UTC, fallback và lỗi theo hợp đồng. Dùng Unit of Work nếu phát sinh nhiều bước nguyên tử. Không sửa lib.rs/mod.rs/state.rs hay migration 001; bàn giao export/wiring cần thêm cho S06-T04.”
- **Chấp nhận:** AC-SIZE; code và test cases đủ, không đổi schema, không thêm crate; không báo test PASS nếu module chưa được đưa vào cây compile.
- **Lệnh kiểm tra:** `cargo fmt --manifest-path src-tauri/Cargo.toml -- --check`; sau G2: `cargo test --manifest-path src-tauri/Cargo.toml setting` (phải có test thực chạy).

### 3. S06-T02 — Triển khai theme controller và ThemeToggle

- **Mục tiêu:** ba mode, listener OS, menu a11y và đồng bộ DB/cache theo C06-02.
- **Thực thi bởi:** subagent codex.
- **Nhóm/phụ thuộc:** P1; phụ thuộc G0, dùng contract BE chứ không chờ S06-T01.
- **Phạm vi file:** `src/features/theme/ThemeToggle.tsx`, `theme.ts`, `ThemeProvider.tsx` nếu cần context theo nền hiện có; `src/hooks/useTheme.ts`; test theme/hook dưới `src/test/` đã khóa. Không sửa index.html/main/tokens/commands.ts.
- **Truy vết:** UC-28, BR-66, NFR-16; ThemeToggle; setting_get/set, SettingValueDto, app_settings; design §4.55/§6.15, structure-be §7.5/§8.
- **Prompt giao codex:** “Triển khai C06-02 với props đã khóa, import wrapper settingGet/settingSet sẽ được S06-T04 tích hợp. Dùng CSS variables hiện có, Sun/Moon/Monitor và Check; tooltip/aria-label mô tả mode. Menu có aria-haspopup, aria-expanded, role menu/menuitemradio, aria-checked; Enter/Space mở, mũi tên di chuyển, Enter chọn, Escape đóng trả focus, click ngoài đóng. Đổi theme ngay, DB là nguồn sự thật, xử lý lỗi ghi giữ RAM + toast lỗi, chặn response cũ đè lựa chọn mới. Cleanup listener. Viết test rõ cho ba mode × OS sáng/tối, OS change, cleanup, cache lỗi và DB reconcile/write failure/race. Bàn giao yêu cầu bootstrap cho S06-T04, không tự sửa file dùng chung.”
- **Chấp nhận:** AC-SIZE; test các hành vi trên; light/dark không bị listener đổi; system lưu mode system; không gọi invoke trực tiếp; menu vẫn dùng khi collapsed.
- **Lệnh kiểm tra:** runner Sprint 00; nếu script là Vitest, `pnpm test src/test/theme.test.ts src/test/useTheme.test.tsx` (S06-T00 chốt tên thực); typecheck đầy đủ tại G2 sau wiring.

### 4. S06-T03 — Dựng SCREEN-08 và copy prompt

- **Mục tiêu:** hoàn thiện màn tĩnh ba bước và hành động copy theo C06-03.
- **Thực thi bởi:** subagent codex.
- **Nhóm/phụ thuộc:** P1; G0.
- **Phạm vi file:** `src/features/ai-guide/AiGuideScreen.tsx`, `GuideStepCard.tsx`, `PromptBox.tsx`, `CopyPromptButton.tsx`, `prompt.ts`, `copyPrompt.ts`. Không sửa routes, App, shell hay Toast dùng chung.
- **Truy vết:** UC-23, BR-58, SCREEN-08; ba component guide + Toast; không command/DB; design §4.49..51/§5 SCREEN-08/§6.7, domain §7.
- **Prompt giao codex:** “Dựng SCREEN-08 theo C06-03 và design-system: hai section, ba card responsive md:grid-cols-3, prompt pre mono pre-wrap và overflow khi cần. Giữ chính xác FIXED_AI_PROMPT ở ref L468–500 trong một constant; chỉ tham chiếu bố cục ref, không copy component nguyên khối. Liên kết Gemini/ChatGPT/Claude mở riêng qua cơ chế hiện có; nút Đề kiểm tra chỉ gọi onNavigateExams. Copy bằng textarea/select/execCommand rồi cleanup, trả focus về nút; giữ nhãn và toast đúng BR-58, không thêm Clipboard API/dependency. Bàn giao màn/props cho S06-T04; nếu webview chặn copy, báo bằng chứng và QDS-38, không báo thành công chỉ vì toast hiện.”
- **Chấp nhận:** AC-SIZE; hiển thị và clipboard cùng một prompt; 3 bước và link đầy đủ; không tạo luồng upload/AI backend; không đổi dữ liệu app.
- **Lệnh kiểm tra:** `pnpm build` sau G2; smoke `pnpm tauri dev`, copy và paste vào text editor để so sánh toàn chuỗi, thử link và quay về exams.

### 5. S06-T04 — Tích hợp hợp đồng và sidebar

- **Mục tiêu:** nối các module vào app, đặt bootstrap theme trước render và hoàn thiện collapse.
- **Thực thi bởi:** subagent codex (một owner tích hợp).
- **Nhóm/phụ thuộc:** tuần tự P2; S06-T01/S06-T02/S06-T03 và G1.
- **Phạm vi file:** `src-tauri/src/lib.rs`, `state.rs`, các `domain/dto/repositories/services/commands/mod.rs`; `src/lib/tauri/commands.ts`; `index.html`, `src/main.tsx`, `src/App.tsx`, routes đang dùng; `src/components/layout/{AppShell,Sidebar,BrandLogo,SidebarToggle,NavItem,ProfileCard}.tsx` nếu tồn tại; `src/stores/uiStore.ts` chỉ khi đã có. Không sửa config/capabilities ngoài file map và quyết định G0.
- **Truy vết:** UC-23/25/28; BR-57/58/66, NFR-16; Sidebar/ThemeToggle/SCREEN-08; setting_get/set + app_settings; design §3.2/3.3/§4.7/§4.55, structure-be §3/§8.
- **Prompt giao codex:** “Tích hợp exports và State, đăng ký đúng hai command một lần theo nền hiện có; mirror DTO và wrappers trong commands.ts. Nối ThemeProvider/hook trước app content và inline script head theo C06-02, cùng cache key theme; sử dụng tokens light/dark đã định nghĩa ở Sprint 00 cho nền root và shell; không định nghĩa lại token. Dùng menu ba lựa chọn, không đổi thành nút xoay vòng từ ví dụ flow. Nối guide qua nav hiện có, giữ exam state. Hoàn thiện sidebar C06-03, bỏ Settings/Power, logo toggle bằng keyboard, nhãn truy cập khi icon-only. Không persist sidebar, không đổi router/store shape. Tôn trọng thay đổi sprint song song. Chạy test module sau đăng ký và smoke native; nếu CSP chặn inline, báo quyết định cần chốt, không nới CSP tự ý.”
- **Chấp nhận:** AC-SIZE; build/test thấy module mới; invoke thật round-trip ba mode; cache/DB reconcile; shell giữ vị trí điều hướng; theme menu không bị sidebar overflow cắt; không flash nền trắng khi cold start với cache hợp lệ.
- **Lệnh kiểm tra:** `pnpm lint`; `pnpm build`; `cargo build --manifest-path src-tauri/Cargo.toml`; `cargo test --manifest-path src-tauri/Cargo.toml`; `pnpm test`; `pnpm tauri dev`.

### 6. S06-T05 — Polish a11y và empty state trong phạm vi đã khóa

- **Mục tiêu:** các màn đã có dùng keyboard và empty state nhất quán, không thay nghiệp vụ.
- **Thực thi bởi:** subagent codex.
- **Nhóm/phụ thuộc:** tuần tự P3; G2, tránh tranh file với tích hợp.
- **Phạm vi file:** danh sách chính xác khóa tại G0, giới hạn `src/features/exam/EmptyState.tsx` (Sprint 01 tạo), `src/components/ui/{Button,IconButton,Toast}.tsx`, shell components từ S06-T04 và các consumer đã tồn tại: SubjectListScreen/SubjectCard, ExamListScreen/ExamCard, ExamOverviewScreen, DashboardScreen, AttemptHistoryPanel, TrashScreen/TrashList. Chỉ sửa các vị trí focus/label/empty rendering, không refactor cả feature. Nếu tên thực khác, ghi mapping trước khi làm.
- **Truy vết:** UC-23/25/28 và shell toàn cục; BR-57/58/66; design §6.11/§6.13, EmptyState có sẵn Sprint 01; không command/schema mới.
- **Prompt giao codex:** “Polish các file đã khóa: button/link có focus-visible đọc được trong light/dark; icon-only có accessible name; card điều hướng dùng bàn phím Enter/Space, tránh button lồng button; toast có vùng thông báo phù hợp. Ngoại lệ BR-49: danh sách môn rỗng render lưới trống, không EmptyState; giữ nguyên trong polish. Chỉ chuẩn hóa các danh sách khác bằng primitive hiện có: môn chưa có đề, chưa có lượt làm, dashboard chưa có lượt, thùng rác rỗng nếu các màn đã tồn tại. Phân biệt loading/error với empty; CTA chỉ trỏ hành động đã có. Không dựng màn thiếu, không đổi query/tính điểm hay thêm tính năng. Ghi danh sách màn chưa có cho Sprint 07; nội dung/CTA chưa có spec đánh dấu giả định hoặc hỏi, không tự thiết kế lại UX.”
- **Chấp nhận:** AC-SIZE; không có vùng rỗng vô nghĩa tại consumer thuộc file map; không có CTA giả; keyboard không mất focus; không có regression điều hướng/dữ liệu; màn chưa tồn tại được ghi N/A cùng lý do.
- **Lệnh kiểm tra:** `pnpm lint`; `pnpm build`; smoke `pnpm tauri dev` với fixture rỗng và có dữ liệu, Tab/Shift+Tab/Enter/Space/Escape ở light/dark.

### 7. S06-T06 — Kiểm thử và nghiệm thu bàn giao

- **Mục tiêu:** cung cấp bằng chứng tự động và checklist Hyan, xác định DONE/PARTIAL/NEED_INPUT đúng thực tế.
- **Thực thi bởi:** subagent codex.
- **Nhóm/phụ thuộc:** tuần tự P4; G3.
- **Phạm vi file:** test settings/theme đã khóa; chỉ đọc code khác, báo lỗi về task owner. Báo cáo trong handoff, không sửa tài liệu nền.
- **Truy vết:** toàn bộ UC-23/25/28, BR-57/58/66, NFR-16; các hợp đồng C06-01..03 và summary §8.
- **Prompt giao codex:** “Chạy bộ kiểm tra bên dưới, không tạo test suite mới ngoài settings/theme đã yêu cầu. Ghi lệnh, exit code, số test thực chạy và bằng chứng smoke; không chấp nhận zero-test pass. Kiểm tra DTO Rust/TS, file owner và kích thước code; kiểm tra cold start, cache lệch, OS listener, lỗi DB, copy thật và giữ nav. Chuẩn bị checklist Hyan; mục chưa chạy để pending, không tự nhận visual PASS. Nếu cần user test, dừng theo escalation sau khi hoàn thành kiểm tra độc lập. Báo hợp đồng bàn giao Sprint 07 và các lệch tài liệu; không sửa tài liệu nền.”
- **Chấp nhận:** AC-SIZE; mọi acceptance có bằng chứng hoặc trạng thái pending/fail cụ thể; chỉ DONE khi acceptance bắt buộc pass và manual được xác nhận.
- **Lệnh kiểm tra:** `pnpm lint`, `pnpm build`, `pnpm test`, `cargo fmt --manifest-path src-tauri/Cargo.toml -- --check`, `cargo build --manifest-path src-tauri/Cargo.toml`, `cargo test --manifest-path src-tauri/Cargo.toml`; smoke `pnpm tauri dev`. Lệnh không có trong checkout là prerequisite thiếu, không âm thầm cài runner mới.

## ACCEPTANCE — Definition of Done

- [ ] UC-28/BR-66: `setting_get/set` invoke thật thành công; DTO `{key,value}` khớp Rust/TS; `app_settings` chỉ một row theme, seed system không ghi đè, updated_at UTC.
- [ ] Test SQLite in-memory chạy thật cho seed/upsert/round-trip ba mode và fallback/lỗi đã khóa; không chạm DB người dùng.
- [ ] Test theme bao phủ light/dark/system × OS light/dark; OS change chỉ tác động system; listener cleanup; cache thiếu/hỏng/không truy cập được; DB thắng cache; lỗi ghi giữ RAM + báo lỗi; response cũ không đè lựa chọn mới.
- [ ] ThemeToggle menu có ba nhãn Sáng/Tối/Theo hệ thống, Sun/Moon/Monitor, Check đúng; tooltip + aria-label, menuitemradio/aria-checked, keyboard và focus return đạt §4.55.
- [ ] Inline script chạy trước React; cold start cache hợp lệ không có frame trắng/theme mặc định; lần đầu không có setting/cache theo OS. Kết quả cache lệch/mất được ghi riêng, không dùng cache để ghi đè DB.
- [ ] Khởi động lại sau lưu thành công khôi phục đúng theme; mọi màn đã tích hợp dùng tokens dark, menu không bị cắt ở sidebar thu gọn.
- [ ] UC-23/BR-58: SCREEN-08 có ba bước, link ngoài, PromptBox chỉ đọc; copy/paste toàn bộ prompt khớp constant, toast chính xác; link Đề kiểm tra giữ viewMode/selection.
- [ ] UC-25/BR-57: sidebar mở/thu gọn đúng kích thước, nhãn/avatar theo spec, logo/nút hoạt động bằng keyboard, không thay dữ liệu/route; không còn Settings/Power.
- [ ] Focus và accessible name đạt ở mọi control trong file map; empty/loading/error phân biệt, danh sách môn rỗng giữ lưới trống theo BR-49; các empty state khác có thông báo/CTA hợp lệ; không thêm feature.
- [ ] Lint/build/format/test pass; file khoảng ≤200 dòng, hàm khoảng ≤40 dòng; không dependency ngoài danh sách Sprint 00, không sửa migration đã phát hành.
- [ ] Checklist Hyan dưới đây có kết quả; màn chưa tồn tại được đánh dấu N/A và chuyển Sprint 07 kiểm tra, không được tuyên bố đã nghiệm thu.

## Checklist nghiệm thu thủ công cho Hyan

Ghi PASS/FAIL/PENDING/N/A, OS/webview, mode, bước tái hiện và ảnh/video nếu cần. Dùng DB/fixture thử riêng, không xóa dữ liệu cá nhân để tạo tình huống.

| # | Thao tác | Kết quả cần thấy |
|---|---|---|
| M01 | Chọn lần lượt Sáng, Tối, Theo hệ thống từ menu | Toàn app đổi ngay; icon, Check, tooltip khớp mode; không đổi màn |
| M02 | Đóng hẳn và mở app sau mỗi lần lưu thành công | Theme đúng ngay; không trắng chớp trước UI; ghi video cold start nếu khó quan sát |
| M03 | Với mode system, đổi OS sáng ↔ tối khi app đang mở | App tự đổi, icon vẫn Monitor; DB vẫn system |
| M04 | Với mode light/dark, đổi OS; mount/unmount lại provider trong test | Theme cố định không đổi; test không còn listener thừa |
| M05 | Fixture lần đầu, cache hỏng/không truy cập được, cache trái DB | Lần đầu theo OS; không crash; DB thắng sau boot. Ghi riêng frame bootstrap, không kết luận anti-flash tuyệt đối khi cache trái DB |
| M06 | Giả lập lỗi get/set; chọn mode nhanh liên tiếp | Báo lỗi thật; lỗi set giữ RAM; không báo đã lưu; restart theo DB, không bị response cũ đổi ngược |
| M07 | Tab tới Theme, Enter/Space, ↑/↓, Enter, Escape, click ngoài | Chọn được cả ba; Escape trả focus; menu không bị clipping ở mở và collapse |
| M08 | Collapse bằng logo/nút tại màn exams có selection; mở lại | Width 256/80px ở md+, nhãn/profile text đúng, avatar giữ nếu có; state exams nguyên vẹn |
| M09 | Mở AI Guide, copy rồi paste sang text editor | Toàn chuỗi JSON/TXT, newline/tab đúng; toast “Đã sao chép Prompt JSON vào bộ nhớ tạm!”; focus trở về nút |
| M10 | Mở từng link Gemini/ChatGPT/Claude; bấm Đề kiểm tra | Website mở riêng; app giữ state; về đúng màn exams trước đó |
| M11 | Tab/Shift+Tab qua shell, guide và các card đã polish trong light/dark | Thấy focus, đọc được nhãn icon-only, Enter/Space kích hoạt đúng, không nested button |
| M12 | Các fixture danh sách môn/đề/lịch sử/dashboard/thùng rác rỗng đã có | Thông báo nhất quán, CTA có đích thật; loading/error không bị trình bày là “rỗng” |
| M13 | Cửa sổ 1280×800 và minWidth 1024; viewport web <768 nếu kiểm tra responsive | Guide không tràn, 3 cột ở md; stacked full width dưới md; không đổi minWidth native để thử |

## Rủi ro, giả định và câu hỏi mở

1. **DB so với localStorage:** Tài liệu nền sau A thống nhất SQLite persist và ngoại lệ localStorage cache theme. Sprint theo summary (đã yêu cầu inline script + ghi rủi ro cache): DB persist, localStorage chỉ cache; không âm thầm sửa tài liệu nền. Key `theme` đã được A đồng bộ trong tài liệu nền.
2. **First paint khi cache lệch:** cache không thể bảo đảm đồng bộ DB trước IPC. Cold start bình thường và cache mất/lệch là hai ca nghiệm thu riêng. Nếu Hyan yêu cầu first paint tuyệt đối đúng DB cả khi cache hỏng, cần quyết định startup gate/native window; không tự thay kiến trúc hay bỏ NFR-16.
3. **Copy thất bại/QDS-38:** spec/ref dùng execCommand và hiện toast kể cả thất bại. Phải thử clipboard thật trên webview; nếu bị chặn, hỏi có cho xử lý lỗi/fallback hay đổi API không. Không tự thêm plugin clipboard hoặc báo copy thành công dựa trên toast.
4. **Giá trị setting sai:** UC-28 có fallback system dạng giả định; lỗi input ghi/key lạ chưa được bảng command chốt. S06-T00 quyết định trước khi worker implement, giữ response và error envelope ổn định.
5. **Tokens dark/QDS-45:** dùng tokens đã có, kiểm tra focus/độ đọc được ở dark; nếu cần thay palette chưa chốt thì báo cụ thể, không tự thiết kế lại UI. Shortcut QDS-48 không triển khai trong sprint.
6. **Empty state/QDS-27:** chỉ chuẩn hóa màn hiện có và hành động sẵn có; chốt copy/CTA khi spec thiếu. Sprint chạy sớm phải bàn giao rõ các consumer chưa có để Sprint 07 nghiệm thu toàn app.
7. **Sidebar responsive:** design §3.3 mô tả icon-only khác UC-25; giữ full width dưới md và state label theo UC-25, test desktop là chính do minWidth 1024. Nếu cần thay hành vi mobile, ghi câu hỏi riêng.
8. **File dùng chung giữa sprint:** shell/routes/commands.ts có thể bị Sprint 02/05 sửa cùng thời điểm; điều phối owner và gate tuần tự. Phát hiện bug nền ảnh hưởng sprint thì báo, không refactor ngoài file list.

───────────────────────────────────────────────────────
🛑 STOP CONDITIONS (DỪNG NGAY khi đạt 1 trong các điều này)
───────────────────────────────────────────────────────
- Tất cả ACCEPTANCE pass → DỪNG, báo "SPRINT DONE".
- Retry 1 task quá 2 lần mà vẫn fail → DỪNG, escalate; thực tế không mở lần thử thứ 3 theo budget dưới đây.
- Phát hiện task cần design decision không có trong spec → DỪNG, hỏi.
- Cần thêm dependency ngoài list đã cho → DỪNG, hỏi.
- Task vượt quá 30 phút ước tính → DỪNG, chia nhỏ lại trước khi giao.

───────────────────────────────────────────────────────
🔁 RETRY BUDGET (giới hạn số lần thử)
───────────────────────────────────────────────────────
- Mỗi task: tối đa 2 lần thử.
- Mỗi lần thử: phải thay đổi approach, KHÔNG được lặp y hệt.
- Sau lần 2 fail: DỪNG task đó, chuyển sang task khác độc lập; không vượt gate phụ thuộc đang fail.
- Cuối sprint: list ra các task chưa xong + lý do, lệnh/lỗi và hai approach đã thử.

───────────────────────────────────────────────────────
🚨 ESCALATION TRIGGERS (khi nào hỏi user)
───────────────────────────────────────────────────────
DỪNG và hỏi user khi:
1. Lỗi không rõ nguyên nhân sau 2 lần debug.
2. Cần chọn giữa 2 approach (A vs B) mà spec không nói, đặc biệt startup khi cache lệch, clipboard thất bại hoặc input setting sai.
3. Cần thay đổi kiến trúc hiện tại (folder structure, store shape), startup window/CSP hoặc thêm dependency.
4. Phát hiện bug ở sprint trước ảnh hưởng sprint này.
5. Cần user test thủ công (visual, UX, performance): hoàn thành kiểm tra độc lập trước, bàn giao checklist cụ thể; không tự đánh dấu PASS.

───────────────────────────────────────────────────────
🚫 OUT OF SCOPE (KHÔNG được làm)
───────────────────────────────────────────────────────
- KHÔNG refactor code ngoài file list ở TASKS.
- KHÔNG thêm feature ngoài GOAL.
- KHÔNG đổi UI/UX ngoài spec.
- KHÔNG optimize premature (chỉ làm khi ACCEPTANCE yêu cầu).
- KHÔNG viết test trừ các test settings/theme được task yêu cầu rõ.
- KHÔNG update README/docs ngoài yêu cầu; phát hiện lệch tài liệu nền thì ghi vào handoff.
- KHÔNG thêm AI API, upload file, Settings/Power, shortcut mới, persist sidebar hay dependency mới.

───────────────────────────────────────────────────────
📤 HANDOFF FORMAT (khi DỪNG, báo cáo theo format này)
───────────────────────────────────────────────────────

STATUS: [DONE | PARTIAL | BLOCKED | NEED_INPUT]
SPRINT: 06

✅ COMPLETED:
- [SNN-TNN]: [file changed] | [UC/BR/hợp đồng bàn giao].
- [Kiểm tra]: [lệnh, exit code, số test thực chạy, bằng chứng].
- [Manual]: [M01..M13: PASS/FAIL/PENDING/N/A + lý do].

❌ FAILED (nếu có):
- [task]: [lỗi gì] | [đã thử gì, tối đa 2 approach] | [cần gì từ user].

🤔 NEED_INPUT (nếu có):
- [Câu hỏi]: [mục spec còn thiếu/mâu thuẫn] | Option A: [...] | Option B: [...].

📦 CONTRACTS FOR SPRINT 07:
- setting_get/set + SettingValueDto; ThemeToggle/useTheme; SCREEN-08; inline script và key cache theme.
- [Màn/file chưa có khi chạy sớm; kiểm tra còn chờ; rủi ro cache/DB, clipboard; lệch tài liệu nền chưa sửa].

📋 NEXT ACTION:
- Nếu DONE → "SPRINT DONE. Ready for sprint 07, paste next prompt".
- Nếu BLOCKED → "Waiting for user response on X".
- Nếu PARTIAL → "Continue task Y after user confirms".
- Nếu NEED_INPUT → [quyết định/checklist Hyan cần xác nhận để mở gate tiếp theo].

═══════════════════════════════════════════════════════
