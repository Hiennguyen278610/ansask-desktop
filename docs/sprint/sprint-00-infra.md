# SPRINT 00 — HẠ TẦNG


**AC-SIZE — acceptance chung bắt buộc:** mọi task code/config/test phải kiểm tra file ≤~200 dòng và hàm ≤~40 dòng; báo số dòng/file và rà ranh giới hàm trong kết quả task, tách module khi vượt, không nén code để né giới hạn. Mọi acceptance task bên dưới viện dẫn AC-SIZE, gate không pass khi chưa kiểm tra.

**Quy tắc UI bắt buộc:** mọi task UI dùng CSS variables/token light và dark từ Sprint 00; không ghi màu hex trực tiếp trong component hoặc style UI.

## CONTEXT

ansask-desktop là app cá nhân, local-first, dùng Tauri 2 + React 19 + TypeScript + Vite; repo đầu vào còn `App.tsx` demo. Đây là kế hoạch thực thi đợt 5, chưa phải báo cáo app đã chạy hay các kiểm tra đã pass. Mọi công việc triển khai được giao cho **subagent codex**.

## GOAL

Bàn giao khung app mở được ở 1280×800, dùng Tailwind v4 + lucide-react, mở SQLite trong app-data với migration 001 đủ 7 bảng, và vượt qua lint/format/build/test của FE lẫn Rust.

**Package manager chốt: pnpm.** Dùng `pnpm-lock.yaml` và `packageManager` trong package.json; mọi sprint dùng scripts `pnpm build`, `pnpm lint`, `pnpm test` (Vitest run), không trộn lockfile của package manager khác.

## 1. Phạm vi và phụ thuộc

- **Trong phạm vi:** toàn bộ `docs/structure-be.md` §9.1–§9.4: dependency, alias, CSS, scripts, SQLite bundled + migration + pool, chrono-tz, AppError/State, capabilities tối thiểu, cửa sổ, AppShell thay demo, chống nháy theme ở bootstrap, lint/format/test/CI.
- **Ngoài phạm vi:** mọi UC nghiệp vụ, CRUD, import/parser, quiz/chấm điểm, dashboard, thùng rác, command settings, ThemeToggle/persist theme/listener OS, sidebar collapse hoàn chỉnh, auth/cloud, backup, font offline. §9.4 liệt kê test repository/grading/parser/ranh giới kỳ như chiến lược toàn dự án; Sprint 00 chỉ dựng runner và test hạ tầng, không triển khai các feature đó để có test.
- **Phụ thuộc sprint:** không. Điều kiện môi trường: Node/pnpm phù hợp Vite hiện có, Rust/Cargo và thư viện hệ thống để build Tauri 2; cần GUI để nghiệm thu desktop. Kiểm tra thực tế tại S00-T01, không giả định môi trường đã đủ.
- **Truy vết:** không UC/BR/SCREEN nghiệp vụ được triển khai. NFR-01, NFR-03, NFR-06, NFR-12, NFR-14, NFR-16, NFR-17 (`docs/domain-core.md` §9). NFR-06/14 mới bàn giao nền persist/constraint/transaction; NFR-16 mới bàn giao tokens + bootstrap. Nghiệm thu chức năng hoàn chỉnh thuộc các sprint sau.

## 2. Tài liệu nền phải đọc

| Tài liệu | Mục/mã và mục đích |
|---|---|
| `docs/sprint/sprint-prompt-template.md` | Toàn bộ: CONTEXT/GOAL/TASKS/ACCEPTANCE, stop, retry, escalation, handoff |
| `docs/sprint/sprint-plan-summarize.md` | §3 quy ước; §4 bảng sprint; §5 Sprint 00; §8 hợp đồng; §6.5 đối chiếu component nền |
| `docs/structure-be.md` | §1 nguyên tắc/kích thước; §2 stack; §3 cây Rust; §5 DB/PRAGMA/migration/time; §6 AppError/command/type; §8 cây FE; §9 toàn bộ; §11 A1–A10, Q1–Q3 |
| `docs/db.dbml` | Toàn bộ 7 bảng, cột/default/CHECK, FK, indexes và SQL trong Note, phụ lục Q-01/02/03/06/10/15/19/21 |
| `docs/design-system.md` | §1, §2 tokens, §3 layout, §4.1 AppShell, §7 DO/DON'T, §8 ánh xạ; khi viết primitive đọc thêm §4.2–§4.14, §4.52–§4.53 |
| `docs/domain-core.md` | §9: NFR-01/03/06/12/14/16/17; chỉ đối chiếu yêu cầu hạ tầng |

Chỉ tham chiếu `docs/ref-ui.tsx` bằng mã/dòng từ tài liệu nền; không chép code ref-ui. Không sửa tài liệu nền để giải quyết mâu thuẫn.

### Thứ tự áp dụng và điểm lệch đã xử lý

1. Yêu cầu Sprint 00/summary đợt 5 chốt **Tailwind v4** + `@tailwindcss/vite`; không làm theo lệnh cài v3 trong design-system §8.4. Giữ token/thẩm mỹ, chuyển cấu hình sang cú pháp v4. Không ghi version patch/crate chưa verify.
2. Migration lấy **schema hiện tại của `db.dbml`** làm chuẩn: tạo đủ `subjects`, `exams`, `questions`, `answer_options`, `attempts`, `app_settings`, `attempt_answers`, có ngay `delete_batch_id`, `option_order` và ba cột Q-04 trong `attempt_answers`: `question_text TEXT NOT NULL DEFAULT ''`, `options_snapshot TEXT NOT NULL DEFAULT '[]'`, `correct_option_ids TEXT NOT NULL DEFAULT '[]'`; không hoãn hai cột sang Sprint 05 như ghi chú cũ structure-be §5.5.
3. Không tự thêm `deleted_at` cho attempts/questions/options; `attempts.score` theo schema là thang 0–10. Các mô tả khác trong structure-be §5.5/§11 Q3 được ghi vào handoff là lệch tài liệu, không biến thành schema mới. A đã sửa tài liệu nền: descendants ẩn qua cha, batch có từ Sprint 01.
4. `SidebarUtilityButton` được summary §6.5 liệt kê nhưng design-system §3.2/§7/§8.1 đã loại Settings/Power: ghi nhận truy vết, **không dựng lại**. SidebarToggle chỉ là primitive controlled; hành vi collapse app hoàn chỉnh thuộc Sprint 06.
5. Dùng title/brand hiện hữu của repo, không tự đổi thương hiệu. Chưa cần router/Zustand cho một placeholder; giữ slot composition và hoãn quyết định điều hướng tới sprint feature. Có QueryClientProvider theo §2.2, chưa tạo query nghiệp vụ.

## 3. Hợp đồng chốt trước khi chạy song song

Không có hợp đồng từ sprint trước. S00-T01 xác nhận các hợp đồng dưới đây bằng handoff; nếu API dependency thực tế không phù hợp thì điều chỉnh và thông báo trước P2, không để worker tự đổi giao diện.

