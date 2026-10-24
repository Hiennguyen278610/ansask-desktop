# Domain Core — ansask-desktop

> Đặc tả nghiệp vụ & use case cho ứng dụng desktop luyện thi trắc nghiệm **ansask-desktop**.
> **Nguồn sự thật duy nhất:** `docs/ref-ui.tsx` (2994 dòng, React single-file demo, state 100% in-memory).
> **Quy ước bằng chứng:** `ref-ui.tsx:Lxxx` hoặc `ref-ui.tsx:Lxxx-Lyyy` trỏ tới dòng trong file nguồn. Khẳng định không có bằng chứng trực tiếp được gắn `[GIẢ ĐỊNH]`.
> **Quy ước hợp đồng khái niệm:** `SCREEN-01..09`, `OVL-01..05`, thực thể `Subject / Exam / Question / AnswerOption / Attempt`.

---

## 1. Tổng quan sản phẩm

### 1.1 Mục đích
Ứng dụng desktop giúp một người tự tạo **bộ đề trắc nghiệm**, làm bài, chấm điểm tức thì và theo dõi tiến độ học tập. Toàn bộ vòng đời dữ liệu (môn → bộ đề → câu hỏi → lượt làm bài) diễn ra trong một app duy nhất, không cần server.

- Tạo & quản lý nội dung: môn học, bộ đề, câu hỏi 4 lựa chọn/1 đáp án đúng (`ref-ui.tsx:L984-L1012`, `ref-ui.tsx:L1061-L1077`).
- Soạn đề theo 2 cách: nhập trực quan từng câu, hoặc dán JSON/TXT do AI sinh ra (`ref-ui.tsx:L2330-L2564`).
- Làm bài có đồng hồ đếm, chấm điểm hệ 10, xem lại đáp án (`ref-ui.tsx:L2569-L2781`).
- Thống kê học tập: 4 chỉ số, biểu đồ tiến độ, phổ điểm, lịch sử gần đây (`ref-ui.tsx:L1490-L1861`).
- Cung cấp prompt AI cố định + hướng dẫn 3 bước để sinh đề từ tài liệu (`ref-ui.tsx:L2788-L2897`).

### 1.2 Đối tượng người dùng
| Đối tượng | Nhu cầu | Bằng chứng |
|---|---|---|
| Học sinh / sinh viên tự ôn thi | Tạo đề từ tài liệu môn học, làm lại nhiều lần, xem điểm | `ref-ui.tsx:L1490-L1587`, `ref-ui.tsx:L2676-L2725` |
| Giáo viên / trợ giảng | Soạn nhanh bộ đề bằng AI rồi dán vào app | `ref-ui.tsx:L2788-L2895` |
| Người dùng đơn lẻ trên máy cá nhân | Dữ liệu local, không chia sẻ, không cộng tác | `ref-ui.tsx:L794-L803` |

### 1.3 Phạm vi (in scope)
| Nhóm | Nội dung | Bằng chứng |
|---|---|---|
| Nội dung | CRUD một phần: tạo môn, tạo/sửa bộ đề, thêm/sửa/xóa câu hỏi & lựa chọn | `ref-ui.tsx:L1061-L1077`, `ref-ui.tsx:L1024-L1056`, `ref-ui.tsx:L546-L562` |
| Nhập liệu | Parse JSON/TXT 2 chiều, đồng bộ realtime với render | `ref-ui.tsx:L39-L141`, `ref-ui.tsx:L879-L914` |
| Luyện tập | Cấu hình số câu, shuffle, làm bài, nộp, chấm, xem lại | `ref-ui.tsx:L1082-L1158`, `ref-ui.tsx:L2903-L2991` |
| Thống kê | Metric theo kỳ, biểu đồ, phổ điểm, lịch sử | `ref-ui.tsx:L1163-L1238`, `ref-ui.tsx:L1490-L1861` |
| Trợ giúp | Prompt AI cố định + copy clipboard | `ref-ui.tsx:L468-L500`, `ref-ui.tsx:L1241-L1249` |
| Thùng rác & khôi phục | **[CẬP NHẬT đợt 3]** Xóa mềm môn/bộ đề, xem thùng rác, khôi phục, xóa vĩnh viễn | Q-21 · BR-71..BR-80 · SCREEN-09 |

### 1.4 Ngoài phạm vi (out of scope — UI không có)
- Không đăng nhập / đăng ký / phân quyền — app render thẳng vào dashboard (`ref-ui.tsx:L1251-L1252`, `ref-ui.tsx:L1406-L1417`).
- Không đồng bộ cloud, không API, không Tauri invoke — toàn bộ state là `useState` (`ref-ui.tsx:L794-L844`).
- **[YÊU CẦU MỚI] (R5)** App cá nhân, single-user: SQLite cục bộ, dữ liệu nằm trong thư mục app-data của OS; **không đăng nhập / phân quyền / cloud** — không có tài khoản, không bảng `users`, dữ liệu không rời máy.
- Không import file (chỉ dán text vào textarea) (`ref-ui.tsx:L2550-L2560`).
- Không xuất file / in / chia sẻ đề; chỉ copy prompt AI (`ref-ui.tsx:L1241-L1249`).
- Không tìm kiếm, không lọc theo từ khóa, không phân trang (`ref-ui.tsx:L2053-L2100`).
- **[CẬP NHẬT đợt 2]** ref-ui không có xóa môn/xóa bộ đề (chỉ xóa câu hỏi trong editor: `ref-ui.tsx:L2179-L2264`, `ref-ui.tsx:L611-L619`); spec chốt **soft delete** (`deleted_at`) cho môn & bộ đề (Q-01, BR-60): cascade ẩn toàn bộ bộ đề/câu hỏi/attempt thuộc môn, thống kê & lịch sử không tính dữ liệu đã ẩn, dialog xác nhận khi xóa, cơ chế “thùng rác/khôi phục” (Q-21 ĐÃ CHỐT).
- Không giới hạn thời gian làm bài, không auto-submit (`ref-ui.tsx:L2569-L2646`).
- Không có dạng câu hỏi khác ngoài trắc nghiệm 1 đáp án đúng; không điểm từng phần, không giải thích đáp án, không ảnh, không tag/độ khó (`ref-ui.tsx:L622-L771`).
- ref-ui không có màn hình Settings thật; nút Settings chỉ bắn toast (`ref-ui.tsx:L1466-L1472`). **[CẬP NHẬT đợt 2]** Q-13 (nút Power gọi reset điều hướng, `ref-ui.tsx:L1473-L1479`) và Q-14 (Settings chỉ toast) **đã loại bỏ** — thay bằng **nút Theme** 3 chế độ Sáng/Tối/Theo hệ thống (R2, BR-66); không còn màn hình Settings trong kế hoạch.

---

## 2. Thuật ngữ (glossary)

| Thuật ngữ | Định nghĩa | Bằng chứng |
|---|---|---|
| **Subject** (Môn học) | Đơn vị gốc của cây nội dung; chứa nhiều bộ đề; có tên + màu nhận diện | `ref-ui.tsx:L252-L289` |
| **Exam** (Bộ đề) | Tập câu hỏi thuộc một môn; đơn vị để làm bài và xem lịch sử | `ref-ui.tsx:L291-L383` |
| **Question** (Câu hỏi) | Một câu trắc nghiệm gồm nội dung `ask` và 2..N lựa chọn | `ref-ui.tsx:L511-L788` |
| **AnswerOption** (Lựa chọn) | Phương án trả lời, có cờ `isCorrect`; hiển thị theo thứ tự A, B, C, D… | `ref-ui.tsx:L699-L702` |
| **Attempt** (Lượt làm bài) | Bản ghi kết quả một lần nộp bài: điểm, số đúng/tổng, thời lượng, thời điểm; **persist** xuống SQLite `[CẬP NHẬT đợt 2]` (BR-50) | `ref-ui.tsx:L1137-L1152` |
| **AttemptAnswer** (Chi tiết đáp án) | **[CẬP NHẬT đợt 2]** (Q-03, BR-68) Bản ghi đáp án **từng câu** của một Attempt, bảng `attempt_answers`; **chính thức & persist** — dựng lại màn “Chi tiết đáp án” kể cả sau khi đóng/mở lại app | Q-03 · BR-62 · BR-68 |
| **Lượt ôn** | Vòng lặp lại câu hỏi khi số câu yêu cầu > số câu gốc; hậu tố `(Lượt ôn #n)`. **[CẬP NHẬT đợt 2]** ref-ui có cơ chế lặp (`ref-ui.tsx:L1100-L1102`); spec R1 + BR-21 chốt: **không lặp** — `N ≥ tổng` thì lấy hết câu (vẫn xáo), hậu tố không còn xuất hiện | `ref-ui.tsx:L1100-L1102`, BR-21 |
| **Câu gốc** | Câu hỏi trong `Exam.questions` trước khi shuffle/nhân bản cho một phiên làm bài | `ref-ui.tsx:L1085-L1106` |
| **Bộ đề gốc** | Bộ đề nguồn chứa câu gốc; không bị mutate khi tạo phiên vì pool là bản copy `[...currentExam.questions]` | `ref-ui.tsx:L1085`, `ref-ui.tsx:L1104` |
| **Điểm hệ 10** | `score = round(correct/total*10, 1)` | `ref-ui.tsx:L1127` |
| **Tiến độ làm bài** | Tỉ lệ câu đã chọn đáp án / tổng số câu của phiên | `ref-ui.tsx:L2583-L2597` |
| **Phổ điểm** | Phân bố lượt làm bài theo 3 mức: Xuất sắc / Khá giỏi / Cần cố gắng | `ref-ui.tsx:L1210-L1214`, `ref-ui.tsx:L1770-L1799` |
| **Kỳ thống kê** | Bộ lọc thời gian của dashboard: `week` / `month` / `year` | `ref-ui.tsx:L806`, `ref-ui.tsx:L1176-L1208` |
| **`chartMetric`** | Chế độ hiển thị biểu đồ: `both` / `score` (toggle chỉ đổi style, xem BR-31) | `ref-ui.tsx:L807`, `ref-ui.tsx:L1604-L1625` |
| **`viewMode`** | Trạng thái điều hướng trong tab Đề kiểm tra: `root/subject/examDetail/examEditor/quizActive/quizResult` | `ref-ui.tsx:L810-L811` |
| **Phiên làm bài (QuizSession)** | Tập câu đã chọn + đáp án người dùng chọn + mốc thời gian; chỉ tồn tại trong RAM | `ref-ui.tsx:L839-L844` |
| **Editor draft** | Bản nháp bộ đề đang soạn (title, câu hỏi, raw text, format tab) trước khi Lưu | `ref-ui.tsx:L828-L836` |
| **Hiện đáp án** | Công tắc hiển thị đáp án đúng ở màn tổng quan bộ đề; mặc định TẮT | `ref-ui.tsx:L822`, `ref-ui.tsx:L2208-L2231` |
| **Toast** | Thông báo nổi góc dưới phải, tự ẩn sau 2.8s | `ref-ui.tsx:L847-L853`, `ref-ui.tsx:L1337-L1342` |
| **Breadcrumb** | Chuỗi điều hướng `root > môn > bộ đề`; click để reset cấp tương ứng | `ref-ui.tsx:L1869-L1943` |
| **Soft delete** (`deleted_at`) | **[CẬP NHẬT đợt 2]** (Q-01, BR-60) Xóa mềm môn/bộ đề: gán `deleted_at`, bản ghi còn trong DB nhưng bị ẩn khỏi mọi danh sách/thống kê/lịch sử; có thể khôi phục từ “thùng rác” (Q-21 ĐÃ CHỐT) | Q-01 · BR-60 · Q-21 |
| **Thùng rác (Trash)** | **[CẬP NHẬT đợt 3]** (Q-21) Tab sidebar SCREEN-09 chứa môn & bộ đề đã xóa mềm; cho phép khôi phục, xóa vĩnh viễn, dọn sạch. | Q-21 · BR-71..BR-80 · SCREEN-09 |
| **Đợt xóa (delete_batch_id)** | **[CẬP NHẬT đợt 3]** (Q-21, BR-71) Id đợt xóa gán cho bản ghi bị xóa mềm cùng đợt; phân biệt cascade (xóa theo môn) với xóa riêng. | BR-71 · §4.2 · §4.3 |
| **AppSetting** | **[YÊU CẦU MỚI]** (R2, §4.10) Cấu hình app dạng key/value persist trong SQLite; hiện chỉ có key `theme` (`light`/`dark`/`system`, seed `system`) | R2 · §4.10 |
| **Giờ Việt Nam** | **[CẬP NHẬT đợt 2]** (Q-06, BR-64) Múi giờ hiển thị chuẩn `Asia/Ho_Chi_Minh` (UTC+7, không DST); dữ liệu lưu **UTC**, mọi hiển thị thời gian & mọi ranh giới hôm nay/tuần/tháng/năm tính theo múi giờ này | Q-06 · BR-64 |

---

## 3. Actor / vai trò

| Actor | Loại | Quyền / hành vi | Bằng chứng |
|---|---|---|---|
| **Người dùng cục bộ** (hiển thị “Matthew Hayes”, ID `308591433`) | Tác nhân chính, duy nhất | Toàn quyền trên dữ liệu local: tạo môn, tạo/sửa bộ đề, làm bài, xem thống kê | `ref-ui.tsx:L1406-L1417` |
| **Nền tảng AI bên ngoài** (Google Gemini / ChatGPT / Claude) | Tác nhân phụ, ngoài hệ thống | Sinh JSON/TXT từ tài liệu; app chỉ mở link và copy prompt, không gọi API | `ref-ui.tsx:L2806-L2841`, `ref-ui.tsx:L2883-L2889` |

**Không có auth, không có phân quyền:**
- App không có màn hình đăng nhập; render trực tiếp shell + dashboard (`ref-ui.tsx:L1251-L1252`).
- Không có state user/session; profile chỉ là JSX tĩnh, không có onClick, không sửa được (`ref-ui.tsx:L1412-L1417`).
- Không có vai trò admin/teacher/student; mọi hành động đều mở cho người dùng duy nhất (`ref-ui.tsx:L1347-L1481`).
- Chấm xanh cạnh avatar và ID chỉ mang tính trang trí `[GIẢ ĐỊNH]` (`ref-ui.tsx:L1410`).
- **[YÊU CẦU MỚI] (R5, BR-70)** Xác nhận bởi spec: app **cá nhân, single-user** — SQLite cục bộ trong thư mục app-data của OS; không đăng nhập, không phân quyền, không cloud; mọi actor đều là “người dùng cục bộ” duy nhất, không có vai trò nào khác.

---

## 4. Thực thể nghiệp vụ

### 4.1 Quan hệ tổng quát
```
Subject 1 ──── N Exam 1 ──── N Question 1 ──── N AnswerOption
  │               │
  │deleted_at     │deleted_at, updatedAt
  └──── N Attempt (snapshot examTitle/subjectName; thời gian hiển thị theo Giờ VN)
            └──── N AttemptAnswer        [CẬP NHẬT đợt 2 — persist, Q-03]

QuizSession ──(sinh ra khi bắt đầu làm bài)──> Attempt (khi nộp)
QuizSession 1 ──── N AttemptAnswer (RAM trong phiên → ghi SQLite `attempt_answers` khi nộp)

AppSetting (bảng độc lập, key/value: theme — §4.10)   [YÊU CẦU MỚI — R2]
```
**Soft delete (Q-01):** `Subject.deleted_at` / `Exam.deleted_at` = `NULL` ⇒ đang hiển thị; khác `NULL` ⇒ ẩn môn/bộ đề và cascade ẩn toàn bộ dữ liệu con (BR-60); `delete_batch_id` ghi id đợt xóa (BR-71). **Thùng rác SCREEN-09** hiển thị các bản ghi đã xóa mềm (Q-21).

### 4.2 Subject — `subjects`

| Tên | Kiểu | Ý nghĩa | Nguồn |
|---|---|---|---|
| `id` | `string` | Định danh; seed `sub-1`..`sub-6`, tạo mới `sub-{timestamp}` | `ref-ui.tsx:L1068`, `ref-ui.tsx:L254` |
| `name` | `string` | Tên môn, đã `trim()`. **[CẬP NHẬT đợt 2]** Chốt Q-15: unique **toàn cục** (BR-04, BR-59); ref-ui không ràng buộc unique (`ref-ui.tsx:L1069`) | `ref-ui.tsx:L1069`, `ref-ui.tsx:L255` |
| `color` | `string` (hex) | Màu nhận diện, 1 trong 8 preset; mặc định `#262b33` | `ref-ui.tsx:L1070`, `ref-ui.tsx:L147-L156`, `ref-ui.tsx:L818` |
| `createdAt` | `string` (`YYYY-MM-DD`) | Ngày tạo, sinh từ `toISOString()` (UTC) | `ref-ui.tsx:L1071`, `ref-ui.tsx:L257` |
| `deletedAt` | `timestamp` hoặc `NULL` | **[CẬP NHẬT đợt 2]** (Q-01, BR-60) Soft delete: `NULL` = đang hiển thị; khác `NULL` = đã ẩn (thùng rác, khôi phục được (Q-21 ĐÃ CHỐT)). ref-ui không có cột này | Q-01 · BR-60 · Q-21 |
| `deleteBatchId` | `string` hoặc `NULL` | **[CẬP NHẬT đợt 3]** (Q-21, BR-71) Id đợt xóa; gán cùng giá trị cho môn và các bộ đề cascade khi xóa môn; `NULL` = xóa riêng hoặc chưa xóa. Phân biệt cascade vs xóa riêng khi khôi phục. | BR-71 · §4.3 |

- **Quan hệ:** 1 Subject → N Exam qua `Exam.subjectId` (`ref-ui.tsx:L1045`, `ref-ui.tsx:L2055`).
- **Vòng đời:** `created` → `active` → **`deleted` (soft delete, [CẬP NHẬT đợt 2] Q-01)** — ref-ui chỉ có `created` → `active`, không có sửa/xóa môn (`ref-ui.tsx:L1061-L1077`); xóa = gán `deletedAt` + dialog xác nhận + cascade ẩn dữ liệu con (BR-60).
- **Dữ liệu dẫn xuất:** số bộ đề = `exams.filter(subjectId).length`; tổng câu = tổng `questions.length` của các bộ đề (`ref-ui.tsx:L2055-L2059`). **[CẬP NHẬT đợt 2]** Mọi dẫn xuất chỉ tính môn/bộ đề `deletedAt IS NULL` (BR-60); thống kê & lịch sử không tính dữ liệu đã ẩn.

### 4.3 Exam — `exams`

| Tên | Kiểu | Ý nghĩa | Nguồn |
|---|---|---|---|
| `id` | `string` | Seed `exam-1..4`, tạo mới `exam-{timestamp}` | `ref-ui.tsx:L1044`, `ref-ui.tsx:L293` |
| `subjectId` | `string` (FK Subject) | Môn chứa bộ đề; lấy từ `selectedSubjectId` khi lưu | `ref-ui.tsx:L1045`, `ref-ui.tsx:L2132` |
| `title` | `string` | Tên bộ đề, đã trim; rỗng → `Chưa có tiêu đề` | `ref-ui.tsx:L1029`, `ref-ui.tsx:L1046` |
| `createdAt` | `string` (`YYYY-MM-DD HH:mm`) | Thời điểm tạo (UTC); giữ nguyên khi cập nhật | `ref-ui.tsx:L1030`, `ref-ui.tsx:L1036` |
| `updatedAt` | `timestamp` hoặc `NULL` | **[CẬP NHẬT đợt 2]** (Q-02, BR-10) Thời điểm cập nhật gần nhất; ghi mỗi lần Lưu đè bộ đề; `NULL` = chưa cập nhật. ref-ui không có cột này | Q-02 · BR-10 |
| `deletedAt` | `timestamp` hoặc `NULL` | **[CẬP NHẬT đợt 2]** (Q-01, BR-60) Soft delete bộ đề: `NULL` = đang hiển thị; khác `NULL` = đã ẩn (khôi phục được (Q-21 ĐÃ CHỐT)). ref-ui không có cột này | Q-01 · BR-60 · Q-21 |
| `deleteBatchId` | `string` hoặc `NULL` | **[CẬP NHẬT đợt 3]** (Q-21, BR-71) Id đợt xóa; gán cùng giá trị cho bộ đề cascade khi xóa môn; `NULL` = xóa riêng hoặc chưa xóa. Phân biệt cascade vs xóa riêng khi khôi phục. | BR-71 · §4.2 |
| `questions` | `array<Question>` | Danh sách câu hỏi nhúng, thứ tự mảng là thứ tự hiển thị | `ref-ui.tsx:L1048`, `ref-ui.tsx:L2314` |

- **Quan hệ:** N Exam → 1 Subject; 1 Exam → N Question; 1 Exam → N Attempt (`ref-ui.tsx:L2134-L2136`).
- **Vòng đời:** `draft` (trong editor, chưa có id) → `saved` (có trong `exams`) → `updated` (ghi đè tại chỗ, giữ `createdAt`, **[CẬP NHẬT đợt 2]** thêm `updatedAt` theo Q-02, không tạo phiên bản) (`ref-ui.tsx:L1032-L1055`) → **`deleted` (soft delete, Q-01)**.
- **Không có:** nhân bản bộ đề, lưu trữ/archived (`ref-ui.tsx:L2179-L2264`). **[CẬP NHẬT đợt 2]** `updatedAt` đã có theo Q-02 (BR-10); xóa bộ đề nay là **soft delete** theo Q-01 (BR-60) — không còn thuộc out-of-scope.

### 4.4 Question — `questions`

| Tên | Kiểu | Ý nghĩa | Nguồn |
|---|---|---|---|
| `id` | `string` | Seed `q-*`, sinh `q-{idx}-{rand}` (parse) hoặc `q-{ts}-{rand}` (chèn tay) | `ref-ui.tsx:L918`, `ref-ui.tsx:L240`, `ref-ui.tsx:L77` |
| `ask` | `string` | Nội dung câu hỏi; cho phép rỗng | `ref-ui.tsx:L917-L919`, `ref-ui.tsx:L606` |
| `options` | `array<AnswerOption>` | **0..N tuỳ nguồn nhập**: editor mặc định 4 và không cho xoá dưới 2; TXT không có dòng `ans.` → 0 lựa chọn; JSON/TXT chỉ 1 dòng đáp án → 1 lựa chọn. ref-ui khi Lưu **không validate** số lựa chọn; **[CẬP NHẬT đợt 2]** spec chốt: khi Lưu **validate ≥ 2 đáp án và ≥ 1 đáp án đúng** (R4, BR-47) | `ref-ui.tsx:L104-L108`, `ref-ui.tsx:L82-L87`, `ref-ui.tsx:L1025-L1028`, BR-47 |
| *(thứ tự)* | `number` (ngầm định) | Vị trí trong `Exam.questions`; hiển thị “Câu {index+1}” | `ref-ui.tsx:L574-L575`, `ref-ui.tsx:L2314` |
| *(examId)* | `string` (ngầm định qua quan hệ nhúng) | Không có field riêng trong UI | `ref-ui.tsx:L2314-L2321` |

- **Vòng đời:** chỉ tồn tại trong editor draft; khi Lưu mới trở thành dữ liệu bộ đề. Xóa câu = filter khỏi mảng (`ref-ui.tsx:L2464-L2469`).
- **Bất biến UI:** mỗi câu hiển thị đúng 1 đáp án đúng nếu dữ liệu được nhập qua radio editor (`ref-ui.tsx:L537-L544`), nhưng ref-ui **không validate** khi Lưu (xem BR-47); không có ràng buộc 2..N ở tầng lưu: câu 0 lựa chọn vẫn lưu được (`ref-ui.tsx:L104-L108`, `ref-ui.tsx:L1025-L1028`). **[CẬP NHẬT đợt 2]** Spec chốt: khi Lưu **validate ≥ 2 đáp án và ≥ 1 đáp án đúng** (R4, BR-47); TXT báo lỗi **theo dòng** (BR-65); câu có **nhiều đáp án đúng là hợp lệ** (Q-10, BR-24/BR-63).

### 4.5 AnswerOption — `answer_options`

| Tên | Kiểu | Ý nghĩa | Nguồn |
|---|---|---|---|
| `id` | `string` | Seed `opt-*` / `o-*`; sinh mới `opt-{ts}-{rand}` | `ref-ui.tsx:L548`, `ref-ui.tsx:L71` |
| `text` | `string` | Nội dung lựa chọn; cho phép rỗng | `ref-ui.tsx:L549`, `ref-ui.tsx:L726-L728` |
| `isCorrect` | `boolean` | Đáp án đúng; editor radio đảm bảo duy nhất 1. **[CẬP NHẬT đợt 2]** Q-10: câu có **nhiều đáp án đúng** (nhiều option `isCorrect = true`) là **hợp lệ**; UI dùng **radio** khi câu có 1 đáp án đúng, **checkbox** khi câu có nhiều đáp án đúng (BR-24, BR-63) | `ref-ui.tsx:L537-L544`, `ref-ui.tsx:L73`, Q-10 |
| *(thứ tự)* | `number` (ngầm định) | Nhãn A/B/C/D sinh từ index | `ref-ui.tsx:L700-L702` |
| *(questionId)* | `string` (ngầm định) | Quan hệ nhúng trong `question.options` | `ref-ui.tsx:L624` |

- **Ràng buộc UI:** **editor** không cho xoá dưới 2 lựa chọn (nút xoá chỉ hiện khi `options.length > 2`) (`ref-ui.tsx:L556`, `ref-ui.tsx:L744-L752`), nhưng dữ liệu import từ TXT/JSON có thể có 0 hoặc 1 lựa chọn và vẫn được lưu — tầng lưu không chặn (`ref-ui.tsx:L104-L108`, `ref-ui.tsx:L1025-L1028`).
- **Vòng đời:** thêm/xóa/sửa trong editor; khi xóa đáp án đúng, lựa chọn đầu tiên được phong làm đúng (`ref-ui.tsx:L557-L560`).

### 4.6 Attempt — `attempts`

| Tên | Kiểu | Ý nghĩa | Nguồn |
|---|---|---|---|
| `id` | `string` | `att-{timestamp}` | `ref-ui.tsx:L1138` |
| `examId` | `string` (FK Exam) | Bộ đề của lượt làm | `ref-ui.tsx:L1139` |
| `examTitle` | `string` | **Denormalize** tên bộ đề tại thời điểm nộp | `ref-ui.tsx:L1140` |
| `subjectId` | `string` (FK Subject) | Môn của bộ đề | `ref-ui.tsx:L1141` |
| `subjectName` | `string` | **Denormalize** tên môn tại thời điểm nộp | `ref-ui.tsx:L1142` |
| `timestamp` | `timestamp` (lưu **UTC**, hiển thị `YYYY-MM-DD HH:mm` Giờ VN) | Thời điểm nộp. **[CẬP NHẬT đợt 2]** Q-06: lưu UTC, hiển thị theo **Giờ Việt Nam** `Asia/Ho_Chi_Minh` (UTC+7, không DST) — BR-26/BR-64; ref-ui dùng giờ local máy | `ref-ui.tsx:L1128-L1135`, Q-06 |
| `periodTag` | `string` | Nhãn kỳ; luôn `'week'` khi tạo mới, **không dùng để lọc** | `ref-ui.tsx:L1144` |
| `dayLabel` | `string` | Nhãn ngày; tạo mới luôn `'H.Nay'`, seed `T2..T6` | `ref-ui.tsx:L1145`, `ref-ui.tsx:L394` |
| `monthLabel` | `string` | `T{tháng}` | `ref-ui.tsx:L1146` |
| `yearLabel` | `string` | Năm dạng chuỗi | `ref-ui.tsx:L1147` |
| `totalQuestions` | `number` (int) | Tổng số câu của phiên | `ref-ui.tsx:L1148` |
| `correctCount` | `number` (int) | Số câu đúng | `ref-ui.tsx:L1149` |
| `score` | `number` (float, 1 chữ số thập phân) | Điểm hệ 10 | `ref-ui.tsx:L1150`, `ref-ui.tsx:L1127` |
| `durationSec` | `number` (int, giây) | Thời lượng làm bài theo đồng hồ | `ref-ui.tsx:L1151`, `ref-ui.tsx:L859` |

- **Quan hệ:** N Attempt → 1 Exam (`examId`); N Attempt → 1 Subject (`subjectId`). Snapshot tên đề/môn để lịch sử không phụ thuộc việc đổi tên sau này (`ref-ui.tsx:L1140-L1142`).
- **Vòng đời:** chỉ sinh khi nộp bài → **immutable** (không sửa/xóa). `periodTag/dayLabel/monthLabel/yearLabel` trên thực tế không được đọc ở đâu ngoài khởi tạo (`ref-ui.tsx:L1144-L1147`, không có usage khác).
- **[CẬP NHẬT đợt 2]** (Q-01, Q-03) Mỗi Attempt có N `AttemptAnswer` **persist** trong `attempt_answers` (kèm `position` theo thứ tự câu của attempt — BR-62, BR-68). Attempt thuộc môn/bộ đề đã soft-delete bị **ẩn** khỏi mọi danh sách/lịch sử/thống kê (BR-60).
- **Trạng thái dẫn xuất theo điểm:** `>= 8.5` Xuất sắc · `7.0 – <8.5` Khá giỏi · `< 7.0` Cần cố gắng (`ref-ui.tsx:L1211-L1213`).

### 4.7 QuizSession — state phiên làm bài — **không persist**

| Tên | Kiểu | Ý nghĩa | Nguồn |
|---|---|---|---|
| `activeQuizQuestions` | `array<Question>` | Bản sao câu hỏi đã shuffle/nhân bản, id mới `quiz-q-{i}-{sourceId}` | `ref-ui.tsx:L839`, `ref-ui.tsx:L1094-L1108` |
| `quizUserAnswers` | `Record<questionId, optionId>` | Đáp án người dùng đã chọn cho từng câu | `ref-ui.tsx:L840`, `ref-ui.tsx:L2657-L2662` |
| `quizStartTime` | `number hoặc null` | Epoch ms lúc bắt đầu | `ref-ui.tsx:L841`, `ref-ui.tsx:L1110` |
| `quizElapsedSec` | `number` (int) | Số giây đã trôi qua, cập nhật mỗi 1s | `ref-ui.tsx:L842`, `ref-ui.tsx:L856-L862` |
| `lastQuizResult` | `Attempt hoặc null` | Bản ghi kết quả vừa nộp để render SCREEN-07 | `ref-ui.tsx:L843`, `ref-ui.tsx:L1155` |
| *(status)* | `string` (dẫn xuất) | `configured` → `active` (`quizActive`) → `submitted` (`quizResult`) → `reviewed` | `ref-ui.tsx:L1113`, `ref-ui.tsx:L1156` |

- Sống trong RAM; breadcrumb/nav không xóa ngay nhưng biến mất khi app đóng `[GIẢ ĐỊNH]` (`ref-ui.tsx:L839-L844`).

### 4.8 AttemptAnswer — `attempt_answers` — **persist** (chính thức)

> **[CẬP NHẬT đợt 2]** Q-03 **chốt**: có bảng `attempt_answers`. ref-ui chỉ có state RAM (dòng dưới giữ bằng chứng `ref-ui.tsx`); bảng dưới đây là **spec đích** cho SQLite.

| Tên | Kiểu | Ý nghĩa | Nguồn |
|---|---|---|---|
| `id` | `string` | PK; sinh `aa-{timestamp}` (hoặc autoincrement) `[GIẢ ĐỊNH]` | Q-03 · BR-68 |
| `attemptId` | `string` (FK Attempt) | Lượt làm chứa câu trả lời này | Q-03 · BR-68 |
| `questionId` | `string` | Khóa của câu trong phiên (id `quiz-q-*` theo ref-ui) hoặc id câu gốc `[GIẢ ĐỊNH]` | `ref-ui.tsx:L1119` |
| `position` | `number` (int) | **[YÊU CẦU MỚI]** Thứ tự câu **trong attempt** — lưu cấu trúc sau khi xáo của phiên (R1, BR-62); dựng lại đúng thứ tự khi xem lại | R1 · BR-62 |
| `optionOrder` | `string[]` (mảng ID trên wire; JSON TEXT ở DB) | **[CẬP NHẬT đợt 3]** (Q-19) Thứ tự option của câu trong phiên sau khi xáo; lưu cùng attempt để xem lại đúng như lúc làm. Nhãn A/B/C/D gán theo vị trí hiển thị, không gắn với option (BR-72). | Q-19 · BR-72 |
| `selectedOptionIds` | `array<string>` hoặc `null` | **[CẬP NHẬT đợt 2]** (Q-10, BR-24/BR-63) Tập lựa chọn của người dùng — **nhiều** option cho câu nhiều đáp án đúng; `null` nếu bỏ trống. ref-ui chỉ có `selectedOptionId` đơn (`ref-ui.tsx:L2656`) | Q-10 · BR-63 |
| `questionText` | `string` | Snapshot nội dung câu hỏi khi nộp | Q-04 · BR-81 |
| `optionsSnapshot` | JSON array `{id,text}` | Snapshot toàn bộ lựa chọn khi nộp | Q-04 · BR-81 |
| `correctOptionIds` | JSON array ID (`string[]`) | Snapshot tập đáp án đúng dùng để chấm khi nộp | Q-04 · BR-81 |
| `isCorrect` | `boolean` | Kết quả chấm **tại thời điểm nộp**; câu nhiều đáp án đúng chấm đúng khi tập chọn **trùng khớp hoàn toàn** tập đáp án đúng (ĐÃ CHỐT, BR-63) | `ref-ui.tsx:L1120-L1123`, Q-10 |

- **[CẬP NHẬT đợt 2] (Q-03, BR-68)** **Chính thức & persist**: ghi xuống SQLite **khi nộp bài**; nhờ đó màn “Chi tiết đáp án” **dựng lại được sau khi đóng/mở lại app**. ref-ui không persist từng câu ⇒ chỉ xem được ngay sau khi nộp (`ref-ui.tsx:L1116-L1152`, `ref-ui.tsx:L2771-L2777`).
- **[CẬP NHẬT đợt 5] Q-04 ĐÃ CHỐT:** lưu snapshot khi nộp; xem lại đọc từ snapshot `questionText`, `optionsSnapshot`, `correctOptionIds`, không phụ thuộc câu hỏi hiện tại (BR-81).
- **Bảo toàn phiên:** mỗi attempt có đúng `totalQuestions` dòng, `position` = 0..n-1 theo thứ tự câu trong phiên (BR-62); **immutable** — không cập nhật/xóa sau khi nộp (giống Attempt); attempt của môn/bộ đề đã soft-delete bị ẩn khỏi mọi màn hình (BR-60).

### 4.9 State UI thuần túy — **không persist** (không phải thực thể nghiệp vụ)

| State | Vai trò | Nguồn |
|---|---|---|
| `activeTab`, `sidebarOpen`, `logoHovered` | Điều hướng & layout | `ref-ui.tsx:L796-L798` |
| `statsPeriod`, `chartMetric` | Bộ lọc hiển thị dashboard | `ref-ui.tsx:L806-L807` |
| `examViewMode`, `selectedSubjectId`, `selectedExamId`, `viewResetCounter` | Vị trí trong cây nội dung | `ref-ui.tsx:L811-L814` |
| `newSubjectName`, `newSubjectColor`, `showCreateSubjectForm` | Form tạo môn | `ref-ui.tsx:L817-L819` |
| `showAnswersSwitch`, `showHistoryModal`, `showQuizConfigModal`, `quizQuestionCountInput` | Cấu hình màn tổng quan & modal làm bài | `ref-ui.tsx:L822-L825` |
| `editingExamTitle`, `editorQuestions`, `editorFormatTab`, `rawTextCode`, `parseError`, `showAllQuestionsDialog`, `focusedQuestionId`, `isEditingExistingExam` | Editor draft | `ref-ui.tsx:L828-L836` |
| `showQuizAllDialog` | Overlay nhảy câu ở quiz; highlight dùng chung `focusedQuestionId` với editor draft | `ref-ui.tsx:L844` |
| `toastMessage` | Thông báo tạm thời | `ref-ui.tsx:L847` |

### 4.10 AppSetting — `app_settings` — **[YÊU CẦU MỚI] (R2)**

> Bảng cấu hình app **mới, không có trong ref-ui** (R2, BR-66); persist trong SQLite cục bộ, app cá nhân single-user (R5) ⇒ không phân vùng theo user.

| Tên | Kiểu | Ý nghĩa | Nguồn |
|---|---|---|---|
| `key` | `string` (PK) | Khóa cấu hình; hiện chỉ có `theme` | R2 · BR-66 |
| `value` | `string` | Giá trị cấu hình; `theme` ∈ `light` / `dark` / `system`; **seed `system`** | R2 · BR-66 |
| `updatedAt` | `timestamp` (UTC) | Thời điểm cập nhật giá trị gần nhất; hiển thị theo Giờ VN (BR-64) | Q-02 · BR-66 |

- **Seed:** tạo dòng `theme = system` khi khởi động app nếu chưa tồn tại.
- **Áp dụng theme:** đọc từ DB và **áp trước khi render** (không nháy trắng màn hình); `system` = theo `prefers-color-scheme` của OS; giá trị persist trong `app_settings`, `localStorage` chỉ cache đọc sớm để chống nháy trắng, dùng duy nhất key `theme`; SQLite vẫn là nguồn persist chính.

---

## 5. Quy tắc nghiệp vụ

### 5.1 Subject (tạo môn)

| ID | Quy tắc | Bằng chứng |
|---|---|---|
| **BR-01** | Tên môn bắt buộc **sau khi trim**. Rỗng/toàn khoảng trắng → toast `Vui lòng nhập tên môn học!`, không tạo bản ghi, form giữ nguyên nội dung. | `ref-ui.tsx:L1063-L1066` |
| **BR-02** | Màu môn chọn từ **8 preset** (`charcoal #262b33`, `royalblue #3b82f6`, `emerald #10b981`, `violet #8b5cf6`, `amber #f59e0b`, `rose #f43f5e`, `cyan #06b6d4`, `indigo #6366f1`). Mặc định khi mở form: preset đầu tiên `#262b33`. | `ref-ui.tsx:L147-L156`, `ref-ui.tsx:L818`, `ref-ui.tsx:L2012-L2029` |
| **BR-03** | `createdAt` = ngày hiện tại, format `YYYY-MM-DD`, sinh bằng `new Date().toISOString().slice(0, 10)` ⇒ **theo UTC**, không theo giờ máy. | `ref-ui.tsx:L1071` |
| **BR-04** | ref-ui **Không chặn trùng tên**: hai môn cùng tên được phép tạo (`ref-ui.tsx:L1061-L1073`). **[CẬP NHẬT đợt 2]** Spec chốt Q-15: tên môn phải **unique toàn cục** — so sánh sau `trim()`, **không phân biệt hoa thường + bỏ khoảng trắng** `[GIẢ ĐỊNH]`; bản soft-deleted **không** chiếm tên; trùng → toast lỗi tiếng Việt, không tạo bản ghi (chi tiết BR-59). | Q-15 · BR-59 |
| **BR-05** | Môn mới **append cuối** `subjects`; grid render đúng thứ tự mảng ⇒ môn mới nằm cuối lưới. | `ref-ui.tsx:L1073`, `ref-ui.tsx:L2054` |
| **BR-06** | Sau khi tạo: reset `newSubjectName`, đóng form, toast `Đã tạo môn "<name>"`; màu đang chọn **không** reset. | `ref-ui.tsx:L1074-L1076` |
| **BR-07** | Màu môn được dùng làm: avatar chữ cái đầu của card môn, badge “N câu hỏi” của bộ đề, dot trong breadcrumb, badge môn ở tổng quan bộ đề (fallback `#262b33` nếu thiếu subject). | `ref-ui.tsx:L2068-L2073`, `ref-ui.tsx:L2145-L2150`, `ref-ui.tsx:L1895-L1899`, `ref-ui.tsx:L2185-L2189` |

### 5.2 Exam (tạo / sửa / hiển thị)

| ID | Quy tắc | Bằng chứng |
|---|---|---|
| **BR-08** | Lưu bộ đề yêu cầu **≥ 1 câu hỏi**. Rỗng → toast `Bộ đề cần có ít nhất 1 câu hỏi!`, ở lại editor, không tạo/cập nhật. | `ref-ui.tsx:L1025-L1028` |
| **BR-09** | Title được `trim()`; nếu rỗng → lưu với giá trị `Chưa có tiêu đề` (không chặn lưu). | `ref-ui.tsx:L1029` |
| **BR-10** | `createdAt` khi tạo mới: `new Date().toISOString().slice(0,16).replace('T',' ')` ⇒ format `YYYY-MM-DD HH:mm` nhưng **theo UTC** (`ref-ui.tsx:L1030`). Khi **cập nhật**, `createdAt` giữ nguyên. **[CẬP NHẬT đợt 2]** Q-02: cập nhật **ghi `updatedAt`** (lưu UTC, hiển thị theo Giờ VN — BR-64); ref-ui không có `updatedAt` (`ref-ui.tsx:L1032-L1039`). | Q-02 · BR-64 |
| **BR-11** | Tạo mới: **prepend** vào đầu `exams`, **chọn luôn** bộ đề vừa tạo, chuyển `examDetail`, tắt “Hiện đáp án”, toast `Đã tạo bộ đề "<title>" thành công!`. | `ref-ui.tsx:L1050-L1054` |
| **BR-12** | Cập nhật: ghi đè `title` + `questions` **tại chỗ** (giữ vị trí trong mảng), chuyển `examDetail`, toast `Đã cập nhật bộ đề "<title>"`; **không** reset “Hiện đáp án”. | `ref-ui.tsx:L1032-L1041` |
| **BR-13** | Danh sách bộ đề của môn = `exams.filter(e => e.subjectId === currentSubject.id)`, giữ **thứ tự mảng** (mới nhất ở đầu vì tạo mới prepend). | `ref-ui.tsx:L2131-L2133`, `ref-ui.tsx:L1050` |
| **BR-14** | Số câu của bộ đề là **giá trị dẫn xuất** `questions.length`, không lưu riêng; hiển thị ở badge card, header tổng quan, nút “Tất cả (n)”. | `ref-ui.tsx:L2149`, `ref-ui.tsx:L2194`, `ref-ui.tsx:L2967` |
| **BR-15** | “Hiện đáp án” mặc định **OFF**, và bị **reset OFF mỗi lần vào `examDetail`** (từ breadcrumb, từ danh sách, từ kết quả). | `ref-ui.tsx:L822`, `ref-ui.tsx:L975`, `ref-ui.tsx:L2208-L2231` |
| **BR-16** | ref-ui không có sửa/xóa bộ đề ở danh sách; chỉ sửa được từ nút “Sửa đề” trong `examDetail` (clone sâu câu hỏi trước khi sửa) (`ref-ui.tsx:L2243-L2249`, `ref-ui.tsx:L1014-L1022`). **[CẬP NHẬT đợt 2]** Q-01: ngoài “Sửa đề”, bổ sung **xóa mềm** bộ đề (dialog xác nhận, thùng rác/khôi phục) — BR-60. | Q-01 · BR-60 |

### 5.3 Cấu hình & thực hiện làm bài