| Mã | Hợp đồng tạo ra | Bên dùng |
|---|---|---|
| C00-DB | `src-tauri/src/db/pool.rs`: `DbPool` là alias pool r2d2 SQLite; `create_pool(db_path: &Path) -> Result<DbPool, AppError>`, tối đa 4 kết nối, initializer cho mỗi kết nối. Composer tạo thư mục app-data và dùng `ansask.db`. | S00-T07, Sprint 01..07 |
| C00-MIG | `db/migrations.rs`: `run_migrations(conn: &mut rusqlite::Connection) -> Result<(), AppError>`; nạp `db/migrations/001_init.sql`; schema version 1, seed `app_settings` key `theme` value `system`, chạy lại không reset dữ liệu. | S00-T03/S00-T07/S00-T08, Sprint 01..07 |
| C00-STATE | `state.rs`: `AppState { pool: DbPool }`, khởi tạo tường minh sau migration thành công; `.manage(state)` trong setup, command sau này nhận `tauri::State<'_, AppState>`. Không Default mở DB ngầm, không global mutable. | S00-T07, Sprint 01..07 |
| C00-ERR | `error.rs`: `AppError` serialize `{ code, message }`; mã `NotFound`, `DuplicateName`, `Validation`, `Db` theo §6.1. Lỗi pool/migration chuyển thành `Db`, chi tiết kỹ thuật chỉ log; FE có `AppException` bảo toàn code/message hợp lệ và fallback tiếng Việt khi lỗi không đúng cấu trúc. | S00-T03/S00-T06/S00-T07 |
| C00-IPC | `src/lib/tauri/invoke.ts`: `invokeCommand<T>(command: string, args?: Record<string, unknown>): Promise<T>`; một điểm import invoke từ `@tauri-apps/api/core`. `commands.ts` là module skeleton cho DTO/wrapper sau này; chưa export hàm nghiệp vụ giả, chưa đăng ký command mới. Feature chỉ gọi qua `commands.ts`. | Sprint 01..07 |
| C00-UI | `AppShell({ sidebar, children })`, hai slot ReactNode; `Sidebar({ children })` khung tĩnh. BrandLogo dùng tên hiện hữu; ProfileCard mặc định “Người dùng cá nhân”, không ID demo. NavItem/IconButton/SidebarToggle nhận callback + accessible label; không tự invoke. | S00-T04/S00-T05/S00-T07, Sprint 01..07 |
| C00-TOAST | `Toast` nhận message, variant success/error, duration mặc định 2800ms, onClose; BR-56: chỉ một message, message mới thay cũ và timeout chỉ xóa message còn hiện hành; `ToastHost` nhận message/variant/onClose qua props. Wrapper IPC chuẩn hóa rồi reject lỗi; điểm xử lý UI duy nhất đưa lỗi vào host, không toast hai lần. Sprint 00 không tạo command để kích toast. | S00-T04/S00-T05/S00-T06, sprint feature |
| C00-PRIM | Card/InsetPanel/ScrollArea nhận children/className; Pill (Chip là tên truy vết) nhận variant/children; IconButton nhận icon/label/disabled/onClick; PrimaryActionButton nhận children/type/disabled/onClick; ModalShell nhận open/onClose/title/describedBy/footer/children theo design-system §8.3. | S00-T04/S00-T05, Sprint 01..07 |
| C00-TIME | UTC TEXT chuẩn `YYYY-MM-DDTHH:mm:ss.sssZ`; `utils/time.rs` cung cấp now_utc/to_hcm, `src/lib/time.ts` cung cấp formatDateTime với timeZone `Asia/Ho_Chi_Minh`; uuid v7 ở `utils/ids.rs`. Chưa tính kỳ thống kê. | Sprint 01..07 |
| C00-THEME | `src/index.css` import Tailwind đầu tiên; `styles/tokens.css` định nghĩa đủ CSS variables cho `:root` (light) và `.dark` (dark); Tailwind v4 khai báo `@custom-variant dark (&:where(.dark, .dark *));`. Mọi task UI dùng token, không hex trực tiếp ngoài file định nghĩa token. Inline bootstrap trước React đọc `theme` (light/dark/system), fallback OS khi thiếu/sai hoặc storage lỗi. SQLite là nguồn thật ở Sprint 06; hiện chưa ghi cache/setting bằng UI. | S00-T04/S00-T07, Sprint 06 |
| C00-CHECK | `pnpm lint`, `pnpm format`, `pnpm format:check`, `pnpm test` (Vitest run, không watch), `pnpm test:watch`, `pnpm build`, `pnpm tauri dev`; Rust fmt/clippy/build/test. CI gọi cùng bộ lệnh, dùng lockfile. | S00-T07..S00-T10, Sprint 01..07 |

**DB bắt buộc:** `foreign_keys=ON`, `busy_timeout=5000`, `synchronous=NORMAL` trên từng connection; DB file dùng WAL. SQLite in-memory có journal_mode=memory, không ép test phải trả WAL. Migration xong trước khi app sẵn sàng; lỗi mở DB/migration phải làm startup thất bại rõ ràng, không fallback DB rỗng. Unit of Work dùng một connection/transaction truyền xuyên thao tác nhiều bước, không lấy connection khác giữa transaction.

**Version gate:** S00-T01 xác minh registry/tài liệu chính thức, ngày kiểm tra, phiên bản Node/pnpm/Rust/MSRV và compatibility; đặc biệt bộ rusqlite/rusqlite_migration/r2d2_sqlite phải dùng được cùng libsqlite3-sys. Danh sách được phép gồm stack §2/§9: Tailwind v4/plugin, lucide-react, Query; rusqlite bundled, migration, r2d2/r2d2_sqlite, thiserror, uuid v7, chrono/chrono-tz, rand, tracing/subscriber, serde/serde_json; ESLint/typescript-eslint/react-hooks, Prettier, Vitest và peer dependencies bắt buộc được ghi rõ. Không cài router/Zustand/specta/SQL plugin mới. S00-T07 là người duy nhất sửa manifest/lockfile sau khi version gate pass.

## 4. TASKS — đồ thị, quyền sở hữu file và gate

```text
P1: S00-T01 Chốt hợp đồng + kiểm chứng version (read-only)
    └── G1: hợp đồng/API, version, ownership đủ rõ
P2: S00-T02 Migration ───────┐
    S00-T03 Pool/Rust core ──┤
    S00-T04 CSS/primitives ──┼── G2: review sản phẩm từng nhánh, khớp hợp đồng
    S00-T05 Shell ──────────┤
    S00-T06 IPC/time FE ─────┘
P3: S00-T07 Tích hợp duy nhất (manifest/config/lib.rs/mod.rs/App/main/CI)
    └── G3: compile/lint/format + startup smoke sau nối toàn bộ nhánh
P4: S00-T08 Test DB/Rust ────┐
    S00-T09 Test FE ─────────┴── G4: test hạ tầng thực sự chạy và pass
P5: S00-T10 Kiểm thử tổng + nghiệm thu
    └── G5: mọi lệnh pass + Hyan ký checklist desktop → SPRINT DONE
```

P2 có các task độc lập về file, không phụ thuộc hoàn thành nhau: chỉ dùng API đã chốt. Nếu số slot ít hơn số task thì xếp hàng trong cùng wave, vẫn không vượt gate. S00-T07 phụ thuộc toàn bộ P2; S00-T08/S00-T09 phụ thuộc S00-T07; S00-T10 phụ thuộc cả S00-T08 và S00-T09. Đường găng là S00-T01 → nhánh P2 chậm nhất → S00-T07 → nhánh P4 chậm nhất → S00-T10.

Chỉ S00-T07 sửa file dùng chung: manifests/lockfiles/config, `lib.rs`, mọi `mod.rs`, `index.html`, `App.tsx`, `main.tsx`, routes nếu có (sprint này không tạo route). Không chạy formatter toàn repo trong wave song song; task chỉ format file mình sở hữu. Sau gate quyền sửa lỗi quay về chủ file, chạy tuần tự nếu chạm file chung. Gate do codex kiểm tra; không cần Hyan duyệt lại các lựa chọn đã chốt. Từng task tối đa 30 phút ước tính; nếu lớn hơn phải chia task con với ownership/gate rõ trước khi triển khai.

### S00-T01 — Chốt hợp đồng và kiểm chứng phiên bản

- **Mục tiêu:** Loại bỏ giả định version/API trước khi giao nhánh độc lập.
- **Thực thi bởi:** subagent codex.
- **Nhóm chạy:** P1 — tuần tự.
- **Phụ thuộc:** Không.
- **Phạm vi file:** Read-only toàn repo và tài liệu; không sửa file.
- **UC/BR/component/command/bảng liên quan:** NFR-01/03/12/17; C00-*; structure-be §1/2/9/11; không command/bảng được sửa.

**Prompt giao cho codex (tự chứa; gửi kèm nguyên khối quy ước dưới đây):**

Bạn là subagent codex lập nền cho ansask-desktop, chưa triển khai feature. Đọc toàn bộ danh sách §2 của sprint này và hợp đồng §3; kiểm tra package.json, Cargo.toml, lockfile, config và khả năng build hiện tại.
1. Đối chiếu schema/stack với các điểm lệch đã xử lý; xác nhận ownership S00-T02..S00-T09.
2. Tra registry/tài liệu chính thức để xác minh version và API, không dùng số minh họa §9.2 làm kết quả đã kiểm chứng. Dùng cargo search/info và pnpm view; kiểm tra MSRV, peer dependencies, r2d2_sqlite/migration/rusqlite cùng native SQLite.
3. Trả handoff bảng dependency → version chọn → nguồn → ngày verify → compatibility/toolchain; chốt API/props C00-* cho các worker. Kiểm tra prerequisites Linux/macOS/Windows phù hợp host, ghi blocker cụ thể.
4. Không sửa manifest, không cài feature, không đổi tài liệu. Nếu registry không truy cập được, báo BLOCKED version gate, không đoán version. Tự kiểm tra không có quyết định chưa chốt ảnh hưởng P2.