| ID | Quy tắc | Bằng chứng |
|---|---|---|
| **BR-17** | Mở modal cấu hình từ `examDetail`: số câu mặc định = `min(25, questions.length)`; preset nhanh `25 / 32 / 40 / Tất cả (n)`. | `ref-ui.tsx:L2253-L2258`, `ref-ui.tsx:L2942-L2968` |
| **BR-18** | Ô nhập số câu: `type="number"`, `min=1`, `max=200` (ràng buộc HTML, **không clamp trong code**). | `ref-ui.tsx:L2926-L2933` |
| **BR-19** | Khi bắt đầu: `requestedCount = max(1, parseInt(input,10) hoặc 1)` ⇒ chuỗi không phải số → 1; không có chặn trên ⇒ nhập 500 sẽ tạo 500 câu. | `ref-ui.tsx:L1084` |
| **BR-20** | Pool được **shuffle Fisher–Yates** trên bản copy `[...currentExam.questions]`, không mutate dữ liệu gốc (`ref-ui.tsx:L1085-L1091`). **[CẬP NHẬT đợt 2]** R1: việc random câu **chuyển xuống BE** (không shuffle phía client như ref-ui); mặc định **bật random**, cho phép tắt `[GIẢ ĐỊNH]` (BR-61). **[CẬP NHẬT đợt 3]** (Q-19) xáo thứ tự option đi kèm xáo câu (BR-72); tắt random tắt cả xáo câu lẫn xáo option (BR-73). | R1 · BR-61 · Q-19 |
| **BR-21** | ref-ui: nếu `requestedCount > pool.length` thì **lặp câu** `pool[i % pool.length]`, gắn hậu tố ` (Lượt ôn #n)`, mỗi câu sinh id mới `quiz-q-{i}-{sourceId}`, options copy nông (`ref-ui.tsx:L1093-L1106`). **[CẬP NHẬT đợt 2]** Đối chiếu R1 ↔ BR-21 cũ và **chốt: bỏ lặp câu** — hành vi đích: chọn **N câu không trùng**; `N ≥ pool.length` ⇒ lấy **hết** pool (không nhân bản), vẫn xáo thứ tự; hậu tố “Lượt ôn” **không còn xuất hiện**; vẫn giữ id mới `quiz-q-{i}-{sourceId}` + copy options (BR-61, BR-62). **[CẬP NHẬT đợt 3]** (Q-19) xáo thứ tự option cùng câu theo từng lượt (BR-72). | R1 · BR-61 · BR-62 · Q-19 |
| **BR-22** | Bắt đầu làm bài: set `activeQuizQuestions`, reset `quizUserAnswers = {}`, `quizStartTime = Date.now()`, `quizElapsedSec = 0`, đóng modal, chuyển `quizActive`. | `ref-ui.tsx:L1108-L1113` |
| **BR-23** | Đồng hồ: chỉ chạy khi `examViewMode === 'quizActive'` và có `quizStartTime`; mỗi 1s tính lại `floor((Date.now() - start)/1000)` (không cộng dồn ⇒ không drift); hiển thị `mm:ss`. | `ref-ui.tsx:L856-L862`, `ref-ui.tsx:L2576-L2579` |
| **BR-24** | Chọn đáp án: ref-ui mỗi câu **tối đa 1 lựa chọn** (radio), lưu `quizUserAnswers[questionId]`, cho phép **đổi**, không có thao tác bỏ chọn (`ref-ui.tsx:L2657-L2662`, `ref-ui.tsx:L2617`). **[CẬP NHẬT đợt 2]** Q-10: câu có **nhiều đáp án đúng** dùng **checkbox** — chọn **nhiều** lựa chọn (tập `selectedOptionIds`); câu có 1 đáp án đúng giữ **radio**. Không chặn nộp khi còn câu trống, nhưng nay **có cảnh báo** trước khi nộp (BR-67). | Q-10 · BR-63 · BR-67 |
| **BR-25** | Chấm điểm: `correct` = số câu **đúng**; `total` = số câu của phiên; `score = Number(((correct/total)*10).toFixed(1))` ⇒ làm tròn 1 chữ số thập phân, chấm theo **số câu**, không theo trọng số (`ref-ui.tsx:L1116-L1127`); ref-ui tính câu đúng = `chosenOpt.isCorrect === true`. **[CẬP NHẬT đợt 2]** Q-10: câu **nhiều đáp án đúng** chỉ chấm **đúng** khi tập lựa chọn người dùng **trùng khớp hoàn toàn** tập đáp án đúng — **không chấm từng phần** (ĐÃ CHỐT); chọn thiếu/dư/đảo = sai; câu trống = sai (chi tiết BR-63). | Q-10 · BR-63 |
| **BR-26** | Nộp bài tạo `Attempt` **snapshot**: `examId`, `examTitle`, `subjectId`, `subjectName` lấy tại thời điểm nộp (fallback `sub-1` / `Môn học`); `durationSec = quizElapsedSec` (`ref-ui.tsx:L1128-L1152`); ref-ui sinh `timestamp` theo **giờ local máy**. **[CẬP NHẬT đợt 2]** Q-06: `timestamp` **lưu UTC**, hiển thị `YYYY-MM-DD HH:mm` theo **Giờ Việt Nam** `Asia/Ho_Chi_Minh` (UTC+7, không DST) — BR-64; nộp bài đồng thời ghi `attempt_answers` (BR-68). | Q-06 · BR-64 · BR-68 |
| **BR-27** | Attempt mới được **prepend** vào `attempts`, gán `lastQuizResult`, chuyển `quizResult`, toast `Hoàn thành bài kiểm tra! Điểm của bạn: <score>/10`. Không reset câu trả lời (giữ để xem lại). | `ref-ui.tsx:L1154-L1157` |
| **BR-28** | Lịch sử của một bộ đề = `attempts.filter(a => a.examId === id)`, giữ thứ tự mảng (mới nhất trước), đánh số `Lần #{index+1}` / `#{index+1}` theo **vị trí trong danh sách đã lọc**. | `ref-ui.tsx:L2289-L2298`, `ref-ui.tsx:L2734-L2747` |
| **BR-29** | Nếu chưa có lượt nào: hiện text `Bạn chưa làm bài kiểm tra nào thuộc bộ đề này.`; ở kết quả, danh sách rỗng không có empty state riêng. | `ref-ui.tsx:L2282-L2286` |
| **BR-30** | “Làm lại đề” từ SCREEN-07 mở lại modal cấu hình **không reset** `quizQuestionCountInput` (giữ số câu của lần trước). | `ref-ui.tsx:L2717-L2723` |

### 5.4 Dashboard & thống kê

| ID | Quy tắc | Bằng chứng |
|---|---|---|
| **BR-31** | 4 metric toàn cục: (1) Tổng bài đã làm = `attempts.length`; (2) Điểm TB = trung bình `score`, `toFixed(1)`, không có dữ liệu → `'0.0'`; (3) Tổng câu đã giải = Σ`totalQuestions`; (4) Tỉ lệ chính xác = Σ`correctCount` / Σ`totalQuestions` × 100, `toFixed(1)`. | `ref-ui.tsx:L1164-L1174` |
| **BR-32** | Kỳ thống kê `week/month/year` **không lọc lại attempts**: chỉ cộng số ảo vào metric và đổi nhãn series. Cụ thể: `month` +59 bài & +1420 câu; `year` +242 bài & +6150 câu; điểm TB và tỉ lệ chính xác **giữ nguyên** (`ref-ui.tsx:L1216-L1230`). **[CẬP NHẬT đợt 2]** Q-05: **hành vi đích** = lọc **thật** theo `timestamp` của attempts trong kỳ (ranh giới tuần/tháng/năm tính theo Giờ VN — BR-64), **bỏ hoàn toàn số ảo** `+59/+1420/+242/+6150`, điểm TB & tỉ lệ chính xác **đổi theo kỳ**; việc bật lọc thật **làm ở sprint cuối** — hiện ref-ui/mock vẫn cộng số ảo (schema sẽ có `submitted_at` + index sẵn). | Q-05 · BR-32 |
| **BR-33** | Series biểu đồ: `week` = 7 điểm `T2..CN`; `month` = 4 điểm `Tuần 1..4`; `year` = 6 điểm `T5..T10`. Phần lớn count/avgScore là **mock cố định**, **trừ điểm cuối mỗi series phụ thuộc `attempts`**: `CN`.count = `max(3, attempts.length - 2)`; `Tuần 4`.count = `19 + attempts.length`; `T10`.count = `54 + attempts.length`; `avgScore` của điểm cuối = điểm TB thật (`ref-ui.tsx:L1176-L1208`, `ref-ui.tsx:L1186-L1190`, `ref-ui.tsx:L1197`, `ref-ui.tsx:L1206`). **[CẬP NHẬT đợt 2]** Q-05: **hành vi đích** = series đếm/điểm **thật** từ attempts thuộc kỳ (lọc theo ranh giới Giờ VN — BR-64); **làm ở sprint cuối** — hiện tại mọi điểm series vẫn là mock như trên. | Q-05 · BR-33 |
| **BR-34** | Phân phối điểm: Xuất sắc `score >= 8.5`; Khá giỏi `7.0 <= score < 8.5`; Cần cố gắng `score < 7.0`; % = `count / max(1, tổng)` × 100, `toFixed(1)`. Luôn tính trên **toàn bộ** attempts (“All Time”), không theo kỳ. | `ref-ui.tsx:L1210-L1214`, `ref-ui.tsx:L1710-L1714` |
| **BR-35** | `chartMetric` chỉ đổi **style** nút (`both` / `score`); dữ liệu series vẽ ra **không** phụ thuộc giá trị này (biểu đồ luôn vẽ cả cột số bài và đường điểm) (`ref-ui.tsx:L1604-L1625`, `ref-ui.tsx:L1654-L1703`). **[CẬP NHẬT đợt 2]** Q-05: khi lọc kỳ chuyển sang **thật** (sprint cuối, BR-32/BR-33), `chartMetric` vẫn chỉ đổi style — số liệu nền của series sẽ là dữ liệu thật theo kỳ; Q-08 (ẩn/bớt series theo lựa chọn) **chưa chốt**. | Q-05 · BR-32 |
| **BR-36** | Bảng “Lịch sử làm bài gần đây” ở dashboard lấy `attempts.slice(0, 6)` theo thứ tự mảng (mới nhất trước), cột: STT, tên bộ đề, môn, thời gian nộp, `correct/total`, điểm. | `ref-ui.tsx:L1830-L1856` |

### 5.5 Nhập / xuất dữ liệu (JSON ↔ TXT ↔ state)

| ID | Quy tắc | Bằng chứng |
|---|---|---|
| **BR-37** | Serialize JSON: mảng `[{ ask, answer: [{ "true" hoặc "false": text }] }]`; đúng 1 key mỗi object lựa chọn; indent bằng tab (`JSON.stringify(..., null, '\t')`). | `ref-ui.tsx:L39-L47` |
| **BR-38** | Serialize TXT: mỗi câu bắt đầu `ask : <nội dung>`; đáp án đúng `ans.* <text>`; sai `ans. <text>`; các câu cách nhau **một dòng trống**. | `ref-ui.tsx:L49-L59` |
| **BR-39** | Parse JSON: input **phải là mảng**, nếu không ném lỗi `JSON phải là một mảng [...]`; `ask` không phải string → `''`; `answer` không phải mảng → `[]`. Mỗi object: có key `true` (own property) → `isCorrect = true`, text lấy từ `true`/`false`/`''`. Nếu không có lựa chọn nào → **fallback 4 lựa chọn rỗng**, lựa chọn đầu `isCorrect = true`. | `ref-ui.tsx:L61-L90` |
| **BR-40** | Parse TXT: bỏ dòng trống, trim từng dòng; `^ask\s*:` mở câu mới; `^ans\.\*` = đúng; `^ans\.` = sai (kiểm tra `ans.*` **trước** `ans.`); dòng không khớp được nối vào `ask` nếu chưa có lựa chọn, ngược lại nối vào **lựa chọn cuối** (cách 1 dấu cách). `ans.` xuất hiện trước `ask` sẽ tạo câu có `ask = ''`. Không ném lỗi trong mọi trường hợp. | `ref-ui.tsx:L92-L141` |
| **BR-41** | Lỗi parse (chỉ JSON) → giữ **nguyên** `editorQuestions` hợp lệ gần nhất, set `parseError`, raw text vẫn là nội dung người dùng đang gõ; UI hiện “Đang chờ cú pháp chuẩn...”. Không chặn Lưu. | `ref-ui.tsx:L899-L914`, `ref-ui.tsx:L2538-L2546` |
| **BR-42** | Mọi thao tác cấu trúc trong editor (sửa/xóa/chèn câu, sửa option) đều gọi `syncQuestionsToRawText` ⇒ **serialize lại toàn bộ** raw text và xóa `parseError`. | `ref-ui.tsx:L879-L887`, `ref-ui.tsx:L2458-L2469` |
| **BR-43** | Chuyển tab TXT ↔ JSON **serialize lại từ `editorQuestions`**, không cố parse raw text đang dở ⇒ nội dung không hợp lệ bị ghi đè. | `ref-ui.tsx:L889-L897` |
| **BR-44** | Thêm câu mới tại vị trí `insertIndex`: câu mặc định `Câu hỏi mới #{length+1}`, 4 lựa chọn với **B là đáp án đúng**, chèn bằng `splice`, sync raw text, focus + scroll tới câu mới. | `ref-ui.tsx:L916-L935` |
| **BR-45** | Sửa lựa chọn: đổi text trực tiếp; **thêm** lựa chọn với text mặc định `Lựa chọn mới {n+1}`, `isCorrect` chỉ khi câu chưa có lựa chọn nào; **xóa** bị chặn khi còn ≤ 2 lựa chọn; nếu xóa mất đáp án đúng thì lựa chọn đầu tiên trở thành đúng. | `ref-ui.tsx:L546-L562` |
| **BR-46** | Đổi đáp án đúng = chọn radio → **đặt duy nhất** lựa chọn đó `isCorrect = true`, tất cả còn lại `false`. Ở mode `quiz`, radio ghi nhận đáp án người dùng; ở `preview`/`result` radio chỉ hiển thị. | `ref-ui.tsx:L537-L544`, `ref-ui.tsx:L652-L697` |

### 5.6 Ràng buộc dữ liệu & khoảng trống kiểm tra

| ID | Quy tắc | Bằng chứng |
|---|---|---|
| **BR-47** | ref-ui **Không validate** khi lưu: `ask` rỗng, text lựa chọn rỗng, 0 đáp án đúng, nhiều đáp án đúng (TXT nhiều `ans.*` hoặc JSON nhiều key `true`) đều được lưu; điều kiện duy nhất là ≥ 1 câu (`ref-ui.tsx:L1024-L1029`, `ref-ui.tsx:L109-L118`, `ref-ui.tsx:L67-L74`). **[CẬP NHẬT đợt 2]** Spec chốt (R4): khi Lưu **validate** — mỗi câu phải có **≥ 2 đáp án** và **≥ 1 đáp án đúng**; dữ liệu TXT báo lỗi **theo dòng** (vì TXT từng tạo câu 0 lựa chọn); điều kiện ≥ 1 câu vẫn giữ (BR-08); **nhiều đáp án đúng vẫn hợp lệ** (Q-10). | R4 · BR-65 |
| **BR-48** | **Không có tìm kiếm / lọc theo từ khóa** ở bất kỳ màn nào; chỉ có lọc ngầm theo quan hệ (`subjectId`, `examId`). | `ref-ui.tsx:L2053-L2100`, `ref-ui.tsx:L2131-L2133` |
| **BR-49** | **Không có empty state cho danh sách môn**: nếu `subjects` rỗng, lưới render trống (khác với danh sách bộ đề có empty state). | `ref-ui.tsx:L2053-L2100`, `ref-ui.tsx:L2109-L2128` |
| **BR-50** | ref-ui **Không persist**: toàn bộ dữ liệu nằm trong `useState`, không `localStorage`, không API, không invoke; tải lại app = quay về seed ban đầu (`ref-ui.tsx:L794-L803`, `ref-ui.tsx:L1251-L1252`). **[CẬP NHẬT đợt 2]** Spec chốt (AS-01, R5): **persist SQLite cục bộ** trong thư mục app-data của OS — `subjects/exams/questions/answer_options/attempts/attempt_answers/app_settings` sống sót qua khởi động lại; **không** localStorage, không API, không cloud (BR-70). | AS-01 · R5 · BR-70 |

### 5.7 Điều hướng, breadcrumb, UI

| ID | Quy tắc | Bằng chứng |
|---|---|---|
| **BR-51** | Breadcrumb: luôn có `root`; hiện tên môn khi `examViewMode !== 'root'` và có `currentSubject`; hiện tên bộ đề khi mode ∈ `examDetail/quizActive/quizResult`; ở `examEditor` hiện `editingExamTitle.trim() hoặc 'Chưa có tiêu đề'`. | `ref-ui.tsx:L1882-L1942` |
| **BR-52** | Click `root` → reset về `root`, xóa `selectedSubjectId/selectedExamId`, đóng & xóa form tạo môn, tăng `viewResetCounter` (remount tab), toast `Đã làm mới trang danh sách môn (root)`. | `ref-ui.tsx:L952-L960`, `ref-ui.tsx:L1868` |
| **BR-53** | Click tên môn → về `subject`, xóa `selectedExamId`, tăng reset counter; chỉ toast `Đã đặt lại trang môn học` khi đang **ở chính** trang môn. | `ref-ui.tsx:L962-L970` |
| **BR-54** | Click tên bộ đề → về `examDetail`, tắt “Hiện đáp án”, đóng panel lịch sử & modal cấu hình; toast `Đã đặt lại trang bộ đề` khi đang ở chính trang đó. | `ref-ui.tsx:L972-L982` |
| **BR-55** | Chuyển tab sidebar (`home/exams/guide`) **không** reset `examViewMode`/`selectedSubjectId` ⇒ quay lại tab Đề kiểm tra sẽ về đúng màn hình cũ (kể cả `quizResult`). | `ref-ui.tsx:L1430-L1433`, `ref-ui.tsx:L811-L813` |
| **BR-56** | Toast: tại một thời điểm chỉ có 1 message; message mới thay message cũ; tự xóa sau **2800ms** (chỉ xóa nếu vẫn là message đó). | `ref-ui.tsx:L847-L853` |
| **BR-57** | Sidebar mở/đóng: mở = `md:w-64` + hiện label/profile; đóng = `md:w-20`, ẩn label; hover logo đổi icon thành `PanelLeft` (`ref-ui.tsx:L1347-L1350`, `ref-ui.tsx:L1363-L1375`). ref-ui còn nút Power gọi `handleResetRoot` (`ref-ui.tsx:L1473-L1479`) + nút Settings/Power ở footer (`ref-ui.tsx:L1466-L1472`). **[CẬP NHẬT đợt 2]** Q-13/Q-14 **LOẠI BỎ** 2 nút Settings/Power — thay bằng **nút Theme** (`ThemeToggle`) 3 chế độ Sáng/Tối/Theo hệ thống, icon `Sun`/`Moon`/`Monitor`, tooltip + `aria-label` (R2, BR-66). | Q-13 · Q-14 · R2 · BR-66 |
| **BR-58** | Copy prompt dùng `textarea` + `document.execCommand('copy')` (không dùng Clipboard API), toast `Đã sao chép Prompt JSON vào bộ nhớ tạm!`. | `ref-ui.tsx:L1241-L1249` |

### 5.8 Danh mục toast (business message)

| Toast | Ngữ cảnh | Bằng chứng |
|---|---|---|
| `Vui lòng nhập tên môn học!` | Tạo môn với tên rỗng | `ref-ui.tsx:L1064` |
| `Đã tạo môn "<name>"` | Tạo môn thành công | `ref-ui.tsx:L1076` |
| `Bộ đề cần có ít nhất 1 câu hỏi!` | Lưu bộ đề rỗng | `ref-ui.tsx:L1026` |
| `Đã tạo bộ đề "<title>" thành công!` | Tạo bộ đề mới | `ref-ui.tsx:L1054` |
| `Đã cập nhật bộ đề "<title>"` | Cập nhật bộ đề | `ref-ui.tsx:L1041` |
| `Hoàn thành bài kiểm tra! Điểm của bạn: <score>/10` | Nộp bài | `ref-ui.tsx:L1157` |
| `Đã làm mới trang danh sách môn (root)` | Click breadcrumb root | `ref-ui.tsx:L959` |
| `Đã đặt lại trang môn học` | Click breadcrumb môn khi đang ở trang môn | `ref-ui.tsx:L968` |
| `Đã đặt lại trang bộ đề` | Click breadcrumb bộ đề khi đang ở tổng quan | `ref-ui.tsx:L980` |
| `Đã đặt lại trình soạn thảo đề` | Click breadcrumb ở editor | `ref-ui.tsx:L1935` |
| `Đã sao chép Prompt JSON vào bộ nhớ tạm!` | Copy prompt | `ref-ui.tsx:L1248` |
| `Hệ thống đang ở chế độ giao diện Neumorphic Soft UI` | ref-ui bắn khi bấm nút Settings (`ref-ui.tsx:L1467`). **[CẬP NHẬT đợt 2]** **LOẠI BỎ** — Q-14 bỏ nút Settings, không còn ngữ cảnh bắn toast này (BR-57, BR-66) | Q-14 · BR-57 |
| `Tên môn "<name>" đã tồn tại!` `[GIẢ ĐỊNH]` (chuỗi chính xác cần chốt) | Tạo môn trùng tên — so khớp sau trim, không phân biệt hoa thường + bỏ khoảng trắng (BR-59) | **[YÊU CẦU MỚI]** Q-15 |
| `Bộ đề "<title>" đã tồn tại trong môn này!` `[GIẢ ĐỊNH]` (chuỗi chính xác cần chốt) | Lưu bộ đề trùng tên **trong cùng môn** (BR-59) | **[YÊU CẦU MỚI]** Q-15 |

### 5.9 Quy tắc bổ sung đợt 2–5 (BR-59..BR-81)

> Nguồn: các quyết định đợt 2 (Q-01, Q-02, Q-03, Q-05, Q-06, Q-10, Q-11, Q-13/Q-14, Q-15) + yêu cầu mới R1–R5. Các BR này **không thay thế** BR-01..BR-58; khi mâu thuẫn, BR ở mục này là nguồn sự thật.

| ID | Quy tắc | Bằng chứng |
|---|---|---|
| **BR-59** | **Unique tên (Q-15):** tên **môn** unique **toàn cục**; tên **bộ đề** unique **trong cùng môn**. So khớp: sau `trim()`, **không phân biệt hoa thường** + **bỏ toàn bộ khoảng trắng** `[GIẢ ĐỊNH]`. Bản soft-deleted **không** chiếm tên (tên giải phóng khi xóa mềm). Vi phạm → chặn lưu + toast lỗi tiếng Việt (§5.8), không tạo/cập nhật bản ghi. | Q-15 · BR-04 |
| **BR-60** | **Soft delete + cascade (Q-01):** xóa môn/bộ đề = gán `deleted_at` (**không xóa vật lý**), có **dialog xác nhận** trước khi xóa. Xóa môn → **cascade ẩn** toàn bộ bộ đề/câu hỏi/attempt thuộc môn; xóa bộ đề → ẩn câu hỏi & attempt của bộ đề. Mọi danh sách, thống kê, lịch sử **không tính** dữ liệu đã ẩn (BR-31..BR-36, BR-48). Có màn “thùng rác / khôi phục” (Q-21 ĐÃ CHỐT): đưa môn/bộ đề trở lại (dữ liệu con chưa bị xóa riêng lẻ tự hiện lại). | Q-01 · Q-21 · §1.4 · §4.2 · §4.3 · BR-71 |
| **BR-61** | **Random câu hỏi (R1):** Quiz Config **mặc định bật random**: chọn **N câu ngẫu nhiên không trùng** từ pool + **xáo thứ tự** câu; `N ≥ pool.length` ⇒ lấy **hết** pool, **vẫn xáo**; cho phép **tắt random** `[GIẢ ĐỊNH]` (mặc định bật) → lấy N câu theo thứ tự gốc, không xáo. **Logic random nằm ở BE** (không shuffle phía client như ref-ui — BR-20). Số câu > pool.length **không còn nhân bản** — hết cơ chế “Lượt ôn” (BR-21). | R1 · BR-20 · BR-21 |
| **BR-62** | **Thứ tự câu theo attempt (R1):** thứ tự **sau khi xáo** được lưu theo từng attempt qua **`attempt_answers.position`** (0..n-1); màn xem lại / lịch sử hiển thị đúng thứ tự làm bài, độc lập với thứ tự câu trong `Exam.questions`. | R1 · §4.8 |
| **BR-63** | **Chấm nhiều đáp án (Q-10)** **ĐÃ CHỐT**: câu **nhiều đáp án đúng** chỉ chấm **đúng** khi tập lựa chọn của người dùng **trùng khớp hoàn toàn** tập đáp án đúng — **không chấm từng phần**; chọn thiếu / chọn dư / sai vị trí = **sai**; câu **trống** = sai. Câu 1 đáp án đúng giữ nguyên cách chấm radio (đúng lựa chọn duy nhất). Tổng điểm vẫn `correct/total*10`, 1 chữ số thập phân (BR-25). | Q-10 · BR-24 · BR-25 |
| **BR-64** | **Giờ Việt Nam (Q-06):** lưu **UTC** toàn bộ; **hiển thị** mọi thời gian (tạo/sửa môn & bộ đề, `timestamp` attempt, `updatedAt`, bảng lịch sử) theo `Asia/Ho_Chi_Minh` (UTC+7, **không DST**). **Mọi ranh giới** hôm nay/tuần/tháng/năm (kỳ thống kê, nhãn “H.Nay”, lọc thật Q-05) tính theo múi giờ này — không theo UTC, không theo giờ máy (BR-03/BR-10/BR-26/BR-32). | Q-06 · Q-05 · §2 (Giờ Việt Nam) |
| **BR-65** | **Validate TXT (R4):** khi Lưu/dán TXT, validate **từng câu**: phải có **≥ 2 đáp án** và **≥ 1 đáp án đúng**; không đạt → báo lỗi **theo dòng** (liệt kê số dòng của câu vi phạm) `[GIẢ ĐỊNH]` — TXT từng tạo câu 0 lựa chọn (BR-40) giờ bị chặn ở bước Lưu (BR-47). Ngoài ra editor TXT **tô màu token**: `ask` **đỏ**, `ans.` **xanh**. | R4 · BR-40 · BR-47 |
| **BR-66** | **Theme persist (R2):** nút **Theme** 3 chế độ **Sáng / Tối / Theo hệ thống** — icon `Sun` / `Moon` / `Monitor`, có **tooltip + `aria-label`**. `system` = theo `prefers-color-scheme` của OS. Giá trị lưu trong `app_settings.theme` (seed `system`, §4.10), **áp trước khi render** (không nháy trắng). Đây là nút thay 2 nút Settings/Power đã loại bỏ (Q-13/Q-14, BR-57). | R2 · BR-57 · §4.10 |
| **BR-67** | **Cảnh báo câu trống khi nộp (Q-11):** bấm Nộp bài mà còn câu chưa trả lời → mở **dialog** nêu **số câu chưa làm** + **liệt kê số thứ tự các câu trống**; có 2 nút: **“Quay lại làm tiếp”** (đóng dialog, ở lại phiên) và **“Vẫn nộp”** (tiến hành nộp). Không còn câu trống → nộp thẳng như cũ (BR-27). | Q-11 · BR-24 · BR-27 |
| **BR-68** | **Chi tiết đáp án sau khi đóng app (Q-03):** khi nộp bài, ghi `attempt_answers` (§4.8) xuống SQLite; màn “Chi tiết đáp án” **dựng lại được** từ DB sau khi đóng/mở lại app — không còn phụ thuộc phiên RAM (ref-ui chỉ xem được ngay sau khi nộp). Câu hỏi hiển thị theo snapshot của attempt (BR-62); điểm số giữ nguyên. | Q-03 · §4.8 |
| **BR-69** | **QuestionNavigatorDialog (R3):** dialog danh sách câu trong Quiz — **lưới số thứ tự**; trạng thái: **chưa làm / đã làm / câu hiện tại**; bấm 1 số → **đóng dialog + focus/cuộn** tới câu đó. Component `QuestionNavigatorDialog` **tái sử dụng** cho **danh sách câu trống** của dialog nộp bài (BR-67). Khác biệt bản Quiz vs Exam Overview `[GIẢ ĐỊNH]`: ở Overview dialog chỉ hiển thị trạng thái, không focus/cuộn làm bài. | R3 · BR-67 |
| **BR-70** | **Dữ liệu cục bộ (R5):** app **cá nhân, single-user** — SQLite cục bộ trong **thư mục app-data của OS**; **không đăng nhập, không phân quyền, không cloud**; không có bảng `users`, không sync. Seed dữ liệu ban đầu chỉ nạp khi DB trống. | R5 · BR-50 · AS-01 · AS-02 |
| **BR-71** | **Soft delete + đợt xóa (Q-01, Q-21):** xóa mềm môn cascade soft-delete các bộ đề thuộc môn; gán cùng `delete_batch_id` cho môn và các bộ đề cascade để phân biệt với bộ đề đã xóa riêng trước đó; khôi phục môn chỉ khôi phục đúng những bộ đề bị xóa cùng đợt. | Q-01 · Q-21 · §4.2 · §4.3 |
| **BR-72** | **Xáo thứ tự đáp án (Q-19):** mỗi câu, mỗi lượt làm, BE Rust xáo thứ tự option (cùng module với xáo câu, DRY); thứ tự option của mỗi câu trong lượt lưu vào `attempt_answers.option_order` (JSON TEXT các `option_id`) để xem lại đúng như lúc làm; nhãn A/B/C/D gán theo vị trí hiển thị sau khi xáo, không gắn với option. | Q-19 · §4.8 |
| **BR-73** | **Tắt random (R1):** tắt random tắt cả xáo câu lẫn xáo option, giữ thứ tự gốc; mặc định một công tắc chung; tách 2 công tắc riêng ghi vào câu hỏi mở. | R1 · Q-19 |
| **BR-74** | **Chấm/lưu dùng option_id:** chấm điểm và lưu đáp án luôn dùng `option_id`, không dùng nhãn chữ A/B/C/D. | Q-19 · BR-63 |
| **BR-75** | **Xáo chỉ ở chế độ làm bài:** màn xem lại, soạn bộ đề, “Chi tiết đáp án” hiển thị theo thứ tự đã lưu của lượt đó (xem lại) hoặc thứ tự gốc (soạn thảo); chỉ xáo khi làm bài. | Q-19 |
| **BR-76** | **Thùng rác UI (Q-21):** tab Thùng rác (icon `Trash2`) thêm vào sidebar ngay sau tab AI Guide, trước các nút chân sidebar; màn SCREEN-09 với 2 nhóm Môn đã xóa / Bộ đề đã xóa, tìm kiếm/lọc theo loại, hiển thị tên, môn gốc (với bộ đề), thời điểm xóa (giờ VN), số câu hỏi/lượt làm đi kèm, nhãn “xóa cùng môn” nếu cascade; hành động Khôi phục, Xóa vĩnh viễn từng mục, Dọn sạch; badge số mục trên tab (ẩn khi 0); trạng thái rỗng/đang tải/có dữ liệu/lỗi/đang xử lý; toast “Hoàn tác” sau xóa mềm `[GIẢ ĐỊNH]`. | Q-21 · SCREEN-09 |
| **BR-77** | **Khôi phục bộ đề khi môn cha bị xóa (Q-21):** **ĐÃ CHỐT (đợt 5): chặn kèm nút “Khôi phục cả môn”**, thông báo cần khôi phục môn trước. | Q-21 · Q-26 |
| **BR-78** | **Xung đột tên khi khôi phục (Q-15, Q-21):** nếu đã có bản ghi đang sống trùng tên thì không khôi phục tự động; yêu cầu đổi tên trong dialog rồi mới khôi phục. | Q-15 · Q-21 |
| **BR-79** | **Dữ liệu đã xóa mềm (Q-21):** không tính vào thống kê, lịch sử, danh sách; khôi phục xong dữ liệu (câu hỏi, lượt làm, attempt_answers) trở lại nguyên vẹn, thống kê tính lại. | Q-01 · Q-21 |
| **BR-80** | **Xóa vĩnh viễn (Q-21):** xóa cứng, kéo theo toàn bộ câu hỏi, option, attempt, attempt_answers thuộc bản ghi đó, thực hiện trong một transaction (NFR-18); xóa vĩnh viễn môn thì xóa cả bộ đề con; không tự dọn theo thời gian (không retention) `[GIẢ ĐỊNH]`. | Q-21 · NFR-18 |
| **BR-81** | **Snapshot attempt (Q-04):** khi nộp lưu nội dung câu hỏi + danh sách option (id+text) + tập đáp án đúng; xem lại đọc từ snapshot, không phụ thuộc câu hỏi hiện tại. | **[CẬP NHẬT đợt 5]** Q-04 ĐÃ CHỐT |

---

## 6. Use case

### UC-01 — Xem Dashboard tổng quan
- **Actor:** Người dùng.
- **Tiền điều kiện:** App đã mở; `activeTab = 'home'` (mặc định).
- **Luồng chính:** 1) App khởi tạo `subjects/exams/attempts` từ seed. 2) `dashboardStats` tính 4 chỉ số toàn cục. 3) Render 4 metric card. 4) Render biểu đồ cột + đường theo series của kỳ hiện tại. 5) Render phổ điểm (donut + legend). 6) Render bảng 6 lượt làm gần nhất.
- **Luồng thay thế / ngoại lệ:** Không có attempt → điểm TB `0.0`, tỉ lệ `0.0`, phổ điểm `0.0%`; bảng rỗng nhưng vẫn render header.
- **Hậu điều kiện:** Không thay đổi dữ liệu nghiệp vụ; chỉ đọc.
- **Screen / Component:** SCREEN-01 · section “Overall Data”, `dashboardStats`, bảng “Overview of Works”.

### UC-02 — Đổi kỳ thống kê
- **Actor:** Người dùng.
- **Tiền điều kiện:** Đang ở SCREEN-01.
- **Luồng chính:** 1) Chọn “Theo Tuần / Theo Tháng / Theo Năm”. 2) `statsPeriod` đổi. 3) `useMemo` tính lại metric + series. 4) Số bài & số câu được cộng offset kỳ; nhãn series đổi `T2..CN` / `Tuần 1..4` / `T5..T10`. **[CẬP NHẬT đợt 2]** 5) **Đích (Q-05, xem UC-32):** lọc attempts **thật** theo kỳ — số bài, số câu, điểm TB, tỉ lệ, series và phổ điểm chỉ tính attempt nằm trong kỳ; ranh giới kỳ tính theo `Asia/Ho_Chi_Minh` trên timestamp lưu UTC (Q-06).
- **Luồng thay thế / ngoại lệ:** **[CẬP NHẬT đợt 2]** *Hiện tại (ref-ui):* metric + series là **mock** — số ảo cộng offset (tuần +59/+1.420; tháng +242/+6.150), **không lọc attempts**; điểm TB, tỉ lệ và phổ điểm không đổi giữa các kỳ (“All Time”). *Đích:* lọc thật → **UC-32**, hạng mục **sprint cuối**.
- **Hậu điều kiện:** Chỉ đổi hiển thị; không đổi dữ liệu.
- **Screen / Component:** SCREEN-01 · period filter (`ref-ui.tsx:L1505-L1523`), `dashboardStats`.

### UC-03 — Đổi metric biểu đồ
- **Actor:** Người dùng.
- **Tiền điều kiện:** Đang ở SCREEN-01, section “Biểu đồ Tiến độ & Điểm số”.
- **Luồng chính:** 1) Chọn “Số bài & Điểm” (`both`) hoặc “Đường điểm số” (`score`). 2) `chartMetric` đổi. 3) Nút được tô đậm theo trạng thái.
- **Luồng thay thế / ngoại lệ:** Bấm lại “Đường điểm số” khi đang `score` → quay về `both`. Bấm “Số bài & Điểm” luôn set `both`. Dữ liệu biểu đồ **không** thay đổi (xem BR-35).
- **Hậu điều kiện:** Chỉ đổi style; không đổi dữ liệu.
- **Screen / Component:** SCREEN-01 · hai nút `chartMetric`, SVG polyline + capsule bars.

### UC-04 — Tạo môn học
- **Actor:** Người dùng.
- **Tiền điều kiện:** Đang ở SCREEN-02 (`root`).
- **Luồng chính:** 1) Bấm “Tạo môn học” → mở form. 2) Nhập tên. 3) Chọn 1 trong 8 ô màu. 4) Submit “Lưu môn học”. 5) Validate trim. 6) Tạo `Subject` mới, append cuối. 7) Reset tên, đóng form, toast thành công.
- **Luồng thay thế / ngoại lệ:** Tên rỗng → toast `Vui lòng nhập tên môn học!`, không tạo; bấm “Hủy”/X → đóng form, giữ tên đang gõ; **[CẬP NHẬT đợt 2]** trùng tên môn **toàn cục** (Q-15, BR-04/BR-59, so khớp sau trim) → **không tạo**, hiện **lỗi tiếng Việt** (vd `Tên môn học đã tồn tại!`), form giữ nguyên tên đang gõ.
- **Hậu điều kiện:** `subjects.length + 1`; môn mới xuất hiện cuối lưới với 0 bộ đề, 0 câu.
- **Screen / Component:** SCREEN-02 · form “Tạo môn học mới”, `handleCreateSubject`, OVL-01 (toast).

### UC-05 — Xem danh sách bộ đề của một môn
- **Actor:** Người dùng.
- **Tiền điều kiện:** Tồn tại ít nhất 1 môn.
- **Luồng chính:** 1) Click card môn ở SCREEN-02. 2) `handleNavigateToSubject` set subject, clear exam, mode `subject`. 3) Lọc exams theo `subjectId`. 4) Render card bộ đề: badge số câu (màu môn), `createdAt`, title, số lượt đã làm.
- **Luồng thay thế / ngoại lệ:** Môn chưa có bộ đề → empty state “Môn <name> chưa có bộ đề nào” + nút “Tạo bộ đề đầu tiên”.
- **Hậu điều kiện:** `examViewMode = 'subject'`; breadcrumb hiện `root > tên môn`.
- **Screen / Component:** SCREEN-03 · `handleNavigateToSubject`, danh sách card, empty state.

### UC-06 — Tạo bộ đề mới (khung mẫu)
- **Actor:** Người dùng.
- **Tiền điều kiện:** Đang ở SCREEN-03 của một môn.
- **Luồng chính:** 1) Bấm “Tạo bộ đề” (header hoặc empty state). 2) `handleOpenCreateExam` set `isEditingExistingExam = false`, title rỗng. 3) Nạp 2 câu mẫu (mỗi câu 4 lựa chọn, 1 đúng). 4) Tab format = `json`, serialize raw text. 5) Chuyển `examEditor`.
- **Luồng thay thế / ngoại lệ:** Không có; luôn tạo mới với 2 câu mẫu (không phải 0 câu).
- **Hậu điều kiện:** Editor draft chứa 2 câu mẫu, title rỗng, chưa ghi vào `exams`.
- **Screen / Component:** SCREEN-05 · `handleOpenCreateExam`, pane Render + pane Editor.

### UC-07 — Sửa câu hỏi / lựa chọn inline
- **Actor:** Người dùng.
- **Tiền điều kiện:** Đang ở SCREEN-05, có câu hỏi trong draft.
- **Luồng chính:** 1) Click vào nội dung câu hỏi → textarea. 2) Gõ nội dung. 3) Blur → thoát edit. 4) Click vào text lựa chọn → input. 5) Gõ, Enter/blur → thoát. 6) Mỗi lần thay đổi gọi `onUpdateQuestion` → cập nhật mảng → serialize lại raw text.
- **Luồng thay thế / ngoại lệ:** Xóa hết nội dung → hiển thị placeholder `(Chưa có nội dung câu hỏi - Nhấn vào để nhập)` / `(Nhấn để nhập lựa chọn)`; vẫn lưu được.
- **Hậu điều kiện:** `editorQuestions` và raw text đồng bộ; chưa ghi vào `exams`.
- **Screen / Component:** SCREEN-05 · `QuestionCard mode="editor"`, `handleAskChange`, `handleOptionTextChange`.

### UC-08 — Chèn câu hỏi tại vị trí
- **Actor:** Người dùng.
- **Tiền điều kiện:** Đang ở SCREEN-05.
- **Luồng chính:** 1) Hover vào vùng giữa hai câu (hoặc đầu danh sách) → nút “Chèn câu mới tại đây”. 2) Click → `handleInsertQuestionAt(index)`. 3) Tạo câu mặc định + 4 lựa chọn (B đúng). 4) `splice` vào mảng, sync raw text. 5) Focus + scroll tới câu mới.
- **Luồng thay thế / ngoại lệ:** Dùng OVL-03 “All (n)” → chọn số câu → đóng dialog, focus/scroll tới câu đó, highlight 2.2s.
- **Hậu điều kiện:** Số câu +1; vị trí chèn chính xác; raw text cập nhật.
- **Screen / Component:** SCREEN-05 · vùng chèn, `handleInsertQuestionAt`, OVL-03.

### UC-09 — Xóa câu hỏi
- **Actor:** Người dùng.
- **Tiền điều kiện:** Đang ở SCREEN-05, câu hỏi ở mode editor.
- **Luồng chính:** 1) Bấm icon thùng rác trên card. 2) Filter câu khỏi mảng theo index. 3) Sync raw text; số câu trên header giảm.
- **Luồng thay thế / ngoại lệ:** Xóa đến khi còn 0 câu → vẫn xóa được; khi Lưu sẽ bị chặn bởi BR-08. Không có confirm dialog.
- **Hậu điều kiện:** Câu bị xóa khỏi draft; đánh số “Câu n” được tính lại.
- **Screen / Component:** SCREEN-05 · `QuestionCard` nút xóa, `onDeleteQuestion`.

### UC-10 — Thêm / xóa lựa chọn
- **Actor:** Người dùng.
- **Tiền điều kiện:** Đang ở SCREEN-05.
- **Luồng chính:** 1) Bấm “Thêm lựa chọn” → thêm option với text `Lựa chọn mới {n+1}`. 2) Bấm X trên một lựa chọn → xóa nếu còn > 2 lựa chọn. 3) Sync raw text.
- **Luồng thay thế / ngoại lệ:** Còn đúng 2 lựa chọn → nút X không render (không thể xóa). Xóa phải đáp án đúng → lựa chọn đầu tiên được set đúng.
- **Hậu điều kiện:** Số lựa chọn thay đổi; nhãn A/B/C/D tính lại theo index.
- **Screen / Component:** SCREEN-05 · `handleAddOption`, `handleRemoveOption`.