> **Quy ước bắt buộc trong prompt:** Mọi công việc triển khai do `subagent codex` thực hiện. Tuân thủ nhóm chạy/phụ thuộc và phạm vi file của task; không giao trùng file giữa task song song. Chốt hợp đồng trước song song; file dùng chung (`lib.rs`/`invoke_handler`, `mod.rs`, routes, `index.html`, config) chỉ do task tích hợp S00-T07 sửa sau P2. Sau mỗi wave có gate tổng; cuối sprint có task kiểm thử/nghiệm thu codex và checklist Hyan. Phân tầng `commands → services → repositories → db`, DI qua `tauri::State`, Unit of Work cho ghi nhiều bước; file Rust/TS ≤ ~200 dòng, hàm ≤ ~40 dòng; DRY/SOLID. Dùng Tailwind v4 + lucide-react; lưu UTC, hiển thị Asia/Ho_Chi_Minh; schema qua migration đánh số; test Rust SQLite in-memory. Không thêm feature nghiệp vụ, không sửa tài liệu nền, không chép code ref-ui; không thêm dependency ngoài danh sách. Chỉ viết test khi task yêu cầu rõ. Tối đa 2 lần thử, lần sau phải đổi approach; báo lỗi còn lại theo HANDOFF FORMAT, không tuyên bố pass khi chưa chạy.

**Tiêu chí chấp nhận:** AC-SIZE; G1 có bảng version có nguồn, danh sách file và API chốt; các điểm lệch được ghi; không phát sinh file.

**Lệnh kiểm tra:** `node --version`, `pnpm --version`, `rustc --version`, `cargo --version`; `pnpm view <package> version engines peerDependencies`; `cargo search <crate> --limit 3`; `cargo info <crate>@<version>` (thay placeholder bằng kết quả thật).

### S00-T02 — Viết migration 001

- **Mục tiêu:** Tạo schema chuẩn 7 bảng và runner migration tái chạy an toàn.
- **Thực thi bởi:** subagent codex.
- **Nhóm chạy:** P2 — song song.
- **Phụ thuộc:** S00-T01/G1.
- **Phạm vi file:** `src-tauri/src/db/migrations.rs`, `src-tauri/src/db/migrations/001_init.sql`.
- **UC/BR/component/command/bảng liên quan:** C00-MIG/ERR; NFR-06/14; structure-be §3/5/9.2; db.dbml toàn bộ 7 bảng, FK/index/Note.

**Prompt giao cho codex (tự chứa; gửi kèm nguyên khối quy ước dưới đây):**

Bạn là subagent codex phụ trách schema SQLite cho app cá nhân Tauri 2. Đọc docs/db.dbml toàn bộ, docs/structure-be.md §1/2/3/5/9/11 và docs/sprint/sprint-plan-summarize.md §3/5 Sprint 00/8; dùng C00-MIG/ERR và version handoff G1.
1. Chuyển schema sang SQL SQLite chuẩn, gồm mọi default/CHECK/unique/index/FK và SQL partial index nằm trong Note; có delete_batch_id, selected_option_ids, option_order; thêm rõ question_text, options_snapshot, correct_option_ids vào attempt_answers ngay migration 001 (Q-04/BR-81), và seed theme=system.
2. Giữ FK RESTRICT/CASCADE/SET NULL đúng từng quan hệ; không thêm users, bảng quiz session, cột deleted_at ngoài schema, constraint một đáp án đúng hay giới hạn 200 câu.
3. Viết runner rusqlite_migration với include SQL, chạy tới version 1; để library quản lý transaction/version, không tự lồng BEGIN trong migration. Không ghi đè seed đã chỉnh khi chạy lại.
4. Không sửa mod.rs/Cargo/error.rs; dùng API đã chốt. Tự đối chiếu tên cột thật (questions.ask, điểm 0–10), không suy từ DTO minh họa. Handoff danh sách bảng/index/FK và SQL kiểm tra cho S00-T08; kiểm thử tự động thuộc S00-T08.

> **Quy ước bắt buộc trong prompt:** Mọi công việc triển khai do `subagent codex` thực hiện. Tuân thủ nhóm chạy/phụ thuộc và phạm vi file của task; không giao trùng file giữa task song song. Chốt hợp đồng trước song song; file dùng chung (`lib.rs`/`invoke_handler`, `mod.rs`, routes, `index.html`, config) chỉ do task tích hợp S00-T07 sửa sau P2. Sau mỗi wave có gate tổng; cuối sprint có task kiểm thử/nghiệm thu codex và checklist Hyan. Phân tầng `commands → services → repositories → db`, DI qua `tauri::State`, Unit of Work cho ghi nhiều bước; file Rust/TS ≤ ~200 dòng, hàm ≤ ~40 dòng; DRY/SOLID. Dùng Tailwind v4 + lucide-react; lưu UTC, hiển thị Asia/Ho_Chi_Minh; schema qua migration đánh số; test Rust SQLite in-memory. Không thêm feature nghiệp vụ, không sửa tài liệu nền, không chép code ref-ui; không thêm dependency ngoài danh sách. Chỉ viết test khi task yêu cầu rõ. Tối đa 2 lần thử, lần sau phải đổi approach; báo lỗi còn lại theo HANDOFF FORMAT, không tuyên bố pass khi chưa chạy.

**Tiêu chí chấp nhận:** AC-SIZE; 7 bảng đúng schema, gồm ba cột snapshot Q-04 với default/type đúng; partial unique theo lower(trim(...)) và chỉ bản sống; 001 được nhúng vào binary; runner không xóa dữ liệu và propagate lỗi.

**Lệnh kiểm tra:** G2 review SQL đối chiếu db.dbml; sau S00-T07: `cargo check --manifest-path src-tauri/Cargo.toml`; sau S00-T08: `cargo test --manifest-path src-tauri/Cargo.toml --test infra_schema`.

### S00-T03 — Dựng pool và lõi Rust

- **Mục tiêu:** Cung cấp connection pool, lỗi, State và utility UTC/ID cho composer.
- **Thực thi bởi:** subagent codex.
- **Nhóm chạy:** P2 — song song.
- **Phụ thuộc:** S00-T01/G1.
- **Phạm vi file:** `src-tauri/src/db/pool.rs`, `src-tauri/src/error.rs`, `src-tauri/src/state.rs`, `src-tauri/src/utils/time.rs`, `src-tauri/src/utils/ids.rs`.
- **UC/BR/component/command/bảng liên quan:** C00-DB/STATE/ERR/TIME; NFR-01/06/12/14; structure-be §1/2/3/5/6.1/9.2; DB dùng cả 7 bảng, không query nghiệp vụ.

**Prompt giao cho codex (tự chứa; gửi kèm nguyên khối quy ước dưới đây):**

Bạn là subagent codex làm lõi Rust của ansask-desktop. Đọc docs/structure-be.md §1/2/3/5/6/9/11, docs/db.dbml quy ước chung, docs/sprint/sprint-plan-summarize.md §3/5 Sprint 00/8; áp dụng API C00-DB/STATE/ERR/TIME đã chốt ở G1.
1. Viết pool max 4, initializer cấu hình FK/busy_timeout/synchronous cho từng kết nối, WAL cho file; không hardcode home/cwd làm app-data.
2. Viết AppError Serialize code/message với thiserror; map lỗi connection/pool/migration mà không lộ SQL/path trong thông báo UI. State chỉ giữ pool, constructor nhận pool đã sẵn sàng.
3. Viết helper UTC với mili-giây + Z, chuyển chrono-tz Asia/Ho_Chi_Minh và uuid v7; chưa làm statistics boundaries.
4. Không gọi Tauri từ lớp DB/utils, không mở DB trong Default/global, không tạo service/repo nghiệp vụ hay tự chạy migration trên mỗi connection. Handoff cách composer lấy connection để migrate một lần trước manage State. Tự review failure propagation và khả năng dùng transaction cùng connection; test do S00-T08 viết.

> **Quy ước bắt buộc trong prompt:** Mọi công việc triển khai do `subagent codex` thực hiện. Tuân thủ nhóm chạy/phụ thuộc và phạm vi file của task; không giao trùng file giữa task song song. Chốt hợp đồng trước song song; file dùng chung (`lib.rs`/`invoke_handler`, `mod.rs`, routes, `index.html`, config) chỉ do task tích hợp S00-T07 sửa sau P2. Sau mỗi wave có gate tổng; cuối sprint có task kiểm thử/nghiệm thu codex và checklist Hyan. Phân tầng `commands → services → repositories → db`, DI qua `tauri::State`, Unit of Work cho ghi nhiều bước; file Rust/TS ≤ ~200 dòng, hàm ≤ ~40 dòng; DRY/SOLID. Dùng Tailwind v4 + lucide-react; lưu UTC, hiển thị Asia/Ho_Chi_Minh; schema qua migration đánh số; test Rust SQLite in-memory. Không thêm feature nghiệp vụ, không sửa tài liệu nền, không chép code ref-ui; không thêm dependency ngoài danh sách. Chỉ viết test khi task yêu cầu rõ. Tối đa 2 lần thử, lần sau phải đổi approach; báo lỗi còn lại theo HANDOFF FORMAT, không tuyên bố pass khi chưa chạy.