### UC-11 — Đổi đáp án đúng
- **Actor:** Người dùng.
- **Tiền điều kiện:** Đang ở SCREEN-05, câu có ≥ 2 lựa chọn.
- **Luồng chính:** 1) Click radio của một lựa chọn. 2) Map toàn bộ options, chỉ option đó `isCorrect = true`. 3) Badge “Đúng” chuyển sang lựa chọn mới. 4) Sync raw text.
- **Luồng thay thế / ngoại lệ:** Ở mode quiz, click radio ghi nhận đáp án người dùng (không đổi `isCorrect`); ở preview/result, radio không tương tác.
- **Hậu điều kiện:** Đúng 1 đáp án đúng (nếu dữ liệu vào qua radio).
- **Screen / Component:** SCREEN-05 · `handleSetCorrectOption`, `QuestionCard` radio.

### UC-12 — Dán / parse JSON
- **Actor:** Người dùng.
- **Tiền điều kiện:** Đang ở SCREEN-05, tab `json`.
- **Luồng chính:** 1) Dán mảng JSON vào textarea. 2) Mỗi keystroke gọi `handleRawEditorChange`. 3) `JSON.parse` + map sang Question/AnswerOption (id mới). 4) Thành công → cập nhật `editorQuestions`, clear `parseError`, pane Render cập nhật ngay.
- **Luồng thay thế / ngoại lệ:** JSON sai/không phải mảng → giữ câu hỏi cũ, set `parseError`, hiện “Đang chờ cú pháp chuẩn...”; `answer` thiếu → 4 lựa chọn rỗng, lựa chọn đầu đúng; nhiều key `true` → nhiều đáp án đúng (không chặn).
- **Hậu điều kiện:** Draft đồng bộ với JSON hợp lệ gần nhất; lỗi không chặn Lưu.
- **Screen / Component:** SCREEN-05 · `parseJsonToQuestions`, `handleRawEditorChange`, pane Editor.

### UC-13 — Dán / parse TXT
- **Actor:** Người dùng.
- **Tiền điều kiện:** Đang ở SCREEN-05, tab `txt`.
- **Luồng chính:** 1) Dán text theo cú pháp `ask :`, `ans.`, `ans.*`. 2) Mỗi keystroke parse. 3) Mỗi `ask :` mở câu mới; `ans.*` đánh dấu đúng. 4) Dòng nối được ghép vào câu hỏi/lựa chọn cuối. 5) Render cập nhật ngay.
- **Luồng thay thế / ngoại lệ:** `ans.` trước `ask` → tạo câu có `ask = ''`; **[CẬP NHẬT đợt 2]** (R4, BR-47/BR-65) parser vẫn luôn trả mảng (không chặn gõ) nhưng bổ sung **validate**: mỗi câu phải có **≥ 2 đáp án** và **≥ 1 đáp án đúng**, lỗi hiển thị **theo dòng** trong pane TXT; **[CẬP NHẬT đợt 2]** (R4) pane TXT **tô màu cú pháp**: `ask` màu đỏ, `ans.` màu xanh; nhiều `ans.*` → nhiều đáp án đúng (Q-10, BR-24).
- **Hậu điều kiện:** `editorQuestions` phản ánh text đang gõ (kể cả trạng thái dở dang).
- **Screen / Component:** SCREEN-05 · `parseTxtToQuestions`, tab `txt`.

### UC-14 — Chuyển tab JSON ↔ TXT
- **Actor:** Người dùng.
- **Tiền điều kiện:** Đang ở SCREEN-05.
- **Luồng chính:** 1) Bấm tab `txt` hoặc `json`. 2) `handleSwitchEditorTab` đổi format. 3) Serialize lại toàn bộ `editorQuestions` theo format mới. 4) Clear `parseError`.
- **Luồng thay thế / ngoại lệ:** Nếu raw text đang lỗi, nội dung lỗi bị **ghi đè** bằng bản serialize từ câu hỏi hợp lệ gần nhất.
- **Hậu điều kiện:** Raw text luôn là biểu diễn hợp lệ của draft.
- **Screen / Component:** SCREEN-05 · hai tab format, `handleSwitchEditorTab`.

### UC-15 — Lưu bộ đề (tạo mới vs cập nhật)
- **Actor:** Người dùng.
- **Tiền điều kiện:** Đang ở SCREEN-05, có ≥ 1 câu.
- **Luồng chính:** 1) Nhập/sửa title. 2) Bấm “Lưu bộ đề”. 3) Validate ≥ 1 câu; **[CẬP NHẬT đợt 2]** (R4, BR-47) validate thêm: mỗi câu có **≥ 2 đáp án** và **≥ 1 đáp án đúng**. 4) Chuẩn hóa title. 5) Nếu `isEditingExistingExam` → cập nhật tại chỗ (giữ `createdAt`, thêm `updatedAt` — Q-02, BR-10); ngược lại → tạo mới, prepend, chọn bộ đề. 6) Chuyển `examDetail`, toast.
- **Luồng thay thế / ngoại lệ:** 0 câu → toast lỗi, ở lại editor; title rỗng → lưu “Chưa có tiêu đề”; đang sửa mà `currentExam` null → rơi vào nhánh tạo mới (không xảy ra qua UI); **[CẬP NHẬT đợt 2]** (Q-15, BR-59) trùng **tên bộ đề trong cùng môn** (so khớp sau trim) → **không lưu**, hiện **lỗi tiếng Việt** (vd `Tên bộ đề đã tồn tại trong môn này!`), ở lại editor; câu thiếu đáp án/đáp án đúng → báo lỗi theo dòng, không lưu.
- **Hậu điều kiện:** Bộ đề xuất hiện/được cập nhật trong `exams`; editor draft không bị xóa nhưng rời màn.
- **Screen / Component:** SCREEN-05 → SCREEN-04 · `handleSaveExamFromEditor`, OVL-01 (toast).

### UC-16 — Xem tổng quan bộ đề & bật “Hiện đáp án”
- **Actor:** Người dùng.
- **Tiền điều kiện:** Có ít nhất 1 bộ đề trong môn.
- **Luồng chính:** 1) Click card bộ đề → `examDetail`. 2) Render badge môn, tổng số câu, title, mô tả. 3) Render danh sách câu ở mode preview (ẩn đáp án). 4) Bấm công tắc “Hiện đáp án” → highlight lựa chọn đúng + badge “Đáp án đúng”.
- **Luồng thay thế / ngoại lệ:** Rời màn rồi quay lại → công tắc tự về OFF (BR-15).
- **Hậu điều kiện:** Chỉ đổi hiển thị; không sửa dữ liệu.
- **Screen / Component:** SCREEN-04 · `QuestionCard mode="preview"`, `showAnswersSwitch`.

### UC-17 — Xem lịch sử làm bài của bộ đề
- **Actor:** Người dùng.
- **Tiền điều kiện:** Đang ở SCREEN-04.
- **Luồng chính:** 1) Bấm “Lịch sử làm bài”. 2) Panel OVL-05 bung ra. 3) Lọc attempts theo `examId`. 4) Render từng dòng: `Lần #n • timestamp`, `Đúng x/y câu`, `score điểm`.
- **Luồng thay thế / ngoại lệ:** Chưa có lượt → text “Bạn chưa làm bài kiểm tra nào thuộc bộ đề này.”; bấm X hoặc nút lần nữa → đóng panel.
- **Hậu điều kiện:** Không đổi dữ liệu; `showHistoryModal` toggle.
- **Screen / Component:** SCREEN-04 + OVL-05 · `showHistoryModal`, filter `attempts`.

### UC-18 — Cấu hình & bắt đầu làm bài
- **Actor:** Người dùng.
- **Tiền điều kiện:** Đang ở SCREEN-04, bộ đề có ≥ 1 câu.
- **Luồng chính:** **[CẬP NHẬT đợt 2]** (R1, BR-21) 1) Bấm “Làm bài kiểm tra”. 2) Modal OVL-02 mở với số câu = `min(25, n)`, **mặc định bật random**: chọn N câu **không trùng** từ pool + **xáo thứ tự** (xem UC-31). 3) Chọn preset 25/32/40/Tất cả hoặc nhập tay. 4) Bấm “Làm bài ngay”. 5) BE sinh phiên: N ≥ tổng số câu → lấy hết, **vẫn xáo**; random/seed xử lý ở **backend**. 6) Reset đáp án & timer, chuyển `quizActive`; thứ tự câu trong phiên được lưu theo attempt (`attempt_answers.position` — BR-62, xem UC-20).
- **Luồng thay thế / ngoại lệ:** **[CẬP NHẬT đợt 2]** Tắt checkbox random trong OVL-02 `[GIẢ ĐỊNH]` → làm theo đúng thứ tự câu trong file; Nhập 0/âm → kẹp về 1; nhập > pool → kẹp về tổng số câu (**không lặp** — bỏ “(Lượt ôn #n)” của ref-ui, BR-21); nhập chữ → 1; bấm “Đóng”/X → không làm bài; bộ đề 0 câu → `handleStartQuiz` return im lặng (không thể xảy ra qua UI).
- **Hậu điều kiện:** QuizSession mới (random theo R1 — xem UC-31); `examViewMode = 'quizActive'`; modal đóng.
- **Screen / Component:** SCREEN-04 + OVL-02 → SCREEN-06 · `handleStartQuiz`.

### UC-19 — Làm bài (chọn đáp án, timer, nhảy câu)
- **Actor:** Người dùng.
- **Tiền điều kiện:** Đang ở `quizActive`.
- **Luồng chính:** 1) Đồng hồ chạy mm:ss. 2) Click lựa chọn → ghi nhận, thanh tiến độ tăng. **[CẬP NHẬT đợt 2]** (Q-10, BR-24/BR-63) Câu **1 đáp án đúng** → control `radio` (chọn 1, đổi được); câu **nhiều đáp án đúng** → control `checkbox` (chọn nhiều, toggle từng cái); chấm: tập đáp án người dùng phải **khớp hoàn toàn** tập đáp án đúng thì câu mới tính đúng. 3) Có thể đổi đáp án. 4) **[CẬP NHẬT đợt 2]** (R3) Bấm “All (n)” → mở **`QuestionNavigatorDialog`** (tái sử dụng OVL-04, DRY — UC-29): lưới số thứ tự **toàn bộ câu trong phiên**, trạng thái chưa làm/đã làm/câu hiện tại, cờ flag nếu có; bấm một số → đóng dialog + focus/scroll + highlight 2.2s. 5) Bấm “Nộp bài” (qua UC-30 nếu còn câu trống).
- **Luồng thay thế / ngoại lệ:** Không chọn gì vẫn nộp được (bị UC-30 cảnh báo khi còn câu trống); không có giới hạn thời gian, không auto-submit; rời tab bằng breadcrumb → phiên bị bỏ, câu trả lời chưa nộp mất theo RAM (bài đã nộp vẫn xem lại được — UC-21).
- **Hậu điều kiện:** `quizUserAnswers` phản ánh lựa chọn (checkbox → tập nhiều đáp án); `quizElapsedSec` tiếp tục tăng.
- **Screen / Component:** SCREEN-06 + `QuestionNavigatorDialog` (thay OVL-04) · `QuizControlBar`, `QuestionCard mode="quiz"` (radio/checkbox theo Q-10).

### UC-20 — Nộp bài & xem kết quả
- **Actor:** Người dùng.
- **Tiền điều kiện:** Đang ở `quizActive`.
- **Luồng chính:** **[CẬP NHẬT đợt 2]** 1) Bấm “Nộp bài”. 2) Còn câu trống → mở **`SubmitWarningDialog`** (Q-11, UC-30): hiện **liệt kê số thứ tự câu trống** + 2 lựa chọn **“Quay lại làm tiếp”** / **“Vẫn nộp”**; chọn “Vẫn nộp” → tiếp tục nộp, “Quay lại làm tiếp” → về phiên. Không còn câu trống → nộp thẳng. 3) Đếm số câu đúng (Q-10: tập đáp án khớp hoàn toàn), tính `total`. 4) `score = round(correct/total*10, 1)`. 5) Tạo Attempt + **lưu `attempt_answers`** (Q-03, BR-68): mỗi dòng gồm câu hỏi, đáp án người dùng (tập nếu nhiều đáp), tập đáp án đúng, thứ tự `position` (R1, BR-62); timestamp lưu **UTC**, hiển thị theo `Asia/Ho_Chi_Minh` (Q-06, BR-64). 6) Prepend attempts, set `lastQuizResult`. 7) Chuyển `quizResult`, toast điểm.
- **Luồng thay thế / ngoại lệ:** Nộp 0 câu → `score = 0`; câu bỏ trống được tính sai; không có giới hạn thời gian, không auto-submit; app cá nhân không đăng nhập → attempt lưu local (R5).
- **Hậu điều kiện:** Attempt + `attempt_answers` được **persist** (xem lại được sau khi đóng app — UC-21); dashboard cập nhật ngay; SCREEN-07 hiển thị điểm, số đúng, thời lượng.
- **Screen / Component:** SCREEN-06 → SCREEN-07 · `handleSubmitQuiz`, `SubmitWarningDialog` `[YÊU CẦU MỚI]`, OVL-01 (toast).

### UC-21 — Xem lại đáp án chi tiết
- **Actor:** Người dùng.
- **Tiền điều kiện:** Vừa nộp bài, đang ở SCREEN-07; **hoặc** mở lại app → vào lịch sử làm bài của bộ đề (UC-17, OVL-05) → chọn lượt làm cần xem.
- **Luồng chính:** 1) Cuộn xuống “Chi tiết đáp án bài làm”. 2) Mỗi câu render mode `result`: đáp án đúng tô xanh; lựa chọn người dùng chọn sai tô đỏ kèm icon X; đáp án đúng kèm icon check. **[CẬP NHẬT đợt 2]** 3) (Q-03, BR-68) Nguồn dữ liệu review là **`attempt_answers` đã persist** — dựng lại màn chi tiết **sau khi đóng/mở lại app** (không còn phụ thuộc state RAM của phiên vừa nộp).
- **Luồng thay thế / ngoại lệ:** Câu không chọn → không có màu đỏ, chỉ thấy đáp án đúng màu xanh; **[CẬP NHẬT đợt 2]** câu nhiều đáp án đúng (Q-10, BR-63) → hiển thị từng đáp án người dùng đã chọn, đúng hết mới xanh; attempt cũ không có `attempt_answers` (trước Q-03) → chỉ hiện điểm/tổng số, không chi tiết `[GIẢ ĐỊNH]`; không hiện lời giải thích (không có field).
- **Hậu điều kiện:** Chỉ đọc; không đổi dữ liệu.
- **Screen / Component:** SCREEN-07 (+ OVL-05) · `QuestionCard mode="result"`, đọc `attempt_answers` (Q-03).

### UC-22 — Làm lại đề
- **Actor:** Người dùng.
- **Tiền điều kiện:** Đang ở SCREEN-07, `currentExam` còn tồn tại.
- **Luồng chính:** 1) Bấm “Làm lại đề”. 2) Modal OVL-02 mở (giữ số câu lần trước). 3) Chọn số câu → “Làm bài ngay”. 4) QuizSession mới, reset đáp án/timer.
- **Luồng thay thế / ngoại lệ:** Bấm “Về tổng quan đề” thay vì làm lại → `examDetail`, công tắc đáp án OFF.
- **Hậu điều kiện:** Attempt cũ vẫn còn; attempt mới sẽ prepend khi nộp.
- **Screen / Component:** SCREEN-07 + OVL-02 → SCREEN-06 · nút “Làm lại đề”, `handleStartQuiz`.

### UC-23 — Dùng AI Guide & copy prompt
- **Actor:** Người dùng.
- **Tiền điều kiện:** `activeTab = 'guide'`.
- **Luồng chính:** 1) Đọc 3 bước hướng dẫn. 2) Bấm “Sao chép Prompt”. 3) App copy `FIXED_AI_PROMPT` vào clipboard bằng textarea ẩn. 4) Toast xác nhận. 5) Người dùng dán vào AI kèm tài liệu, nhận JSON/TXT, quay lại tab Đề kiểm tra để dán vào editor.
- **Luồng thay thế / ngoại lệ:** Click link Gemini/ChatGPT/Claude → mở tab mới; click “Đề kiểm tra” trong bước 3 → chuyển tab (không reset màn hình).
- **Hậu điều kiện:** Clipboard chứa prompt; không đổi dữ liệu app.
- **Screen / Component:** SCREEN-08 · `FIXED_AI_PROMPT`, `handleCopyPrompt`, OVL-01 (toast).

### UC-24 — Reset điều hướng bằng breadcrumb
- **Actor:** Người dùng.
- **Tiền điều kiện:** Đang ở tab Đề kiểm tra, `examViewMode != 'root'`.
- **Luồng chính:** 1) Click `root` → về danh sách môn, xóa lựa chọn, đóng form, toast. 2) Hoặc click tên môn → về danh sách bộ đề của môn. 3) Hoặc click tên bộ đề → về tổng quan bộ đề, tắt “Hiện đáp án”.
- **Luồng thay thế / ngoại lệ:** Click đúng cấp đang đứng → chỉ reset (tăng `viewResetCounter`, toast “Đã đặt lại...”), dữ liệu không đổi; ở editor click breadcrumb → nạp lại draft (mất thay đổi chưa lưu).
- **Hậu điều kiện:** `viewMode`/selection đúng cấp; state con được reset tương ứng.
- **Screen / Component:** SCREEN-02/03/04/05 · breadcrumb header, `handleResetRoot`, `handleNavigateToSubject`, `handleNavigateToExamDetail`, OVL-01 (toast).

### UC-25 — Thu gọn / mở sidebar
- **Actor:** Người dùng.
- **Tiền điều kiện:** Bất kỳ màn hình nào.
- **Luồng chính:** 1) Hover logo → icon đổi thành `PanelLeft`. 2) Click logo hoặc nút thu gọn → `sidebarOpen` toggle. 3) Sidebar đổi width, ẩn/hiện label + profile. **[CẬP NHẬT đợt 2]** (Q-13/Q-14, BR-66) 4) Vùng nút dưới cùng sidebar: **LOẠI BỎ nút Power và nút Settings** (ref-ui: Power chỉ gọi `handleResetRoot` không thoát app — `ref-ui.tsx:L1473-L1479`; Settings chỉ toast — `ref-ui.tsx:L1466-L1472`), thay bằng **nút Theme** `ThemeToggle` (icon `Sun`/`Moon`/`Monitor`) → UC-28.
- **Luồng thay thế / ngoại lệ:** Trên mobile (`< md`) sidebar luôn full width; label ẩn/hiện theo state; **[CẬP NHẬT đợt 2]** trên bản đích không còn Power/Settings — reset điều hướng chỉ qua breadcrumb (UC-24).
- **Hậu điều kiện:** Chỉ đổi layout (+ theme qua UC-28); dữ liệu và vị trí điều hướng giữ nguyên.
- **Screen / Component:** Tất cả screen · `Sidebar`, `sidebarOpen`, `logoHovered`, `ThemeToggle` `[YÊU CẦU MỚI]`.

### UC-26 — Xóa môn (soft delete, dialog xác nhận) — `[YÊU CẦU MỚI]`
- **Actor:** Người dùng.
- **Tiền điều kiện:** Tồn tại ≥ 1 môn; đang ở SCREEN-02 (card môn) hoặc SCREEN-03 (chi tiết môn).
- **Luồng chính:** 1) Bấm nút xóa trên card môn (hoặc trong SCREEN-03). 2) Mở **`DeleteConfirmDialog`**: nêu tên môn + số bộ đề bị ảnh hưởng, xác nhận “Xóa” / “Hủy”. 3) Xác nhận → set `deleted_at` (**soft delete**, Q-01/BR-60) — **không xóa vật lý**. 4) **Cascade ẩn** toàn bộ bộ đề/câu hỏi/attempt của môn; môn biến mất khỏi lưới SCREEN-02, toast thành công.
- **Luồng thay thế / ngoại lệ:** Bấm “Hủy”/đóng dialog/X → không đổi gì; thống kê Dashboard & lịch sử làm bài **bỏ qua dữ liệu đã ẩn**; đang đứng trong môn bị xóa → tự quay về SCREEN-02; khôi phục từ **Thùng rác** (SCREEN-09, UC-34) — dữ liệu con chưa bị xóa riêng lẻ tự hiện lại; app cá nhân, không phân quyền — mọi thao tác local (R5).
- **Hậu điều kiện:** `subjects` giữ nguyên bản ghi + `deleted_at` được set; mọi danh sách/thống kê/lịch sử chỉ tính `deleted_at IS NULL`.
- **Screen / Component:** SCREEN-02/SCREEN-03 · card môn, `DeleteConfirmDialog` `[YÊU CẦU MỚI]`, OVL-01 (toast).

### UC-27 — Xóa bộ đề (soft delete, dialog xác nhận) — `[YÊU CẦU MỚI]`
- **Actor:** Người dùng.
- **Tiền điều kiện:** Tồn tại ≥ 1 bộ đề; đang ở SCREEN-03 (card bộ đề) hoặc SCREEN-04 (tổng quan bộ đề).
- **Luồng chính:** 1) Bấm nút xóa trên card bộ đề (hoặc trong SCREEN-04). 2) Mở **`DeleteConfirmDialog`**: nêu tên bộ đề + cảnh báo các lượt làm bài liên quan sẽ bị ẩn khỏi thống kê/lịch sử, xác nhận “Xóa” / “Hủy”. 3) Xác nhận → set `deleted_at` (soft delete, Q-01/BR-60); **cascade ẩn** câu hỏi + attempts của bộ đề. 4) Bộ đề biến mất khỏi SCREEN-03; nếu đang ở SCREEN-04 của bộ đề đó → quay về SCREEN-03; toast thành công.
- **Luồng thay thế / ngoại lệ:** “Hủy” → không đổi gì; số bộ đề trên card môn & thống kê giảm tương ứng; attempts liên quan không bị xóa vật lý, chỉ ẩn; khôi phục từ **Thùng rác** (SCREEN-09, UC-35), xung đột tên xử lý theo BR-78.
- **Hậu điều kiện:** `exams` giữ nguyên bản ghi + `deleted_at` được set; mọi dẫn xuất (số câu, số lượt, biểu đồ) chỉ tính bản ghi chưa ẩn.
- **Screen / Component:** SCREEN-03/SCREEN-04 · card bộ đề, nút header SCREEN-04, `DeleteConfirmDialog`, OVL-01 (toast).

### UC-28 — Đổi giao diện Theme (Sáng/Tối/Hệ thống) — `[YÊU CẦU MỚI]`
- **Actor:** Người dùng.
- **Tiền điều kiện:** App đã mở; bất kỳ màn hình nào.
- **Luồng chính:** 1) Bấm nút Theme ở sidebar (icon `Sun`/`Moon`/`Monitor`) → menu 3 chế độ: **Sáng / Tối / Theo hệ thống** (Q-13/Q-14, BR-66). 2) Chọn chế độ → áp theme ngay trên toàn app. 3) Persist lựa chọn vào **`app_settings.theme`**. 4) Khởi động lại app → đọc `app_settings.theme` và **áp trước khi render** (không nháy theme mặc định).
- **Luồng thay thế / ngoại lệ:** “Theo hệ thống” → theo `prefers-color-scheme`, tự đổi khi hệ thống đổi (listener runtime); giá trị lưu không hợp lệ → fallback “Theo hệ thống” `[GIẢ ĐỊNH]`; app cá nhân không tài khoản → theme là setting local, không đồng bộ cloud (R5); **không còn màn hình Settings** (thay thế luôn chức năng còn lại của nút Settings cũ — chỉ toast).
- **Hậu điều kiện:** `app_settings.theme` phản ánh lựa chọn mới; icon nút Theme cập nhật theo chế độ hiện tại.
- **Screen / Component:** Tất cả screen · `ThemeToggle` (sidebar), `app_settings.theme` `[YÊU CẦU MỚI]`.

### UC-29 — Mở dialog danh sách câu & nhảy tới câu (làm bài) — `[YÊU CẦU MỚI]`
- **Actor:** Người dùng.
- **Tiền điều kiện:** Đang ở `quizActive` (SCREEN-06); phiên có ≥ 1 câu.
- **Luồng chính:** (R3) 1) Bấm nút “All (n)” trên `QuizControlBar` → mở **`QuestionNavigatorDialog`**. 2) Dialog hiển thị lưới **toàn bộ** số thứ tự câu **theo thứ tự của phiên** (đã random theo UC-31), mỗi ô gắn trạng thái: **chưa làm / đã làm / câu hiện tại**; ô có cờ flag nếu người dùng đã đánh dấu (nếu có tính năng cờ `[GIẢ ĐỊNH]`). 3) Bấm một số → **đóng dialog**, scroll + focus tới câu, highlight 2.2s, “câu hiện tại” cập nhật.
- **Luồng thay thế / ngoại lệ:** Đóng bằng X/Esc/nhấn lớp phủ → đóng, không nhảy; đây là thành phần **dùng chung** `QuestionNavigatorDialog` (DRY) — thống nhất tên cho OVL-03 (editor) và OVL-04 (quiz) cũ, và tái sử dụng cho danh sách câu trống của UC-30; **khác biệt bản Quiz vs Exam Overview:** bản Quiz liệt kê câu **trong phiên** kèm trạng thái đã làm/cờ (phiên có thể chỉ là tập con ngẫu nhiên), còn bản Exam Overview (SCREEN-04) liệt kê **tất cả câu của bộ đề** ở trạng thái xem trước, không trạng thái làm bài.
- **Hậu điều kiện:** Người dùng ở đúng câu bấm chọn; đáp án/tiến độ không đổi.
- **Screen / Component:** SCREEN-06 · `QuizControlBar` nút “All (n)”, `QuestionNavigatorDialog` `[YÊU CẦU MỚI]` (tái sử dụng OVL-03/OVL-04).

### UC-30 — Cảnh báo nộp bài khi còn câu trống — `[YÊU CẦU MỚI]`
- **Actor:** Người dùng.
- **Tiền điều kiện:** Đang ở `quizActive`, vừa bấm “Nộp bài”.
- **Luồng chính:** (Q-11) 1) Đếm các câu chưa chọn đáp án. 2) Còn câu trống → mở **`SubmitWarningDialog`**: thông báo “Còn x câu chưa làm”, **liệt kê số thứ tự các câu trống**; 2 nút **“Quay lại làm tiếp”** và **“Vẫn nộp”**. 3) “Quay lại làm tiếp” → đóng dialog, quay về vị trí câu hiện tại; người dùng có thể mở `QuestionNavigatorDialog` (tái sử dụng UC-29) để nhảy nhanh tới câu trống. 4) “Vẫn nộp” → thực hiện nộp bài như UC-20 (mọi câu trống tính sai).
- **Luồng thay thế / ngoại lệ:** Không còn câu trống → nộp thẳng, **không** hiện dialog; đóng dialog bằng X/Esc → coi như “Quay lại làm tiếp” `[GIẢ ĐỊNH]`; 0 câu đã làm vẫn nộp được → `score = 0`.
- **Hậu điều kiện:** Bài chỉ được nộp khi không có câu trống hoặc khi người dùng chọn “Vẫn nộp”; attempt + `attempt_answers` được lưu (UC-20).
- **Screen / Component:** SCREEN-06 · nút “Nộp bài”, `SubmitWarningDialog` `[YÊU CẦU MỚI]`, `QuestionNavigatorDialog` (dùng lại).

### UC-31 — Tạo phiên làm bài ngẫu nhiên (Quiz Config) — `[YÊU CẦU MỚI]`
- **Actor:** Người dùng.
- **Tiền điều kiện:** SCREEN-04, bộ đề có ≥ 1 câu; OVL-02 đang mở (mở từ UC-18/UC-22).
- **Luồng chính:** (R1) 1) Trong OVL-02, checkbox **random mặc định BẬT**: chọn N câu **không trùng** + **xáo thứ tự** (câu hỏi; lựa chọn theo cấu hình). 2) Nhập/chọn N (preset 25/32/40/Tất cả). 3) Bấm “Làm bài ngay” → **backend** sinh phiên: N ≥ tổng số câu → lấy hết, **vẫn xáo**; N < pool → chọn ngẫu nhiên N câu không trùng rồi xáo (seed/random xử lý ở BE, BR-21). 4) Client nhận danh sách câu theo thứ tự phiên; khi nộp, thứ tự này được persist qua `attempt_answers.position` (BR-62).
- **Luồng thay thế / ngoại lệ:** Tắt checkbox random `[GIẢ ĐỊNH]` → làm theo đúng thứ tự câu trong file; N ≤ 0 → kẹp về 1; N > pool → kẹp về tổng số câu (**không lặp** — bỏ cơ chế “(Lượt ôn #n)” của ref-ui); client **không tự shuffle**.
- **Hậu điều kiện:** `QuizSession` sinh theo thứ tự ngẫu nhiên (mặc định); thứ tự được lưu cùng attempt để xem lại đúng thứ tự đã làm.
- **Screen / Component:** OVL-02 → SCREEN-06 · checkbox random `[YÊU CẦU MỚI]`, preset số câu, `handleStartQuiz`.

### UC-32 — Lọc thống kê thật theo kỳ (Tuần/Tháng/Năm) — `[YÊU CẦU MỚI]` · **sprint cuối**
- **Actor:** Người dùng.
- **Tiền điều kiện:** SCREEN-01; attempts đã được persist (kể cả từ lần mở app trước).
- **Luồng chính:** (Q-05 — **hạng mục sprint cuối**) 1) Chọn kỳ “Tuần / Tháng / Năm”. 2) **Lọc attempts thật** theo thời điểm nằm trong kỳ: Tuần = `T2..CN` tuần hiện tại; Tháng = các tuần trong tháng; Năm = các tháng `T5..T10` (theo series hiện có). 3) Ranh giới kỳ tính theo **`Asia/Ho_Chi_Minh`** trên timestamp lưu **UTC** (Q-06, BR-64). 4) Recompute số bài, số câu, điểm TB, tỉ lệ, series và phổ điểm theo tập đã lọc. 5) Kỳ không có attempt → về trạng thái rỗng như UC-01.
- **Luồng thay thế / ngoại lệ:** **Hiện tại ref-ui là mock** — số ảo cộng offset (tuần +59/+1.420; tháng +242/+6.150), điểm TB/tỉ lệ/phổ điểm không đổi giữa các kỳ; thời gian chuyển sang lọc thật nằm trong **sprint cuối** — trước mắt giữ nguyên giao diện, chỉ dữ liệu tính toán đổi; attempt có timestamp UTC rơi vào 00:00–06:59 UTC (7–13h VN) phải tính vào **ngày VN** tương ứng.
- **Hậu điều kiện:** Metric + series phản ánh đúng tập attempt trong kỳ; không đổi dữ liệu.
- **Screen / Component:** SCREEN-01 · period filter (`ref-ui.tsx:L1505-L1523`), `dashboardStats` `[YÊU CẦU MỚI]` (lọc thật).

### UC-33 — Xem thùng rác (SCREEN-09) — `[YÊU CẦU MỚI]`
- **Actor:** Người dùng.
- **Tiền điều kiện:** App đã mở; có hoặc không có mục đã xóa mềm.
- **Luồng chính:** 1) Bấm tab “Thùng rác” trên sidebar (sau AI Guide) → SCREEN-09. 2) Hiển thị 2 nhóm: Môn đã xóa và Bộ đề đã xóa. 3) Tìm kiếm/lọc theo loại. 4) Mỗi mục hiện tên, môn gốc (với bộ đề), thời điểm xóa (giờ VN), số câu hỏi/lượt làm đi kèm, nhãn “xóa cùng môn” nếu cascade. 5) Badge số mục trên tab sidebar (ẩn khi 0).
- **Luồng thay thế / ngoại lệ:** Thùng rác rỗng → empty state; đang tải → skeleton; lỗi → thông báo lỗi; mục đang xử lý → trạng thái loading từng mục.
- **Hậu điều kiện:** Chỉ đọc; không đổi dữ liệu.
- **Screen / Component:** SCREEN-09 · sidebar tab “Thùng rác” (icon `Trash2`), danh sách 2 nhóm.

### UC-34 — Khôi phục môn — `[YÊU CẦU MỚI]`
- **Actor:** Người dùng.
- **Tiền điều kiện:** Đang ở SCREEN-09, có môn đã xóa mềm.
- **Luồng chính:** 1) Bấm “Khôi phục” trên môn. 2) Nếu không xung đột tên → đặt `deleted_at = NULL`, khôi phục các bộ đề cùng đợt xóa (`delete_batch_id`), dữ liệu con trở lại nguyên vẹn. 3) Môn biến mất khỏi thùng rác, xuất hiện lại ở SCREEN-02; toast thành công.
- **Luồng thay thế / ngoại lệ:** Xung đột tên (đã có môn sống trùng tên) → dialog yêu cầu đổi tên rồi mới khôi phục (BR-78); hủy → không đổi.
- **Hậu điều kiện:** `deleted_at = NULL`; thống kê/lịch sử tính lại.
- **Screen / Component:** SCREEN-09 · nút Khôi phục, dialog đổi tên nếu xung đột.

### UC-35 — Khôi phục bộ đề — `[YÊU CẦU MỚI]`
- **Actor:** Người dùng.
- **Tiền điều kiện:** Đang ở SCREEN-09, có bộ đề đã xóa mềm.
- **Luồng chính:** 1) Bấm “Khôi phục” trên bộ đề. 2) Nếu môn cha đang bị xóa → chặn, thông báo cần khôi phục môn trước (mặc định chặn kèm nút “Khôi phục cả môn”). 3) Nếu không xung đột tên → đặt `deleted_at = NULL`, dữ liệu con trở lại nguyên vẹn. 4) Bộ đề biến mất khỏi thùng rác, xuất hiện lại ở SCREEN-03; toast thành công.
- **Luồng thay thế / ngoại lệ:** Xung đột tên → dialog đổi tên (BR-78); hủy → không đổi.
- **Hậu điều kiện:** `deleted_at = NULL`; thống kê/lịch sử tính lại.
- **Screen / Component:** SCREEN-09 · nút Khôi phục, dialog.

### UC-36 — Xóa vĩnh viễn một mục — `[YÊU CẦU MỚI]`
- **Actor:** Người dùng.
- **Tiền điều kiện:** Đang ở SCREEN-09, có mục đã xóa mềm.
- **Luồng chính:** 1) Bấm “Xóa vĩnh viễn” trên mục. 2) Mở `DeleteConfirmDialog` biến thể xóa vĩnh viễn, cảnh báo không thể hoàn tác. 3) Xác nhận → xóa cứng trong một transaction, cascade toàn bộ câu hỏi/option/attempt/attempt_answers (NFR-18); xóa môn thì xóa cả bộ đề con. 4) Mục biến mất khỏi thùng rác; toast thành công.
- **Luồng thay thế / ngoại lệ:** “Hủy” → không đổi gì.
- **Hậu điều kiện:** Bản ghi bị xóa vật lý; không còn trong DB.
- **Screen / Component:** SCREEN-09 · nút Xóa vĩnh viễn, `DeleteConfirmDialog` (biến thể vĩnh viễn).

### UC-37 — Dọn sạch thùng rác — `[YÊU CẦU MỚI]`
- **Actor:** Người dùng.
- **Tiền điều kiện:** Đang ở SCREEN-09, có ≥ 1 mục.
- **Luồng chính:** 1) Bấm “Dọn sạch thùng rác”. 2) Mở `DeleteConfirmDialog` xác nhận xóa vĩnh viễn tất cả. 3) Xác nhận → xóa cứng tất cả mục trong thùng rác trong transaction (NFR-18). 4) Thùng rác trở thành rỗng; toast thành công.
- **Luồng thay thế / ngoại lệ:** “Hủy” → không đổi gì.
- **Hậu điều kiện:** Thùng rác rỗng.
- **Screen / Component:** SCREEN-09 · nút Dọn sạch, `DeleteConfirmDialog`.

### UC-38 — Hoàn tác xóa (toast) — `[YÊU CẦU MỚI]` `[GIẢ ĐỊNH]`
- **Actor:** Người dùng.
- **Tiền điều kiện:** Vừa xóa mềm thành công (UC-26/UC-27).
- **Luồng chính:** 1) Sau khi xóa mềm thành công, toast có nút “Hoàn tác”. 2) Bấm “Hoàn tác” → khôi phục bản ghi vừa xóa (đặt `deleted_at = NULL`) trong thời gian ngắn sau khi xóa.
- **Luồng thay thế / ngoại lệ:** Toast tự ẩn sau 2.8s → nút hoàn tác không còn; khôi phục sau đó qua SCREEN-09.
- **Hậu điều kiện:** Bản ghi trở lại nếu hoàn tác trong thời hạn toast.
- **Screen / Component:** OVL-01 (toast) · nút “Hoàn tác”.

---

## 7. Luồng điều hướng

### 7.1 Sơ đồ

```
[SIDEBAR]
 ├─ OVERVIEW ──────────────> SCREEN-01 Dashboard
 ├─ ĐỀ KIỂM TRA ───────────> SCREEN-02 Exam Root (danh sách môn)
 │                             │ click card môn
 │                             v
 │                          SCREEN-03 Subject Detail (danh sách bộ đề)
 │                             │ click card bộ đề        ▲ click tên môn (reset)
 │                             v                         │
 │                          SCREEN-04 Exam Overview ─────┘
 │                             ├─ "Sửa đề" ───────────> SCREEN-05 Exam Editor
 │                             │                            │ "Lưu bộ đề" (tạo mới/cập nhật)
 │                             │                            └──────────────> SCREEN-04
 │                             ├─ "Lịch sử làm bài" ───> OVL-05 (panel trong SCREEN-04)
 │                             └─ "Làm bài kiểm tra" ──> OVL-02 Quiz Config
 │                                                          │ "Làm bài ngay"
 │                                                          v
 │                                                       SCREEN-06 Quiz Taking
 │                                                          │ "Nộp bài"
 │                                                          v
 │                                                       SCREEN-07 Quiz Result
 │                                                          ├─ "Về tổng quan đề" ─> SCREEN-04
 │                                                          └─ "Làm lại đề" ──────> OVL-02 ─> SCREEN-06
 └─ AI GUIDE ──────────────> SCREEN-08 AI Guide
  └─ THÙNG RÁC ────────────> SCREEN-09 Trash (ngay sau AI Guide)
                               └─ link "Đề kiểm tra" ──> quay lại tab exams (giữ viewMode)
```

### 7.2 Bảng chuyển màn

| Đi từ | Hành động | Đến | Điều kiện / state thay đổi |
|---|---|---|---|
| Bất kỳ | Click sidebar `OVERVIEW` | SCREEN-01 | `activeTab='home'`; **không** reset exam nav (`ref-ui.tsx:L1430-L1433`) |
| Bất kỳ | Click sidebar `ĐỀ KIỂM TRA` | Màn hình exams gần nhất | `activeTab='exams'`; `examViewMode` giữ nguyên, có thể là `quizResult` (`ref-ui.tsx:L811`, `ref-ui.tsx:L1432`) |
| Bất kỳ | Click sidebar `AI GUIDE` | SCREEN-08 | `activeTab='guide'` (`ref-ui.tsx:L1425`) |
| Bất kỳ | Click sidebar `THÙNG RÁC` | SCREEN-09 | `activeTab='trash'` (sau AI Guide) `[CẬP NHẬT đợt 3]` |
| SCREEN-02 | Click card môn | SCREEN-03 | set `selectedSubjectId`, clear `selectedExamId`, mode `subject` (`ref-ui.tsx:L962-L970`) |
| SCREEN-02 | Click `root` trên breadcrumb | SCREEN-02 | reset selection + form + tên, tăng reset counter, toast (`ref-ui.tsx:L952-L960`) |
| SCREEN-03 | Click card bộ đề | SCREEN-04 | set `selectedExamId`, mode `examDetail`, tắt show answers, đóng history/config (`ref-ui.tsx:L972-L982`) |
| SCREEN-03 | Click tên môn trên breadcrumb | SCREEN-03 | reset trang môn (nếu đang ở đó), toast (`ref-ui.tsx:L967-L969`) |
| SCREEN-03 | Click “Tạo bộ đề” / “Tạo bộ đề đầu tiên” | SCREEN-05 (new) | draft 2 câu mẫu, title rỗng, tab json (`ref-ui.tsx:L984-L1012`) |
| SCREEN-04 | Click “Sửa đề” | SCREEN-05 (edit) | clone câu hỏi, title hiện tại, tab json (`ref-ui.tsx:L1014-L1022`) |
| SCREEN-04 | Click “Làm bài kiểm tra” | OVL-02 | input = `min(25, n)` (`ref-ui.tsx:L2252-L2258`) |
| OVL-02 | “Làm bài ngay” | SCREEN-06 | shuffle, tạo QuizSession, reset timer, đóng modal (`ref-ui.tsx:L1108-L1113`) |
| OVL-02 | “Đóng” / X | Quay lại màn trước | chỉ đóng modal (`ref-ui.tsx:L2910-L2915`, `ref-ui.tsx:L2973-L2978`) |
| SCREEN-05 | “Lưu bộ đề” – tạo mới | SCREEN-04 | prepend, chọn exam mới, tắt show answers, toast (`ref-ui.tsx:L1042-L1054`) |
| SCREEN-05 | “Lưu bộ đề” – cập nhật | SCREEN-04 | ghi đè tại chỗ, toast (`ref-ui.tsx:L1032-L1041`) |
| SCREEN-05 | Click breadcrumb title | SCREEN-05 | nạp lại draft (new hoặc edit), toast “Đã đặt lại trình soạn thảo đề” (`ref-ui.tsx:L1925-L1942`) |
| SCREEN-06 | “Nộp bài” | SCREEN-07 | tạo Attempt, set `lastQuizResult`, toast (`ref-ui.tsx:L1154-L1157`) |
| SCREEN-06 | Click breadcrumb bộ đề | SCREEN-04 | tắt show answers, đóng modal (`ref-ui.tsx:L972-L982`) |
| SCREEN-07 | “Về tổng quan đề” | SCREEN-04 | `handleNavigateToExamDetail`, reset phụ (`ref-ui.tsx:L2708-L2716`) |
| SCREEN-07 | “Làm lại đề” | OVL-02 | mở modal, **không** reset số câu (`ref-ui.tsx:L2717-L2723`) |
| SCREEN-08 | Link “Đề kiểm tra” ở bước 3 | SCREEN-02..07 (giữ nguyên) | `activeTab='exams'` (`ref-ui.tsx:L2859-L2864`) |
| Bất kỳ | ~~Nút Power~~ **[CẬP NHẬT đợt 2] LOẠI BỎ** (Q-13) | — | ref-ui cũ gọi `handleResetRoot` – reset điều hướng, không thoát app (`ref-ui.tsx:L1473-L1479`, `ref-ui.tsx:L796`); bản đích **không còn nút Power** — reset chỉ qua breadcrumb (UC-24) |
| Bất kỳ | ~~Nút Settings~~ **[CẬP NHẬT đợt 2] LOẠI BỎ** (Q-14) | — | ref-ui cũ chỉ toast (`ref-ui.tsx:L1466-L1472`); bản đích **không còn nút Settings / màn hình Settings** |
| Bất kỳ | Nút Theme (sidebar) → chọn Sáng / Tối / Theo hệ thống | Không đổi màn | **[CẬP NHẬT đợt 2]** `ThemeToggle` (`Sun`/`Moon`/`Monitor`), persist `app_settings.theme`, áp trước render → **UC-28** |
| SCREEN-02 / SCREEN-03 | Bấm nút xóa môn → `DeleteConfirmDialog` → xác nhận | Ở nguyên màn hiện tại (hoặc về SCREEN-02 nếu đang trong môn bị xóa) | **[CẬP NHẬT đợt 2]** soft delete `deleted_at`, cascade ẩn (Q-01) → **UC-26**; hủy → không đổi |
| SCREEN-03 / SCREEN-04 | Bấm nút xóa bộ đề → `DeleteConfirmDialog` → xác nhận | SCREEN-03 (nếu đang ở SCREEN-04 bộ đề bị xóa) | **[CẬP NHẬT đợt 2]** soft delete `deleted_at`, cascade ẩn (Q-01) → **UC-27**; hủy → không đổi |
| SCREEN-09 | Bấm “Khôi phục” môn/bộ đề → (xung đột tên → dialog đổi tên) | SCREEN-09 / SCREEN-02/03 | **[CẬP NHẬT đợt 3]** khôi phục soft delete, dữ liệu con trở lại (BR-77, BR-78) → **UC-34/UC-35** |
| SCREEN-09 | Bấm “Xóa vĩnh viễn” / “Dọn sạch” → `DeleteConfirmDialog` (biến thể vĩnh viễn) → xác nhận | SCREEN-09 | **[CẬP NHẬT đợt 3]** hard delete trong transaction (NFR-18) → **UC-36/UC-37** |
| SCREEN-06 | Bấm “All (n)” | QuestionNavigatorDialog (trong SCREEN-06) | **[CẬP NHẬT đợt 2]** (R3) lưới số thứ tự, trạng thái đã/chưa làm/câu hiện tại; bấm số → đóng dialog + nhảy tới câu → **UC-29** |
| SCREEN-06 | Bấm “Nộp bài” khi còn câu trống | SubmitWarningDialog (trong SCREEN-06) | **[CẬP NHẬT đợt 2]** (Q-11) liệt kê số thứ tự câu trống; “Quay lại làm tiếp” → về phiên, “Vẫn nộp” → SCREEN-07 → **UC-30**; không trống → SCREEN-07 thẳng |