**Tiêu chí chấp nhận:** AC-SIZE; Pool init mọi connection; State inject được; lỗi và timestamp đúng hợp đồng; không truy cập DB thật khi compile.

**Lệnh kiểm tra:** G2 review source và API; sau S00-T07: `cargo check --manifest-path src-tauri/Cargo.toml`; sau S00-T08: `cargo test --manifest-path src-tauri/Cargo.toml --test infra_pool --test infra_utils`.

### S00-T04 — Tạo tokens và primitive UI

- **Mục tiêu:** Cung cấp CSS Tailwind v4 và primitive tái sử dụng theo design-system.
- **Thực thi bởi:** subagent codex.
- **Nhóm chạy:** P2 — song song.
- **Phụ thuộc:** S00-T01/G1.
- **Phạm vi file:** `src/index.css`, `src/styles/tokens.css`, `src/styles/neumorphic.css`; `src/components/ui/{Card,InsetPanel,Pill,IconButton,PrimaryActionButton,ScrollArea,Toast,ModalShell}.tsx`.
- **UC/BR/component/command/bảng liên quan:** C00-UI/PRIM/TOAST/THEME; NFR-16 nền; design-system §1/2/4.7–4.14/4.52–4.53/7/8; structure-be §8/9.1; không command/bảng.

**Prompt giao cho codex (tự chứa; gửi kèm nguyên khối quy ước dưới đây):**

Bạn là subagent codex dựng nền giao diện React 19, không dựng màn nghiệp vụ. Đọc docs/design-system.md §1/2/3/4.1/7/8 và mục primitive tương ứng; docs/structure-be.md §1/2/8/9; docs/sprint/sprint-plan-summarize.md §3/5 Sprint 00/8; dùng C00-PRIM/TOAST/THEME.
1. Định nghĩa tokens light/dark, font fallback theo spec, shadow hai chiều, radius/spacing; ánh xạ @theme/custom dark variant theo Tailwind v4 và import CSS đúng thứ tự. Không dùng config/lệnh Tailwind v3 hoặc chép ref-ui.
2. Viết primitive từng file theo props chốt: label cho icon, disabled/type cho button, Toast role/status và dọn timeout, ModalShell semantic dialog với đóng/focus phù hợp; không làm dialog nghiệp vụ.
3. Không tạo font download/offline packaging, không tự thêm thư viện utility hay modal. Không sửa main/App/Vite/package/index.html; handoff imports cho S00-T07.
4. Tự review CSS không cắt overlay, token không hardcode lặp trong JSX, primitive không chứa invoke. Test hành vi do S00-T09 đảm nhận.

> **Quy ước bắt buộc trong prompt:** Mọi công việc triển khai do `subagent codex` thực hiện. Tuân thủ nhóm chạy/phụ thuộc và phạm vi file của task; không giao trùng file giữa task song song. Chốt hợp đồng trước song song; file dùng chung (`lib.rs`/`invoke_handler`, `mod.rs`, routes, `index.html`, config) chỉ do task tích hợp S00-T07 sửa sau P2. Sau mỗi wave có gate tổng; cuối sprint có task kiểm thử/nghiệm thu codex và checklist Hyan. Phân tầng `commands → services → repositories → db`, DI qua `tauri::State`, Unit of Work cho ghi nhiều bước; file Rust/TS ≤ ~200 dòng, hàm ≤ ~40 dòng; DRY/SOLID. Dùng Tailwind v4 + lucide-react; lưu UTC, hiển thị Asia/Ho_Chi_Minh; schema qua migration đánh số; test Rust SQLite in-memory. Không thêm feature nghiệp vụ, không sửa tài liệu nền, không chép code ref-ui; không thêm dependency ngoài danh sách. Chỉ viết test khi task yêu cầu rõ. Tối đa 2 lần thử, lần sau phải đổi approach; báo lỗi còn lại theo HANDOFF FORMAT, không tuyên bố pass khi chưa chạy.

**Tiêu chí chấp nhận:** AC-SIZE; Các primitive export được, props đúng; CSS v4 có light/dark, icon lucide, nút có nhãn; không có UI nghiệp vụ hoặc Settings/Power.

**Lệnh kiểm tra:** G2 kiểm tra import/props/tokens; sau S00-T07: `pnpm exec tsc --noEmit`, `pnpm lint`, `pnpm build`.

### S00-T05 — Tạo AppShell và chrome tĩnh

- **Mục tiêu:** Cung cấp khung sidebar/main để thay demo qua task tích hợp.
- **Thực thi bởi:** subagent codex.
- **Nhóm chạy:** P2 — song song.
- **Phụ thuộc:** S00-T01/G1; chỉ dùng hợp đồng S00-T04, không đợi file S00-T04 để thiết kế.
- **Phạm vi file:** `src/components/layout/{AppShell,Sidebar,BrandLogo,SidebarToggle,ProfileCard,NavItem,ToastHost}.tsx`.
- **UC/BR/component/command/bảng liên quan:** C00-UI/PRIM/TOAST; design-system §3/4.1–4.6/8; summary §6.5; không SCREEN/UC/command nghiệp vụ.

**Prompt giao cho codex (tự chứa; gửi kèm nguyên khối quy ước dưới đây):**

Bạn là subagent codex làm shell React 19 cho ứng dụng cá nhân. Đọc docs/design-system.md §1/2/3/4.1–4.6/7/8, docs/structure-be.md §1/8/9.3, docs/sprint/sprint-plan-summarize.md §3/5 Sprint 00/6.5/8; giữ props C00-UI/TOAST.
1. Viết AppShell với slot sidebar/children, landmark aside/main, sidebar mở 256px và main co giãn; document cuộn, không overflow-hidden root cắt overlay.
2. Tách brand/profile/nav/controlled toggle; tên người dùng mặc định cá nhân, không tài khoản/ID giả. Nav nhận props, chưa nối route hoặc action nghiệp vụ; không dựng Settings/Power.
3. ToastHost composition của Toast theo hợp đồng, chưa tạo notification nghiệp vụ. SidebarToggle chưa nối tính năng collapse hoàn chỉnh; để Sprint 06.
4. Không sửa App.tsx/main.tsx/config, không tạo SCREEN hay breadcrumb feature; S00-T07 sẽ mount shell với placeholder. Tự kiểm tra phụ thuộc chỉ vào props/primitive, không import invoke; layout phải chứa được cửa sổ tối thiểu 1024px.

> **Quy ước bắt buộc trong prompt:** Mọi công việc triển khai do `subagent codex` thực hiện. Tuân thủ nhóm chạy/phụ thuộc và phạm vi file của task; không giao trùng file giữa task song song. Chốt hợp đồng trước song song; file dùng chung (`lib.rs`/`invoke_handler`, `mod.rs`, routes, `index.html`, config) chỉ do task tích hợp S00-T07 sửa sau P2. Sau mỗi wave có gate tổng; cuối sprint có task kiểm thử/nghiệm thu codex và checklist Hyan. Phân tầng `commands → services → repositories → db`, DI qua `tauri::State`, Unit of Work cho ghi nhiều bước; file Rust/TS ≤ ~200 dòng, hàm ≤ ~40 dòng; DRY/SOLID. Dùng Tailwind v4 + lucide-react; lưu UTC, hiển thị Asia/Ho_Chi_Minh; schema qua migration đánh số; test Rust SQLite in-memory. Không thêm feature nghiệp vụ, không sửa tài liệu nền, không chép code ref-ui; không thêm dependency ngoài danh sách. Chỉ viết test khi task yêu cầu rõ. Tối đa 2 lần thử, lần sau phải đổi approach; báo lỗi còn lại theo HANDOFF FORMAT, không tuyên bố pass khi chưa chạy.

**Tiêu chí chấp nhận:** AC-SIZE; Shell/chrome tĩnh đúng tên và slot, không chứa demo Tauri hay dữ liệu nghiệp vụ; file độc lập S00-T04/S00-T06; sẵn sàng tích hợp.

**Lệnh kiểm tra:** G2 review props/ownership; sau S00-T07: `pnpm exec tsc --noEmit`, `pnpm build`; kiểm tra resize thủ công ở G5.

### S00-T06 — Dựng IPC wrapper và thời gian FE

- **Mục tiêu:** Tạo điểm gọi Tauri thống nhất và formatter múi giờ cố định.
- **Thực thi bởi:** subagent codex.
- **Nhóm chạy:** P2 — song song.
- **Phụ thuộc:** S00-T01/G1.
- **Phạm vi file:** `src/lib/tauri/invoke.ts`, `src/lib/tauri/commands.ts`, `src/lib/time.ts`.
- **UC/BR/component/command/bảng liên quan:** C00-IPC/ERR/TIME; structure-be §1.1/5.4/6/8; summary §8; không đăng ký command/bảng mới.