### 7.3 Quy tắc reset state khi điều hướng
| Sự kiện | State được reset | State giữ nguyên | Bằng chứng |
|---|---|---|---|
| Về `root` | `selectedSubjectId`, `selectedExamId`, form tạo môn, `newSubjectName`, `viewResetCounter` | `subjects`, `exams`, `attempts`, `newSubjectColor` | `ref-ui.tsx:L952-L960` |
| Vào `subject` | `selectedExamId`, `viewResetCounter` | form tạo môn (đã đóng khi rời root) | `ref-ui.tsx:L962-L970` |
| Vào `examDetail` | `showAnswersSwitch=false`, `showHistoryModal=false`, `showQuizConfigModal=false` | `attempts`, editor draft cũ | `ref-ui.tsx:L972-L982` |
| Vào `quizActive` | `quizUserAnswers={}`, `quizStartTime`, `quizElapsedSec=0` | `attempts` (chưa thêm) | `ref-ui.tsx:L1108-L1113` |
| Nộp bài | `lastQuizResult`, `examViewMode` | `quizUserAnswers`, `activeQuizQuestions` (để review) | `ref-ui.tsx:L1154-L1157` |
| Chuyển sidebar tab | `activeTab` | toàn bộ state exam/quiz | `ref-ui.tsx:L1430-L1433` |

---

## 8. Ma trận truy vết

| UC | Screen | Component (thật trong file) | Thực thể |
|---|---|---|---|
| UC-01 | SCREEN-01 | `dashboardStats`, 4 metric card, donut, bảng “Overview of Works” (`ref-ui.tsx:L1163-L1238`, `ref-ui.tsx:L1527-L1587`, `ref-ui.tsx:L1804-L1859`) | Attempt |
| UC-02 | SCREEN-01 | Period filter `week/month/year` (`ref-ui.tsx:L1505-L1523`) | Attempt |
| UC-03 | SCREEN-01 | Nút `chartMetric` + SVG polyline (`ref-ui.tsx:L1604-L1625`, `ref-ui.tsx:L1643-L1663`) | Attempt |
| UC-04 | SCREEN-02 | form “Tạo môn học mới”, `handleCreateSubject` (`ref-ui.tsx:L1976-L2049`, `ref-ui.tsx:L1061-L1077`) | Subject |
| UC-05 | SCREEN-03 | danh sách card bộ đề, `handleNavigateToSubject` (`ref-ui.tsx:L2107-L2173`, `ref-ui.tsx:L962-L970`) | Exam, Attempt, Subject |
| UC-06 | SCREEN-05 | `handleOpenCreateExam`, pane Render + Editor (`ref-ui.tsx:L984-L1012`, `ref-ui.tsx:L2330-L2564`) | Exam, Question, AnswerOption |
| UC-07 | SCREEN-05 | `QuestionCard mode="editor"`, `handleAskChange` (`ref-ui.tsx:L511-L788`, `ref-ui.tsx:L526-L535`) | Question, AnswerOption |
| UC-08 | SCREEN-05, OVL-03 | vùng chèn `+`, `handleInsertQuestionAt` (`ref-ui.tsx:L2437-L2483`, `ref-ui.tsx:L916-L935`) | Question, AnswerOption |
| UC-09 | SCREEN-05 | nút xóa câu, `onDeleteQuestion` (`ref-ui.tsx:L611-L619`, `ref-ui.tsx:L2464-L2469`) | Question |
| UC-10 | SCREEN-05 | `handleAddOption`, `handleRemoveOption` (`ref-ui.tsx:L546-L562`) | AnswerOption |
| UC-11 | SCREEN-05 | `handleSetCorrectOption`, radio editor (`ref-ui.tsx:L537-L544`, `ref-ui.tsx:L660-L697`) | AnswerOption |
| UC-12 | SCREEN-05 | `parseJsonToQuestions`, textarea JSON (`ref-ui.tsx:L61-L90`, `ref-ui.tsx:L899-L914`) | Question, AnswerOption |
| UC-13 | SCREEN-05 | `parseTxtToQuestions`, textarea TXT (`ref-ui.tsx:L92-L141`) | Question, AnswerOption |
| UC-14 | SCREEN-05 | tab `txt`/`json`, `handleSwitchEditorTab` (`ref-ui.tsx:L2501-L2523`, `ref-ui.tsx:L889-L897`) | Question, AnswerOption |
| UC-15 | SCREEN-05 → SCREEN-04 | `handleSaveExamFromEditor`, nút “Lưu bộ đề” (`ref-ui.tsx:L1024-L1056`, `ref-ui.tsx:L2348-L2354`) | Exam, Question, AnswerOption, Subject |
| UC-16 | SCREEN-04 | `QuestionCard mode="preview"`, `showAnswersSwitch` (`ref-ui.tsx:L2179-L2324`) | Exam, Question, AnswerOption |
| UC-17 | SCREEN-04, OVL-05 | panel “Lịch sử làm bài của bộ đề này” (`ref-ui.tsx:L2268-L2310`) | Attempt, Exam |
| UC-18 | SCREEN-04, OVL-02 → SCREEN-06 | `handleStartQuiz`, modal cấu hình (`ref-ui.tsx:L2903-L2991`, `ref-ui.tsx:L1082-L1114`) | Exam, Question, QuizSession |
| UC-19 | SCREEN-06, OVL-04 → `QuestionNavigatorDialog` `[CẬP NHẬT đợt 2]` | `QuizControlBar`, `QuestionCard mode="quiz"` — radio/checkbox theo số đáp án đúng (Q-10, BR-24/BR-63), nút “All (n)” mở dialog danh sách câu (R3) (`ref-ui.tsx:L2571-L2669`) | QuizSession, AttemptAnswer, Question |
| UC-20 | SCREEN-06 → SCREEN-07 | `handleSubmitQuiz`, `SubmitWarningDialog` (Q-11), banner điểm (`ref-ui.tsx:L1116-L1158`, `ref-ui.tsx:L2679-L2725`) `[CẬP NHẬT đợt 2]` | Attempt, AttemptAnswer (persist + `position`, Q-03/R1), Exam, Subject |
| UC-21 | SCREEN-07 (+ OVL-05) | `QuestionCard mode="result"`, đọc `attempt_answers` persist — xem lại sau khi đóng app (Q-03, BR-68) (`ref-ui.tsx:L2765-L2779`) `[CẬP NHẬT đợt 2]` | Attempt, AttemptAnswer, AnswerOption |
| UC-22 | SCREEN-07, OVL-02 | nút “Làm lại đề” (`ref-ui.tsx:L2717-L2723`) | Attempt, QuizSession |
| UC-23 | SCREEN-08 | `FIXED_AI_PROMPT`, `handleCopyPrompt` (`ref-ui.tsx:L468-L500`, `ref-ui.tsx:L1241-L1249`, `ref-ui.tsx:L2788-L2897`) | — (không thực thể) |
| UC-24 | SCREEN-02, SCREEN-03, SCREEN-04, SCREEN-05 | breadcrumb header + 3 handler reset (`ref-ui.tsx:L1869-L1943`, `ref-ui.tsx:L952-L982`) | Subject, Exam |
| UC-25 | Tất cả screen | `Sidebar`, `sidebarOpen`, `ThemeToggle` — bỏ nút Power/Settings (Q-13/Q-14, BR-66) (`ref-ui.tsx:L1347-L1481`) `[CẬP NHẬT đợt 2]` | AppSettings (`app_settings.theme`) |
| UC-26 | SCREEN-02, SCREEN-03 | nút xóa môn, `DeleteConfirmDialog` `[YÊU CẦU MỚI]` | Subject (`deleted_at`), Exam (cascade ẩn) |
| UC-27 | SCREEN-03, SCREEN-04 | nút xóa bộ đề, `DeleteConfirmDialog` `[YÊU CẦU MỚI]` | Exam (`deleted_at`), Question, Attempt |
| UC-28 | Tất cả screen | `ThemeToggle` (`Sun`/`Moon`/`Monitor`), đọc/triển khai `app_settings.theme` trước render `[YÊU CẦU MỚI]` | AppSettings (`app_settings.theme`) |
| UC-29 | SCREEN-06, `QuestionNavigatorDialog` | lưới số thứ tự, ô trạng thái chưa làm/đã làm/câu hiện tại, cờ flag `[YÊU CẦU MỚI]` (R3) | QuizSession, Question |
| UC-30 | SCREEN-06, `SubmitWarningDialog` (+ `QuestionNavigatorDialog` dùng lại) | nút “Nộp bài”, danh sách câu trống, “Quay lại làm tiếp”/“Vẫn nộp” `[YÊU CẦU MỚI]` (Q-11) | Attempt, AttemptAnswer, QuizSession |
| UC-31 | OVL-02 → SCREEN-06 | checkbox random (mặc định bật), preset số câu, `handleStartQuiz` gọi BE `[YÊU CẦU MỚI]` (R1, BR-21) | Exam, Question, QuizSession |
| UC-32 | SCREEN-01 | period filter + `dashboardStats` lọc thật theo kỳ `[YÊU CẦU MỚI]` (Q-05/Q-06 — **sprint cuối**, hiện ref-ui mock) | Attempt |
| UC-33 | SCREEN-09 | sidebar tab “Thùng rác” (icon `Trash2`), danh sách 2 nhóm, tìm kiếm/lọc `[YÊU CẦU MỚI]` (Q-21) | Subject, Exam |
| UC-34 | SCREEN-09 | nút Khôi phục môn, dialog đổi tên nếu xung đột `[YÊU CẦU MỚI]` (Q-21) | Subject, Exam |
| UC-35 | SCREEN-09 | nút Khôi phục bộ đề, dialog đổi tên/xung đột môn cha `[YÊU CẦU MỚI]` (Q-21) | Exam, Subject |
| UC-36 | SCREEN-09 | nút Xóa vĩnh viễn, `DeleteConfirmDialog` (biến thể vĩnh viễn) `[YÊU CẦU MỚI]` (Q-21) | Subject, Exam, Question, AnswerOption, Attempt, AttemptAnswer |
| UC-37 | SCREEN-09 | nút Dọn sạch thùng rác, `DeleteConfirmDialog` `[YÊU CẦU MỚI]` (Q-21) | Subject, Exam, Question, AnswerOption, Attempt, AttemptAnswer |
| UC-38 | OVL-01 (toast) | toast có nút “Hoàn tác” sau xóa mềm `[YÊU CẦU MỚI]` `[GIẢ ĐỊNH]` (Q-21) | Subject, Exam |

**Kiểm tra phủ (đợt 3 — tổng 38 UC):** `SCREEN-01` (UC-01..03, UC-32) · `SCREEN-02` (UC-04, UC-24, UC-26) · `SCREEN-03` (UC-05, UC-24, UC-26, UC-27) · `SCREEN-04` (UC-15..UC-18, UC-24, UC-27, UC-31) · `SCREEN-05` (UC-06..UC-15, UC-24) · `SCREEN-06` (UC-18..UC-20, UC-22, UC-29..UC-31) · `SCREEN-07` (UC-20..UC-22) · `SCREEN-08` (UC-23) · `SCREEN-09` (UC-33..UC-37) · sidebar/mọi màn (UC-25, UC-28, UC-38).
**Thực thể lõi (đợt 3):** Subject (UC-04, UC-05, UC-15, UC-20, UC-24, UC-26, UC-33, UC-34, UC-36) · Exam (UC-05, UC-06, UC-15..UC-18, UC-20, UC-24, UC-27, UC-31, UC-33, UC-35, UC-36) · Question (UC-06..UC-14, UC-18..UC-21, UC-27, UC-29, UC-31, UC-36) · AnswerOption (UC-06..UC-14, UC-16, UC-21, UC-36) · Attempt (UC-01..UC-03, UC-17, UC-20..UC-22, UC-27, UC-30, UC-32, UC-36) · AttemptAnswer — **persist** `attempt_answers` (incl. `option_order`) theo Q-03/Q-19 (UC-19..UC-21, UC-30, UC-36) · AppSettings — `app_settings.theme` (UC-25, UC-28).

> **Overlay trong truy vết:** `OVL-01` (Toast) không phải screen độc lập — xuất hiện tại UC-04, UC-15, UC-20, UC-23, UC-24, UC-26, UC-27 và mọi luồng gọi `triggerToast`; render cố định góc dưới phải (`ref-ui.tsx:L1337-L1342`). `OVL-02` (UC-18, UC-22, UC-31) · `OVL-03` (UC-08) · `OVL-05` (UC-17, UC-21). **[CẬP NHẬT đợt 2]** `OVL-03`/`OVL-04` được thống nhất thành component dùng chung **`QuestionNavigatorDialog`** (DRY) — UC-08 (editor), UC-19/UC-29 (quiz), dùng lại trong UC-30 (danh sách câu trống). Overlay/dialog mới: `DeleteConfirmDialog` (UC-26, UC-27), `SubmitWarningDialog` (UC-30); không phải dialog: `ThemeToggle` (UC-25, UC-28).

---

## 9. Yêu cầu phi chức năng (suy ra từ UI)

| ID | Yêu cầu | Trạng thái | Căn cứ |
|---|---|---|---|
| **NFR-01** | **Offline / local-first**: không phụ thuộc server, mọi thao tác chạy trong tiến trình app. `[CẬP NHẬT đợt 2]` Cụ thể hoá theo R5: dữ liệu persist vào **SQLite cục bộ nằm trong thư mục app-data của OS** (không ghi vào thư mục cài đặt, không phụ thuộc network). | `[CẬP NHẬT đợt 2]` — chuyển từ giả định sang yêu cầu (R5); ref-ui không có fetch/invoke | `ref-ui.tsx:L794-L844`, Yêu cầu mới R5 |
| **NFR-02** | **Xung đột offline**: app vẫn `@import` Google Fonts và mở link ngoài ⇒ cần mạng cho font/link, không thuần offline. | Quan sát trực tiếp | `ref-ui.tsx:L1255`, `ref-ui.tsx:L2813-L2838` |
| **NFR-03** | **Single-user, không auth, không phân quyền**: dữ liệu không gắn với tài khoản. | Quan sát trực tiếp | `ref-ui.tsx:L1406-L1417`, `ref-ui.tsx:L794-L803` |
| **NFR-04** | **Hiệu năng biểu đồ**: series tối đa 7 điểm, tính trong `useMemo` theo `[attempts, statsPeriod]` ⇒ chi phí không đáng kể. | Quan sát trực tiếp | `ref-ui.tsx:L1163-L1238`, `ref-ui.tsx:L1178-L1208` |
| **NFR-05** | **Hiệu năng danh sách**: mọi câu hỏi render đồng thời, không virtualization; với bộ 42 câu hoặc phiên 200 câu có thể chậm/cuộn nặng. | `[GIẢ ĐỊNH]` về rủi ro | `ref-ui.tsx:L2313-L2323`, `ref-ui.tsx:L2649-L2669` |
| **NFR-06** | **Persist là nhu cầu bắt buộc**. `[CẬP NHẬT đợt 2]` ref-ui không có localStorage/DB/API ⇒ tắt app mất toàn bộ môn, bộ đề, lượt làm, draft; bản dựng thật phải persist **toàn bộ** môn, bộ đề, lượt làm (`attempts` + `attempt_answers`) và cài đặt app (theme) vào SQLite cục bộ trong thư mục app-data của OS (R5). | `[CẬP NHẬT đợt 2]` — gap quan sát được + yêu cầu R5 | `ref-ui.tsx:L794-L803`, `ref-ui.tsx:L847`, Yêu cầu mới R5 |
| **NFR-07** | **Rủi ro mất dữ liệu**: không autosave, không cảnh báo khi rời editor/breadcrumb ⇒ mất draft đang soạn. | `[GIẢ ĐỊNH]` | `ref-ui.tsx:L1929-L1936`, `ref-ui.tsx:L2348-L2354` |
| **NFR-08** | **Độ chính xác đồng hồ**: tính lại từ `Date.now()` mỗi tick nên không tích lũy sai số; sai số ≤ 1s. | Quan sát trực tiếp | `ref-ui.tsx:L856-L862` |
| **NFR-09** | **Giới hạn tải**: số câu làm bài tối đa trên UI là 200 (ràng buộc HTML, không phải business rule). | Quan sát trực tiếp | `ref-ui.tsx:L2926-L2933` |
| **NFR-10** | **Ngôn ngữ**: toàn bộ copy là tiếng Việt hard-code, không có lớp i18n. | Quan sát trực tiếp | `ref-ui.tsx:L1422-L1425`, `ref-ui.tsx:L1496-L1501` |
| **NFR-11** | **Accessibility**: radio bị `sr-only` và hàng lựa chọn dùng `div onClick` ⇒ không thao tác được bằng bàn phím; toast không có `aria-live`. | `[GIẢ ĐỊNH]` về mức độ chấp nhận | `ref-ui.tsx:L650-L697`, `ref-ui.tsx:L1337-L1342` |
| **NFR-12** | **Riêng tư**. `[CẬP NHẬT đợt 2]` Dữ liệu học tập chỉ nằm máy local trong thư mục app-data của OS (SQLite cục bộ), không telemetry, không đồng bộ cloud; ngoại lệ là font/link ngoài (NFR-02). | `[CẬP NHẬT đợt 2]` — chốt theo R5 | `ref-ui.tsx:L794-L803`, `ref-ui.tsx:L1255`, Yêu cầu mới R5 |
| **NFR-13** | **Responsive**: lưới 1/2/3 cột, sidebar thu gọn dưới `md`, vùng editor cố định `h-[640px]`. | Quan sát trực tiếp | `ref-ui.tsx:L1347-L1350`, `ref-ui.tsx:L2053`, `ref-ui.tsx:L2361` |
| **NFR-14** | **Toàn vẹn dữ liệu**. `[CẬP NHẬT đợt 2]` Bản dựng thật **bắt buộc**: (a) **transaction** cho mọi thao tác ghi liên quan nhiều bảng/bản ghi; (b) **unique constraint** cho tên môn (toàn cục) và tên bộ đề trong cùng môn (Q-15); (c) **soft delete** qua cột `deleted_at` + cascade ẩn cấp con (Q-01). ref-ui không có điều nào trong ba mục trên. | `[CẬP NHẬT đợt 2]` — chốt Q-01 + Q-15 (đợt 2) | `ref-ui.tsx:L1024-L1073`, §10.2 Q-01/Q-15 |
| **NFR-15** | **Chuẩn thời gian hiển thị**: `[YÊU CẦU MỚI]` Dữ liệu lưu ở dạng **UTC** trong SQLite; **mọi hiển thị** (ngày tạo môn/bộ đề, lịch sử làm bài) và **ranh giới kỳ thống kê** (ngày/tuần/tháng/năm) tính theo múi giờ **`Asia/Ho_Chi_Minh` (UTC+7, không có DST)** — không dùng múi giờ hệ thống. | `[YÊU CẦU MỚI]` — chốt Q-06 (đợt 2) | §10.2 Q-06, §10.3 Q-06 |
| **NFR-16** | **Theme không nháy trắng**: `[YÊU CẦU MỚI]` (R2) App có 3 chế độ theme (sáng / tối / theo hệ thống), persist vào bảng `app_settings.theme`; theme được **áp dụng trước lần render đầu tiên** (inline script / class trên root trước khi mount) ⇒ không xuất hiện flash-white khi mở app; mặc định lần đầu theo `prefers-color-scheme`. | `[YÊU CẦU MỚI]` — phản ánh yêu cầu R2 | Yêu cầu mới R2, Q-14 |
| **NFR-17** | **Không multi-user**: `[YÊU CẦU MỚI]` (R5) App cá nhân chạy trên máy người dùng: **không đăng nhập, không phân quyền, không tài khoản, không đồng bộ cloud**; toàn bộ trạng thái nằm trong SQLite cục bộ ở thư mục app-data của OS. | `[YÊU CẦU MỚI]` — phản ánh yêu cầu R5 | Yêu cầu mới R5, NFR-03, AS-02 |
| **NFR-18** | **Xóa vĩnh viễn trong transaction**: `[CẬP NHẬT đợt 3]` mọi thao tác xóa vĩnh viễn (môn/bộ đề) thực hiện trong một transaction, cascade toàn bộ câu hỏi/option/attempt/attempt_answers thuộc bản ghi; không để lại bản ghi mồ côi. | `[CẬP NHẬT đợt 3]` — BR-80, Q-21 | BR-80, UC-36, UC-37 |

---

## 10. Giả định và câu hỏi mở

### 10.1 Giả định

| ID | Nội dung | Vì sao chưa chắc | Ảnh hưởng |
|---|---|---|---|
| **AS-01** | Sản phẩm **phải** persist xuống SQLite local; ref-ui chỉ là demo in-memory. | Không có code persistence trong nguồn. | C cần thiết kế bảng; dev cần lớp repository. |
| **AS-02** | `[CẬP NHẬT đợt 2]` Một người dùng duy nhất: app cá nhân (R5), **không** cần bảng `users`/auth/phân quyền; dữ liệu lưu trong SQLite cục bộ ở thư mục app-data của OS. | UI không có login, profile tĩnh; R5 xác nhận không cloud. | Bỏ qua auth & phân quyền (NFR-17); nếu thêm multi-user phải đổi schema. |
| **AS-03** | Kiểu DB suy ra: `TEXT` cho id/tên/ngày, `INTEGER` cho đếm/giây, `REAL` cho điểm, `BOOLEAN` (0/1) cho `isCorrect`. | Nguồn chỉ có kiểu JS. | C chốt kiểu & ràng buộc. |
| **AS-04** | “Lượt ôn #n” là nhãn hiển thị, không phải thực thể riêng. | Chỉ xuất hiện trong chuỗi `ask`. | Không cần bảng riêng; nhưng phân biệt lượt làm trong cùng đề phải dựa vào `Attempt`. |
| **AS-05** | ~~`Attempt` chỉ lưu tổng hợp, không lưu từng câu trả lời.~~ `[CẬP NHẬT đợt 2]` **ĐÃ CHỐT (Q-03)**: có bảng `attempt_answers`, lưu chính thức từng câu trả lời của từng lượt làm ⇒ xem lại đáp án chi tiết sau khi đóng/mở lại app. | ~~Không có state/DB cho AttemptAnswer~~ — ref-ui không có, nhưng yêu cầu đã chốt. | **[CẬP NHẬT đợt 5] Q-04 ĐÃ CHỐT:** `attempt_answers` lưu snapshot nội dung câu hỏi, options và tập đáp án đúng khi nộp; xem lại từ snapshot DB, không từ câu hỏi hiện tại (BR-81). |
| **AS-06** | ~~Thời gian lưu theo local time cho `Attempt`, nhưng `Exam/Subject.createdAt` lại theo UTC.~~ `[CẬP NHẬT đợt 2]` **ĐÃ CHỐT (Q-06)**: lưu **UTC toàn bộ**; hiển thị và ranh giới kỳ thống kê theo **`Asia/Ho_Chi_Minh`** (UTC+7, không DST) — NFR-15. | ~~Hai cách sinh khác nhau trong code~~ — ref-ui vẫn hỗn hợp, chuẩn hóa theo Q-06. | C chuẩn hóa tầng lưu/hiển thị thời gian; dev không dùng múi giờ hệ thống. |
| **AS-07** | Thứ tự hiển thị = thứ tự mảng: môn cũ→mới, bộ đề mới→cũ, attempt mới→cũ. | Không có sort tường minh. | Nếu C thêm `ORDER BY` phải khớp hành vi UI. |
| **AS-08** | `chartMetric` dự định lọc hiển thị nhưng hiện chỉ đổi style. | Không có nhánh code dùng để vẽ. | Dev có thể implement đúng ý hoặc giữ nguyên — cần chốt (Q-08). |
| **AS-09** | Giới hạn 200 câu chỉ là ràng buộc HTML, không phải business rule. | `handleStartQuiz` không clamp. | Nhập tay vượt 200 vẫn chạy; cần chốt (Q-09). |
| **AS-10** | Tên thương hiệu hiển thị là “QUIZ Analysis / Smart Exam Studio”, khác tên repo `ansask-desktop`. | UI hard-code. | Ảnh hưởng branding, không ảnh hưởng domain. |
| **AS-11** | `[CẬP NHẬT đợt 3]` (R1, Q-19) Khi làm bài: **thứ tự câu hỏi random MẶC ĐỊNH BẬT** — Quiz Config mặc định chọn ngẫu nhiên N câu không trùng và xáo thứ tự; N ≥ tổng số câu thì lấy hết nhưng **vẫn xáo**; người dùng có thể **tắt random**. **ĐÃ CHỐT Q-19: CÓ xáo option** — thứ tự option cũng xáo cùng câu (BR-72). | ref-ui **có** shuffle Fisher-Yates cho câu hỏi (`BR-20`, `ref-ui.tsx:L1085-L1091`); xáo option là yêu cầu mới (Q-19). | Phải lưu `option_order` trong `attempt_answers` để màn xem lại hiển thị trúng lựa chọn; UI cần thể hiện rõ trạng thái đang làm bản xáo khi bật random. |
| **AS-12** | `[YÊU CẦU MỚI]` **ĐÃ CHỐT (Q-10)**: chấm điểm câu nhiều đáp án đúng theo **trùng khớp hoàn toàn** — tập đáp án người dùng chọn phải khớp hoàn toàn tập đáp án đúng thì mới đúng. | ref-ui nhận dữ liệu nhiều đáp án đúng nhưng chưa có rule. | Ảnh hưởng thuật toán chấm và cách diễn đạt kết quả (“đúng một phần” không có). |

### 10.2 Câu hỏi mở

| ID | Nội dung | Vì sao chưa chắc | Ảnh hưởng |
|---|---|---|---|
| **Q-01** | Có cần chức năng **xóa môn / xóa bộ đề** không? Hiện chỉ xóa được câu hỏi trong editor. | UI không có nút xóa. | — **ĐÃ CHỐT**: xóa **soft delete** bằng cột `deleted_at`; khi xóa môn thì cascade **ẩn** toàn bộ bộ đề + attempt của môn đó; mọi thao tác xóa đều qua **dialog xác nhận**; tính năng thùng rác / khôi phục (Q-21 ĐÃ CHỐT). |
| **Q-02** | Cập nhật bộ đề có nên đổi `createdAt` hoặc thêm `updatedAt`? | Code giữ nguyên `createdAt`. | — **ĐÃ CHỐT**: giữ nguyên `created_at`, **thêm `updated_at`** cho `exams` (cập nhật mỗi lần lưu). Ảnh hưởng sort hiển thị và màn lịch sử. |
| **Q-03** | Có cần lưu **từng câu trả lời** của lượt làm bài để xem lại sau khi mở app? | Hiện chỉ có aggregate. | — **ĐÃ CHỐT**: **CÓ** bảng `attempt_answers`, chính thức; người dùng xem được chi tiết đáp án đã chọn của từng câu sau khi đóng/mở lại app. |
| **Q-04** | Bộ đề bị sửa sau khi đã có Attempt thì lịch sử hiển thị theo đề cũ hay đề mới? | `Attempt` snapshot `examTitle` nhưng review dùng `currentExam.questions` mới. | **ĐÃ CHỐT (đợt 5)**: lưu nội dung câu hỏi, options `{id,text}` và tập đáp án đúng khi nộp; xem lại từ snapshot trong `attempt_answers` (BR-81). |
| **Q-05** | Kỳ thống kê có nên **thực sự lọc** attempts theo `timestamp`? | Code chỉ cộng offset mock. | — **ĐÃ CHỐT (làm ở sprint cuối — xem §10.4)**: lọc **thật** theo kỳ; **bỏ hoàn toàn** các số ảo +59 / +1420 / +242 / +6150; điểm trung bình phải **đổi theo kỳ** đang chọn; ref-ui hiện là mock. |
| **Q-06** | Chuẩn thời gian nào được dùng: UTC (`toISOString`) hay local (`getFullYear`…)? | Hai nguồn khác nhau trong cùng file. | — **ĐÃ CHỐT**: lưu **UTC toàn bộ**; hiển thị (mọi màn hình) và **ranh giới kỳ thống kê** theo `Asia/Ho_Chi_Minh` (UTC+7, không DST) — NFR-15, AS-06. |
| **Q-07** | “Lần #1” trong lịch sử là lượt **mới nhất** hay **cũ nhất**? | Đánh số theo index của mảng đã prepend ⇒ mới nhất là #1. | Ảnh hưởng cách đọc lịch sử; nếu C sort tăng dần sẽ đảo nghĩa. |
| **Q-08** | `chartMetric` có cần ẩn/bớt series theo lựa chọn không? | Hiện chỉ đổi màu chữ nút. | Ảnh hưởng yêu cầu sprint UI. |
| **Q-09** | Có cần chặn cứng số câu ≤ 200 và ≤ một giới hạn tài nguyên? | Chỉ có `max` HTML. | Tránh phiên 500 câu gây lag. |
| **Q-10** | Khi bộ đề có nhiều đáp án đúng (nhập từ TXT/JSON), chấm điểm thế nào? | Code chấp nhận dữ liệu này, chấm theo `isCorrect` của lựa chọn được chọn. | — **ĐÃ CHỐT**: cho phép **nhiều đáp án đúng**; câu đúng khi tập đáp án đã chọn **trùng khớp hoàn toàn** tập đáp án đúng (ĐÃ CHỐT — AS-12); UI phân biệt radio (1 đáp án) vs checkbox (nhiều đáp án) theo dữ liệu đề. |
| **Q-11** | Có cần cảnh báo khi nộp bài còn câu chưa trả lời? | Không có confirm. | — **ĐÃ CHỐT**: có **dialog cảnh báo câu trống** liệt kê danh sách câu chưa trả lời, kèm 2 nút **“Quay lại làm tiếp”** và **“Vẫn nộp”**. |
| **Q-12** | Có cần giới hạn thời gian / auto-submit? | Không có trong UI. | Ảnh hưởng `durationSec` và mô hình phiên. |
| **Q-13** | Nút Power nên **thoát app** hay chỉ reset điều hướng? | Hiện gọi `handleResetRoot`. | — **ĐÃ CHỐT – LOẠI BỎ**: không còn nút Power; nó đã bị thay bằng **nút Theme** (đổi theme, không reset điều hướng). Màn reset điều hướng chỉ còn breadcrumb (UC-24). |
| **Q-14** | Nút Settings có cần màn hình thật (âm thanh, theme, dữ liệu)? | Hiện chỉ toast. | — **ĐÃ CHỐT – LOẠI BỎ**: **không** có màn hình Settings; thay bằng **ThemeToggle** persist vào `app_settings.theme` (3 chế độ: sáng / tối / theo hệ thống, không nháy trắng — NFR-16). |
| **Q-15** | Có cần chặn trùng tên môn / trùng tên bộ đề trong cùng môn? | Không kiểm tra. | — **ĐÃ CHỐT**: unique tên **môn trên toàn cục**, unique tên **bộ đề trong cùng môn**; so khớp **không phân biệt hoa/thường + đã trim** `[GIẢ ĐỊNH]`; bản ghi soft-deleted **không chiếm tên**; khi vi phạm hiện **lỗi tiếng Việt**. Ảnh hưởng unique constraint trong `db.dbml` (NFR-14). |
| **Q-16** | Có cần lưu draft editor khi rời màn (chống mất dữ liệu)? | Không autosave. | Ảnh hưởng UX và schema (draft table). |
| **Q-17** | Font Google có được tải offline/bundle không? | `@import` từ mạng. | Ảnh hưởng cam kết offline-first. |
| **Q-18** | Có cần hiển thị “All Time” cho phổ điểm theo đúng kỳ đang chọn? | Hiện luôn all-time. | Ảnh hưởng tính nhất quán dashboard. |
| **Q-19** | `[YÊU CẦU MỚI]` Có **xáo thứ tự đáp án (option)** khi làm bài không? | ref-ui giữ nguyên thứ tự mảng. | **ĐÃ CHỐT (đợt 3)**: **CÓ xáo option** — BE Rust xáo theo từng câu/lượt, lưu `option_order` trong `attempt_answers`; tắt random tắt cả xáo câu & option (BR-72, BR-73). |
| **Q-20** | `[YÊU CẦU MỚI]` Phạm vi **tô màu cú pháp TXT**: chỉ token `ask` / `ans.` hay cả dòng đầu câu hỏi? | Phụ thuộc cú pháp thật trong ref-ui. | **ĐÃ CHỐT (đợt 3)**: chỉ **tô token** `ask` (đỏ) và `ans.` (xanh) theo đúng regex parser của ref-ui, không tô cả dòng (BR-65). |
| **Q-21** | `[YÊU CẦU MỚI]` Với soft delete (Q-01), có làm **“Thùng rác / Khôi phục”** không, hay chỉ ẩn vĩnh viễn sau khi xóa? | Q-01 chốt soft delete nhưng chưa chốt UI khôi phục. | **ĐÃ CHỐT (đợt 3)**: **làm thùng rác** — tab sidebar SCREEN-09 sau AI Guide; khôi phục, xóa vĩnh viễn, dọn sạch; `delete_batch_id` phân biệt cascade; không retention tự động `[GIẢ ĐỊNH]`. |
| **Q-22** | `[YÊU CẦU MỚI]` **Tự dọn thùng rác sau N ngày?** | Chưa chốt chính sách retention. | `[GIẢ ĐỊNH]`: **không tự dọn**; nếu muốn đặt “tự xóa sau N ngày” thì ghi vào câu hỏi mở và chốt sau (BR-80). |
| **Q-23** | `[YÊU CẦU MỚI]` **Hoàn tác sau xóa mềm?** (toast có nút “Hoàn tác”) | Chưa chốt UX khôi phục nhanh. | `[GIẢ ĐỊNH]`: toast có nút “Hoàn tác” sau xóa mềm (UC-38); tự ẩn sau 2.8s. |
| **Q-24** | `[YÊU CẦU MỚI]` **Công tắc random riêng cho câu/option?** | Mặc định một công tắc chung (BR-73). | `[GIẢ ĐỊNH]`: nếu muốn tách 2 công tắc riêng thì ghi vào câu hỏi mở; mặc định một công tắc chung. |
| **Q-25** | `[YÊU CẦU MỚI]` **Cờ “không xáo” cho câu kiểu “Tất cả các đáp án trên / A và B”?** | Rủi ro khi xáo option làm sai đáp án kiểu “Tất cả các đáp án trên”. | `[GIẢ ĐỊNH]`: nêu như rủi ro và gợi ý cách xử lý (ví dụ cờ “không xáo” theo câu) trong câu hỏi mở, không tự thêm tính năng. |
| **Q-26** | `[YÊU CẦU MỚI]` **Khôi phục bộ đề khi môn cha bị xóa:** xử lý thế nào? | Quyết định đợt 5 theo BR-77. | **ĐÃ CHỐT (đợt 5): chặn kèm nút “Khôi phục cả môn”**, thông báo cần khôi phục môn trước (BR-77). |

### 10.3 Hướng `db.dbml` `[CẬP NHẬT đợt 2]` — trạng thái chốt

Tham chiếu phụ lục cuối `docs/db.dbml` (mục “Điểm chưa chắc chắn”). `[CẬP NHẬT đợt 2]` Các dòng **ĐÃ CHỐT** dưới đây là nguồn sự thật; nếu `db.dbml` hiện chưa khớp thì **phải sửa DBML theo bảng** (xem ghi chú cuối mục). Các dòng còn lại vẫn “Chưa chốt”.

| Q-xx | Hướng đã chọn trong `db.dbml` | Trạng thái |
|---|---|---|
| **Q-01** | `[YÊU CẦU MỚI]` **Soft delete**: thêm cột `deleted_at` (nullable) cho `subjects` + `exams`; xóa môn **cascade ẩn** (`deleted_at`) các bộ đề và attempt cấp con; mọi thao tác xóa qua dialog xác nhận. Thùng rác / khôi phục (Q-21 ĐÃ CHỐT). | **ĐÃ CHỐT** (đợt 2) — cần thêm `deleted_at` vào `db.dbml` nếu chưa có |
| **Q-02** | Giữ `created_at`, **thêm `updated_at`** cho `exams` (khác ref-ui). | **ĐÃ CHỐT** (đợt 2) |
| **Q-03** | **CÓ** bảng `attempt_answers` (mỗi câu của mỗi attempt: `selected_option_ids`, `is_correct`, …) — mở khoá xem lại chi tiết sau khi đóng app. | **ĐÃ CHỐT** (đợt 2) — bỏ nhãn `[GIẢ ĐỊNH]` |
| **Q-05** | Schema đã sẵn `submitted_at` + index; bật lọc thật bằng `WHERE submitted_at >= ?` **theo ranh giới kỳ `Asia/Ho_Chi_Minh`** (NFR-15); bỏ offset ảo (BR-32) — **thực thi ở sprint cuối** (§10.4). | **ĐÃ CHỐT** (đợt 2) — **thực thi ở sprint cuối** |
| **Q-06** | Lưu **UTC toàn bộ**; **hiển thị** (mọi màn hình) và **ranh giới kỳ thống kê** theo `Asia/Ho_Chi_Minh` (UTC+7, không DST). | **ĐÃ CHỐT** (đợt 2) — sửa hướng cũ “ngày tạo theo UTC, `submitted_at` theo LOCAL” |
| **Q-07** | “Lần #1” = lượt **mới nhất** (`ORDER BY submitted_at DESC`), khớp prepend BR-27/BR-28 | Chưa chốt — user quyết trước sprint |
| **Q-09** | **KHÔNG** `CHECK (total_questions <= 200)` ở DB (chỉ là ràng buộc HTML) | Chưa chốt — user quyết trước sprint |
| **Q-10** | **Không** chặn nhiều đáp án đúng ở DB (validate/normalize ở app); schema lưu đủ tập đáp án đúng + tập đáp án đã chọn để chấm “trùng khớp hoàn toàn” (AS-12 **ĐÃ CHỐT** đợt 2). | **ĐÃ CHỐT** (đợt 2) |
| **Q-15** | `[CẬP NHẬT đợt 2]` **ĐÃ CHỐT — đảo hướng cũ**: `UNIQUE` tên môn **toàn cục** và `(subject_id, title)` trong cùng môn; so khớp **không phân biệt hoa/thường + trim** `[GIẢ ĐỊNH]` (ví dụ unique index trên `lower(trim(title))`); bản ghi soft-deleted không chiếm tên. | **ĐÃ CHỐT** (đợt 2) — **Cần sửa `db.dbml`**: bỏ hướng “KHÔNG khai báo UNIQUE” |
| **Q-19** | **[CẬP NHẬT đợt 3]** Xáo option → lưu `option_order` (JSON TEXT các `option_id`) trong `attempt_answers`; nhãn A/B/C/D gán theo vị trí hiển thị, chấm/lưu dùng `option_id`. | **ĐÃ CHỐT** (đợt 3) — cần thêm cột `option_order` vào `attempt_answers` trong `db.dbml` |
| **Q-21** | **[CẬP NHẬT đợt 3]** Thùng rác → thêm `delete_batch_id` (nullable) cho `subjects` + `exams`; bảng trash commands (restore, hard delete, purge) không cần bảng riêng (dùng `deleted_at` + `delete_batch_id`). | **ĐÃ CHỐT** (đợt 3) — cần thêm `delete_batch_id` vào `db.dbml` |

> `[CẬP NHẬT đợt 2]` **Việc còn lại**: người sửa `docs/db.dbml` phải cập nhật theo Q-01 (thêm `deleted_at`), Q-02 (`updated_at` cho `exams`), Q-15 (unique index) và mục “Điểm chưa chắc chắn” trong DBML cho khớp bảng trên.

### 10.4 Hạng mục hoãn đến sprint cuối `[YÊU CẦU MỚI]`

| Hạng mục | Lý do hoãn | Phụ thuộc |
|---|---|---|
| **(i) Lọc thống kê thật theo kỳ** `[YÊU CẦU MỚI]` — Q-05: lọc attempts thật theo kỳ đang chọn (dựa `submitted_at`), **bỏ hoàn toàn** các số ảo +59 / +1420 / +242 / +6150, điểm trung bình phải **đổi theo kỳ**; ref-ui hiện chỉ cộng offset mock. | Cần đủ dữ liệu attempt thật trong SQLite + lớp thống kê; làm sớm sẽ phải viết lại khi schema Q-03/Q-05 ổn định. | Q-05, Q-06 (ranh giới kỳ `Asia/Ho_Chi_Minh`, NFR-15), bảng `attempts` + index `submitted_at`. |
| **(ii) Sửa donut Phổ điểm** `[YÊU CẦU MỚI]` — bổ sung segment **“Cần cố gắng”** để donut đủ 3 nhóm (giỏi / khá / cần cố gắng), hiện chỉ thấy 2 nhóm (trùng **QDS-21**). | Thuộc nhóm chỉnh dashboard thống kê, gom chung đợt với (i) để sửa một lần. | QDS-21, dữ liệu điểm thật từ (i). |
| **(iii) `chartMetric` ẩn/hiện series thật** `[YÊU CẦU MỚI]` — Q-08: nút metric phải lọc series thực sự thay vì chỉ đổi màu chữ. | Tách khỏi logic lưu trữ; làm sau khi (i) cung cấp series tính từ dữ liệu thật. | Q-08, mục (i). |