**Prompt giao cho codex (tự chứa; gửi kèm nguyên khối quy ước dưới đây):**

Bạn là subagent codex dựng ranh giới FE/BE cho Tauri 2 React 19. Đọc docs/structure-be.md §1/5.4/6/8/9, docs/sprint/sprint-plan-summarize.md §3/5 Sprint 00/8, docs/db.dbml quy ước thời gian; dùng C00-IPC/ERR/TIME.
1. Viết invokeCommand generic từ @tauri-apps/api/core, giữ args/result, chuẩn hóa reject thành AppException code/message; lỗi lạ có fallback tiếng Việt. Không swallow/retry ngầm, không trả success giả khi chạy browser ngoài Tauri.
2. Tạo commands.ts skeleton có ghi chú nơi mirror DTO Rust/TS và quy tắc feature chỉ import tại đây; không tạo trước 27 DTO/command, không health-check command tự phát.
3. Viết formatDateTime dùng Intl với Asia/Ho_Chi_Minh rõ ràng, xử lý input UTC không hợp lệ có quy ước lỗi nhất quán. Không tính kỳ thống kê hoặc dùng timezone hệ điều hành.
4. Không sửa component/config, không tạo toast trùng ở wrapper và consumer. Handoff test cases success/error/UTC đổi ngày cho S00-T09; tự kiểm tra không có invoke trực tiếp ngoài wrapper.

> **Quy ước bắt buộc trong prompt:** Mọi công việc triển khai do `subagent codex` thực hiện. Tuân thủ nhóm chạy/phụ thuộc và phạm vi file của task; không giao trùng file giữa task song song. Chốt hợp đồng trước song song; file dùng chung (`lib.rs`/`invoke_handler`, `mod.rs`, routes, `index.html`, config) chỉ do task tích hợp S00-T07 sửa sau P2. Sau mỗi wave có gate tổng; cuối sprint có task kiểm thử/nghiệm thu codex và checklist Hyan. Phân tầng `commands → services → repositories → db`, DI qua `tauri::State`, Unit of Work cho ghi nhiều bước; file Rust/TS ≤ ~200 dòng, hàm ≤ ~40 dòng; DRY/SOLID. Dùng Tailwind v4 + lucide-react; lưu UTC, hiển thị Asia/Ho_Chi_Minh; schema qua migration đánh số; test Rust SQLite in-memory. Không thêm feature nghiệp vụ, không sửa tài liệu nền, không chép code ref-ui; không thêm dependency ngoài danh sách. Chỉ viết test khi task yêu cầu rõ. Tối đa 2 lần thử, lần sau phải đổi approach; báo lỗi còn lại theo HANDOFF FORMAT, không tuyên bố pass khi chưa chạy.

**Tiêu chí chấp nhận:** AC-SIZE; Wrapper bảo toàn type/result và lỗi; commands.ts skeleton build được; formatter độc lập OS timezone; không command giả.

**Lệnh kiểm tra:** G2 review API/error contract; sau S00-T07: `pnpm exec tsc --noEmit`; `rg -n "@tauri-apps/api/core|invoke\(" src` chỉ cho phép wrapper và test mock tương ứng.

### S00-T07 — Tích hợp manifest, startup, shell và CI

- **Mục tiêu:** Nối toàn bộ hạ tầng thành app chạy và bộ lệnh tái lập được.
- **Thực thi bởi:** subagent codex.
- **Nhóm chạy:** P3 — tuần tự, một codex.
- **Phụ thuộc:** S00-T02..S00-T06/G2.
- **Phạm vi file:** `package.json`, `pnpm-lock.yaml`, `vite.config.ts`, `tsconfig*.json`, `eslint.config.js`, `.prettierrc`, `.prettierignore`, `vitest.config.ts`, `.github/workflows/ci.yml`, `src-tauri/Cargo.toml`, `src-tauri/Cargo.lock`, `src-tauri/tauri.conf.json`, `src-tauri/capabilities/default.json`, `src-tauri/src/lib.rs`, `src-tauri/src/main.rs` (nếu cần), mọi `src-tauri/src/**/mod.rs` cần cho hạ tầng, `src/main.tsx`, `src/App.tsx`, `src/App.css`, `index.html`; chỉ thêm `rust-toolchain.toml` nếu G1 đã chốt pin.
- **UC/BR/component/command/bảng liên quan:** C00-*; toàn bộ structure-be §9.1–9.4; AppShell; NFR-01/03/06/12/14/16/17; 7 bảng qua migration, không command nghiệp vụ.

**Prompt giao cho codex (tự chứa; gửi kèm nguyên khối quy ước dưới đây):**

Bạn là subagent codex tích hợp duy nhất sau khi các nhánh hạ tầng đã giao file. Đọc docs/structure-be.md §1/2/3/5/6/8/9/11, docs/design-system.md §2/3/4.1/7/8, docs/sprint/sprint-plan-summarize.md §3/5 Sprint 00/8, schema docs/db.dbml; nhận G1 và handoff S00-T02..S00-T06.
1. Chỉ ghi phiên bản đã verify; thêm các dependency được phép, giải quyết native SQLite compatibility, cập nhật lockfiles. Cấu hình Tailwind v4 Vite plugin và alias @/* ở Vite/TS; cài QueryClientProvider, chưa dùng router/Zustand.
2. Nối mod.rs/re-export/lib.rs: tạo app-data, mở ansask.db, lấy connection chạy migration, log version, sau thành công manage AppState. Dọn greet/demo/invoke_handler demo, không đăng ký command nghiệp vụ. Khởi tạo tracing một lần.
3. Thay App demo bằng AppShell + Sidebar + placeholder trung tính, nối CSS từ main, gỡ CSS demo đang áp dụng. Window 1280×800, minWidth 1024, minHeight 700 theo design-system §8.4; giữ identifier com.hyanhasta05.ansask-desktop và brand hiện hữu.
4. Audit capabilities theo cửa sổ thực tế: giữ core cần dùng và tauri-plugin-opener (Rust + JS dependency, đăng ký plugin) cùng capabilities opener:default cho link AI Guide Sprint 06; không gỡ opener khi bỏ demo; không thêm FS/SQL/shell/network quyền rộng. Bootstrap theme trong index.html trước module React, cache localStorage key `theme` với try/catch và fallback OS; chưa đọc/ghi DB settings hay làm ThemeToggle.
5. Thêm ESLint TypeScript/react-hooks, Prettier, Vitest chế độ run và scripts C00-CHECK; format:check chỉ vùng mã/config sở hữu, không buộc format lại tài liệu nền. Cấu hình CI cài prerequisite Tauri trên runner, dùng frozen pnpm lock/Cargo --locked; fmt, clippy all-targets -D warnings, build/test. Không thêm test giả/no-test-pass để che runner rỗng.
6. Export API hạ tầng cần thiết từ lib/module để S00-T08 dùng integration tests qua tên lib crate thực tế trong Cargo.toml; không tạo placeholder test hoặc sửa file test thuộc S00-T08. Tự kiểm tra compile/lint/format/startup; G3 chưa được coi là G4 vì test hạ tầng chưa viết. Không sửa file nhánh khác để tiện fix; trả lỗi về chủ file theo quy trình tuần tự.

> **Quy ước bắt buộc trong prompt:** Mọi công việc triển khai do `subagent codex` thực hiện. Tuân thủ nhóm chạy/phụ thuộc và phạm vi file của task; không giao trùng file giữa task song song. Chốt hợp đồng trước song song; file dùng chung (`lib.rs`/`invoke_handler`, `mod.rs`, routes, `index.html`, config) chỉ do task tích hợp S00-T07 sửa sau P2. Sau mỗi wave có gate tổng; cuối sprint có task kiểm thử/nghiệm thu codex và checklist Hyan. Phân tầng `commands → services → repositories → db`, DI qua `tauri::State`, Unit of Work cho ghi nhiều bước; file Rust/TS ≤ ~200 dòng, hàm ≤ ~40 dòng; DRY/SOLID. Dùng Tailwind v4 + lucide-react; lưu UTC, hiển thị Asia/Ho_Chi_Minh; schema qua migration đánh số; test Rust SQLite in-memory. Không thêm feature nghiệp vụ, không sửa tài liệu nền, không chép code ref-ui; không thêm dependency ngoài danh sách. Chỉ viết test khi task yêu cầu rõ. Tối đa 2 lần thử, lần sau phải đổi approach; báo lỗi còn lại theo HANDOFF FORMAT, không tuyên bố pass khi chưa chạy.

**Tiêu chí chấp nhận:** AC-SIZE; giữ tauri-plugin-opener + capabilities opener:default để Sprint 06 dùng; G3 app compile/start được, DB migration trước State; config/window/capabilities đúng; CI và scripts thật; lockfile tái lập; không feature mới.

**Lệnh kiểm tra:** `pnpm install --frozen-lockfile`, `pnpm lint`, `pnpm format:check`, `pnpm build`; `cargo check --locked --manifest-path src-tauri/Cargo.toml`; `cargo tree --manifest-path src-tauri/Cargo.toml -d`; `cargo fmt --manifest-path src-tauri/Cargo.toml -- --check`; `pnpm tauri dev` (GUI smoke).

### S00-T08 — Kiểm thử migration, pool và utility Rust

- **Mục tiêu:** Chứng minh schema, transaction và khởi tạo DB bằng test hạ tầng thực.
- **Thực thi bởi:** subagent codex.
- **Nhóm chạy:** P4 — song song.
- **Phụ thuộc:** S00-T07/G3.
- **Phạm vi file:** `src-tauri/tests/{infra_schema,infra_constraints,infra_pool,infra_utils}.rs`, `src-tauri/tests/common/mod.rs` (chỉ helper test, thuộc S00-T08, không là mod.rs production dùng chung).
- **UC/BR/component/command/bảng liên quan:** C00-DB/MIG/ERR/TIME; NFR-06/14; db.dbml toàn bộ schema/FK/index; structure-be §5/9.4; không test service chưa tồn tại.

**Prompt giao cho codex (tự chứa; gửi kèm nguyên khối quy ước dưới đây):**

Bạn là subagent codex kiểm thử Rust cho nền Tauri/SQLite; không viết feature. Đọc docs/db.dbml toàn bộ, docs/structure-be.md §1/3/5/9.4, docs/sprint/sprint-plan-summarize.md §3/5 Sprint 00/8 và hợp đồng C00-DB/MIG/ERR/TIME.
1. Viết test integration gọi API production qua lib crate; SQLite :memory: chạy migration thật. Kiểm tra đủ 7 bảng, columns/default/nullability/CHECK, FK và indexes (kể cả partial expressions), version=1, seed theme=system; chạy lần hai không xóa fixture và không reset theme đã đổi.
2. Fixture tối thiểu chứng minh FK từ chối orphan, RESTRICT/CASCADE/SET NULL đúng schema, unique tên active sau lower(trim), tên của bản đã xóa không chiếm chỗ, unique position, bool/score/count bounds; nhiều option đúng vẫn được. Không giả định SQLite lower xử lý đầy đủ Unicode ngoài hành vi DB đã chốt.
3. Test transaction rollback khi một bước ghi thất bại; khẳng định không còn dữ liệu ghi dở. Dùng cùng connection cho :memory:, không coi các connection :memory: riêng là cùng DB.
4. Test initializer production trên nhiều connection cùng giữ đồng thời: FK/timeout/synchronous, và test WAL/reopen persist bằng file tạm cô lập dưới temp-dir cho trường hợp không thể kiểm tra in-memory; dọn file sau drop pool, tuyệt đối không chạm ansask.db thật. Không thêm crate test ngoài danh sách nếu chưa được duyệt.
5. Test UTC mili-giây/Z, to_hcm đổi ngày, UUID v7, AppError serialized contract; startup/open path lỗi propagate. Không viết grading/parser/repo feature. Tự chạy bộ test, báo cả số test và failure; nếu API chưa public yêu cầu S00-T07 sửa tuần tự, không tự sửa lib/mod/config.

> **Quy ước bắt buộc trong prompt:** Mọi công việc triển khai do `subagent codex` thực hiện. Tuân thủ nhóm chạy/phụ thuộc và phạm vi file của task; không giao trùng file giữa task song song. Chốt hợp đồng trước song song; file dùng chung (`lib.rs`/`invoke_handler`, `mod.rs`, routes, `index.html`, config) chỉ do task tích hợp S00-T07 sửa sau P2. Sau mỗi wave có gate tổng; cuối sprint có task kiểm thử/nghiệm thu codex và checklist Hyan. Phân tầng `commands → services → repositories → db`, DI qua `tauri::State`, Unit of Work cho ghi nhiều bước; file Rust/TS ≤ ~200 dòng, hàm ≤ ~40 dòng; DRY/SOLID. Dùng Tailwind v4 + lucide-react; lưu UTC, hiển thị Asia/Ho_Chi_Minh; schema qua migration đánh số; test Rust SQLite in-memory. Không thêm feature nghiệp vụ, không sửa tài liệu nền, không chép code ref-ui; không thêm dependency ngoài danh sách. Chỉ viết test khi task yêu cầu rõ. Tối đa 2 lần thử, lần sau phải đổi approach; báo lỗi còn lại theo HANDOFF FORMAT, không tuyên bố pass khi chưa chạy.

**Tiêu chí chấp nhận:** AC-SIZE; Test có assertion thực và fail nếu bỏ migration/FK/unique/rollback; không dùng DB người dùng; pool kiểm chứng nhiều connection; ghi rõ ngoại lệ file tạm cho WAL/persist.

**Lệnh kiểm tra:** `cargo test --locked --manifest-path src-tauri/Cargo.toml --test infra_schema --test infra_constraints --test infra_pool --test infra_utils`; `cargo clippy --locked --manifest-path src-tauri/Cargo.toml --all-targets -- -D warnings`.

### S00-T09 — Kiểm thử IPC, múi giờ và bootstrap FE

- **Mục tiêu:** Chứng minh wrapper và pre-render theme không cần backend nghiệp vụ.
- **Thực thi bởi:** subagent codex.
- **Nhóm chạy:** P4 — song song.
- **Phụ thuộc:** S00-T07/G3.
- **Phạm vi file:** `src/test/{invoke,time,theme-bootstrap,shell}.test.ts` (dùng `.tsx` cho shell nếu cần); không sửa config/shared production.
- **UC/BR/component/command/bảng liên quan:** C00-IPC/ERR/TIME/THEME/UI; NFR-16 nền; structure-be §6/8/9.4, design-system §4.1/8.4; không command nghiệp vụ.

**Prompt giao cho codex (tự chứa; gửi kèm nguyên khối quy ước dưới đây):**

Bạn là subagent codex viết test FE hạ tầng React 19/Tauri 2. Đọc docs/structure-be.md §1/5.4/6/8/9.4, docs/design-system.md §4.1/8.4, docs/sprint/sprint-plan-summarize.md §3/5 Sprint 00/8; dùng C00-IPC/ERR/TIME/THEME/UI.
1. Vitest mock module Tauri API để kiểm tra wrapper truyền command/args, resolve result, preserve AppError hợp lệ, fallback lỗi lạ, reject thay vì swallow; không cần command backend mới.
2. Test formatDateTime với UTC gần nửa đêm đổi ngày ở Asia/Ho_Chi_Minh và input sai; kết quả không phụ thuộc timezone host.
3. Đọc và chạy chính inline script bootstrap từ index.html trong môi trường global stub tối thiểu: cache light/dark/system, thiếu/sai cache, localStorage throw, OS dark/light; assert class root trước mount. Không copy thuật toán ra test rồi test bản copy.
4. Smoke render shell bằng react-dom/server hiện có: landmark và placeholder composition/nhãn cá nhân, không form greet/demo; kiểm tra hành vi tương tác/focus thật để checklist desktop, không claim SSR chứng minh đầy đủ a11y. Không thêm jsdom/testing-library chỉ để test thuận tiện khi chưa nằm trong G1.
5. Tự chạy Vitest one-shot, lint/build; không sửa wrapper/index/config khi test fail, chuyển bug về chủ file và chạy lại sau fix tuần tự.

> **Quy ước bắt buộc trong prompt:** Mọi công việc triển khai do `subagent codex` thực hiện. Tuân thủ nhóm chạy/phụ thuộc và phạm vi file của task; không giao trùng file giữa task song song. Chốt hợp đồng trước song song; file dùng chung (`lib.rs`/`invoke_handler`, `mod.rs`, routes, `index.html`, config) chỉ do task tích hợp S00-T07 sửa sau P2. Sau mỗi wave có gate tổng; cuối sprint có task kiểm thử/nghiệm thu codex và checklist Hyan. Phân tầng `commands → services → repositories → db`, DI qua `tauri::State`, Unit of Work cho ghi nhiều bước; file Rust/TS ≤ ~200 dòng, hàm ≤ ~40 dòng; DRY/SOLID. Dùng Tailwind v4 + lucide-react; lưu UTC, hiển thị Asia/Ho_Chi_Minh; schema qua migration đánh số; test Rust SQLite in-memory. Không thêm feature nghiệp vụ, không sửa tài liệu nền, không chép code ref-ui; không thêm dependency ngoài danh sách. Chỉ viết test khi task yêu cầu rõ. Tối đa 2 lần thử, lần sau phải đổi approach; báo lỗi còn lại theo HANDOFF FORMAT, không tuyên bố pass khi chưa chạy.

**Tiêu chí chấp nhận:** AC-SIZE; Có test thực cho IPC/time/bootstrap và smoke shell; không dùng passWithNoTests, không gọi DB mạng hoặc command feature; ghi số test pass/fail.

**Lệnh kiểm tra:** `pnpm test`, `pnpm lint`, `pnpm build`; `TZ=UTC pnpm test` và `TZ=Asia/Ho_Chi_Minh pnpm test` cho tính độc lập múi giờ (shell hỗ trợ env tương ứng).

### S00-T10 — Kiểm thử tổng và nghiệm thu bàn giao

- **Mục tiêu:** Chốt bằng chứng tự động và checklist desktop để Sprint 01 dùng nền.
- **Thực thi bởi:** subagent codex.
- **Nhóm chạy:** P5 — tuần tự.
- **Phụ thuộc:** S00-T08/S00-T09/G4.
- **Phạm vi file:** Read-only toàn repo và chạy kiểm tra; không sửa code/config/docs. Nếu lỗi, trả task về đúng chủ file rồi chạy lại kiểm tra bị ảnh hưởng.
- **UC/BR/component/command/bảng liên quan:** Tất cả C00-*; toàn bộ NFR Sprint 00 ở mức nền đã nêu; structure-be §9; summary §8.

**Prompt giao cho codex (tự chứa; gửi kèm nguyên khối quy ước dưới đây):**

Bạn là subagent codex nghiệm thu Sprint 00 của ansask-desktop. Đọc toàn bộ file sprint này, docs/sprint/sprint-prompt-template.md, docs/sprint/sprint-plan-summarize.md §3/5 Sprint 00/8, docs/structure-be.md §1/5/8/9, docs/db.dbml và docs/design-system.md §3/4.1/7/8.
1. Chạy trọn checklist lệnh §5 trên phiên bản tích hợp cuối, không dùng kết quả cũ trước fix. Ghi command, exit code, số test, môi trường và chỗ chưa kiểm chứng.
2. Review ownership/diff, số dòng file/hàm, dependency/lockfile, tầng kiến trúc, invoke duy nhất, no business commands, quyền tối thiểu; kiểm tra CI thật nếu có run, nếu chỉ local thì ghi rõ chưa chạy GitHub Actions.
3. Mở desktop, xác minh startup/migration/log và checklist Hyan §6. Không có GUI thì đánh dấu NEED_INPUT cho desktop; không thay bằng browser preview rồi tuyên bố Tauri pass.
4. Bàn giao API/path/scripts, version đã verify, schema version, test evidence, điểm lệch tài liệu và các việc hoãn; không sửa tài liệu nền. Báo lỗi về owner, tối đa hai lần thử/task; chỉ SPRINT DONE khi mọi acceptance kể cả thủ công đã xác nhận.

> **Quy ước bắt buộc trong prompt:** Mọi công việc triển khai do `subagent codex` thực hiện. Tuân thủ nhóm chạy/phụ thuộc và phạm vi file của task; không giao trùng file giữa task song song. Chốt hợp đồng trước song song; file dùng chung (`lib.rs`/`invoke_handler`, `mod.rs`, routes, `index.html`, config) chỉ do task tích hợp S00-T07 sửa sau P2. Sau mỗi wave có gate tổng; cuối sprint có task kiểm thử/nghiệm thu codex và checklist Hyan. Phân tầng `commands → services → repositories → db`, DI qua `tauri::State`, Unit of Work cho ghi nhiều bước; file Rust/TS ≤ ~200 dòng, hàm ≤ ~40 dòng; DRY/SOLID. Dùng Tailwind v4 + lucide-react; lưu UTC, hiển thị Asia/Ho_Chi_Minh; schema qua migration đánh số; test Rust SQLite in-memory. Không thêm feature nghiệp vụ, không sửa tài liệu nền, không chép code ref-ui; không thêm dependency ngoài danh sách. Chỉ viết test khi task yêu cầu rõ. Tối đa 2 lần thử, lần sau phải đổi approach; báo lỗi còn lại theo HANDOFF FORMAT, không tuyên bố pass khi chưa chạy.

**Tiêu chí chấp nhận:** AC-SIZE; G5 có đầy đủ bằng chứng tự động + nghiệm thu Hyan; chưa xác nhận thủ công thì NEED_INPUT, không DONE; hợp đồng §3 dùng được cho Sprint 01.

**Lệnh kiểm tra:** Toàn bộ lệnh §5 và checklist §6; `rg -n "greet|@tauri-apps/api/core|invoke\(" src src-tauri/src`; kiểm tra độ dài file/hàm theo structure-be §1.2.

## 5. ACCEPTANCE / Definition of Done

- [ ] G1–G5 đều pass; tất cả task bàn giao có trạng thái, file và bằng chứng; không có blocker bị bỏ qua.
- [ ] React 19 + TS + Vite hiện hữu được giữ tương thích; Tailwind v4/plugin, lucide-react, Query và crates §9.2 được verify trước khi ghi version; lockfile không xung đột native SQLite.
- [ ] AppShell thay demo, app desktop chạy được, window mặc định 1280×800, minWidth 1024/minHeight 700; identifier giữ nguyên; capability chỉ phục vụ nhu cầu thực tế.
- [ ] DB nằm `<app-data-dir>/ansask.db`; migration 001 tạo đúng 7 bảng và toàn bộ FK/index/CHECK/default theo DBML, kể cả SQL trong Note; seed theme=system; không seed dữ liệu nghiệp vụ demo.
- [ ] Mở lại DB không mất dữ liệu, không tạo schema/seed trùng; migration lỗi không để app giả vờ sẵn sàng; pool tối đa 4 và PRAGMA được thiết lập trên mỗi connection; log version migration không chứa dữ liệu học tập.
- [ ] Test SQLite in-memory xác minh schema, constraint, FK, transaction rollback; test file tạm riêng xác minh WAL/persist; không tác động DB của Hyan.
- [ ] Wrapper IPC là điểm invoke duy nhất, commands.ts skeleton sẵn cho sprint sau; Rust State/lỗi/UTC và formatter FE khớp hợp đồng.
- [ ] Bootstrap áp theme trước React, cache lỗi/thiếu không làm trắng app; chưa tuyên bố đã hoàn thành ThemeToggle/đồng bộ DB của Sprint 06.
- [ ] Lint/format/build/test thực sự pass; test runner có test chạy, không dùng tùy chọn bỏ qua lỗi/no-tests; CI được cấu hình dùng cùng lệnh và prerequisite Tauri.
- [ ] File Rust/TS ≤ ~200 dòng, hàm ≤ ~40 dòng; chỗ vượt phải tách hoặc ghi lý do cụ thể để review, không miễn toàn module. Không feature ngoài phạm vi, không sửa tài liệu nền.

Chạy từ root repo; Cargo dùng `--manifest-path` để không nhầm working directory. Các lệnh ghi format (`pnpm format`) chỉ chạy khi có quyền sở hữu file; nghiệm thu dùng check không ghi.

```bash
pnpm install --frozen-lockfile
pnpm lint
pnpm format:check
pnpm test
pnpm build
cargo fmt --manifest-path src-tauri/Cargo.toml -- --check
cargo clippy --locked --manifest-path src-tauri/Cargo.toml --all-targets -- -D warnings
cargo build --locked --manifest-path src-tauri/Cargo.toml
cargo test --locked --manifest-path src-tauri/Cargo.toml
pnpm tauri dev
```

`pnpm tauri dev` là kiểm tra tương tác, kết thúc sau smoke; app đã mở không đồng nghĩa mọi checklist pass. Để kiểm tra offline của frontend production, build desktop bằng `pnpm tauri build --no-bundle`, chạy binary tương ứng host rồi tắt mạng; không dùng dev server làm bằng chứng app phụ thuộc mạng. Lệnh build này cần toolchain Tauri host, chưa yêu cầu ký hay phát hành installer.

CI tối thiểu phải chạy FE install/lint/format:check/test/build và Rust fmt/clippy/build/test với lockfile. Không bỏ qua lỗi bằng `continue-on-error`; phân biệt “workflow đã cấu hình”, “các lệnh chạy local pass”, và “GitHub Actions thực tế đã pass”. Nếu repo chưa có remote/workflow run, ghi rõ giới hạn đó; không tự push/publish để lấy bằng chứng.

## 6. Checklist nghiệm thu thủ công cho Hyan

Codex chuẩn bị build, lệnh chạy và log trước khi bàn giao checklist; Hyan chỉ xác nhận trải nghiệm desktop. Các mục chưa thực hiện để trống, không tự đánh dấu.

- [ ] Mở app bằng Tauri: có sidebar, brand/profile cá nhân, vùng nội dung placeholder; không còn form greet/logo/link demo; không có login, tài khoản hoặc dữ liệu môn/đề giả.
- [ ] Đối chiếu kích thước logical theo config: mặc định 1280×800, không thu hẹp dưới 1024 hoặc thấp hơn 700; ở mức tối thiểu chữ/nút/main không tràn ngang hoặc bị cắt. Phân biệt kích thước logical với pixel vật lý khi màn hình có scale.
- [ ] Tailwind/token/shadow/font fallback và lucide hiển thị; Tab tới các control có nhãn/focus, control chưa có feature không giả vờ thực hiện nghiệp vụ. Toast/modal chỉ kiểm tra qua fixture/test harness nếu có, không thêm màn demo vào app phát hành.
- [ ] DevTools đặt `theme=dark`, mở lại: class dark có trước mount; thử light, system, bỏ cache và OS dark/light. Đổi theme hoàn chỉnh trong app thuộc Sprint 06, chưa yêu cầu UI settings.
- [ ] Kiểm tra log/path thực: DB trong app-data, schema version 1. Đóng/mở lại vẫn mở đúng file, seed theme không lặp; không xóa DB hiện hữu để đạt bài test “fresh”. Test DB mới dùng môi trường/profile cô lập.
- [ ] Chạy binary production khi mất mạng: shell vẫn mở, DB vẫn khởi tạo/đọc được; font fallback không chặn app. Không telemetry/cloud phát sinh.
- [ ] Đối chiếu báo cáo test/exit code; ghi môi trường OS, DPI, kết quả từng mục và lỗi nhìn thấy. Xác nhận hoặc trả lỗi cho codex; nếu thiếu GUI thì giữ NEED_INPUT.

## 7. Rủi ro và câu hỏi mở

| Rủi ro | Xử lý / gate |
|---|---|
| A1/A9: version Tailwind/crate chưa kiểm chứng; libsqlite3-sys có thể xung đột | S00-T01 kiểm chứng nguồn chính thức trước ghi version; S00-T07 cargo tree/build với lockfile; G1 không pass nếu chỉ đoán số version |
| DBML và structure-be khác nhau về deleted_at/score/cột mới | Áp dụng thứ tự ở §2; migration theo DBML hiện tại; S00-T08 test contract, handoff điểm lệch, không sửa tài liệu nền |
| SQLite :memory: riêng theo connection; WAL không có trên memory DB | Dùng một connection cho migration/constraint unit test, nhiều connection chỉ test initializer; riêng WAL/persist dùng file tạm cô lập |
| SQLite lower/trim không phải Unicode case-fold đầy đủ | Giữ đúng expression DBML, ghi giới hạn cho Sprint 01; nếu cần thay nghĩa unique phải hỏi, không tự thêm ICU/dependency |
| NFR-16 bị hiểu thành phải làm settings feature ngay | Sprint 00 chỉ tokens/bootstrap/seed; Sprint 06 thêm setting_get/set, ThemeToggle, sync DB/cache và OS listener |
| Thiếu thư viện native Tauri hoặc GUI/CI remote | Báo prerequisite thiếu cụ thể; compile/test và desktop là bằng chứng riêng, không thay desktop bằng web preview |
| Task tích hợp hoặc primitive vượt 30 phút | Ước lượng trước; chia task con tuần tự cùng owner hoặc ownership rời nhau, không cho nhiều codex sửa config chung |
| Test thất bại do hợp đồng chưa public hoặc lỗi nhánh | Dừng nhánh bị ảnh hưởng, trả owner sửa tuần tự; rerun gate liên quan rồi tổng nghiệm thu; không nới test/DoD để pass |

**Câu hỏi mở không chặn việc viết kế hoạch:** tên thương hiệu cuối cùng (AS-10/structure-be §11 Q1) giữ như repo cho đến khi có quyết định; router/Zustand (A10/Q2) chưa cần cho placeholder, chốt trước khi làm điều hướng/state thật; dark token tương phản (design-system QDS-45) còn nghiệm thu polish ở Sprint 06. Phiên bản dependency/toolchain cụ thể phải có câu trả lời ở S00-T01 trước thực thi P2/P3. Nếu phát hiện quyết định mới không có trong spec hoặc bất tương thích không giải quyết trong stack đã cho, báo NEED_INPUT cùng phương án, không tự mở rộng scope.

## 8. STOP CONDITIONS — dừng ngay khi đạt điều kiện

- Tất cả ACCEPTANCE pass, gồm xác nhận thủ công → dừng, báo **SPRINT DONE**.
- Một task thất bại sau hai lần thử → dừng task đó, escalate; các nhánh độc lập có thể tiếp tục, mọi task phụ thuộc/gate liên quan bị chặn.
- Phát hiện cần design decision chưa có trong spec → dừng phần phụ thuộc quyết định, hỏi.
- Cần dependency ngoài danh sách được phép → dừng phần đó, hỏi.
- Task ước tính vượt 30 phút → dừng, chia nhỏ lại với file owner/phụ thuộc/gate rõ trước khi tiếp tục.

## 9. RETRY BUDGET

Mỗi task tối đa **2 lần thử**; lần hai phải thay đổi approach dựa trên lỗi thu được, không chạy lại y hệt để hy vọng pass. Sau lần hai fail, dừng task đó và chuyển sang task độc lập nếu có; không khởi động task phụ thuộc. Cuối sprint liệt kê mọi task chưa xong, hai approach đã thử và lý do. Thời gian build/download môi trường được ghi riêng; không dùng lý do này để bỏ gate hoặc kéo dài một task triển khai không kiểm soát.

## 10. ESCALATION TRIGGERS

Dừng và hỏi khi lỗi không rõ nguyên nhân sau hai lần debug; phải chọn A/B mà spec không nói; cần đổi kiến trúc/folder structure/store shape; phát hiện lỗi đầu vào ảnh hưởng sprint; hoặc cần Hyan test visual/UX/performance trên desktop. Sprint 00 không có sprint trước: lỗi template/đầu vào vẫn phải ghi rõ. Các khác biệt đã giải quyết ở §2 và hành động đã được giao không cần hỏi lại. Với bước thủ công, hoàn thành build và cung cấp bằng chứng review được trước khi yêu cầu Hyan xác nhận.

## 11. OUT OF SCOPE — ràng buộc thực thi

Không refactor ngoài file list task; không thêm feature ngoài GOAL; không đổi UI/UX ngoài spec; không tối ưu sớm; không viết test ngoài S00-T08/S00-T09 và kiểm tra đã nêu; không update README/docs nền. Không copy code ref-ui. Không thực hiện CRUD/import/quiz/grading/stats/trash/theme settings để “test thử” hạ tầng. Không thêm command sức khỏe, SQL frontend plugin hoặc quyền truy cập rộng chỉ để làm smoke test. Không push, deploy hoặc phát hành installer trong sprint này.

## 12. HANDOFF FORMAT

```text
STATUS: [DONE | PARTIAL | BLOCKED | NEED_INPUT]
SPRINT: 00

✅ COMPLETED:
- [S00-Txx]: [file changed; hợp đồng bàn giao]
- [Gate Gx]: [lệnh, exit code, số test, môi trường, bằng chứng desktop/CI]

❌ FAILED (nếu có):
- [S00-Txx]: [lỗi] | [approach lần 1 / lần 2] | [cần gì từ user]

🤔 NEED_INPUT (nếu có):
- [câu hỏi]: [ảnh hưởng] | Option A: [...] | Option B: [...]
- [checklist Hyan còn trống]: [build/lệnh/log sẵn để kiểm tra]

📋 NEXT ACTION:
- DONE → "SPRINT DONE. Ready for sprint 01, paste next prompt"
- BLOCKED → "Waiting for user response on X"
- PARTIAL → "Continue task Y after user confirms" [chỉ khi Y thực sự cần xác nhận]
- NEED_INPUT → [quyết định hoặc kiểm tra thủ công còn thiếu]

CONTRACTS:
- [API/props/path/schema version/scripts/dependency versions + nguồn/ngày verify]
- [điểm lệch tài liệu nền; việc hoãn; giới hạn chưa kiểm chứng]
```

**Quy mô kế hoạch:** 10 task (`S00-T01`–`S00-T10`), 5 wave (`P1`–`P5`), 5 gate (`G1`–`G5`).
