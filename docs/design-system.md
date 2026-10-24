# Design System — ansask-desktop

> **Nguồn sự thật duy nhất:** [`docs/ref-ui.tsx`](ref-ui.tsx) — 2994 dòng, React single-file demo, Tailwind utility classes + `lucide-react`, **không có file CSS riêng**; design system neumorphic nằm trong thẻ `<style>` tại [`ref-ui.tsx:L1254-L1341`](ref-ui.tsx#L1254-L1341).
>
> Tài liệu này **chỉ mô tả cái đang có** trong ref, không thiết kế lại. Mọi đề xuất cải tiến được gắn `[GIẢ ĐỊNH]` và tập trung ở **mục 9**. Mọi giá trị màu / shadow / radius / class đều trích nguyên văn từ code, kèm tham chiếu dòng để đối chiếu.

| Thuộc tính | Giá trị |
|---|---|
| Sản phẩm | ansask-desktop — desktop luyện thi trắc nghiệm, offline-first |
| Stack tham chiếu | React 19 + Tailwind utility + lucide-react + Tauri 2 — **`tailwindcss` và `lucide-react` đều chưa có trong `package.json`** |
| Phiên bản tài liệu | 1.0 — 2026-10-23 |
| Phạm vi | 9 màn hình, 5 overlay, **63 component** (54 giữ nguyên mã + 5 mới đợt 2 + 4 mới đợt 3), 9 nhóm token (bộ light của ref + bộ dark `[YÊU CẦU MỚI]`) |
| Quy ước tham chiếu | `ref-ui.tsx:L<dòng>` = file trong `docs/`; nhiều dòng viết `L1254-L1341` |
| Quy ước nhãn | `[GIẢ ĐỊNH]` = suy luận ngoài code; `QDS-xx` / `ASDS-xx` = câu hỏi/giả định **riêng của design system** (mục 9); `Q-xx` / `AS-xx` = mã của [`domain-core.md`](domain-core.md) |
| Trạng thái code | Demo in-memory, chưa nối SQLite / Tauri command |

**Mục lục**

1. [Nguyên tắc thiết kế & cảm quan tổng thể](#1-nguyên-tắc-thiết-kế--cảm-quan-tổng-thể)
2. [Design tokens](#2-design-tokens)
3. [Layout tổng thể ứng dụng](#3-layout-tổng-thể-ứng-dụng)
4. [Danh mục component](#4-danh-mục-component)
5. [Mô tả từng màn hình/page](#5-mô-tả-từng-màn-hìnhpage)
6. [Pattern tương tác chung](#6-pattern-tương-tác-chung)
7. [Ràng buộc & quy tắc bắt buộc (DO / DON'T)](#7-ràng-buộc--quy-tắc-bắt-buộc-do--dont)
8. [Gợi ý ánh xạ sang React component](#8-gợi-ý-ánh-xạ-sang-react-component)
9. [Giả định và câu hỏi mở](#9-giả-định-và-câu-hỏi-mở)

---

## 1. Nguyên tắc thiết kế & cảm quan tổng thể

**[CẬP NHẬT đợt 5]** Sprint 00 phải khai báo CSS variables cho **cả light và dark** (`:root` / `.dark`) theo §2.1e–f, cùng Tailwind v4 `@custom-variant dark (&:where(.dark, .dark *));`. Mọi task UI chỉ dùng token semantic, không hex trực tiếp trong JSX/CSS component; hex chỉ nằm ở định nghĩa token. Các giá trị/class của ref bên dưới là dữ liệu đối chiếu, phải ánh xạ sang token khi triển khai. Sprint 06 chỉ hoàn thiện chuyển đổi/persist/chống nháy trắng. Cache localStorage dùng duy nhất key `theme` ở cả Sprint 00 và Sprint 06; SQLite `app_settings` vẫn là nguồn persist chính.

### 1.1 Neumorphic soft UI — một hệ "ánh sáng" duy nhất

Toàn bộ giao diện dựng trên **một** ý niệm: mọi khối là cùng một vật liệu `#eef2f7` nổi lên khỏi nền `#e8edf4`, được chiếu sáng từ **trên-trái** (bóng trắng `#ffffff`, offset âm) và đổ bóng về **dưới-phải** (bóng xám-xanh, offset dương). Không có gradient nền, không có border đậm, không có màu nền khác ngoài các sắc xám-xanh này.

```css
/* ref-ui.tsx:L1267-L1271 */
.neu-card {
  background: #eef2f7;
  box-shadow: 7px 7px 16px #d0d8e4, -7px -7px 16px #ffffff;
  border: 1px solid rgba(255, 255, 255, 0.8);
}
```

Hệ quả kỹ thuật: **độ nổi (elevation) được mã hoá bằng cặp offset/blur**, không bằng `shadow-sm/md/lg`. Muốn "cao hơn" thì tăng offset + blur (4 → 5 → 6 → 7 → 14px), muốn "chìm" thì đảo dấu bằng `inset`. Chỉ có 5 bậc nổi + 1 bậc chìm (xem [2.6](#26-shadow)).

### 1.2 Khối nổi và khối chìm

| Vai trò | Class | Cảm giác | Dùng cho |
|---|---|---|---|
| Nổi cấp khung | `.neu-shell` (14px) | Panel lớn nhất, tách khỏi cửa sổ | Sidebar, `<main>`, popover, modal |
| Nổi cấp card | `.neu-card` (7px) | Khối nội dung | Section, card môn, card bộ đề, banner |
| Nổi cấp pill | `.neu-pill` (5px) / `.neu-pill-active` (6px) | Viên nhỏ, bấm được | Chip, nút phụ, avatar, badge điểm |
| Nổi cấp icon | `.neu-icon-btn` (4px) | Nút vuông nhỏ | Nút xoá, settings, đóng |
| Chìm | `.neu-card-inset` (inset 4px) | Ô nhập, vùng chứa dữ liệu | Input, textarea, hàng lựa chọn, khung prompt, `pre` |

Quy ước ngầm: **nội dung nhập vào thì chìm, hành động thì nổi, khung thì nổi nhất**. Đây là quy tắc bất biến của hệ; đảo ngược sẽ phá vỡ ảo giác vật liệu.

### 1.3 Tương phản thấp, màu nhấn là than chì

Không có "primary blue". Màu nhấn hành động là **than chì** `#262b33` (nút tối gradient `#2d333d → #1d2128`, [`L1307-L1312`](ref-ui.tsx#L1307-L1312)). Màu chức năng chỉ xuất hiện ở nơi có ngữ nghĩa:

- **Xanh dương** `#3b82f6` — dữ liệu biểu đồ (đường điểm, [`L1650`](ref-ui.tsx#L1650)).
- **Emerald** — đáp án đúng, trạng thái thành công, đồng bộ cú pháp, chấm online ([`L636`](ref-ui.tsx#L636), [`L2543`](ref-ui.tsx#L2543), [`L1410`](ref-ui.tsx#L1410)).
- **Rose** — đáp án sai, nút xoá khi hover ([`L645`](ref-ui.tsx#L645), [`L615`](ref-ui.tsx#L615)).
- **Amber** — cảnh báo cú pháp đang chờ ([`L2539`](ref-ui.tsx#L2539)).

Tương phản chữ cố ý thấp: chữ phụ dùng `slate-400` trên `#eef2f7` chỉ đạt ~2.5:1 — **không dùng cho thông tin bắt buộc đọc** (xem DON'T ở mục 7 và QDS-04).

### 1.4 Typography dày, cỡ nhỏ, mật độ cao

Ứng dụng desktop nhiều dữ liệu: cỡ chữ chủ đạo là **11–14px**, nhãn bảng 11px uppercase, số liệu lớn 20–24px. Hai họ font Google Sans (chính) và Plus Jakarta Sans (dự phòng), nạp qua `@import` Google Fonts ([`L1255`](ref-ui.tsx#L1255)). Xem [2.2](#22-typography).

### 1.5 Bố cục "floating panels"

Không có khung liền mạch kiểu app cổ điển. Mỗi vùng là một khối nổi **tách rời**, cách nhau `gap-5`/`gap-7` (20/28px), bo góc rất lớn 24–32px, padding trong 20–32px. Sidebar và main là hai panel song song, không dính cạnh cửa sổ (`p-3 sm:p-6` ở wrapper, [`L1252`](ref-ui.tsx#L1252)).

### 1.6 Hệ quả bắt buộc cho dev

| Đặc tính cảm quan | Quy tắc kỹ thuật | Hệ quả |
|---|---|---|
| Vật liệu đồng nhất | Mọi surface dùng `#eef2f7`; chỉ inset dùng `#e9eef5` | Không tự thêm `bg-white`, `bg-slate-50` cho khối lớn |
| Ánh sáng một chiều | Cặp shadow luôn `(+x,+y)` tối và `(-x,-y)` sáng | Không dùng shadow 1 chiều, không dùng `shadow-md` cho khối neu |
| Nổi bằng shadow, không bằng viền | Viền chỉ là `1px rgba(255,255,255,.65–.9)` | Viền xám đậm > 1.5px là sai hệ |
| Trạng thái = đảo shadow | Hover giảm offset, active → `inset` | Không dùng `scale` đơn thuần cho active |
| Màu nhấn = than chì | CTA dùng `.neu-dark-btn`, không dùng xanh | Xanh/emerald/rose chỉ mang nghĩa dữ liệu |
| Bo góc lớn | 12px cho control nhỏ, 24–32px cho khối | Không dùng `rounded-md` cho card |
| Chuyển động ngắn | 200ms cho tương tác, 300ms cho layout, 500ms cho dữ liệu | Không animation > 500ms ngoài toast |

---

## 2. Design tokens

> Toàn bộ giá trị dưới đây trích từ [`ref-ui.tsx:L1254-L1341`](ref-ui.tsx#L1254-L1341) và các class Tailwind trong JSX. Repo **chưa có** `tailwind.config.*` và **chưa cài** `tailwindcss` trong `package.json` → các giá trị palette mặc định của Tailwind được đánh dấu `[GIẢ ĐỊNH]` (QDS-01).
>
> **[CẬP NHẬT đợt 2 — R2/R4]:** mục này được bổ sung **(e)** bộ token dark mode và **(f)** token cú pháp TXT `syntax-ask` / `syntax-ans` — cả hai là `[YÊU CẦU MỚI]`, **không** có trong ref-ui (ref chỉ có light, không có `dark` class, không có token nào cho highlight). Cách áp dụng dark mode qua Tailwind xem [8.4](#84-tích-hợp-tailwind--css-variables).

### 2.1 Màu sắc

**a) Màu lõi của hệ neumorphic**

| Token | Giá trị | Vai trò | Ref |
|---|---|---|---|
| `--app-bg` | `#e8edf4` | Nền toàn cửa sổ | [`L1252`](ref-ui.tsx#L1252) |
| `--neu-surface` | `#eef2f7` | Mặt khối nổi (shell / card / pill / icon) | [`L1262`](ref-ui.tsx#L1262), [`L1268`](ref-ui.tsx#L1268), [`L1280`](ref-ui.tsx#L1280), [`L1292`](ref-ui.tsx#L1292) |
| `--neu-surface-raised` | `#f5f8fc` | Mặt pill đang chọn (sáng hơn 1 bậc) | [`L1286`](ref-ui.tsx#L1286) |
| `--neu-inset` | `#e9eef5` | Mặt khối chìm | [`L1274`](ref-ui.tsx#L1274) |
| `--ink-900` | `#1e232a` | Chữ tiêu đề, số liệu, nhấn mạnh | [`L1379`](ref-ui.tsx#L1379), [`L1497`](ref-ui.tsx#L1497) |
| `--ink-800` | `#262b33` | Chữ thân, nền nút tối, focus ring | [`L1252`](ref-ui.tsx#L1252), [`L1308`](ref-ui.tsx#L1308) |
| `--ink-700` | `#2d333d` | Đỉnh gradient nút tối | [`L1308`](ref-ui.tsx#L1308) |
| `--ink-950` | `#1d2128` | Đáy gradient nút tối | [`L1308`](ref-ui.tsx#L1308) |
| `--ink-1000` | `#14171c` | Đáy cột biểu đồ (gradient) | [`L1694`](ref-ui.tsx#L1694) |

**b) Màu bóng (shadow colors) — bắt buộc dùng đúng cặp**

| Token | Giá trị | Dùng cho | Ref |
|---|---|---|---|
| `--shadow-1` | `#cfd6e2` | Bóng tối của `.neu-shell` 14px | [`L1263`](ref-ui.tsx#L1263) |
| `--shadow-2` | `#d0d8e4` | Bóng tối của `.neu-card` 7px | [`L1269`](ref-ui.tsx#L1269) |
| `--shadow-3` | `#ced6e2` | Bóng tối của `.neu-pill` 5px và `.neu-icon-btn` 4px | [`L1281`](ref-ui.tsx#L1281), [`L1293`](ref-ui.tsx#L1293) |
| `--shadow-4` | `#c9d2e0` | Bóng tối của `.neu-pill-active` 6px | [`L1287`](ref-ui.tsx#L1287) |
| `--shadow-5` | `#c5cdd9` | Bóng tối của `.neu-dark-btn` | [`L1310`](ref-ui.tsx#L1310) |
| `--shadow-inset` | `#cfd7e3` | Bóng chìm của `.neu-card-inset` | [`L1275`](ref-ui.tsx#L1275) |
| `--highlight` | `#ffffff` | Bóng sáng mọi cấp + viền + nền knob | toàn bộ `.neu-*` |

**c) Màu ngữ nghĩa (Tailwind palette mặc định `[GIẢ ĐỊNH]` — QDS-01)**

| Nhóm | Class dùng trong ref | Hex tương ứng | Ngữ nghĩa |
|---|---|---|---|
| Trung tính | `text-slate-400` / `500` / `600` | `#94a3b8` / `#64748b` / `#475569` | Chữ phụ, nhãn bảng, metadata |
| Đường kẻ | `border-slate-200/80`, `border-slate-200/70` | `#e2e8f0` | Divider, header bảng, footer card |
| Track | `bg-slate-200`, `from-slate-200/90 to-slate-300/60` | `#e2e8f0` / `#cbd5e1` | Track progress, vỏ cột biểu đồ |
| Thành công | `emerald-500/600/700`, `emerald-400` | `#10b981` / `#059669` / `#047857` / `#34d399` | Đáp án đúng, đồng bộ, chấm online |
| Lỗi | `rose-400/500/600` | `#fb7185` / `#f43f5e` / `#e11d48` | Đáp án sai, hover xoá |
| Cảnh báo | `amber-600` | `#d97706` | Cú pháp đang chờ |
| Liên kết | `blue-600` | `#2563eb` | Hover link ở AI Guide |
| Dữ liệu | `#3b82f6` | `#3b82f6` | Polyline biểu đồ điểm |
| Donut | `#1e232a`, `#64748b`, `#dce3ee` | — | Segment Xuất sắc / Khá giỏi / track |
| Backdrop | `bg-slate-900/35` | `#0f172a` @35% | Nền modal |
| Scrollbar | `#cbd3e0` → hover `#9aa6b8` | — | Thanh cuộn 6px |

**d) Palette 8 màu môn học** — [`L147-L156`](ref-ui.tsx#L147-L156)

| `id` | Tên hiển thị | `hex` | `soft` | Ghi chú |
|---|---|---|---|---|
| `charcoal` | Than chì | `#262b33` | `#dce2ec` | Mặc định khi tạo môn ([`L818`](ref-ui.tsx#L818)) |
| `royalblue` | Xanh dương | `#3b82f6` | `#dbeafe` | |
| `emerald` | Xanh ngọc | `#10b981` | `#d1fae5` | |
| `violet` | Tím khói | `#8b5cf6` | `#ede9fe` | |
| `amber` | Cam hổ phách | `#f59e0b` | `#fef3c7` | |
| `rose` | Đỏ hồng | `#f43f5e` | `#ffe4e6` | |
| `cyan` | Xanh lam | `#06b6d4` | `#cffafe` | |
| `indigo` | Chàm | `#6366f1` | `#e0e7ff` | |

> `soft` được khai báo nhưng **không dùng ở bất kỳ đâu** trong render (chỉ tồn tại ở 8 dòng khai báo) → QDS-03. Hiện UI chỉ dùng `hex` làm `backgroundColor` (badge, chấm màu, ô vuông chữ cái đầu).

**e) Bộ token dark mode — `[YÊU CẦU MỚI]` (R2)**

Ref chỉ có light; bảng dưới đây là bộ token dark **đề xuất**, giữ đúng logic neumorphic: bóng `(+x,+y)` phải **tối hơn** nền, bóng `(-x,-y)` (highlight) phải **sáng hơn** nền — trong dark mode hai khái niệm này **đảo vai trò tương phản** chứ không đảo offset. Mọi giá trị là `[GIẢ ĐỊNH]` (ref không có bất kỳ tham chiếu dark nào) — QDS-45.

| Token | Light (ref) | Dark `[GIẢ ĐỊNH]` | Vai trò |
|---|---|---|---|
| `--app-bg` | `#e8edf4` | `#1a1f27` | Nền toàn cửa sổ |
| `--neu-surface` | `#eef2f7` | `#242b36` | Mặt khối nổi (shell / card / pill / icon) |
| `--neu-surface-raised` | `#f5f8fc` | `#2c3441` | Mặt pill đang chọn (sáng hơn 1 bậc) |
| `--neu-inset` | `#e9eef5` | `#20262f` | Mặt khối chìm (tối hơn surface 1 bậc) |
| `--ink-900` | `#1e232a` | `#eef2f7` | Chữ tiêu đề, số liệu (đảo sáng/tối) |
| `--ink-800` | `#262b33` | `#cbd5e1` | Chữ thân, icon, focus ring |
| `--ink-700` | `#2d333d` | `#3a4552` | Đỉnh gradient CTA |
| `--ink-950` | `#1d2128` | `#252d38` | Đáy gradient CTA |
| `--ink-1000` | `#14171c` | `#161b22` | Đáy cột biểu đồ (gradient) |
| `--shadow-1` | `#cfd6e2` | `#10141a` | Bóng tối của `.neu-shell` |
| `--shadow-2` | `#d0d8e4` | `#11161d` | Bóng tối của `.neu-card` |
| `--shadow-3` | `#ced6e2` | `#12171e` | Bóng tối của `.neu-pill` / `.neu-icon-btn` |
| `--shadow-4` | `#c9d2e0` | `#141a22` | Bóng tối của `.neu-pill-active` |
| `--shadow-5` | `#c5cdd9` | `#0e1218` | Bóng tối của `.neu-dark-btn` |
| `--shadow-inset` | `#cfd7e3` | `#161b23` | Bóng chìm của `.neu-card-inset` |
| `--highlight` | `#ffffff` | `#39424f` | Bóng **sáng** (offset âm) — sáng hơn surface ~1.4 bậc |
| `--border-strong` | `rgba(255,255,255,.85)` | `rgba(255,255,255,.06)` | Viền shell/card/pill (trong dark, viền trắng alpha cao sẽ thành “vệt sáng”) |
| `--cta-from` / `--cta-to` | `#2d333d` / `#1d2128` | `#3a4552` / `#252d38` | Gradient `.neu-dark-btn` |

> **Quy tắc bất biến khi port dark mode:** (1) không đảo dấu offset — chỉ đổi giá trị màu; (2) `.neu-dark-btn` đã tối sẵn → giữ hành vi CTA, chỉ nâng surface 1 bậc trong dark cho đủ tách khỏi nền; (3) backdrop modal `bg-slate-900/35` → `bg-black/60` `[GIẢ ĐỊNH]`; (4) scrollbar `#cbd3e0 → #3a4552` `[GIẢ ĐỊNH]`. Áp dụng duy nhất qua **CSS variables + class `dark`** trên `<html>` (xem [8.4](#84-tích-hợp-tailwind--css-variables)), **không** viết tay `dark:` cho giá trị đã là token.

**f) Token cú pháp TXT — `syntax-ask` / `syntax-ans` — `[YÊU CẦU MỚI]` (R4)**

Dùng cho `SyntaxHighlightedTextarea` ([4.59](#459-syntaxhighlightedtextarea)) ở SCREEN-05 (tab TXT). Cú pháp thật lấy từ serializer [`ref-ui.tsx:L49-L59`](ref-ui.tsx#L49-L59) và parser [`ref-ui.tsx:L92-L141`](ref-ui.tsx#L92-L141):

| Token | Regex parser (nguồn sự thật) | Ý nghĩa | Màu light | Màu dark `[GIẢ ĐỊNH]` |
|---|---|---|---|---|
| `syntax-ask` | `/^ask\s*:/i` — dòng bắt đầu bằng `ask` + `:` (nhận `ask :`, `ask:`, `ASK:`) | đầu câu hỏi | `#e11d48` (rose-600) | `#fb7185` (rose-400) |
| `syntax-ans` (đúng) | `/^ans\.\*/i` — `ans.` + `*`, được kiểm tra **trước** nhánh `ans.` | đáp án **đúng** | `#2563eb` (blue-600) | `#60a5fa` (blue-400) |
| `syntax-ans` (sai) | `/^ans\./i` — `ans.` thường | đáp án sai | `#2563eb` (blue-600) | `#60a5fa` (blue-400) |

- **Phạm vi tô: chỉ token đầu dòng** — `ask` + dấu `:`; hoặc `ans.`; hoặc `ans.*`. Parser coi mọi ký tự sau token là **nội dung** (kể cả khoảng trắng sau khi trim [`L98`](ref-ui.tsx#L98)) → phần còn lại của dòng giữ màu chữ thường.
- **Dòng continuation** (không khớp 3 token trên, [`L129-L136`](ref-ui.tsx#L129-L136)) được nối vào `ask`/lựa chọn gần nhất → **không tô màu**, không gạch chân.
- Parser case-insensitive (`/i`) → `ANS.*`, `Ask:` vẫn là token và vẫn tô.
- Cả hai màu đạt tương phản AA trên nền `--neu-inset` light (`#e9eef5`) và dark (`#20262f`) — kiểm tra lại khi chốt bảng dark (QDS-45).
- **JSON mode không tô màu** đợt 2 (chỉ TXT được hỗ trợ — `[YÊU CẦU MỚI]`).
- Vùng dòng lỗi (validate TXT, xem [4.40](#440-parseerrorbanner)) dùng `bg-rose-500/10` `[GIẢ ĐỊNH]` — style chưa chốt, QDS-46.

### 2.2 Typography

| Thuộc tính | Giá trị thực | Ref |
|---|---|---|
| Font stack | `'Google Sans', 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif` | [`L1258`](ref-ui.tsx#L1258) |
| Phạm vi áp dụng | Selector `*` (toàn bộ phần tử, kể cả input/button) | [`L1257-L1259`](ref-ui.tsx#L1257-L1259) |
| Google Fonts | `Google+Sans:wght@400;500;700` + `Plus+Jakarta+Sans:wght@400;500;600;700` | [`L1255`](ref-ui.tsx#L1255) |
| Weight dùng | `400` (mặc định), `500` (`font-medium`), `600` (`font-semibold`), `700` (`font-bold`) | toàn file |
| Mono | `font-mono` cho `textarea` code và `pre` prompt | [`L2559`](ref-ui.tsx#L2559), [`L2892`](ref-ui.tsx#L2892) |

> Google Sans **không** có weight 600 trong `@import`, nhưng `font-semibold` được dùng ~10 lần → trình duyệt tự tổng hợp (synthetic bold) hoặc fallback sang Plus Jakarta Sans. Ghi nhận QDS-02.

**Thang cỡ chữ thực tế** (không có scale trung gian nào khác):

| Cỡ | Class | Dùng ở |
|---|---|---|
| 10px | `text-[10px]` | Tooltip biểu đồ, badge "Vừa xong", nhãn "Điểm / 10" |
| 11px | `text-[11px]` | Nhãn phụ, badge đếm, header bảng, legend donut, hint cú pháp |
| 12px | `text-xs` | Chữ phụ chuẩn, pill, nút nhỏ, nav label |
| 14px | `text-sm` | Chữ thân, câu hỏi, input, modal |
| 16px | `text-base` | Tiêu đề card, tên môn, logo brand |
| 18px | `text-lg` | Tiêu đề section, tên bộ đề ở result |
| 20px | `text-xl` | Điểm TB trong donut, tiêu đề exam overview |
| 24px | `text-2xl` | Số liệu metric, điểm score banner |

**Line-height & tracking:** `leading-tight` (khối logo), `leading-relaxed` (câu hỏi, prompt, mô tả bước), `tracking-tight` (logo), `tracking-wider` (nav label uppercase), `uppercase` (header bảng, "Điểm / 10", tab TXT/JSON).

### 2.3 Spacing

| Nhóm | Giá trị dùng | Ví dụ |
|---|---|---|
| Padding khung trang | `p-3 sm:p-6` | Wrapper app [`L1252`](ref-ui.tsx#L1252) |
| Padding panel | `p-5 sm:p-8` | `<main>` [`L1486`](ref-ui.tsx#L1486) |
| Padding card | `p-4`, `p-5`, `p-6`, `p-8`, `p-12` | Metric `p-4`, section `p-5 sm:p-6`, empty state `p-12` |
| Gap layout | `gap-5 sm:gap-7` (panel), `gap-6` (grid), `gap-5` (grid card), `gap-4`, `gap-3`, `gap-2.5` | [`L1252`](ref-ui.tsx#L1252), [`L1591`](ref-ui.tsx#L1591), [`L2053`](ref-ui.tsx#L2053) |
| Gap nội bộ nhỏ | `gap-1`, `gap-1.5`, `gap-2`, `gap-3`, `gap-3.5` | Pill, icon + label |
| Dọc | `space-y-1`, `1.5`, `2`, `2.5`, `3`, `4`, `5`, `6`, `9` | List câu hỏi `space-y-4`, grid line chart `space-y-9` |
| Kích thước cố định | `w-7` (nhãn trục), `w-10 h-5` (switch), `w-11 h-11` (icon tile), `w-14 h-14` (empty icon), `w-16 h-16` (avatar), `w-24 h-24` (điểm), `w-44 h-44` (donut), `h-[640px]` (pane), `w-72`/`w-64` (popover) | rải rác |

### 2.4 Radius

| Token | Giá trị | Dùng cho | Ref |
|---|---|---|---|
| `rounded-lg` | 8px | Nút nhỏ trong popover, badge "Vừa xong", radio label | [`L2405`](ref-ui.tsx#L2405) |
| `rounded-xl` | 12px | Input, nút CTA nhỏ, icon button 32px, tab | [`L2003`](ref-ui.tsx#L2003) |
| `rounded-2xl` | 16px | Card metric, hàng lựa chọn, popover, toast, banner | [`L1528`](ref-ui.tsx#L1528) |
| `rounded-3xl` | 24px | Empty state | [`L2111`](ref-ui.tsx#L2111) |
| `rounded-full` | 9999px | Pill, nav item, avatar, switch, progress, dot | [`L1436`](ref-ui.tsx#L1436) |
| `rounded-[24px]` | 24px | SubjectCard, ExamCard | [`L2064`](ref-ui.tsx#L2064), [`L2141`](ref-ui.tsx#L2141) |
| `rounded-[26px]` | 26px | Section card dashboard, pane editor, overview header | [`L1493`](ref-ui.tsx#L1493), [`L2361`](ref-ui.tsx#L2361) |
| `rounded-[28px]` | 28px | Modal panel, score banner | [`L2905`](ref-ui.tsx#L2905), [`L2679`](ref-ui.tsx#L2679) |
| `rounded-[30px]` | 30px | Sidebar shell | [`L1348`](ref-ui.tsx#L1348) |
| `rounded-[32px]` | 32px | `<main>` shell | [`L1486`](ref-ui.tsx#L1486) |

> Giá trị px của `lg/xl/2xl/3xl` là mặc định Tailwind (`[GIẢ ĐỊNH]` — chưa có config, QDS-01). Quy ước: **control nhỏ 12px, card nội dung 16px, card lớn 24–26px, khung 28–32px, pill full**.

### 2.5 Shadow

| Tên | Chuỗi `box-shadow` chính xác | Ref |
|---|---|---|
| `.neu-shell` | `14px 14px 32px #cfd6e2, -14px -14px 32px #ffffff` | [`L1263`](ref-ui.tsx#L1263) |
| `.neu-card` | `7px 7px 16px #d0d8e4, -7px -7px 16px #ffffff` | [`L1269`](ref-ui.tsx#L1269) |
| `.neu-pill` | `5px 5px 11px #ced6e2, -5px -5px 11px #ffffff` | [`L1281`](ref-ui.tsx#L1281) |
| `.neu-pill-active` | `6px 6px 14px #c9d2e0, -6px -6px 14px #ffffff` | [`L1287`](ref-ui.tsx#L1287) |
| `.neu-icon-btn` | `4px 4px 9px #ced6e2, -4px -4px 9px #ffffff` | [`L1293`](ref-ui.tsx#L1293) |
| `.neu-icon-btn:hover` | `2px 2px 5px #ced6e2, -2px -2px 5px #ffffff` + `translateY(1px)` | [`L1298-L1301`](ref-ui.tsx#L1298-L1301) |
| `.neu-icon-btn:active` | `inset 3px 3px 6px #ced6e2, inset -3px -3px 6px #ffffff` | [`L1303-L1305`](ref-ui.tsx#L1303-L1305) |
| `.neu-card-inset` | `inset 4px 4px 9px #cfd7e3, inset -4px -4px 9px #ffffff` | [`L1275`](ref-ui.tsx#L1275) |
| `.neu-dark-btn` | `5px 5px 12px #c5cdd9, -4px -4px 10px #ffffff` (offset không đối xứng) | [`L1310`](ref-ui.tsx#L1310) |

**Shadow phụ (Tailwind):** `shadow-sm` (segment active, hàng mới), `shadow-md` (badge preset active, tooltip chart, icon vuông môn), `shadow-lg` (QuestionCard focus), `shadow-xl` (popover quiz), `shadow-2xl` (popover editor), `shadow-inner` (radio unchecked, vỏ cột biểu đồ), `shadow` (knob switch).

### 2.6 Border

| Ngữ cảnh | Giá trị | Ref |
|---|---|---|
| Shell | `1.5px solid rgba(255,255,255,0.85)` | [`L1264`](ref-ui.tsx#L1264) |
| Card | `1px solid rgba(255,255,255,0.8)` | [`L1270`](ref-ui.tsx#L1270) |
| Inset | `1px solid rgba(255,255,255,0.65)` | [`L1276`](ref-ui.tsx#L1276) |
| Pill | `1px solid rgba(255,255,255,0.9)` | [`L1282`](ref-ui.tsx#L1282) |
| Pill active | `1.5px solid #ffffff` | [`L1285-L1289`](ref-ui.tsx#L1285-L1289) |
| Panel phụ (form, history) | `border border-white` | [`L1978`](ref-ui.tsx#L1978), [`L2269`](ref-ui.tsx#L2269) |
| Divider | `border-slate-200/70` (70%), `/80` (header), `/60` (bảng) | [`L1464`](ref-ui.tsx#L1464), [`L1820`](ref-ui.tsx#L1820), [`L1829`](ref-ui.tsx#L1829) |
| Đúng | `border-emerald-400` / `/80` / `/70` | [`L636`](ref-ui.tsx#L636) |
| Sai | `border-rose-400` | [`L645`](ref-ui.tsx#L645) |
| Input / radio | `border-slate-300`, `border-slate-400` | [`L588`](ref-ui.tsx#L588), [`L692`](ref-ui.tsx#L692) |
| Nhấn mạnh | `border-[#262b33]/30`, `border-4 border-[#262b33]` | [`L2741`](ref-ui.tsx#L2741), [`L2681`](ref-ui.tsx#L2681) |

### 2.7 z-index

| Layer | Giá trị | Thành phần | Ref |
|---|---|---|---|
| Nội dung nổi trong chart | `z-10` | Cột biểu đồ | [`L1679`](ref-ui.tsx#L1679) |
| Sticky quiz bar | `z-20` + `sticky top-2` | QuizControlBar | [`L2572`](ref-ui.tsx#L2572) |
| Popover | `z-30` | All Questions (editor/quiz) | [`L2386`](ref-ui.tsx#L2386), [`L2611`](ref-ui.tsx#L2611) |
| Modal + Toast | `z-50` | Backdrop modal, toast | [`L2904`](ref-ui.tsx#L2904), [`L1338`](ref-ui.tsx#L1338) |

> Toast và modal **cùng** `z-50`; toast render trước modal trong DOM nên modal sẽ phủ toast nếu cả hai mở. Ghi nhận QDS-05.

### 2.8 Motion

| Token | Giá trị | Dùng ở | Ref |
|---|---|---|---|
| `duration-200` | 200ms | NavItem, SubjectCard hover, gap insert, `ease` cho `.neu-icon-btn`/`.neu-dark-btn` | [`L1295`](ref-ui.tsx#L1295), [`L1436`](ref-ui.tsx#L1436) |
| `duration-300` | 300ms | Sidebar width (`ease-in-out`), QuestionCard focus | [`L1348`](ref-ui.tsx#L1348), [`L567`](ref-ui.tsx#L567) |
| `duration-500` | 500ms | Cột biểu đồ (chiều cao) | [`L1689`](ref-ui.tsx#L1689) |
| `transition-colors` | 150ms mặc định | Hover chữ, row bảng, switch | [`L1833`](ref-ui.tsx#L1833), [`L2221`](ref-ui.tsx#L2221) |
| `transition-transform` | 150ms | Chevron `translate-x-1`, knob switch, logo | [`L2095`](ref-ui.tsx#L2095), [`L2226`](ref-ui.tsx#L2226) |
| `ease-in-out` | cubic-bezier(.4,0,.2,1) | Sidebar | [`L1348`](ref-ui.tsx#L1348) |
| `animate-bounce` | 1s infinite (Tailwind) | Toast | [`L1338`](ref-ui.tsx#L1338) |
| `animate-pulse` | 2s infinite (Tailwind) | Icon toggle khi hover logo | [`L1369`](ref-ui.tsx#L1369) |
| `animate-fadeIn` | **Không định nghĩa** | Tab dashboard/guide, panel modal | [`L1491`](ref-ui.tsx#L1491), [`L2905`](ref-ui.tsx#L2905) |
| `backdrop-blur-xs` | **Không có trong Tailwind v3** | Backdrop modal | [`L2904`](ref-ui.tsx#L2904) |

> `@keyframes fadeIn` không tồn tại trong `<style>` (chỉ có 6 class `.neu-*` + scrollbar). Đề xuất keyframes ở QDS-06. Không có `prefers-reduced-motion` (QDS-07).

### 2.9 Breakpoint & kích thước cửa sổ desktop

**Breakpoint Tailwind sử dụng** (mặc định, chưa custom):

| BP | Min-width | Nơi layout đổi |
|---|---|---|
| `sm` | 640px | `p-3→sm:p-6`, `gap-5→sm:gap-7`, metric `sm:grid-cols-2`, subject grid `sm:grid-cols-2`, title bar `sm:flex-row`, editor pane `text-xs→sm:text-sm` |
| `md` | 768px | Wrapper `flex-col→md:flex-row`; sidebar `w-full→md:w-64` hoặc `md:w-20`; exam grid `md:grid-cols-2`; form tạo môn `md:grid-cols-2`; guide `md:grid-cols-3`; score banner `md:flex-row` |
| `lg` | 1024px | Chart row `lg:grid-cols-3` + `lg:col-span-2`; overview header `lg:flex-row`; editor `lg:grid-cols-2` |
| `xl` | 1280px | Metric `xl:grid-cols-4` |

**Kích thước cửa sổ:** `src-tauri/tauri.conf.json` khai báo `width: 800`, `height: 600`, **không có `minWidth`/`minHeight`** ([`tauri.conf.json:L16-L17`](src-tauri/tauri.conf.json#L16-L17)). Đây là điểm lệch nghiêm trọng so với layout: ở 800px, `md` đã bật → sidebar 256px + gap 28px + padding 48px → vùng nội dung chỉ còn ~468px, trong khi chart cần `lg` (1024px) mới đủ 3 cột. `[GIẢ ĐỊNH]` khuyến nghị `minWidth: 1024`, mặc định 1280×800 — **[CẬP NHẬT đợt 2]: ĐÃ CHỐT theo ASDS-03** (QDS-08 đóng): `tauri.conf.json` phải đổi `width: 1280`, `height: 800`, thêm `minWidth: 1024`, `minHeight: 700` `[YÊU CẦU MỚI]`. Cửa sổ < 1024 **không** thiết kế thêm — đây là ngưỡng cứng khi port (xem [8.4](#84-tích-hợp-tailwind--css-variables)).

**Hành vi < 640px (mobile/stacked):** sidebar chiếm `w-full` và nằm **trên** nội dung (`flex-col`); label/tên/toggle **vẫn bị unmount** nếu `sidebarOpen=false` (chỉ còn icon) — mobile chỉ khác ở width/padding; main `p-5`; metric 1 cột; subject card 1 cột; bảng recent attempts cuộn ngang (`overflow-x-auto`, [`L1817`](ref-ui.tsx#L1817)); editor 2 pane xếp dọc, mỗi pane vẫn `h-[640px]` → trang rất dài (QDS-09).

---

## 3. Layout tổng thể ứng dụng

Toàn bộ ứng dụng là **một trang duy nhất** (không router, không URL): `App` giữ `activeTab` (`home` / `exams` / `guide`) và `examViewMode` (`root` / `subject` / `examDetail` / `examEditor` / `quizActive` / `quizResult`) — [`L796`](ref-ui.tsx#L796), [`L811`](ref-ui.tsx#L811). Layout gồm **3 lớp**: khung cửa sổ → sidebar + main → overlay (toast / popover / modal).

### 3.1 Khung tổng (≥1024px, sidebar mở)

```
┌──────────────────────────── cửa sổ Tauri (mặc định 800×600) ────────────────────────────┐
│  div.min-h-screen  bg #e8edf4  p-3 sm:p-6  flex-col md:flex-row  gap-5 sm:gap-7       │
│                                                                                        │
│  ┌──────────────────┐   gap 28px   ┌──────────────────────────────────────────────┐   │
│  │ ASIDE            │              │ MAIN                                          │   │
│  │ .neu-shell       │              │ .neu-shell  rounded-[32px]  p-5 sm:p-8       │   │
│  │ rounded-[30px]   │              │ flex-1  gap-6  overflow-x-hidden             │   │
│  │ w-64  p-6        │              │                                              │   │
│  │                  │              │  ┌────────────────────────────────────────┐  │   │
│  │ [Q]  QUIZ Analysis│             │  │ Breadcrumb (chỉ tab exams)             │  │   │
│  │      Smart Exam.. │             │  │ .neu-card rounded-2xl px-5 py-4        │  │   │
│  │      [PanelLeft]  │             │  └────────────────────────────────────────┘  │   │
│  │                  │              │  ┌────────────────────────────────────────┐  │   │
│  │      (MH)        │              │  │ NỘI DUNG THEO TAB                      │  │   │
│  │   Matthew Hayes  │              │  │ • home  → Dashboard 3 section          │  │   │
│  │   ID: 308591433  │              │  │ • exams → 6 view (root→subject→…)      │  │   │
│  │                  │              │  │ • guide → 2 section                    │  │   │
│  │  ▸ OVERVIEW      │              │  └────────────────────────────────────────┘  │   │
│  │  ▸ ĐỀ KIỂM TRA   │              │                                              │   │
│  │  ▸ AI GUIDE      │              │                                              │   │
│  │  ▸ THÙNG RÁC     │              │  ← NavBadge số mục (ẩn khi 0)                 │   │
│  │  ─────────────   │              │                                              │   │
│  │  [ThemeToggle]    │              │                                              │   │
│  └──────────────────┘              └──────────────────────────────────────────────┘   │
│                                                                                        │
│        Toast: fixed bottom-6 right-6 z-50 (chỉ khi có message)                         │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

| Vùng | Khung / class | Kích thước | Ref |
|---|---|---|---|
| Root | `min-h-screen bg-[#e8edf4] text-[#262b33] flex flex-col md:flex-row p-3 sm:p-6 gap-5 sm:gap-7` | full viewport | [`L1252`](ref-ui.tsx#L1252) |
| Sidebar | `aside.neu-shell rounded-[30px] shrink-0 flex flex-col justify-between` | `md:w-64 p-6` / `md:w-20 p-4` | [`L1347-L1350`](ref-ui.tsx#L1347-L1350) |
| Main | `main.flex-1 neu-shell rounded-[32px] p-5 sm:p-8 overflow-x-hidden flex flex-col gap-6` | co giãn | [`L1486`](ref-ui.tsx#L1486) |
| Overlay | `fixed` + `z-50` (toast, modal) / `absolute` + `z-30` (popover) | theo nội dung | [`L1338`](ref-ui.tsx#L1338), [`L2904`](ref-ui.tsx#L2904) |

> Không có `h-screen` / `overflow-y-auto` ở sidebar hay main: **toàn bộ trang cuộn**, sidebar giãn theo chiều cao nội dung. Với màn hình dài (editor, quiz 40 câu), nav sidebar sẽ trôi khỏi viewport (QDS-10).

### 3.2 Sidebar mở / thu gọn

```
MỞ (sidebarOpen = true)                 THU GỌN (sidebarOpen = false)
┌──────────────────────────┐            ┌──────────┐
│ [Q]  QUIZ Analysis  [◧]  │            │   [Q]    │  ← logo 44×44, hover đổi icon
│      Smart Exam Studio   │            │          │
│                          │            │   (MH)   │  ← avatar vẫn hiện
│         (MH)             │            │          │
│     Matthew Hayes        │            │   ▸      │  ← icon-only, căn giữa
│     ID: 308591433       │            │   ▸      │
│                          │            │   ▸      │
│  ▸ OVERVIEW              │            │  ──────  │
│  ▸ ĐỀ KIỂM TRA           │            │   [☀]    │  ← ThemeToggle (R2)
│  ▸ AI GUIDE              │            │          │
│  ▸ THÙNG RÁC (Trash2)    │            │  NavBadge│
│  ───────────────────     │            │          │
│   [ThemeToggle ☀/☾/💻]    │            └──────────┘
└──────────────────────────┘             w-full md:w-20 p-4 items-center
   w-full md:w-64 p-6
```

Chuyển đổi: `transition-all duration-300 ease-in-out` trên `aside` ([`L1348`](ref-ui.tsx#L1348)); nội dung text bị **unmount** (không ẩn bằng opacity) nên không có hiệu ứng mờ dần — chiều rộng co giật theo bước 300ms. Nút đóng (◧) chỉ hiện khi mở; logo luôn hiện và toggle được.

> **[CẬP NHẬT đợt 2 — R2]:** đáy sidebar còn **một** nút [`ThemeToggle`](#455-themetoggle) (Sáng / Tối / Theo hệ thống — [4.55](#455-themetoggle)); 2 nút utility của ref (⚙ Settings, ⏻ Power — [`L1460-L1480`](ref-ui.tsx#L1460-L1480)) **đã bị loại bỏ**: Q-13 (Power reset điều hướng) và Q-14 (Settings chỉ toast) đóng, không còn trong phạm vi.

### 3.3 Stacked (<768px)

```
┌─────────────────────────────┐
│ ┌─────────────────────────┐ │
│ │ ASIDE  w-full           │ │  ← vẫn full nội dung: logo + avatar + 4 nav (Overview, Đề kiểm tra, AI Guide, Thùng rác)
│ │ logo / avatar / nav     │ │     + ThemeToggle (thay 2 utility ⚙/⏻ — R2), không thu gọn được về icon-only
│ │                         │ │     Thùng rác kèm NavBadge (ẩn khi 0)
│ └─────────────────────────┘ │
│            gap 20px         │
│ ┌─────────────────────────┐ │
│ │ MAIN  p-5               │ │
│ │ breadcrumb (wrap)       │ │
│ │ nội dung 1 cột          │ │
│ └─────────────────────────┘ │
└─────────────────────────────┘
```

Ở `flex-col`, sidebar luôn có width `w-full` (không bị `md:w-20` thu nhỏ). Nhưng label/tên/toggle bị **unmount** theo `sidebarOpen` ở **mọi breakpoint** ([`L1377`](ref-ui.tsx#L1377), [`L1389`](ref-ui.tsx#L1389), [`L1412`](ref-ui.tsx#L1412), [`L1449`](ref-ui.tsx#L1449)): nếu `sidebarOpen=false`, mobile cũng **chỉ còn icon**, chỉ padding/căn giữa thay đổi (QDS-09).

### 3.4 Split pane — SCREEN-05 Exam Editor

```
┌──────────────────────────── EXAM EDITOR ────────────────────────────┐
│ EditorTitleBar  .neu-card rounded-2xl p-4  (title input + n câu + Lưu) │
│                                                                       │
│ grid-cols-1 lg:grid-cols-2  gap-6  flex-1                             │
│ ┌───────────────────────────┐  ┌───────────────────────────┐          │
│ │ RENDER PANE               │  │ EDITOR PANE               │          │
│ │ .neu-card [26px] p-5      │  │ .neu-card [26px] p-5      │          │
│ │ h-[640px] flex-col        │  │ h-[640px] flex-col        │          │
│ │ ┌───────────────────────┐ │  │ ┌───────────────────────┐ │          │
│ │ │ header + All(n) ▾     │ │  │ │ header + [txt|json]   │ │          │
│ │ ├───────────────────────┤ │  │ ├───────────────────────┤ │          │
│ │ │ [+ Chèn đầu] (hover)  │ │  │ │ hint cú pháp + sync   │ │          │
│ │ │ QuestionCard editor   │ │  │ ├───────────────────────┤ │          │
│ │ │ [+ Chèn tại đây]      │ │  │ │ textarea font-mono    │ │          │
│ │ │ QuestionCard editor   │ │  │ │ (flex-1, resize-none) │ │          │
│ │ │ … overflow-y-auto     │ │  │ │                       │ │          │
│ │ └───────────────────────┘ │  │ └───────────────────────┘ │          │
│ └───────────────────────────┘  └───────────────────────────┘          │
└───────────────────────────────────────────────────────────────────────┘
```

Ref: [`L2359-L2361`](ref-ui.tsx#L2359-L2361), [`L2490`](ref-ui.tsx#L2490). Hai pane **cùng** `h-[640px]`, pane trái `overflow-y-auto` **chỉ ở vùng list** (header cố định trong pane), pane phải để textarea `flex-1` + `resize-none`.

### 3.5 Modal — OVL-02 Quiz Config

```
╔═ viewport ══════════════════════════════════════════════╗
║  backdrop: fixed inset-0 z-50 bg-slate-900/35          ║
║            backdrop-blur-xs  flex center  p-4          ║
║      ┌───────────────────────────────────────┐          ║
║      │ .neu-shell rounded-[28px]             │          ║
║      │ max-w-md w-full p-6 space-y-5         │          ║
║      │ ┌───────────────────────────────────┐ │          ║
║      │ │ Tiêu đề            [X] neu-icon   │ │          ║
║      │ │ Mô tả bộ đề + số câu gốc          │ │          ║
║      │ │ Label + input number (inset)      │ │          ║
║      │ │ [25][32][40][Tất cả]  grid-cols-4 │ │          ║
║      │ │ ─────────────────────────────     │ │          ║
║      │ │            [Đóng] [Làm bài ngay]  │ │          ║
║      │ └───────────────────────────────────┘ │          ║
║      └───────────────────────────────────────┘          ║
╚═════════════════════════════════════════════════════════╝
```

Ref: [`L2903-L2990`](ref-ui.tsx#L2903-L2990). Backdrop **không** đóng khi click (không có `onClick` trên lớp phủ), không có `Escape`, không focus trap.

### 3.6 Thứ tự DOM & z-stack

```
div (app)
├── <style> neumorphic                    z: —
├── Toast (conditional)                   z-50, fixed bottom-right
├── aside (Sidebar)                       z: auto (flow)
├── main
│   ├── Breadcrumb (tab exams)
│   ├── SCREEN theo activeTab + examViewMode
│   │   └── popover All Questions         z-30, absolute trong header pane
│   └── sticky QuizControlBar             z-20, sticky top-2
└── QuizConfigModal (conditional)         z-50, fixed inset-0
```

Ref: [`L1251-L1334`](ref-ui.tsx#L1251-L1334), [`L1336-L1342`](ref-ui.tsx#L1336-L1342), [`L1344-L1481`](ref-ui.tsx#L1344-L1481), [`L1483-L1486`](ref-ui.tsx#L1483-L1486), [`L2900-L2991`](ref-ui.tsx#L2900-L2991).

---

## 4. Danh mục component

**Quy ước mục:** mỗi component là một mục `### 4.x`, gồm đúng 6 phần: **(a)** tên/vai trò/nơi dùng · **(b)** cấu trúc + ASCII wireframe · **(c)** props/biến thể + bảng trạng thái 9 dòng · **(d)** style chính · **(e)** hành vi/phím/a11y · **(f)** ràng buộc.

**Nhóm:** 4.1–4.14 primitive & chrome · 4.15–4.23 dashboard · 4.24–4.31 subject/exam · 4.32–4.35 question · 4.36–4.42 editor · 4.43–4.48 quiz/result · 4.49–4.51 guide · 4.52–4.54 overlay shell & modal · **4.55–4.59 component mới đợt 2** · **4.60–4.63 component mới đợt 3**.

**[CẬP NHẬT đợt 2]:** thêm 5 component `[YÊU CẦU MỚI]` (không có trong ref): [`ThemeToggle`](#455-themetoggle) (4.55), [`QuestionNavigatorDialog`](#456-questionnavigatordialog) (4.56), [`SubmitWarningDialog`](#457-submitwarningdialog) (4.57), [`DeleteConfirmDialog`](#458-deleteconfirmdialog) (4.58), [`SyntaxHighlightedTextarea`](#459-syntaxhighlightedtextarea) (4.59). **[CẬP NHẬT đợt 3]:** thêm 4 component `[YÊU CẦU MỚI]`: [`TrashList`](#460-trashlist) (4.60), [`TrashItemRow`](#461-trashitemrow) (4.61), [`RestoreDialog`](#462-restoredialog) (4.62), [`NavBadge`](#463-navbadge) (4.63). **Tổng cộng 63 component** (54 cũ giữ nguyên mã + 5 mới đợt 2 + 4 mới đợt 3).

> Các nhãn trạng thái dùng chung: **Disabled / Loading / Error** phần lớn **không tồn tại** trong ref (demo in-memory, không có request). Khi ghi `N/A` kèm lý do, đó là hiện trạng — không phải thiếu sót của tài liệu.

### 4.1 AppShell

**(a) Vai trò & nơi dùng** — Khung gốc của toàn app: nền, hướng flex, padding, gap, màu selection. Dùng một lần trong `App` — [`ref-ui.tsx:L1252`](ref-ui.tsx#L1252).

**UC liên quan:** dùng chung cho mọi màn hình — chủ yếu UC-01, UC-24, UC-25

**(b) Cấu trúc**

```
┌ div.min-h-screen (bg #e8edf4, text #262b33, p-3 sm:p-6, flex-col md:flex-row, gap-5 sm:gap-7) ┐
│  <style>  →  Toast?  →  <aside>  →  <main>  →  Modal?                                  │
└────────────────────────────────────────────────────────────────────────────────────────────┘
```

Cây: `AppShell` → `StyleTag` · `Toast` · `Sidebar` · `Main` → (`Breadcrumb` · `Screen`) · `QuizConfigModal`.

**(c) Props & trạng thái** — Không có prop; biến thể duy nhất là `sidebarOpen` (ảnh hưởng layout con).

| Trạng thái | Biểu hiện thực tế | Ref |
|---|---|---|
| Default | Nền `#e8edf4`, chữ `#262b33`, padding 12px (mobile) / 24px (≥640) | [`L1252`](ref-ui.tsx#L1252) |
| Hover | N/A — khung không có hover | — |
| Focus | N/A — không nhận focus | — |
| Active | N/A | — |
| Disabled | N/A | — |
| Loading | N/A — không có splash/loading toàn cục | — |
| Empty | N/A | — |
| Error | N/A — không có error boundary | — |
| Selected | Selection text đảo màu: `selection:bg-[#262b33] selection:text-white` | [`L1252`](ref-ui.tsx#L1252) |

**(d) Style chính** — `min-h-screen`, `flex flex-col md:flex-row`, `p-3 sm:p-6`, `gap-5 sm:gap-7`, `selection:*`.

**(e) Hành vi & a11y** — Không có landmark `role`; `<aside>` và `<main>` là semantic HTML. Scroll thuộc về `document`, không có scroll container nội bộ. Không có skip-link.

**(f) Ràng buộc** — `min-h-screen` + padding khiến tổng chiều cao luôn ≥ viewport; `gap-7` (28px) là khoảng cách lớn nhất giữa 2 panel. Không đặt `overflow-hidden` ở root (sẽ cắt popover absolute).

### 4.2 Sidebar

**(a) Vai trò & nơi dùng** — Panel điều hướng trái, chứa brand, profile, 3 nav, **1 nút `ThemeToggle`** `[CẬP NHẬT đợt 2 — R2]` (ref: 2 nút utility ⚙/⏻ — [`L1460-L1480`](ref-ui.tsx#L1460-L1480) — **đã bị loại bỏ**). Luôn render — [`ref-ui.tsx:L1347-L1481`](ref-ui.tsx#L1347-L1481).

> **[CẬP NHẬT đợt 2 — R2]:** đáy sidebar bỏ Settings/Power, thêm [`ThemeToggle`](#455-themetoggle) (4.55) — 3 chế độ Sáng / Tối / Theo hệ thống; persist qua bảng `app_settings` key `theme`, áp trước khi render → không nháy trắng. Nút Settings/Power và màn Settings **không** tồn tại trong phạm vi mới (xem [“KHÔNG có màn hình Settings”](#ghi-chú-không-có-màn-hình-settings)).

> **[CẬP NHẬT đợt 3]:** danh sách nav thêm mục **Thùng rác** (icon lucide `Trash2`) ngay sau **AI Guide**, kèm [`NavBadge`](#463-navbadge) (4.63) hiển thị số mục đang có trong thùng rác — **ẩn khi 0**; thứ tự: Overview → Đề kiểm tra → AI Guide → Thùng rác → (đáy) ThemeToggle.

**UC liên quan:** UC-25 (thu gọn/mở); điều hướng tab phục vụ UC-01, UC-05, UC-23, UC-33..UC-38 (Thùng rác)

**(b) Cấu trúc**

```
┌ aside.neu-shell rounded-[30px] shrink-0 flex-col justify-between (w-64 p-6 | w-20 p-4) ┐
│ ┌ div.w-full ────────────────────────────────────────────────────────────────────────┐ │
│ │  Header: BrandLogo + BrandText? + SidebarToggle?                                    │ │
│ │  ProfileCard                                                                        │ │
│ │  nav.space-y-3 → NavItem × 3                                                         │ │
│ └────────────────────────────────────────────────────────────────────────────────────┘ │
│ ┌ div bottom: border-t border-slate-200/70 pt-6 mt-6 ────────────────────────────────┐ │
│ │  [CẬP NHẬT R2] ThemeToggle (☀ | ☾ | 💻) — thay cho ⚙ + ⏻ đã loại bỏ                 │ │
│ └────────────────────────────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

**(c) Props & trạng thái** — `sidebarOpen: boolean` (từ App state [`L797`](ref-ui.tsx#L797)); không có prop riêng. **[CẬP NHẬT R2]** cụm đáy nhận thêm `theme` + `onThemeChange` cho `ThemeToggle` (xem [4.55](#455-themetoggle)).

| Trạng thái | Biểu hiện thực tế | Ref |
|---|---|---|
| Default | Mở: `w-full md:w-64 p-6`, `justify-between` | [`L1349`](ref-ui.tsx#L1349) |
| Hover | Container không hover; chỉ con hover | — |
| Focus | N/A (container) | — |
| Active | Đang chuyển: width + padding animate 300ms `ease-in-out` | [`L1348`](ref-ui.tsx#L1348) |
| Disabled | N/A — không có trạng thái thu gọn bị khoá | — |
| Loading | N/A | — |
| Empty | N/A — luôn có 3 nav | — |
| Error | N/A | — |
| Selected | Thu gọn: `w-full md:w-20 p-4 items-center`; label/name/toggle unmount | [`L1349`](ref-ui.tsx#L1349) |

**(d) Style chính** — `.neu-shell` (14px shadow, `#eef2f7`, viền trắng 1.5px), `rounded-[30px]`, `shrink-0`.

**(e) Hành vi & a11y** — Không `sticky`, không `h-screen`; là `<aside>` không có `aria-label`. Chiều cao = chiều cao row (stretch) nên với nội dung dài, nút utility nằm cuối trang. Toggle bằng nút logo hoặc nút ◧. **[CẬP NHẬT R2]** với `ThemeToggle`: `aria-haspopup="menu"` + `aria-expanded` trên nút, `role="menu"`/`menuitemradio` cho dropdown — bổ sung khi port (ref không có).

**(f) Ràng buộc** — `shrink-0` giữ nguyên 256px ở md+; ở <768 luôn `w-full`. Khi thu gọn, mọi text bị unmount nên `title` là nguồn nhãn duy nhất (tooltip native) — [`L1433`](ref-ui.tsx#L1433).

### 4.3 BrandLogo

**(a) Vai trò & nơi dùng** — Nút 44×44 vừa là logo vừa là toggle sidebar; hover đổi ruột sang icon `PanelLeft`. Trong Sidebar — [`ref-ui.tsx:L1361-L1386`](ref-ui.tsx#L1361-L1386).

**UC liên quan:** UC-25

**(b) Cấu trúc**

```
┌ div.flex.items-center.gap-3 ─────────────────────────────────┐
│  ┌ button.neu-icon-btn w-11 h-11 rounded-2xl ─────────────┐  │
│  │   logoHovered ? <PanelLeft w-5 animate-pulse>          │  │
│  │               : <div.w-5.h-5.rounded-lg.bg-#262b33>Q</div> │
│  └─────────────────────────────────────────────────────────┘  │
│  sidebarOpen && ┌ div ───────────────────────────┐           │
│                 │ h1 QUIZ Analysis  (text-base)   │           │
│                 │ p  Smart Exam Studio (11px)      │           │
│                 └──────────────────────────────────┘           │
└───────────────────────────────────────────────────────────────┘
```

**(c) Props & trạng thái** — `sidebarOpen`, `logoHovered`, `onToggle` (inline).

| Trạng thái | Biểu hiện thực tế | Ref |
|---|---|---|
| Default | Ô 44×44, ruột là chữ **Q** trắng trên `#262b33`, `rounded-lg`, `text-xs font-bold` | [`L1371-L1373`](ref-ui.tsx#L1371-L1373) |
| Hover | Ruột đổi thành `PanelLeft` 20×20 + `animate-pulse`; nút nhận `.neu-icon-btn:hover` (shadow 2px + tụt 1px) | [`L1298-L1301`](ref-ui.tsx#L1298-L1301), [`L1369`](ref-ui.tsx#L1369) |
| Focus | Không style tuỳ biến → focus ring mặc định của trình duyệt | — |
| Active | `.neu-icon-btn:active` → shadow inset 3px | [`L1303-L1305`](ref-ui.tsx#L1303-L1305) |
| Disabled | N/A | — |
| Loading | N/A | — |
| Empty | N/A | — |
| Error | N/A | — |
| Selected | `title` đổi “Thu gọn Sidebar” / “Mở rộng Sidebar” theo trạng thái | [`L1365`](ref-ui.tsx#L1365) |

**(d) Style chính** — `.neu-icon-btn` + `w-11 h-11 rounded-2xl`, icon `text-[#262b33]`, `group overflow-hidden` (dự phòng cho hiệu ứng sau này).

**(e) Hành vi & a11y** — `onMouseEnter/Leave` trên **div cha** đổi icon (vùng hover rộng hơn nút). Click toggle. Không có `aria-expanded`, không `aria-label` (chỉ `title`). Kích thước chạm 44×44 — đạt tối thiểu.

**(f) Ràng buộc** — Nhãn thương hiệu hard-code “QUIZ Analysis” / “Smart Exam Studio”, lệch tên sản phẩm `ansask-desktop` (QDS-11). Text brand chỉ render khi mở; ở chế độ thu gọn không còn nhãn chữ.

### 4.4 SidebarToggle

**(a) Vai trò & nơi dùng** — Nút thu gọn tường minh ở góc phải header sidebar; chỉ tồn tại khi sidebar mở — [`ref-ui.tsx:L1389-L1397`](ref-ui.tsx#L1389-L1397).

**UC liên quan:** UC-25

**(b) Cấu trúc**

```
sidebarOpen && ┌ button.neu-icon-btn w-8 h-8 rounded-xl ─┐
               │      <PanelLeft w-4 h-4 />            │
               └───────────────────────────────────────┘
```

**(c) Props & trạng thái** — Không prop; `onClick={() => setSidebarOpen(false)}`.

| Trạng thái | Biểu hiện thực tế | Ref |
|---|---|---|
| Default | 32×32, `rounded-xl`, icon 16px màu `slate-500` | [`L1393`](ref-ui.tsx#L1393) |
| Hover | `hover:text-[#262b33]` + shadow 2px + `translateY(1px)` | [`L1393`](ref-ui.tsx#L1393) |
| Focus | Mặc định trình duyệt | — |
| Active | Shadow inset 3px | [`L1303`](ref-ui.tsx#L1303) |
| Disabled | N/A | — |
| Loading | N/A | — |
| Empty | **Không render** khi sidebar đóng — đây là trạng thái “empty” của component | [`L1389`](ref-ui.tsx#L1389) |
| Error | N/A | — |
| Selected | N/A (không phải toggle 2 chiều — chỉ đóng) | — |

**(d) Style chính** — `.neu-icon-btn w-8 h-8 rounded-xl flex items-center justify-center text-slate-500`.

**(e) Hành vi & a11y** — `title="Thu gọn Sidebar"`. Chỉ một chiều (đóng); mở lại phải dùng BrandLogo. Không `aria-controls`.

**(f) Ràng buộc** — 32×32 < 44px khuyến nghị chạm; đặt cạnh logo nên dễ bấm nhầm khi hover logo (QDS-13).

### 4.5 ProfileCard

**(a) Vai trò & nơi dùng** — Khối nhận diện người dùng (avatar tròn, trạng thái online, tên, ID). Trong Sidebar — [`ref-ui.tsx:L1400-L1418`](ref-ui.tsx#L1400-L1418).

**UC liên quan:** dùng chung — UC-25 (hiển thị/ẩn theo sidebar); bản thân profile không có UC

**(b) Cấu trúc**

```
┌ div.flex.flex-col.items-center.text-center.mb-7 (py-2 | py-1) ┐
│   ┌ div.w-16.h-16.rounded-full.p-1.neu-pill.relative ─────┐   │
│   │   ┌ div.w-full.h-full.rounded-full.gradient ────────┐  │   │
│   │   │                  MH                             │  │   │
│   │   └─────────────────────────────────────────────────┘  │   │
│   │   ●  (w-3.5 h-3.5 emerald-500, border-2 #eef2f7)       │   │
│   └────────────────────────────────────────────────────────┘   │
│   sidebarOpen && <h2>Matthew Hayes</h2> + <p>ID: 308591433</p>  │
└────────────────────────────────────────────────────────────────┘
```

**(c) Props & trạng thái** — Dữ liệu hard-code; `sidebarOpen` điều khiển phần text.

| Trạng thái | Biểu hiện thực tế | Ref |
|---|---|---|
| Default | Avatar 64px, viền `.neu-pill`, gradient `from-[#262b33] to-slate-500`, chữ `MH` trắng 18px | [`L1406-L1409`](ref-ui.tsx#L1406-L1409) |
| Hover | N/A — không tương tác | — |
| Focus | N/A | — |
| Active | N/A | — |
| Disabled | N/A | — |
| Loading | N/A | — |
| Empty | N/A — luôn có dữ liệu mẫu | — |
| Error | N/A | — |
| Selected | Online: chấm `emerald-500` 14px, viền 2px `#eef2f7`, `bottom-0.5 right-0.5`; không có trạng thái offline | [`L1410`](ref-ui.tsx#L1410) |

**(d) Style chính** — `w-16 h-16 rounded-full p-1 neu-pill`; inner `bg-gradient-to-tr from-[#262b33] to-slate-500`; tên `font-bold text-sm text-[#1e232a]`; ID `text-[11px] text-slate-400`.

**(e) Hành vi & a11y** — Tĩnh, không click. Chấm online là `<span>` không có nhãn → trình đọc màn hình bỏ qua trạng thái.

**(f) Ràng buộc** — Text chỉ hiện khi sidebar mở; ở 20px-width avatar vẫn 64px nên gần chạm hai mép (`p-4` + 80px). Dữ liệu mẫu “Matthew Hayes / 308591433” phải thay bằng hồ sơ local thật — **[CẬP NHẬT đợt 2 — R5]: QDS-12 ĐÃ CHỐT** theo hướng app **cá nhân, single-user**: không login, không phân quyền, không cloud; profile chỉ là tên hiển thị local (lưu trong `app_settings`, mặc định “Người dùng cá nhân”), ID máy sinh local hoặc **bỏ hẳn khối profile** `[YÊU CẦU MỚI]`; **không** xây luồng auth dưới bất kỳ hình thức nào.

### 4.6 NavItem

**(a) Vai trò & nơi dùng** — Mục điều hướng chính (3 mục: OVERVIEW, ĐỀ KIỂM TRA, AI GUIDE) — [`ref-ui.tsx:L1421-L1457`](ref-ui.tsx#L1421-L1457).

**UC liên quan:** UC-01, UC-05, UC-23, UC-25

**(b) Cấu trúc**

```
button.w-full.flex.items-center.rounded-full (px-4 py-3.5 gap-3.5 | p-3.5 justify-center)
├── div.w-6.h-6.rounded-full  →  <Icon w-3.5 h-3.5 />
└── sidebarOpen && div.leading-tight → span.text-xs.tracking-wider  LABEL
```

Dữ liệu 3 mục: `{ id, label, sub, icon }` — [`L1422-L1426`](ref-ui.tsx#L1422-L1426).

**(c) Props & trạng thái** — `item`, `isActive = activeTab === item.id`, `sidebarOpen`.

| Trạng thái | Biểu hiện thực tế | Ref |
|---|---|---|
| Default (inactive) | Chữ `slate-500`, `font-medium`; icon `text-slate-600`; không nền | [`L1439`](ref-ui.tsx#L1439) |
| Hover | `hover:text-[#1e232a]` (chỉ đổi màu chữ, không đổi nền/shadow) | [`L1439`](ref-ui.tsx#L1439) |
| Focus | Mặc định trình duyệt | — |
| Active | `.neu-pill-active` + `text-[#1e232a] font-bold`; icon trong vòng tròn `bg-[#262b33] text-white` | [`L1438`](ref-ui.tsx#L1438), [`L1443-L1447`](ref-ui.tsx#L1443-L1447) |
| Disabled | N/A | — |
| Loading | N/A | — |
| Empty | N/A — luôn 3 mục | — |
| Error | N/A | — |
| Selected | Chính là `isActive`; chỉ 1 mục active tại một thời điểm | [`L1428`](ref-ui.tsx#L1428) |

**(d) Style chính** — `w-full flex items-center rounded-full transition-all duration-200`; mở: `px-4 py-3.5 gap-3.5 justify-start`; đóng: `p-3.5 justify-center`; label `text-xs tracking-wider`.

**(e) Hành vi & a11y** — `onClick` set `activeTab`; `title="{label} - {sub}"` là nơi duy nhất dùng `sub` (**`sub` không hiển thị**) — [`L1433`](ref-ui.tsx#L1433). Không dùng `aria-current="page"`.

**(f) Ràng buộc** — Ở chế độ thu gọn, nút vuông 24px icon giữa pill 60px; label unmount. **[CẬP NHẬT đợt 3]** Hỗ trợ [`NavBadge`](#463-navbadge) (4.63) cho tab **Thùng rác** — badge pill nhỏ nằm ở góc trên-phải của NavItem (cả chế độ mở & thu gọn), **ẩn khi số mục = 0**; không dùng cho các tab khác.

### 4.7 SidebarUtilityButton

**(a) Vai trò & nơi dùng (ref — ĐÃ BỊ LOẠI BỎ theo R2)** — Hai nút tiện ích cuối sidebar: Settings (chỉ toast) và Power (reset root) — [`ref-ui.tsx:L1460-L1480`](ref-ui.tsx#L1460-L1480).

> **[CẬP NHẬT đợt 2 — R2]: COMPONENT NÀY KHÔNG CÒN ĐƯỢC DỰNG.** Thay thế bằng [`ThemeToggle`](#455-themetoggle) (4.55) — nút duy nhất trong cụm `border-t` đáy sidebar. Q-13 (Power → reset điều hướng) và Q-14 (Settings có màn hình thật) **đã bị loại bỏ** khỏi phạm vi; phần mô tả ref dưới đây chỉ để truy vết.

**UC liên quan:** UC-24 (nút Power — **hết hiệu lực** vì nút bị bỏ; reset điều hướng còn lại dùng breadcrumb); nút Settings chưa bao giờ có UC (Q-14 — đóng)

**(b) Cấu trúc**

```
div.flex (justify-around px-2 | flex-col gap-3).pt-6.mt-6.border-t.border-slate-200/70
├── button.neu-icon-btn.w-10.h-10.rounded-xl  →  <Settings w-4 h-4 />   ✕ LOẠI BỎ (R2)
└── button.neu-icon-btn.w-10.h-10.rounded-xl  →  <Power w-4 h-4 />       ✕ LOẠI BỎ (R2)

[CẬP NHẬT R2] — giữ nguyên div khung (border-t, pt-6 mt-6, 40×40), nội dung thay bằng:
└── ThemeToggle (4.55) → .neu-icon-btn.w-10.h-10.rounded-xl + <Sun|Moon|Monitor w-4 h-4 />
```

**(c) Props & trạng thái (ref)** — `icon`, `title`, `onClick`. **[CẬP NHẬT R2]** bản thay thế (`ThemeToggle`) nhận `theme`, `onThemeChange`, `collapsed` — xem [4.55](#455-themetoggle).

| Trạng thái | Biểu hiện thực tế | Ref |
|---|---|---|
| Default | 40×40, `rounded-xl`, icon `#262b33` | [`L1468`](ref-ui.tsx#L1468) |
| Hover | Shadow 2px + `translateY(1px)` | [`L1298-L1301`](ref-ui.tsx#L1298-L1301) |
| Focus | Mặc định trình duyệt | — |
| Active | Inset 3px | [`L1303`](ref-ui.tsx#L1303) |
| Disabled | N/A | — |
| Loading | N/A | — |
| Empty | N/A | — |
| Error | N/A | — |
| Selected | N/A — không phải toggle; Settings không mở màn hình nào | — |

**(d) Style chính** — `.neu-icon-btn w-10 h-10 rounded-xl`; nhóm `justify-around` khi mở, `flex-col gap-3` khi thu gọn.

**(e) Hành vi & a11y (ref)** — Settings → `triggerToast('Hệ thống đang ở chế độ giao diện Neumorphic Soft UI')` (nút **giả**, chưa có màn hình cài đặt) — [`L1467`](ref-ui.tsx#L1467). Power → `handleResetRoot` (về root + toast). Chỉ có `title`, không `aria-label`. **[CẬP NHẬT R2]** Cả hai handler trên **bị xoá**; nếu cần reset điều hướng thì dùng breadcrumb (UC-24). `ThemeToggle` thay thế phải có đủ `title` + `aria-label` + menu 3 chế độ (a11y đầy đủ hơn ref).

**(f) Ràng buộc** — 40×40; nhóm có `border-t` ngăn cách; ở chế độ thu gọn chiều rộng 40px vừa trong sidebar `w-20 p-4` (80 − 32 = 48px) — giữ nguyên cho `ThemeToggle` (nút duy nhất còn lại của nhóm).

### 4.8 Toast

**(a) Vai trò & nơi dùng** — Thông báo tạm thời duy nhất của app (OVL-01), hiện ở góc dưới phải — [`ref-ui.tsx:L1336-L1342`](ref-ui.tsx#L1336-L1342).

**UC liên quan:** dùng chung — UC-04, UC-15, UC-20, UC-24 (mọi toast)

**(b) Cấu trúc**

```
toastMessage && ┌ div.fixed.bottom-6.right-6.z-50.neu-dark-btn ────────────┐
                │  <Sparkles w-4 h-4 text-emerald-400 />  <span>{msg}</span> │
                └───────────────────────────────────────────────────────────┘
                px-5 py-3 rounded-2xl gap-2.5 text-sm font-medium animate-bounce
```

**(c) Props & trạng thái** — `toastMessage: string | null`; không có API xếp hàng, không loại (success/error).

| Trạng thái | Biểu hiện thực tế | Ref |
|---|---|---|
| Default | Hiện 2.8s rồi tự ẩn; nền gradient tối, chữ trắng 14px | [`L848-L853`](ref-ui.tsx#L848-L853) |
| Hover | N/A — `pointer-events` mặc định nhưng không có hành vi | — |
| Focus | N/A — không nhận focus | — |
| Active | N/A | — |
| Disabled | N/A | — |
| Loading | N/A | — |
| Empty | Không render gì (`toastMessage` null) | [`L1337`](ref-ui.tsx#L1337) |
| Error | Không có biến thể lỗi — mọi toast đều xanh lá/trung tính | — |
| Selected | Message mới **thay thế** message cũ; timer cũ không bị clear (kiểm tra `prev === msg`) | [`L850-L852`](ref-ui.tsx#L850-L852) |

**(d) Style chính** — `.neu-dark-btn` (gradient `145deg #2d333d → #1d2128`, shadow `5px 5px 12px #c5cdd9`), `rounded-2xl`, `animate-bounce`, icon `emerald-400`.

**(e) Hành vi & a11y** — Tự ẩn sau **2800ms**; `animate-bounce` lặp vô hạn trong suốt thời gian hiện (gây nhấp nháy liên tục — QDS-14). Không `role="status"`, không `aria-live`, không nút đóng. Không pause khi hover.

**(f) Ràng buộc** — 1 dòng, không `max-width` → message dài sẽ tràn ra ngoài viewport (`whitespace-nowrap` mặc định của flex item). Nằm cùng `z-50` với modal nên bị modal che khi mở.

> **[CẬP NHẬT đợt 3 — GIẢ ĐỊNH]:** Sau **xóa mềm** (soft delete môn/bộ đề từ SCREEN-02/03), Toast hiển thị thêm nút **( Hoàn tác )** `[GIẢ ĐỊNH]` trong 2.8s — bấm để khôi phục ngay mục vừa xóa mà không cần vào Thùng rác (undo nhanh). Khi hết thời gian, mục chỉ còn khôi phục qua SCREEN-09. Toast vẫn một instance, nút là phần của message (không tách component).

### 4.9 Card (`.neu-card`)

**(a) Vai trò & nơi dùng** — Primitive “khối nổi cấp nội dung”, nền tảng của gần như mọi section. Định nghĩa CSS tại [`ref-ui.tsx:L1267-L1271`](ref-ui.tsx#L1267-L1271); dùng ở breadcrumb [`L1870`](ref-ui.tsx#L1870), metric [`L1528`](ref-ui.tsx#L1528), section dashboard [`L1493`](ref-ui.tsx#L1493), subject card [`L2064`](ref-ui.tsx#L2064), empty state [`L2111`](ref-ui.tsx#L2111), score banner [`L2679`](ref-ui.tsx#L2679).

**UC liên quan:** dùng chung — UC-01, UC-04, UC-05, UC-15, UC-16, UC-20

**(b) Cấu trúc**

```
┌ div.neu-card  rounded-{2xl|[24px]|[26px]}  p-{4|5|6|8} ─────────┐
│  (nội dung tuỳ biến — card không có slot cố định)            │
└──────────────────────────────────────────────────────────────┘
```

**(c) Props & trạng thái** — Không phải component riêng trong ref (chỉ là class); “props” là `radius`, `padding`, `className` bổ sung.

| Trạng thái | Biểu hiện thực tế | Ref |
|---|---|---|
| Default | Nền `#eef2f7`, shadow `7px 7px 16px #d0d8e4, -7px -7px 16px #fff`, viền `1px rgba(255,255,255,.8)` | [`L1267-L1271`](ref-ui.tsx#L1267-L1271) |
| Hover | Card **không** tự hover; consumer thêm `hover:-translate-y-1` (subject/exam card) | [`L2064`](ref-ui.tsx#L2064) |
| Focus | N/A | — |
| Active | N/A | — |
| Disabled | N/A | — |
| Loading | N/A — không có skeleton | — |
| Empty | Card vẫn hiện; nội dung rỗng do consumer quyết định (EmptyState) | [`L2111`](ref-ui.tsx#L2111) |
| Error | N/A | — |
| Selected | N/A — chọn lựa thể hiện ở Pill/row, không ở card | — |

**(d) Style chính** — `background:#eef2f7; box-shadow:7px 7px 16px #d0d8e4, -7px -7px 16px #ffffff; border:1px solid rgba(255,255,255,.8)`.

**(e) Hành vi & a11y** — Không tương tác. Khi dùng làm card bấm được, consumer thêm `cursor-pointer` + `onClick` và **không** có `role="button"`/`tabIndex` (subject/exam card) → không truy cập được bằng bàn phím (QDS-16).

**(f) Ràng buộc** — Không lồng `.neu-card` trong `.neu-card` quá 1 cấp (xem 1.2). Padding chuẩn: `p-4` metric, `p-5`/`p-6` section, `p-8` banner/guide, `p-12` empty.

### 4.10 InsetPanel (`.neu-card-inset`)

**(a) Vai trò & nơi dùng** — Primitive “khối chìm”: ô nhập, vùng chứa dữ liệu, hàng lựa chọn, khung code, prompt — [`ref-ui.tsx:L1273-L1277`](ref-ui.tsx#L1273-L1277).

**UC liên quan:** dùng chung — UC-12, UC-13, UC-18, UC-23

**(b) Cấu trúc**

```
┌ div.neu-card-inset  p-{1|3|4|5}  rounded-{xl|2xl} ─┐
│   input / textarea / pre / radio row / legend      │
└────────────────────────────────────────────────────┘
```

**(c) Props & trạng thái**

| Trạng thái | Biểu hiện thực tế | Ref |
|---|---|---|
| Default | Nền `#e9eef5`, `inset 4px 4px 9px #cfd7e3, inset -4px -4px 9px #fff`, viền `1px rgba(255,255,255,.65)` | [`L1273-L1277`](ref-ui.tsx#L1273-L1277) |
| Hover | N/A — trừ khi bản thân là input (không đổi) | — |
| Focus | Không có style focus của class; input bên trong dùng `focus:outline-none` (mất hoàn toàn dấu hiệu focus) | [`L2003`](ref-ui.tsx#L2003) |
| Active | N/A | — |
| Disabled | N/A | — |
| Loading | N/A | — |
| Empty | Hiện khung rỗng (placeholder bên trong) | [`L2554-L2558`](ref-ui.tsx#L2554-L2558) |
| Error | Không đổi màu khi lỗi cú pháp — `ParseErrorBanner` mới là nơi báo | [`L2538-L2541`](ref-ui.tsx#L2538-L2541) |
| Selected | N/A | — |

**(d) Style chính** — `background:#e9eef5; box-shadow:inset 4px 4px 9px #cfd7e3, inset -4px -4px 9px #ffffff; border:1px solid rgba(255,255,255,.65)`.

**(e) Hành vi & a11y** — Khi bọc input, input cần `focus-visible` riêng — hiện **không có** (QDS-17). Ô màu `#e9eef5` chỉ chênh 1 bậc so với surface nên ranh giới dựa hoàn toàn vào cặp shadow inset.

**(f) Ràng buộc** — Không thêm `border` xám; không dùng inset cho vùng chỉ-đọc lớn (dễ gây cảm giác “ô nhập” sai).

### 4.11 Pill / Chip (`.neu-pill`, `.neu-pill-active`)

**(a) Vai trò & nơi dùng** — Viên nhỏ đa dụng: badge đếm, filter, nút phụ, badge điểm, nhãn “Câu n”, nút “All”. CSS [`ref-ui.tsx:L1279-L1289`](ref-ui.tsx#L1279-L1289); dùng ở nav active [`L1438`](ref-ui.tsx#L1438), period/CRUD [`L1811`](ref-ui.tsx#L1811), badge điểm [`L1851`](ref-ui.tsx#L1851), nhãn câu [`L574`](ref-ui.tsx#L574).

**UC liên quan:** dùng chung — UC-01, UC-02, UC-03, UC-16, UC-17, UC-18, UC-22

**(b) Cấu trúc**

```
span|button.neu-pill (px-3 py-1 rounded-full text-xs font-bold)
├── [dot 8px]?   ├── <Icon 14px>?   └── text

Biến thể: .neu-pill-active (nền #f5f8fc, shadow 6px, viền 1.5px trắng)
          bg-[#262b33] text-white  (pill “đặc” — không dùng class)
```

**(c) Props & trạng thái** — `variant: 'default' | 'active' | 'solid'`; `as: span | button`.

| Trạng thái | Biểu hiện thực tế | Ref |
|---|---|---|
| Default | `.neu-pill`: nền `#eef2f7`, shadow 5px `#ced6e2`, viền `1px rgba(255,255,255,.9)` | [`L1279-L1283`](ref-ui.tsx#L1279-L1283) |
| Hover | Không có trong CSS; consumer thêm `hover:bg-white/70` hoặc `hover:bg-white` | [`L1811`](ref-ui.tsx#L1811), [`L2236`](ref-ui.tsx#L2236) |
| Focus | Mặc định trình duyệt | — |
| Active (đang chọn) | `.neu-pill-active`: nền `#f5f8fc`, shadow `6px 6px 14px #c9d2e0`, viền `1.5px #fff` | [`L1285-L1289`](ref-ui.tsx#L1285-L1289) |
| Disabled | Không có biến thể disabled | — |
| Loading | N/A | — |
| Empty | N/A | — |
| Error | N/A | — |
| Selected | Dùng `bg-[#262b33] text-white` (period tab, preset, câu đã trả lời) | [`L1516`](ref-ui.tsx#L1516), [`L2949`](ref-ui.tsx#L2949) |

**(d) Style chính** — `rounded-full`, `px-3 py-1` (badge) → `px-4 py-2.5` (nút), `text-[11px]`/`text-xs`, `font-bold`.

**(e) Hành vi & a11y** — `.neu-pill` **không có** `:active` → bấm không có phản hồi biến dạng (khác `.neu-icon-btn`). Không có `aria-pressed` cho các pill filter.

**(f) Ràng buộc** — Pill dài (tên môn) phải có `truncate`/`max-w`; hiện badge số câu không truncate nhưng nội dung ngắn. `rounded-full` bắt buộc — không dùng `rounded-lg` cho pill.

### 4.12 IconButton (`.neu-icon-btn`)

**(a) Vai trò & nơi dùng** — Nút icon vuông nhỏ, có phản hồi nhấn bằng shadow đảo — [`ref-ui.tsx:L1291-L1305`](ref-ui.tsx#L1291-L1305). Dùng: logo [`L1366`](ref-ui.tsx#L1366), toggle [`L1393`](ref-ui.tsx#L1393), utility [`L1468`](ref-ui.tsx#L1468), xoá câu [`L615`](ref-ui.tsx#L615), đóng modal [`L2912`](ref-ui.tsx#L2912).

**UC liên quan:** UC-09 (xoá câu), UC-18/UC-22 (đóng modal), UC-25

**(b) Cấu trúc**

```
┌ button.neu-icon-btn  w-{8|10|11} h-{8|10|11}  rounded-{xl|2xl}  flex center ┐
│        <Icon class="w-{3.5|4|5} h-..." />                                 │
└───────────────────────────────────────────────────────────────────────────┘
```

**(c) Props & trạng thái** — `size: 32 | 40 | 44`, `icon`, `tone: 'ink' | 'muted'`.

| Trạng thái | Biểu hiện thực tế | Ref |
|---|---|---|
| Default | Nền `#eef2f7`, shadow `4px 4px 9px #ced6e2, -4px -4px 9px #fff`, `transition: all .2s ease` | [`L1291-L1296`](ref-ui.tsx#L1291-L1296) |
| Hover | Shadow co còn `2px 2px 5px`, `transform: translateY(1px)`; consumer có thể đổi màu icon (`hover:text-rose-500`) | [`L1298-L1301`](ref-ui.tsx#L1298-L1301), [`L615`](ref-ui.tsx#L615) |
| Focus | Không style → ring mặc định | — |
| Active | `inset 3px 3px 6px #ced6e2, inset -3px -3px 6px #fff` | [`L1303-L1305`](ref-ui.tsx#L1303-L1305) |
| Disabled | N/A — không có `[disabled]` styling | — |
| Loading | N/A | — |
| Empty | N/A | — |
| Error | N/A | — |
| Selected | N/A — không phải toggle; dùng pill-active nếu cần trạng thái | — |

**(d) Style chính** — `.neu-icon-btn` + kích thước + `rounded-xl` (32/40) hoặc `rounded-2xl` (44).

**(e) Hành vi & a11y** — Mọi instance **phải** có `title` vì không có text. Kích thước 32px (`w-8`) nhỏ hơn ngưỡng chạm 44px — chấp nhận được trên desktop, không đạt cho touch (QDS-13).

**(f) Ràng buộc** — Không đặt 2 icon button sát nhau < 8px (dễ nhầm); không dùng cho hành động phá huỷ mà không có xác nhận (xoá câu hỏi hiện xoá ngay — [`ref-ui.tsx:L613`](ref-ui.tsx#L613)).

### 4.13 PrimaryActionButton (`.neu-dark-btn`)

**(a) Vai trò & nơi dùng** — CTA chính duy nhất của hệ: nền than chì, chữ trắng — [`ref-ui.tsx:L1307-L1317`](ref-ui.tsx#L1307-L1317). Dùng: “Tạo môn học” [`L1950`](ref-ui.tsx#L1950), “Tạo bộ đề” [`L1960`](ref-ui.tsx#L1960), “Lưu môn học” [`L2044`](ref-ui.tsx#L2044), “Lưu bộ đề” [`L2350`](ref-ui.tsx#L2350), “Làm bài kiểm tra” [`L2259`](ref-ui.tsx#L2259), “Nộp bài” [`L2640`](ref-ui.tsx#L2640), “Sao chép Prompt” [`L2885`](ref-ui.tsx#L2885), toast [`L1338`](ref-ui.tsx#L1338).

**UC liên quan:** UC-04, UC-06, UC-15, UC-18, UC-20, UC-23

**(b) Cấu trúc**

```
┌ button.neu-dark-btn  px-{4|5|6} py-{2|2.5|3}  rounded-{xl|2xl} ┐
│   <Icon w-4 h-4 [fill-current] />   <span>Nhãn</span>          │
└─────────────────────────────────────────────────────────────────┘
```

**(c) Props & trạng thái** — `size: 'sm' (px-4 py-2)' | 'md' (px-5 py-2.5) | 'lg' (px-6 py-2.5)'`; `icon?`.

| Trạng thái | Biểu hiện thực tế | Ref |
|---|---|---|
| Default | Gradient `linear-gradient(145deg,#2d333d,#1d2128)`, chữ trắng, shadow `5px 5px 12px #c5cdd9, -4px -4px 10px #fff` | [`L1307-L1312`](ref-ui.tsx#L1307-L1312) |
| Hover | `filter: brightness(1.08); transform: translateY(-1px)` | [`L1314-L1317`](ref-ui.tsx#L1314-L1317) |
| Focus | Mặc định trình duyệt (ring xanh của Chrome trên nền tối — không được style) | — |
| Active | **Không có** rule `:active` → không có phản hồi nhấn (QDS-18) | — |
| Disabled | Không có `[disabled]` styling; nút “Lưu” vẫn bấm được khi 0 câu (chặn bằng toast) | [`L1025-L1028`](ref-ui.tsx#L1025-L1028) |
| Loading | Không có spinner/disabled khi submit | — |
| Empty | N/A | — |
| Error | N/A | — |
| Selected | N/A | — |

**(d) Style chính** — `.neu-dark-btn` + padding theo cấp + `text-xs sm:text-sm font-bold` + `flex items-center gap-2`.

**(e) Hành vi & a11y** — Không có `aria-busy`, không chặn double-submit (tạo môn 2 lần nếu double click nhanh — [`L1061-L1077`](ref-ui.tsx#L1061-L1077)). Chữ trắng trên `#1d2128` đạt contrast ~15:1 (tốt).

**(f) Ràng buộc** — Chỉ **một** CTA tối trong một vùng; không dùng `.neu-dark-btn` cho hành động phụ (dùng `.neu-pill`). Toast cũng dùng class này nên không đặt toast cạnh CTA (trùng hình thức).

### 4.14 ScrollArea (scrollbar tuỳ biến)

**(a) Vai trò & nơi dùng** — Thanh cuộn mảnh 6px toàn cục — [`ref-ui.tsx:L1319-L1333`](ref-ui.tsx#L1319-L1333). Áp dụng cho: list câu hỏi editor [`L2435`](ref-ui.tsx#L2435), popover All editor [`L2386`](ref-ui.tsx#L2386), popover quiz [`L2615`](ref-ui.tsx#L2615), bảng recent [`L1817`](ref-ui.tsx#L1817).

**UC liên quan:** dùng chung — UC-08, UC-12, UC-13, UC-14, UC-19

**(b) Cấu trúc**

```
::-webkit-scrollbar            { width:6px; height:6px }
::-webkit-scrollbar-track      { background:transparent }
::-webkit-scrollbar-thumb      { background:#cbd3e0; border-radius:999px }
::-webkit-scrollbar-thumb:hover{ background:#9aa6b8 }
```

**(c) Props & trạng thái** — Không có API; là pseudo-element toàn cục.

| Trạng thái | Biểu hiện thực tế | Ref |
|---|---|---|
| Default | Track trong suốt, thumb `#cbd3e0` 6px, bo 999px | [`L1320-L1330`](ref-ui.tsx#L1320-L1330) |
| Hover | Thumb đậm lên `#9aa6b8` | [`L1331-L1333`](ref-ui.tsx#L1331-L1333) |
| Focus | N/A | — |
| Active (kéo) | Không có style riêng | — |
| Disabled | N/A | — |
| Loading | N/A | — |
| Empty | Không hiện thumb khi không tràn | — |
| Error | N/A | — |
| Selected | N/A | — |

**(d) Style chính** — Chỉ `-webkit-*`; **không** có `scrollbar-width`/`scrollbar-color` cho Firefox (QDS-19).

**(e) Hành vi & a11y** — Thanh 6px khó kéo bằng chuột; vẫn cuộn được bằng wheel. Không có `scrollbar-gutter` → layout xô lệch khi xuất hiện (QDS-19).

**(f) Ràng buộc** — Áp dụng global nên mọi vùng cuộn đều mảnh; muốn thanh dày hơn phải override cục bộ. Không ẩn scrollbar (`display:none`) vì làm mất dấu hiệu còn nội dung.

### 4.15 MetricCard

**(a) Vai trò & nơi dùng** — 4 ô số liệu tổng quan ở SCREEN-01: Đã làm / Điểm TB / Câu đã giải / Tỉ lệ chính xác — [`ref-ui.tsx:L1527-L1587`](ref-ui.tsx#L1527-L1587).

**UC liên quan:** UC-01, UC-02

**(b) Cấu trúc**

```
┌ div.neu-card.rounded-2xl.p-4.flex.items-center.justify-between ─────────┐
│  ┌ div ──────────────────────────┐   ┌ div.w-11.h-11.rounded-full ───┐  │
│  │ p.text-xs.slate-400  LABEL     │   │      .neu-pill               │  │
│  │ div.flex.items-baseline.gap-1.5 │   │   <Icon w-5 h-5 />          │  │
│  │   span.text-2xl  VALUE          │   └─────────────────────────────┘  │
│  │   span.text-xs   DELTA          │                                    │
│  └────────────────────────────────┘                                    │
└────────────────────────────────────────────────────────────────────────┘
```

**(c) Props & trạng thái** — `label`, `value`, `delta`, `icon`.

| Trạng thái | Biểu hiện thực tế | Ref |
|---|---|---|
| Default | Card `p-4`, label 12px `slate-400`, value 24px bold `#1e232a`, icon tròn 44px `.neu-pill` | [`L1528-L1541`](ref-ui.tsx#L1528-L1541) |
| Hover | Không có (card tĩnh) | — |
| Focus | N/A | — |
| Active | N/A | — |
| Disabled | N/A | — |
| Loading | N/A — số liệu tính đồng bộ từ `attempts`, không chờ | — |
| Empty | Khi 0 lượt: hiện `0`, `0.0`, `0`, `0.0%` — không có empty state riêng | [`L1164-L1174`](ref-ui.tsx#L1164-L1174) |
| Error | N/A | — |
| Selected | N/A | — |

**(d) Style chính** — `.neu-card rounded-2xl p-4`; delta tăng: `text-emerald-600` + `↑`; delta trung tính: `text-slate-400` (“/ 10 ↑”).

**(e) Hành vi & a11y** — Tĩnh. Delta **luôn** là mũi tên ↑ (không có ↓/giảm) → tín hiệu một chiều, dễ gây hiểu sai khi số liệu giảm (QDS-20). Số liệu `avgScore` là string từ `.toFixed(1)`.

**(f) Ràng buộc** — `xl:grid-cols-4` / `sm:grid-cols-2` / 1 cột; value dài (≥5 chữ số) sẽ đẩy icon — không có `truncate`/`tabular-nums`.

### 4.16 PeriodTabs (Tuần / Tháng / Năm)

**(a) Vai trò & nơi dùng** — Bộ lọc kỳ thống kê ở header section Overview Data — [`ref-ui.tsx:L1504-L1523`](ref-ui.tsx#L1504-L1523).

**UC liên quan:** UC-02

**(b) Cấu trúc**

```
┌ div.neu-card-inset.p-1.rounded-full.flex.gap-1 ─────────────────┐
│  [ Theo Tuần ]  [ Theo Tháng ]  [ Theo Năm ]                   │
│   active: bg-#262b33 text-white shadow-sm                      │
│   inactive: text-slate-500 hover:text-#262b33                   │
└──────────────────────────────────────────────────────────────────┘
```

**(c) Props & trạng thái** — `value: 'week'|'month'|'year'`, `onChange`; item label cố định.

| Trạng thái | Biểu hiện thực tế | Ref |
|---|---|---|
| Default | Container inset `p-1 rounded-full`; tab `px-3.5 py-1.5 text-xs font-bold rounded-full` | [`L1505`](ref-ui.tsx#L1505), [`L1514`](ref-ui.tsx#L1514) |
| Hover | Inactive: chỉ đổi màu chữ sang `#262b33` | [`L1517`](ref-ui.tsx#L1517) |
| Focus | Mặc định trình duyệt | — |
| Active (đang chọn) | Nền `#262b33`, chữ trắng, `shadow-sm` | [`L1516`](ref-ui.tsx#L1516) |
| Disabled | N/A | — |
| Loading | N/A — đổi period là tính lại đồng bộ (`useMemo`) | [`L1163-L1238`](ref-ui.tsx#L1163-L1238) |
| Empty | N/A | — |
| Error | N/A | — |
| Selected | Trùng Active; không có `aria-selected`/`role="tablist"` | [`L1511-L1519`](ref-ui.tsx#L1511-L1519) |

**(d) Style chính** — Container `.neu-card-inset p-1 rounded-full`; tab active `bg-[#262b33] text-white shadow-sm`.

**(e) Hành vi & a11y** — Click đổi `statsPeriod` → `dashboardStats` đổi series + 3 chỉ số (tháng +59 bài, năm +242 bài — dữ liệu **giả lập** [`L1216-L1229`](ref-ui.tsx#L1216-L1229)). Là 3 `<button>` rời, không có semantics tablist.

**(f) Ràng buộc** — 3 tab cố định, không wrap; ở container hẹp (`sm`) vẫn đủ 3 × ~90px = 270px.

### 4.17 ChartMetricToggle

**(a) Vai trò & nơi dùng** — 2 nút chọn dữ liệu hiển thị trên ComboChart: “Số bài & Điểm” / “Đường điểm số” — [`ref-ui.tsx:L1604-L1625`](ref-ui.tsx#L1604-L1625).

**UC liên quan:** UC-03

**(b) Cấu trúc**

```
div.flex.gap-2
├── button.neu-pill.px-3.py-1.5.rounded-full.text-[11px].font-bold
│      ● slate-400   +  “Số bài & Điểm”
└── button.neu-pill.px-3.py-1.5.rounded-full.text-[11px].font-bold
       ● #1e232a     +  “Đường điểm số”
```

**(c) Props & trạng thái** — `value: 'both' | 'score'` (+ `'count'` tồn tại trong state nhưng **không có UI** — QDS-15).

| Trạng thái | Biểu hiện thực tế | Ref |
|---|---|---|
| Default | Cả hai đều `.neu-pill`; nút “both” chữ `#1e232a`, nút “score” chữ `slate-400` | [`L1607-L1609`](ref-ui.tsx#L1607-L1609) |
| Hover | Không có hiệu ứng hover riêng | — |
| Focus | Mặc định trình duyệt | — |
| Active | Chỉ **đổi màu chữ** + màu dot; shadow/nền không đổi (hai nút trông như nhau) | [`L1608`](ref-ui.tsx#L1608) |
| Disabled | N/A | — |
| Loading | N/A | — |
| Empty | N/A | — |
| Error | N/A | — |
| Selected | `chartMetric === 'score'` khi bấm nút 2; bấm lại quay về `'both'` | [`L1615-L1617`](ref-ui.tsx#L1615-L1617) |

**(d) Style chính** — `.neu-pill`, `text-[11px] font-bold`, dot `w-2 h-2 rounded-full`.

**(e) Hành vi & a11y** — Toggle 2 chiều nhưng **không** thay đổi gì trên biểu đồ: `chartMetric` không được dùng trong render ComboChart (grep chỉ thấy ở 2 nút) → nút trang trí (QDS-15). Không `aria-pressed`.

**(f) Ràng buộc** — Nhãn dài `text-[11px]`; ở `flex-wrap` có thể xuống dòng cùng header chart.

### 4.18 ComboChart (bar + line + grid + axis)

**(a) Vai trò & nơi dùng** — Biểu đồ kết hợp: cột “số bài” + đường “điểm TB” + lưới ngang, ở SCREEN-01 (chiếm `lg:col-span-2`) — [`ref-ui.tsx:L1628-L1705`](ref-ui.tsx#L1628-L1705).

**UC liên quan:** UC-01, UC-03

**(b) Cấu trúc**

```
┌ div.relative.pt-4.pb-2 ──────────────────────────────────────────────────────┐
│  ┌ lưới: div.space-y-9.text-[11px].slate-400 ─────────────────────────────┐  │
│  │  10đ  ─────────────────────────────────────────────                    │  │
│  │  7.5đ ─────────────────────────────────────────────                    │  │
│  │  5.0đ ─────────────────────────────────────────────                    │  │
│  │  2.5đ ─────────────────────────────────────────────                    │  │
│  │  0đ   ─────────────────────────────────────────────                    │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│  ┌ overlay absolute left-10 right-2 top-4 bottom-7 flex.items-end ────────┐  │
│  │   <svg viewBox="0 0 600 180" preserveAspectRatio="none">              │  │
│  │        polyline #3b82f6 strokeWidth=3                                 │  │
│  │   </svg>                                                              │  │
│  │    ▮     ▮     ▮     ▮     ▮     ▮     ▮     ← bar group (z-10)        │  │
│  │   T2    T3    T4    T5    T6    T7    CN                                │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

Mỗi cột: `group relative` → tooltip (`absolute -top-9`) + vỏ track (`w-3.5 sm:w-4`, gradient xám, `shadow-inner p-0.5`) + ruột fill (`gradient #14171c→#262b33→slate-600`) + nhãn trục.

**(c) Props & trạng thái** — `series: { label, count, avgScore }[]` (7 điểm tuần / 4 điểm tháng / 6 điểm năm — [`L1176-L1208`](ref-ui.tsx#L1176-L1208)).

| Trạng thái | Biểu hiện thực tế | Ref |
|---|---|---|
| Default | 5 đường lưới, cột cao theo `count`, ruột cao theo `avgScore`, đường xanh nối các điểm | [`L1631-L1663`](ref-ui.tsx#L1631-L1663) |
| Hover | Tooltip hiện (`opacity-0 → group-hover:opacity-100`): “{count} đề • TB {avg}đ”, nền `#1e232a`, 10px, `-top-9` | [`L1681-L1684`](ref-ui.tsx#L1681-L1684) |
| Focus | N/A — cột không focus được | — |
| Active | N/A | — |
| Disabled | N/A | — |
| Loading | N/A — dữ liệu dựng đồng bộ | — |
| Empty | `series` luôn có 4–7 điểm hard-code; nếu `attempts` rỗng vẫn vẽ (CN count = max(3, -2) = 3) → **không có empty state** | [`L1186-L1190`](ref-ui.tsx#L1186-L1190) |
| Error | N/A | — |
| Selected | N/A | — |

**(d) Style chính** — Lưới `border-b border-slate-200/80`, nhãn `w-7 text-right`; polyline `stroke #3b82f6`, width 3, cap/join round; track `bg-gradient-to-b from-slate-200/90 to-slate-300/60`; fill `bg-gradient-to-t from-[#14171c] via-[#262b33] to-slate-600`; `transition-all duration-500` cho cả hai chiều cao.

**(e) Hành vi & a11y** — Chiều cao cột = `clamp(35, count/maxCount*100, 100)%` của overlay; ruột = `avgScore/10*100%` — **hai thang đo khác nhau** trên cùng một cột (QDS-22). Tooltip chỉ có khi hover → không có dữ liệu cho bàn phím/screen reader; không `<title>`, không bảng dữ liệu thay thế.

**(f) Ràng buộc** — Overlay lệch trái `left-10` để chừa nhãn trục; `right-2` + `justify-around` khiến cột cuối sát mép. SVG `preserveAspectRatio="none"` làm nét vẽ méo theo tỉ lệ khung (nét dày/ngang khác nhau). Trục tung luôn 0–10 bất kể dữ liệu.

### 4.19 DonutGauge

**(a) Vai trò & nơi dùng** — Vòng tròn phổ điểm trung bình ở SCREEN-01, cột phải — [`ref-ui.tsx:L1717-L1768`](ref-ui.tsx#L1717-L1768).

**UC liên quan:** UC-01

**(b) Cấu trúc**

```
┌ div.relative.my-3.w-44.h-44.rounded-full.neu-pill.flex.center.p-4 ─┐
│   <svg class="-rotate-90" viewBox="0 0 120 120">                │
│     circle r=46 stroke #dce3ee width 12      (track)             │
│     circle r=46 stroke #1e232a dasharray …   (Xuất sắc)          │
│     circle r=46 stroke #64748b dasharray …   (Khá giỏi)          │
│   </svg>                                                          │
│   ┌ div.absolute.inset-8.rounded-full.neu-card-inset ─────────┐  │
│   │            8.4đ   (text-xl bold)                          │  │
│   │            Điểm TB (11px slate-400)                       │  │
│   └───────────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────────────┘
```

**(c) Props & trạng thái** — `distribution: { excellentPct, goodPct, averagePct }`, `avgScore` (string).

| Trạng thái | Biểu hiện thực tế | Ref |
|---|---|---|
| Default | Track `#dce3ee` 12px; 2 segment `#1e232a` / `#64748b`, `strokeLinecap="round"`, dasharray `pct*289/289` | [`L1719-L1757`](ref-ui.tsx#L1719-L1757) |
| Hover | Không có | — |
| Focus | N/A | — |
| Active | N/A | — |
| Disabled | N/A | — |
| Loading | N/A | — |
| Empty | Khi chưa có attempt: cả 3 pct = `0.0` → vòng chỉ còn track, tâm hiện `0.0đ` | [`L1211-L1214`](ref-ui.tsx#L1211-L1214) |
| Error | N/A | — |
| Selected | N/A | — |

**(d) Style chính** — Khung `.neu-pill` 176×176, tâm `.neu-card-inset` (`inset-8`); segment bắt đầu từ `-rotate-90` (12 giờ), chạy theo chiều kim đồng hồ.

**(e) Hành vi & a11y** — Tĩnh. `strokeDasharray` dùng chu vi làm tròn **289** (2π×46 ≈ 289.03) — sai số < 0.02%, chấp nhận được. `strokeDashoffset` âm để nối segment 2 sau segment 1.

**(f) Ràng buộc** — **Chỉ vẽ 2/3 thành phần**: `averagePct` không có segment (QDS-21) → vòng không bao giờ khép kín trừ khi 2 nhóm đầu = 100%. Không thể biểu diễn giá trị > 100 (dữ liệu `toFixed(1)` có thể lệch tổng do làm tròn).

### 4.20 DonutLegend

**(a) Vai trò & nơi dùng** — 3 ô chú giải dưới DonutGauge (Xuất sắc / Khá giỏi / Cần cố gắng) — [`ref-ui.tsx:L1770-L1799`](ref-ui.tsx#L1770-L1799).

**UC liên quan:** UC-01

**(b) Cấu trúc**

```
div.w-full.grid.grid-cols-3.gap-2.pt-2.text-center
├── div → [■ #1e232a] Xuất sắc   /  62.5%
├── div → [■ slate-500] Khá giỏi /  25.0%
└── div → [■ slate-300] Cần cố gắng / 12.5%
```

**(c) Props & trạng thái** — 3 cặp `{color, label, pct}` cố định.

| Trạng thái | Biểu hiện thực tế | Ref |
|---|---|---|
| Default | 3 cột đều, nhãn 11px `slate-400`, số 14px bold `#1e232a` | [`L1771-L1798`](ref-ui.tsx#L1771-L1798) |
| Hover | Không có | — |
| Focus | N/A | — |
| Active | N/A | — |
| Disabled | N/A | — |
| Loading | N/A | — |
| Empty | Hiện `0.0%` cho cả 3 — vẫn giữ bố cục | [`L1232-L1236`](ref-ui.tsx#L1232-L1236) |
| Error | N/A | — |
| Selected | N/A | — |

**(d) Style chính** — `grid-cols-3 gap-2 pt-2 text-center`; swatch `w-2 h-2 rounded-sm`; nhãn `text-[11px] text-slate-400`; số `font-bold text-sm text-[#1e232a] mt-0.5`.

**(e) Hành vi & a11y** — Màu swatch là **giác quan duy nhất** phân biệt nhóm (không có pattern) → không đạt WCAG 1.4.1 nếu in đen trắng; nhãn chữ vẫn đọc được nên chấp nhận ở mức cơ bản. Không có `title`/tooltip.

**(f) Ràng buộc** — 3 cột cố định; nhãn “Cần cố gắng” dài nhất (~80px) vừa ở 176px bề rộng. Không wrap sang 2 dòng.

### 4.21 RecentAttemptList

**(a) Vai trò & nơi dùng** — Bảng “Overview of Works” 6 lượt làm bài gần nhất ở SCREEN-01 — [`ref-ui.tsx:L1803-L1860`](ref-ui.tsx#L1803-L1860).

**UC liên quan:** UC-01, UC-20

**(b) Cấu trúc**

```
┌ section.neu-card.rounded-[26px].p-5.sm:p-6 ─────────────────────────────┐
│  header: h3 “Overview of Works • …”        [Làm đề mới →] pill          │
│  ┌ div.overflow-x-auto ─────────────────────────────────────────────┐  │
│  │ table.w-full.text-left.border-collapse                           │  │
│  │  thead: STT | Tên bộ đề | Môn học | Thời gian nộp | Kết quả | Điểm│  │
│  │  tbody.divide-y → RecentAttemptRow × min(6, attempts.length)     │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
```

**(c) Props & trạng thái** — `attempts` (nhận 6 phần tử đầu), `onSeeAll`.

| Trạng thái | Biểu hiện thực tế | Ref |
|---|---|---|
| Default | Header 11px uppercase `slate-400`, viền dưới `slate-200/80`; body `text-xs sm:text-sm` | [`L1819-L1829`](ref-ui.tsx#L1819-L1829) |
| Hover | Từng row `hover:bg-white/40 transition-colors` | [`L1833`](ref-ui.tsx#L1833) |
| Focus | N/A — row không focus được | — |
| Active | N/A | — |
| Disabled | N/A | — |
| Loading | N/A | — |
| Empty | `tbody` rỗng, **không có thông báo**; header + nút vẫn hiện | [`L1830`](ref-ui.tsx#L1830) |
| Error | N/A | — |
| Selected | N/A — không chọn dòng | — |

**(d) Style chính** — `overflow-x-auto` + `border-collapse`; header `text-[11px] uppercase`; row `py-3.5 px-3`; nút “Làm đề mới →” `.neu-pill px-3.5 py-1.5 text-xs font-bold hover:underline`.

**(e) Hành vi & a11y** — Nút chuyển sang tab `exams` nhưng **không** reset về root: nếu đang ở `examDetail` thì vẫn ở đó (chỉ đổi tab) → hành vi “Làm đề mới” không như nhãn (QDS-23). Dùng `<table>` đúng semantic; thiếu `<caption>`.

**(f) Ràng buộc** — `slice(0, 6)` cứng; bảng 6 cột nên ở <640px phải cuộn ngang; cột “Tên bộ đề” không `truncate` → tên dài đẩy bảng rộng.

### 4.22 RecentAttemptRow

**(a) Vai trò & nơi dùng** — Một dòng dữ liệu lượt làm bài — [`ref-ui.tsx:L1830-L1856`](ref-ui.tsx#L1830-L1856).

**UC liên quan:** UC-01, UC-20

**(b) Cấu trúc**

```
tr.hover:bg-white/40
├── td STT        (slate-400 font-semibold)
├── td Tên bộ đề  (font-bold #1e232a)
├── td Môn học    (slate-500 font-medium)
├── td Thời gian  (slate-400)
├── td Kết quả    (center, slate-600, “23/25 câu”)
└── td Điểm       (right, span.neu-pill “9.2 đ”)
```

**(c) Props & trạng thái** — `attempt: { id, examTitle, subjectName, timestamp, correctCount, totalQuestions, score }`, `index`.

| Trạng thái | Biểu hiện thực tế | Ref |
|---|---|---|
| Default | 6 ô, `py-3.5 px-3`, divider `divide-slate-200/60` | [`L1829-L1855`](ref-ui.tsx#L1829-L1855) |
| Hover | `hover:bg-white/40` (nền trắng 40% — rất nhẹ) | [`L1833`](ref-ui.tsx#L1833) |
| Focus | N/A | — |
| Active | N/A | — |
| Disabled | N/A | — |
| Loading | N/A | — |
| Empty | N/A (không render) | — |
| Error | N/A | — |
| Selected | N/A | — |

**(d) Style chính** — Chữ `text-xs sm:text-sm`; điểm dùng `.neu-pill px-3 py-1 rounded-full font-bold`.

**(e) Hành vi & a11y** — **Không click được** — không điều hướng tới result của lượt đó (QDS-24). Không có `<time datetime>`; timestamp là string `YYYY-MM-DD HH:mm`.

**(f) Ràng buộc** — Điểm hiển thị kèm hậu tố “đ” và dấu cách (`9.2 đ`), khác ScoreBanner (`9.2` + “Điểm / 10”).

### 4.23 Breadcrumb

**(a) Vai trò & nơi dùng** — Thanh định vị + hành động ngữ cảnh cho toàn bộ tab “Đề kiểm tra” — [`ref-ui.tsx:L1869-L1967`](ref-ui.tsx#L1869-L1967).

**UC liên quan:** UC-24; hỗ trợ UC-05, UC-06, UC-16

**(b) Cấu trúc**

```
┌ header.neu-card.rounded-2xl.px-5.py-4.flex.flex-wrap.justify-between.gap-4 ┐
│ ┌ trái: flex.flex-wrap.gap-1.5.text-sm.sm:text-base.font-bold ─────────┐ │
│ │  [root]  ›  [● Tên môn]  ›  [Tên bộ đề]  ›  [Tiêu đề nháp]          │ │
│ └──────────────────────────────────────────────────────────────────────┘ │
│ ┌ phải: flex.gap-2.5 ─────────────────────────────────────────────────┐ │
│ │  root    → [+ Tạo môn học]  (.neu-dark-btn)                         │ │
│ │  subject → [+ Tạo bộ đề]    (.neu-dark-btn)                         │ │
│ │  khác    → (trống)                                                  │ │
│ └──────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
```

**(c) Props & trạng thái** — `currentSubject`, `currentExam`, `examViewMode`, `editingExamTitle`; 4 biến thể crumb.

| Trạng thái | Biểu hiện thực tế | Ref |
|---|---|---|
| Default (root) | Chỉ “root” + CTA “Tạo môn học” | [`L1873-L1879`](ref-ui.tsx#L1873-L1879), [`L1947-L1955`](ref-ui.tsx#L1947-L1955) |
| Hover | Crumb `hover:bg-white/70` nền trắng mờ; không underline | [`L1875`](ref-ui.tsx#L1875) |
| Focus | Mặc định trình duyệt | — |
| Active | N/A | — |
| Disabled | N/A | — |
| Loading | N/A | — |
| Empty | N/A — “root” luôn tồn tại | — |
| Error | N/A | — |
| Selected | Crumb hiện tại = **nút reset** (click lại sẽ reset trang + toast) | [`L1886-L1891`](ref-ui.tsx#L1886-L1891) |

**(d) Style chính** — Header `.neu-card rounded-2xl px-5 py-4`; crumb `px-3 py-1 rounded-xl`; separator `ChevronRight w-4 h-4 text-slate-400`; crumb bộ đề `bg-white/60 hover:bg-white truncate max-w-xs sm:max-w-md`; crumb nháp `bg-white/70`.

**(e) Hành vi & a11y** — `root` → `handleResetRoot()`; môn → `handleNavigateToSubject(id, examViewMode === 'subject')` (reset nếu đang ở chính nó); bộ đề → tương tự; nháp → mở lại editor (mất thay đổi chưa lưu — không cảnh báo). Không dùng `<nav aria-label="breadcrumb">`, không `aria-current`.

**(f) Ràng buộc** — `flex-wrap` cho phép xuống 2 dòng; tên bộ đề `truncate` + `max-w-xs sm:max-w-md`; tiêu đề nháp rỗng hiển thị “Chưa có tiêu đề” ([`ref-ui.tsx:L1939`](ref-ui.tsx#L1939)).

### 4.24 SubjectCard

**(a) Vai trò & nơi dùng** — Card môn học trong lưới SCREEN-02 — [`ref-ui.tsx:L2060-L2098`](ref-ui.tsx#L2060-L2098).

> **[CẬP NHẬT đợt 2 — Q-01/Q-15]** `[YÊU CẦU MỚI]`: bổ sung nút **“Xoá môn”** (icon lucide `Trash2`, góc trên phải card, chỉ hiện khi hover/focus — `opacity-0 group-hover:opacity-100 focus-visible:opacity-100`) mở [`DeleteConfirmDialog`](#458-deleteconfirmdialog) ([4.58](#458-deleteconfirmdialog)) — **soft delete** (`deleted_at` trong DB, không xoá cứng). Tên môn là **duy nhất toàn cục** → lỗi trùng tên hiển thị inline ở `CreateSubjectForm` (4.25).

**UC liên quan:** UC-05, UC-24

**(b) Cấu trúc**

```
┌ div.neu-card.rounded-[24px].p-5.cursor-pointer.hover:-translate-y-1.group ─┐
│ ┌ top ─────────────────────────────────────────────────────────────────┐ │
│ │  ┌ w-11 h-11 rounded-2xl  (bg = sub.color, chữ cái đầu trắng) ┐     │ │
│ │  │                    M                                          │     │ │
│ │  └───────────────────────────────────────────────────────────────┘     │ │
│ │                              [ 2 bộ đề ] .neu-pill                    │ │
│ └──────────────────────────────────────────────────────────────────────┘ │
│  h3  Mạng Máy Tính          (group-hover:text-black)                     │
│  p   Tổng cộng 45 câu hỏi trắc nghiệm                                    │
│  ────────────────────────────────────────────────────────────────────   │
│  ● Mở danh sách đề                                        ›              │
└────────────────────────────────────────────────────────────────────────┘
```

**(c) Props & trạng thái** — `subject { id, name, color }`, `examCount`, `totalQuestions`, `onOpen`, **`onDelete?`** `[YÊU CẦU MỚI]` (Q-01).

| Trạng thái | Biểu hiện thực tế | Ref |
|---|---|---|
| Default | Card `p-5`, icon vuông 44px màu môn + `shadow-md`, pill “N bộ đề” | [`L2064-L2077`](ref-ui.tsx#L2064-L2077) |
| Hover | `hover:-translate-y-1` (nâng 4px) + chữ tiêu đề đổi `group-hover:text-black` + chevron `translate-x-1` | [`L2064`](ref-ui.tsx#L2064), [`L2095`](ref-ui.tsx#L2095) |
| Focus | N/A — `<div>` không `tabIndex` → **không thể tab tới** | [`L2061-L2065`](ref-ui.tsx#L2061-L2065) |
| Active | N/A — không có hiệu ứng nhấn | — |
| Disabled | N/A | — |
| Loading | N/A | — |
| Empty | Không có empty state: môn 0 bộ đề vẫn là card bình thường, pill “0 bộ đề” | [`L2074-L2076`](ref-ui.tsx#L2074-L2076) |
| Error | N/A | — |
| Selected | N/A — click điều hướng ngay, không chọn | — |

**(d) Style chính** — `.neu-card rounded-[24px] p-5`; icon `rounded-2xl text-white font-bold`; footer `mt-5 pt-3 border-t border-slate-200/70 text-xs font-bold`.

**(e) Hành vi & a11y** — `onClick` trên div; không `role="button"`, không `onKeyDown` ⇒ **vi phạm a11y cơ bản** (QDS-16). Chữ cái đầu lấy `sub.name.charAt(0).toUpperCase()` — tên bắt đầu bằng ký tự có dấu vẫn hiển thị đúng nhưng không có fallback khi rỗng.

**(f) Ràng buộc** — `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`; tên môn 1 dòng (không truncate → card cao lên nếu wrap); màu chữ trắng trên `#f59e0b` (amber) chỉ đạt ~2.2:1 — chữ cái đầu bị mờ (QDS-25).

### 4.25 CreateSubjectForm

**(a) Vai trò & nơi dùng** — Form inline (không modal) tạo môn học, mở/đóng bằng nút “Tạo môn học” ở breadcrumb — [`ref-ui.tsx:L1975-L2050`](ref-ui.tsx#L1975-L2050).

**UC liên quan:** UC-04

**(b) Cấu trúc**

```
form.neu-card.rounded-2xl.p-5.space-y-4.border.border-white
┌ header: h3 “Tạo môn học mới”                    [X] ──────────────┐
├ grid.grid-cols-1.md:grid-cols-2.gap-4 ──────────────────────────┐ │
│ ┌ label “Tên môn học” ─────────┐  ┌ label “Chọn ô màu…” ──────┐ │ │
│ │ input.neu-card-inset         │  │ [8 swatch 32×32]          │ │ │
│ └──────────────────────────────┘  └───────────────────────────┘ │ │
└─────────────────────────────────────────────────────────────────┘ │
┌ footer.justify-end.gap-2: [Hủy]  [Lưu môn học] ───────────────────┐ │
└────────────────────────────────────────────────────────────────────┘
```

**(c) Props & trạng thái** — `open`, `name`, `color`, `onSubmit`, `onCancel`.

| Trạng thái | Biểu hiện thực tế | Ref |
|---|---|---|
| Default | Form hiện dưới breadcrumb, `space-y-4`, input rộng full | [`L1976-L2004`](ref-ui.tsx#L1976-L2004) |
| Hover | Input không hover; nút Hủy/Lưu theo style chung | — |
| Focus | Input **mất** focus ring (`focus:outline-none`, không thay thế) | [`L2003`](ref-ui.tsx#L2003) |
| Active | N/A | — |
| Disabled | N/A — nút Lưu không bị disable khi tên rỗng | — |
| Loading | N/A | — |
| Empty | Tên rỗng → submit bị chặn bằng toast “Vui lòng nhập tên môn học!” | [`L1063-L1066`](ref-ui.tsx#L1063-L1066) |
| Error | Ref chỉ toast; **[CẬP NHẬT Q-15]** `[YÊU CẦU MỚI]` bổ sung **inline error** dưới input tên: “Tên môn học đã tồn tại — tên môn là duy nhất trong app.” (`text-xs text-rose-600` + `aria-invalid` + `aria-describedby`), chặn submit, form giữ nguyên nội dung | — |
| Selected | Màu đang chọn = swatch có `ring-2 ring-offset-2 ring-[#262b33]` + dấu Check | [`L2018-L2027`](ref-ui.tsx#L2018-L2027) |

**(d) Style chính** — `.neu-card rounded-2xl p-5` + `border border-white`; label `text-xs font-bold text-slate-500 mb-1.5`; input `px-4 py-2.5 rounded-xl neu-card-inset text-sm font-medium`; Hủy `.neu-pill`; Lưu `.neu-dark-btn px-5 py-2`.

**(e) Hành vi & a11y** — `onSubmit` chặn `preventDefault`; Enter trong input submit form (hành vi mặc định, tốt). Đóng form X/Hủy **không** xoá `newSubjectName` (chỉ ẩn) → mở lại còn chữ cũ (QDS-26). Không `<fieldset>`/`<legend>`; label không `htmlFor` (không gắn với input). **[CẬP NHẬT Q-15]** `[YÊU CẦU MỚI]`: validate tên trùng chạy **trước** khi append — `subjects.some(s => s.name.trim().toLowerCase() === name.toLowerCase())` → hiện inline error thay vì toast; đồng thời sửa lỗi `htmlFor`/`aria-invalid` khi port.

**(f) Ràng buộc** — Grid 2 cột ở `md`; 8 swatch 32px + gap 10px = 326px → vừa cột phải ở desktop, **tràn** ở cột hẹp (swatch wrap nhờ `flex-wrap`). Không giới hạn độ dài tên môn.

### 4.26 ColorSwatchGrid

**(a) Vai trò & nơi dùng** — Lưới 8 ô màu chọn màu môn (dùng `SUBJECT_COLORS`) — [`ref-ui.tsx:L2011-L2030`](ref-ui.tsx#L2011-L2030).

**UC liên quan:** UC-04

**(b) Cấu trúc**

```
div.flex.items-center.gap-2.5.flex-wrap
├── button.w-8.h-8.rounded-xl  bg=#262b33  (selected → scale-110 + ring + ✓)
├── button … #3b82f6
├── … 8 nút
└── (mỗi nút có title = tên màu tiếng Việt)
```

**(c) Props & trạng thái** — `value: hex`, `onChange`, `options = SUBJECT_COLORS`.

| Trạng thái | Biểu hiện thực tế | Ref |
|---|---|---|
| Default | 32×32, `rounded-xl`, nền = hex, `opacity-80` | [`L2018-L2024`](ref-ui.tsx#L2018-L2024) |
| Hover | `hover:opacity-100` (không đổi kích thước) | [`L2021`](ref-ui.tsx#L2021) |
| Focus | Mặc định trình duyệt | — |
| Active | Không có hiệu ứng nhấn riêng | — |
| Disabled | N/A | — |
| Loading | N/A | — |
| Empty | N/A — luôn 8 màu | — |
| Error | N/A | — |
| Selected | `scale-110` + `ring-2 ring-offset-2 ring-[#262b33]` + `<Check>` trắng 16px | [`L2019-L2026`](ref-ui.tsx#L2019-L2026) |

**(d) Style chính** — `w-8 h-8 rounded-xl transition-transform`; selected `scale-110`; `ring-offset` lấy nền `#eef2f7`.

**(e) Hành vi & a11y** — `title` = tên màu (“Than chì”, “Xanh dương”…). Chọn màu = click; không có `aria-pressed`/`role="radiogroup"`; trạng thái chọn có **2 tín hiệu** (ring + check) nên không chỉ dựa vào màu.

**(f) Ràng buộc** — 8 nút cố định; `scale-110` + ring làm phần tử tràn 2px ra ngoài → cần `gap-2.5` để không chồng. Ô `#ffffff` không tồn tại trong palette (đúng thiết kế).

### 4.27 ExamCard

**(a) Vai trò & nơi dùng** — Card bộ đề trong lưới SCREEN-03 — [`ref-ui.tsx:L2137-L2168`](ref-ui.tsx#L2137-L2168).

> **[CẬP NHẬT đợt 2 — Q-01]** `[YÊU CẦU MỚI]`: bổ sung nút **“Xoá bộ đề”** (`Trash2`, góc trên phải card, hiện khi hover/focus) mở [`DeleteConfirmDialog`](#458-deleteconfirmdialog) — soft delete. Bộ đề đã có lượt làm bài vẫn giữ lịch sử `Attempt` (snapshot `examTitle` — [`L1140`](ref-ui.tsx#L1140)). Tên bộ đề **unique trong cùng môn** — lỗi trùng hiện inline ở `EditorTitleBar` khi Lưu (4.36).

**UC liên quan:** UC-05, UC-16

**(b) Cấu trúc**

```
┌ div.neu-card.rounded-[24px].p-5.cursor-pointer.group ───────────────────┐
│  [ 42 câu hỏi ]  (bg=subject.color, text trắng)        2026-10-18 14:30 │
│  h4  Đề tổng hợp OSI, TCP/IP & Chia mạng con                           │
│  p   Đã làm 3 lượt • Nhấn để xem câu hỏi hoặc bắt đầu kiểm tra         │
│  ────────────────────────────────────────────────────────────────────  │
│  Xem tổng quan & Làm đề                                        ›        │
└─────────────────────────────────────────────────────────────────────────┘
```

**(c) Props & trạng thái** — `exam { id, title, createdAt, questions }`, `subjectColor`, `attemptCount`, **`onDelete?`** `[YÊU CẦU MỚI]` (Q-01).

| Trạng thái | Biểu hiện thực tế | Ref |
|---|---|---|
| Default | Card `p-5`; badge đếm câu `px-3 py-1 rounded-full text-[11px]` nền màu môn | [`L2141-L2153`](ref-ui.tsx#L2141-L2153) |
| Hover | `hover:-translate-y-1` + chevron `translate-x-1` | [`L2141`](ref-ui.tsx#L2141), [`L2166`](ref-ui.tsx#L2166) |
| Focus | N/A — `<div>` không tab được | — |
| Active | N/A | — |
| Disabled | N/A | — |
| Loading | N/A | — |
| Empty | Bộ đề 0 câu vẫn hiện badge “0 câu hỏi” (không chặn tạo) | [`L2149`](ref-ui.tsx#L2149) |
| Error | N/A | — |
| Selected | N/A | — |

**(d) Style chính** — `.neu-card rounded-[24px] p-5`; badge `text-white` theo màu môn; ngày `text-[11px] text-slate-400`; footer `border-t border-slate-200/70 text-xs font-bold`.

**(e) Hành vi & a11y** — Click → `handleNavigateToExamDetail(exam.id)`; cùng vấn đề a11y như SubjectCard (QDS-16). Meta “Đã làm N lượt” tính bằng `attempts.filter(...)` mỗi lần render (O(n·m) — chấp nhận ở quy mô demo).

**(f) Ràng buộc** — `grid-cols-1 md:grid-cols-2`; tiêu đề 1 dòng (không truncate); badge chữ trắng trên màu amber/cyan có contrast thấp (QDS-25).

### 4.28 EmptyState

**(a) Vai trò & nơi dùng** — Khối trạng thái rỗng khi môn chưa có bộ đề — [`ref-ui.tsx:L2111-L2128`](ref-ui.tsx#L2111-L2128).

**UC liên quan:** UC-05, UC-06

**(b) Cấu trúc**

```
┌ div.neu-card.rounded-3xl.p-12.text-center.space-y-4 ─────────────┐
│           ┌ w-14 h-14 rounded-2xl neu-pill ┐                     │
│           │        <BookOpen 24px>          │                   │
│           └────────────────────────────────┘                     │
│            Môn {name} chưa có bộ đề nào        (font-bold base)   │
│     Hãy nhấn nút “Tạo bộ đề” để soạn câu hỏi…  (xs, max-w-md)    │
│              [ + Tạo bộ đề đầu tiên ]  (.neu-dark-btn)           │
└──────────────────────────────────────────────────────────────────┘
```

**(c) Props & trạng thái** — Nội dung hard-code theo `currentSubject`; không có prop.

| Trạng thái | Biểu hiện thực tế | Ref |
|---|---|---|
| Default | Card `p-12`, icon 56px, tiêu đề 16px, mô tả 12px, CTA | [`L2111-L2127`](ref-ui.tsx#L2111-L2127) |
| Hover | Chỉ CTA có hover (`.neu-dark-btn`) | [`L1314`](ref-ui.tsx#L1314) |
| Focus | CTA nhận focus mặc định | — |
| Active | N/A | — |
| Disabled | N/A | — |
| Loading | N/A | — |
| Empty | Chính nó là empty state | — |
| Error | Không có biến thể lỗi / “không tải được” | — |
| Selected | N/A | — |

**(d) Style chính** — `.neu-card rounded-3xl p-12 text-center space-y-4`; icon tile `.neu-pill` 56px, `text-slate-400`; mô tả `text-xs text-slate-400 max-w-md mx-auto`.

**(e) Hành vi & a11y** — CTA mở editor tạo bộ đề. Không có `role="status"`; thông điệp nêu đúng tên môn (tốt cho ngữ cảnh).

**(f) Ràng buộc** — Chỉ dùng cho “môn chưa có bộ đề”. Các trường hợp rỗng khác dùng text thường (history panel, [`ref-ui.tsx:L2284-L2286`](ref-ui.tsx#L2284-L2286)) hoặc **không có gì** (bảng recent, [`L1830`](ref-ui.tsx#L1830)) → không nhất quán (QDS-27).

### 4.29 ExamOverviewHeader

**(a) Vai trò & nơi dùng** — Khối tổng quan bộ đề + 4 hành động, đầu SCREEN-04 — [`L2181-L2265`](ref-ui.tsx#L2181-L2265).

**UC liên quan:** UC-16, UC-17, UC-18, UC-22

**(b) Cấu trúc**

```
┌ div.neu-card.rounded-[26px].p-6.flex.flex-col.lg:flex-row.lg:items-center.justify-between.gap-5 ┐
│ ┌ trái.space-y-2 ──────────────────────────┐  ┌ phải.flex.flex-wrap.gap-3 ──────────────┐ │
│ │ [● Môn]  [Tổng số: 42 câu]              │  │ [👁 Hiện đáp án  ◯—]  (switch)        │ │
│ │ h2  Tên bộ đề                            │  │ [🕐 Lịch sử làm bài]  (.neu-pill)     │ │
│ │ p   Mặc định đáp án được ẩn…             │  │ [✎ Sửa đề]            (.neu-pill)     │ │
│ └──────────────────────────────────────────┘  │ [▶ Làm bài kiểm tra] (.neu-dark-btn)  │ │
│                                               └─────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────────────────────────────────────────┘
```

**(c) Props & trạng thái** — `subject`, `exam`, `showAnswers`, `onToggleAnswers`, `onHistory`, `onEdit`, `onStart`.

| Trạng thái | Biểu hiện thực tế | Ref |
|---|---|---|
| Default | Badge môn (nền màu môn) + pill “Tổng số: N câu”, tiêu đề `text-lg sm:text-xl` | [`L2182-L2202`](ref-ui.tsx#L2182-L2202) |
| Hover | Chỉ các nút phụ `hover:bg-white/70`; card không hover | [`L2236`](ref-ui.tsx#L2236) |
| Focus | N/A ở card; nút mặc định | — |
| Active | N/A | — |
| Disabled | N/A — “Sửa đề”/“Làm bài” luôn bật | — |
| Loading | N/A | — |
| Empty | Bộ đề 0 câu: vẫn hiện “Tổng số: 0 câu”, nút Làm bài mở modal nhưng `handleStartQuiz` return sớm (không phản hồi) | [`L1083`](ref-ui.tsx#L1083) |
| Error | N/A | — |
| Selected | N/A | — |

**(d) Style chính** — `.neu-card rounded-[26px] p-6`; mô tả `text-xs text-slate-400`; CTA `.neu-dark-btn px-5 py-2.5 rounded-2xl` có icon `Play` `fill-current`.

**(e) Hành vi & a11y** — 4 hành động trong `flex-wrap gap-3`; “Làm bài” set số câu mặc định `min(25, tổng)` rồi mở modal ([`ref-ui.tsx:L2253-L2258`](ref-ui.tsx#L2253-L2258)). Không có nhóm `role="group"`/`aria-label`.

**(f) Ràng buộc** — Ở `lg` mới xếp ngang; dưới `lg` 4 nút wrap thành 2–4 dòng, chiếm chiều cao đáng kể.

### 4.30 ShowAnswersSwitch

**(a) Vai trò & nơi dùng** — Công tắc “Hiện đáp án” cho danh sách câu hỏi preview — [`L2207-L2231`](ref-ui.tsx#L2207-L2231).

**UC liên quan:** UC-16

**(b) Cấu trúc**

```
button.neu-pill.px-4.py-2.5.rounded-2xl.flex.gap-3
├── <Eye|EyeOff 16px>   (emerald-600 | slate-400)
├── span “Hiện đáp án”  (emerald-700 | slate-600)
└── div.w-10.h-5.rounded-full.p-0.5 (bg emerald-500 | slate-300)
     └── div.w-4.h-4.rounded-full.bg-white.shadow (translate-x-5 | translate-x-0)
```

**(c) Props & trạng thái** — `checked: boolean`, `onChange`.

| Trạng thái | Biểu hiện thực tế | Ref |
|---|---|---|
| Default (OFF) | Icon EyeOff `slate-400`, chữ `slate-600`, track `slate-300`, knob `translate-x-0` | [`L2214-L2229`](ref-ui.tsx#L2214-L2229) |
| Hover | Không có hover riêng cho switch (chỉ `.neu-pill` tĩnh) | — |
| Focus | Mặc định trình duyệt | — |
| Active | Bấm → đổi trạng thái; không có hiệu ứng nhấn | [`L2209`](ref-ui.tsx#L2209) |
| Disabled | N/A | — |
| Loading | N/A | — |
| Empty | N/A | — |
| Error | N/A | — |
| Selected (ON) | Icon Eye `emerald-600`, chữ `emerald-700`, track `emerald-500`, knob `translate-x-5` (20px) | [`L2221-L2228`](ref-ui.tsx#L2221-L2228) |

**(d) Style chính** — `.neu-pill px-4 py-2.5 rounded-2xl`; track `w-10 h-5 p-0.5` (40×20); knob `w-4 h-4` (16px) + `shadow`, `transition-transform` mặc định 150ms.

**(e) Hành vi & a11y** — Là `<button>` chứa “switch” → **không có** `role="switch"`, `aria-checked`, không nhãn liên kết; trạng thái đọc được chỉ nhờ màu + vị trí knob. Bấm vào bất kỳ đâu trong nút đều toggle (vùng chạm lớn — tốt). Toggle reset về `false` mỗi lần vào lại ExamDetail ([`ref-ui.tsx:L975`](ref-ui.tsx#L975)).

**(f) Ràng buộc** — Track 40×20 cố định; `p-0.5` = 2px **mỗi phía** ⇒ vùng knob = 40 − 4 − 16 = 20 = `translate-x-5`, nên knob **sát mép phải** khi ON (QDS-28). Chỉ áp dụng cho mode `preview`; mode quiz/result không bị ảnh hưởng.

### 4.31 AttemptHistoryPanel

**(a) Vai trò & nơi dùng** — Panel (không phải modal) liệt kê lịch sử làm bài của bộ đề, mở từ nút “Lịch sử làm bài” (OVL-05) — [`L2267-L2310`](ref-ui.tsx#L2267-L2310).

**UC liên quan:** UC-17 (OVL-05)

**(b) Cấu trúc**

```
┌ div.neu-card.rounded-2xl.p-5.space-y-3.border.border-white ──────────────┐
│  🕐 Lịch sử làm bài của bộ đề này                            [X]        │
│  ┌ empty → p.text-xs “Bạn chưa làm bài kiểm tra nào…” ─────────────┐  │
│  │ hoặc: div.space-y-2 → AttemptHistoryRow × n                     │  │
│  │  ┌ .neu-card-inset.px-4.py-2.5.rounded-xl.flex.justify-between ┐ │  │
│  │  │ Lần #1 • 2026-10-23 19:40   Đúng 23/25 câu   [ 9.2 điểm ]   │ │  │
│  │  └──────────────────────────────────────────────────────────────┘ │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────┘
```

**(c) Props & trạng thái** — `attempts` (đã filter theo exam), `onClose`.

| Trạng thái | Biểu hiện thực tế | Ref |
|---|---|---|
| Default | Panel chèn giữa header và danh sách câu hỏi, `p-5 space-y-3` | [`L2269`](ref-ui.tsx#L2269) |
| Hover | Row không hover | — |
| Focus | N/A | — |
| Active | N/A | — |
| Disabled | N/A | — |
| Loading | N/A | — |
| Empty | Dòng chữ “Bạn chưa làm bài kiểm tra nào thuộc bộ đề này.” `py-3` | [`L2284-L2286`](ref-ui.tsx#L2284-L2286) |
| Error | N/A | — |
| Selected | N/A | — |

**(d) Style chính** — `.neu-card rounded-2xl p-5` + `border border-white`; row `.neu-card-inset px-4 py-2.5 rounded-xl text-xs`; điểm dùng `.neu-pill`.

**(e) Hành vi & a11y** — Mở/đóng bằng nút `setShowHistoryModal(prev => !prev)`, tự đóng khi điều hướng sang exam khác ([`ref-ui.tsx:L976`](ref-ui.tsx#L976)). Không phải dialog → không có backdrop/focus trap (đúng bản chất “panel mở rộng”).

**(f) Ràng buộc** — Danh sách không giới hạn chiều cao → nhiều lượt sẽ kéo dài trang; 3 cột nội dung (`justify-between`) có thể chồng khi timestamp dài ở cửa sổ hẹp.

### 4.32 QuestionCard

**(a) Vai trò & nơi dùng** — Component trung tâm, **một** implementation cho 4 ngữ cảnh: xem trước bộ đề, soạn thảo, làm bài, xem lại kết quả — [`ref-ui.tsx:L505-L788`](ref-ui.tsx#L505-L788). Dùng: SCREEN-04 preview [`L2314-L2322`](ref-ui.tsx#L2314-L2322), SCREEN-05 editor [`L2450-L2470`](ref-ui.tsx#L2450-L2470), SCREEN-06 quiz [`L2650-L2668`](ref-ui.tsx#L2650-L2668), SCREEN-07 result [`L2770-L2778`](ref-ui.tsx#L2770-L2778).

> **[CẬP NHẬT đợt 2 — R1/Q-10]** `[YÊU CẦU MỚI]` — hợp đồng UI đổi theo quyết định **nhiều đáp án đúng được phép**:
> - Câu **1 đáp án đúng** → giữ control **radio** như ref, ở mọi mode.
> - Câu **nhiều đáp án đúng** (dữ liệu TXT/JSON cho phép nhiều `ans.*` / nhiều `"true"` — [`L109-L128`](ref-ui.tsx#L109-L128), [`L67-L75`](ref-ui.tsx#L67-L75)) → control **checkbox**: editor tick nhiều đáp án đúng, quiz/result chọn nhiều đáp án.
> - `mode='quiz'` lưu `selectedOptionIds: string[]` (mảng) thay `selectedOptionId` đơn; tiến độ “Đã chọn” đếm số câu có ≥ 1 đáp án được chọn; chấm điểm theo rule Q-10 của domain-core.

**UC liên quan:** UC-07, UC-09, UC-11, UC-16, UC-19, UC-21

**(b) Cấu trúc**

```
┌ div.neu-card-inset.p-5.rounded-2xl  (+ ring-2 ring-#262b33 shadow-lg scale-[1.005] khi focus) ┐
│ ┌ header.flex.items-start.justify-between.gap-3.mb-4 ──────────────────────────────────┐ │
│ │  [ Câu 3 ] .neu-pill                        (mode=editor ? [🗑] : —)                   │ │
│ │  (editor)  textarea autoFocus rows=2  |  div.cursor-text hover:bg-white/60            │ │
│ │  (!editor) h4 text-sm sm:text-base leading-relaxed                                    │ │
│ └───────────────────────────────────────────────────────────────────────────────────────┘ │
│ ┌ options.space-y-2.5 ──────────────────────────────────────────────────────────────────┐ │
│ │  OptionRow × n                                                                          │ │
│ └───────────────────────────────────────────────────────────────────────────────────────┘ │
│ ┌ editor footer.mt-3.flex.justify-between ──────────────────────────────────────────────┐ │
│ │  [+ Thêm lựa chọn]                          “Mẹo: Nhấn vào nút tròn Radio…” (11px)      │ │
│ └───────────────────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────────────────────┘
```

Bố cục theo mode:

```
PREVIEW (showAnswer=false)      PREVIEW (showAnswer=true)
┌────────────────────────┐     ┌────────────────────────┐
│ [Câu 1]  Nội dung?      │     │ [Câu 1]  Nội dung?      │
│ ○ A. Lựa chọn 1         │     │ ● A. Lựa chọn 1  [Đáp án đúng] │
│ ○ B. Lựa chọn 2         │     │ ○ B. Lựa chọn 2         │
└────────────────────────┘     └────────────────────────┘

EDITOR                          QUIZ / RESULT
┌────────────────────────┐     ┌────────────────────────┐
│ [Câu 1]          [🗑]  │     │ [Câu 1]  Nội dung?      │
│ ● A. …        [Đúng] [x]│     │ ● A. …  (quiz: đã chọn) │
│ ○ B. …            [x]  │     │ ✓ B. …  (result: đúng)  │
│ + Thêm lựa chọn   Mẹo… │     │ ✗ C. …  (result: sai)   │
└────────────────────────┘     └────────────────────────┘
```

**(c) Props & trạng thái**

| Prop | Kiểu | Mặc định | Ý nghĩa |
|---|---|---|---|
| `index` | number | — | Số thứ tự 0-based, hiển thị `index + 1` |
| `question` | `{ id, ask, options[] }` | — | Dữ liệu câu hỏi |
| `mode` | `'preview' \| 'editor' \| 'quiz' \| 'result'` | `'preview'` | Quyết định toàn bộ tương tác |
| `showAnswer` | boolean | `false` | Chỉ có tác dụng ở `preview` |
| `selectedOptionId` | string \| null | `null` | Đáp án người dùng chọn (quiz/result) |
| `onSelectOption` | `(id) => void` | noop | Chọn đáp án |
| `onUpdateQuestion` | `(q) => void` | noop | Sửa ask/option/đáp án đúng |
| `onDeleteQuestion` | `() => void` | noop | Xoá câu |
| `isFocused` | boolean | `false` | Highlight tạm 2.2s |
| `cardRef` | `(el) => void` | `null` | Đăng ký ref để scroll-into-view |

**Ma trận mode × trạng thái**

| Tình huống | Radio | Nền hàng | Nhãn phải | Ref |
|---|---|---|---|---|
| preview, ẩn đáp án | rỗng | `bg-[#eef2f6]/70` | — | [`L634`](ref-ui.tsx#L634) |
| preview, hiện đáp án, đúng | đặc emerald | `bg-emerald-50/90 border-emerald-400/80` | badge “Đáp án đúng” | [`L635-L636`](ref-ui.tsx#L635-L636), [`L756-L760`](ref-ui.tsx#L756-L760) |
| editor, đúng | đặc emerald | `bg-emerald-50/80` | badge “Đúng” | [`L637-L638`](ref-ui.tsx#L637-L638), [`L739-L743`](ref-ui.tsx#L739-L743) |
| quiz, đã chọn | đặc `#262b33` | `bg-white border-[#262b33]/40 shadow-sm` | — | [`L639-L640`](ref-ui.tsx#L639-L640) |
| result, đúng | đặc emerald | `bg-emerald-50/90 border-emerald-400` | ✓ CheckCircle2 | [`L642-L643`](ref-ui.tsx#L642-L643), [`L762-L764`](ref-ui.tsx#L762-L764) |
| result, chọn sai | đặc rose | `bg-rose-50/90 border-rose-400` | ✗ XCircle | [`L644-L646`](ref-ui.tsx#L644-L646), [`L765-L767`](ref-ui.tsx#L765-L767) |

**Bảng trạng thái component**

| Trạng thái | Biểu hiện thực tế | Ref |
|---|---|---|
| Default | `.neu-card-inset p-5 rounded-2xl`, chip “Câu n”, danh sách option | [`L565-L570`](ref-ui.tsx#L565-L570) |
| Hover | Chỉ phần tử con: ask `hover:bg-white/60`, option `hover:bg-white/60`, nút xoá đổi `rose-500` | [`L594`](ref-ui.tsx#L594), [`L615`](ref-ui.tsx#L615) |
| Focus | `ring-2 ring-[#262b33] shadow-lg scale-[1.005]` khi `isFocused` (không phải focus bàn phím) | [`L567-L569`](ref-ui.tsx#L567-L569) |
| Active | N/A — card không bấm | — |
| Disabled | N/A | — |
| Loading | N/A | — |
| Empty | ask rỗng: editor → placeholder nghiêng “(Chưa có nội dung câu hỏi - Nhấn vào để nhập)”; mode khác → “(Câu hỏi trống)” | [`L596-L600`](ref-ui.tsx#L596-L600), [`L606`](ref-ui.tsx#L606) |
| Error | N/A — không có trạng thái lỗi riêng cho câu hỏi | — |
| Selected | Ở editor: option đúng mang nền emerald + badge; ở quiz/result: hàng được chọn theo `selectedOptionId` | [`L625-L647`](ref-ui.tsx#L625-L647) |

**(d) Style chính** — `.neu-card-inset p-5 rounded-2xl transition-all duration-300`; chip `neu-pill px-3 py-1 rounded-xl text-xs font-bold text-[#262b33]`; ask 14–16px `font-semibold leading-relaxed`; textarea khi sửa `bg-white/90 border border-slate-300 rounded-xl p-2.5 text-sm`.

**(e) Hành vi & a11y**

- **Inline edit ask**: click vào chữ → `textarea autoFocus rows=2`; thoát bằng **blur** (không Enter/Escape) — [`L580-L589`](ref-ui.tsx#L580-L589).
- **Inline edit option**: click → `input autoFocus`; thoát bằng **blur hoặc Enter** — [`L707-L719`](ref-ui.tsx#L707-L719).
- **Đổi đáp án đúng** (editor): click radio → `handleSetCorrectOption` set duy nhất 1 option đúng — [`L537-L544`](ref-ui.tsx#L537-L544).
- **Xoá option**: chỉ hiện khi `options.length > 2`; nếu xoá mất option đúng thì tự gán option đầu — [`L555-L562`](ref-ui.tsx#L555-L562).
- **Thêm option**: thêm cuối, text mặc định “Lựa chọn mới N”, đúng nếu danh sách đang rỗng — [`L546-L553`](ref-ui.tsx#L546-L553).
- **Xoá câu**: không confirm — [`L612-L618`](ref-ui.tsx#L612-L618).
- **[CẬP NHẬT R1 — Q-10]** **Đa đáp án**: ở editor, click checkbox toggles `isCorrect` của option **không** ép về đúng 1 (khác `handleSetCorrectOption` [`L537-L544`](ref-ui.tsx#L537-L544)); ở quiz, mỗi click toggles 1 phần tử trong `selectedOptionIds`; `onSelectOption(id)` đơn chỉ dùng cho câu 1 đáp án.
- **a11y**: `<input type="radio" class="sr-only">` với `onChange={() => {}}` và `checked` controlled ⇒ **bàn phím không thể đổi đáp án** (arrow/space kích hoạt onChange rỗng, state không đổi) — QDS-29. Không có `aria-labelledby` nối ask với options; không đánh số thứ tự bằng `<ol>`.

**(f) Ràng buộc** — Tối thiểu 2 option (chặn xoá), **không có tối đa**; không giới hạn độ dài ask/option; `scale-[1.005]` có thể gây tràn 1px khi card sát mép; mode `result` bỏ qua `showAnswer` (luôn hiện đáp án). **[CẬP NHẬT R1]** schema `Question` **không đổi** — chỉ `isCorrect` được phép đúng trên nhiều option; UI phân biệt bằng loại control (radio/checkbox), **không** thêm field mới.

> **[CẬP NHẬT đợt 3 — Q-19]:** Nhãn A/B/C/D **gán theo vị trí hiển thị** sau xáo (option đầu = A, thứ hai = B, …) — không cố định theo id option. **Màn xem lại (SCREEN-07)** hiển thị theo **thứ tự đã lưu của Attempt** (thứ tự câu + thứ tự option của phiên). **Soạn thảo (SCREEN-05)** vẫn theo **thứ tự gốc** của bộ đề; nhãn A/B/C/D ở editor cũng theo vị trí hiện tại trong editor.

### 4.33 OptionRow

**(a) Vai trò & nơi dùng** — Một hàng lựa chọn A/B/C/D trong QuestionCard; là nơi chứa toàn bộ logic “đúng/sai/đã chọn” — [`ref-ui.tsx:L622-L771`](ref-ui.tsx#L622-L771).

**UC liên quan:** UC-07, UC-10, UC-11, UC-16, UC-19, UC-21

**(b) Cấu trúc**

```
┌ div.flex.items-center.gap-3.px-3.5.py-2.5.rounded-xl.border ─────────────────┐
│  ┌ label (radio) ─┐  ┌ span “A.” ─┐  ┌ div.flex-1 text ─────────────┐  ┌ phải ┐ │
│  │  ( ) w-5 h-5    │  │ text-xs      │  │ span | input (editor)         │  │badge │ │
│  │  border + dot    │  │ font-bold    │  │                               │  │icon  │ │
│  └─────────────────┘  └──────────────┘  └──────────────────────────────┘  └───────┘ │
└──────────────────────────────────────────────────────────────────────────────────────────┘
```

**(c) Props & trạng thái** — `opt`, `index`, `mode`, `isSelected`, `showAnswer`, `onSelect`, `onSetCorrect`, `onRemove`, `onEditText`; **[CẬP NHẬT R1]** thêm prop `selectionType: 'single' | 'multi'` `[YÊU CẦU MỚI]` — quyết định render radio hay checkbox.

| Trạng thái | Biểu hiện thực tế | Ref |
|---|---|---|
| Default | Nền `bg-[#eef2f6]/70`, viền `border-white/70`, hover `bg-white/60`; radio rỗng `border-slate-400 bg-[#eef2f6] shadow-inner` | [`L634`](ref-ui.tsx#L634), [`L692`](ref-ui.tsx#L692) |
| Hover | `hover:bg-white/60` (chỉ đổi nền, không đổi viền) | [`L634`](ref-ui.tsx#L634) |
| Focus | **Không có** — radio `sr-only`, không `focus-visible` trên hàng | [`L675-L681`](ref-ui.tsx#L675-L681) |
| Active | N/A | — |
| Disabled | N/A — không có disabled | — |
| Loading | N/A | — |
| Empty | editor: text rỗng → “(Nhấn để nhập lựa chọn)” nghiêng; mode khác: chuỗi rỗng | [`L726-L728`](ref-ui.tsx#L726-L728) |
| Error | N/A | — |
| Selected | Xem ma trận 4.32; radio đặc + nền theo mode; result sai dùng rose | [`L630-L696`](ref-ui.tsx#L630-L696) |

**(d) Style chính** — `flex items-center gap-3 px-3.5 py-2.5 rounded-xl border transition-all`; radio `w-5 h-5 rounded-full border`, dot trong `w-2 h-2 rounded-full bg-white`; nhãn chữ cái `text-xs font-bold text-slate-400 w-5`; `text-sm text-[#262b33]`.

**(e) Hành vi & a11y** — Click cả hàng chỉ có tác dụng ở `mode='quiz'` ([`L652-L654`](ref-ui.tsx#L652-L654)); label radio `stopPropagation` rồi xử lý editor/quiz ([`L660-L674`](ref-ui.tsx#L660-L674)). Ở `preview`, con trỏ vẫn `cursor-pointer` trên label dù **không làm gì** — affordance sai (QDS-30). `title` đổi theo mode (“Chọn làm đáp án ĐÚNG” / “Chọn đáp án này” / rỗng). **[CẬP NHẬT R1/Q-10]** Với `selectionType='multi'`: control đổi sang `<input type="checkbox" class="sr-only">` + ô vuông tự vẽ (`rounded-md`, tick bằng icon `Check` 10px) — **không** đổi layout hàng; `title` → “Chọn các đáp án ĐÚNG”; checkbox native nhận Space nên a11y tốt hơn nhóm radio `sr-only` hiện tại (QDS-29 chỉ còn áp dụng cho câu đơn).

**(f) Ràng buộc** — Tối đa hiển thị nhãn A–Z theo `String.fromCharCode(65 + oIdx)`; > 26 option sẽ ra ký tự lạ. Text option không truncate (wrap tự nhiên); hàng cao lên theo nội dung, badge bên phải `shrink-0`.

### 4.34 InlineEditableText

**(a) Vai trò & nơi dùng** — Cơ chế sửa tại chỗ cho nội dung câu hỏi và nội dung lựa chọn ở `mode='editor'` — [`ref-ui.tsx:L578-L602`](ref-ui.tsx#L578-L602) (ask), [`L706-L730`](ref-ui.tsx#L706-L730) (option).

**UC liên quan:** UC-07

**(b) Cấu trúc**

```
ASK (textarea)                          OPTION (input)
┌ div.cursor-text.hover:bg-white/60 ─┐   ┌ div.cursor-text.hover:bg-white/80 ─┐
│  “Nội dung câu hỏi…”               │   │  “Nội dung lựa chọn…”              │
└─────────────┬─────────────────────┘   └─────────────┬────────────────────┘
              │ click                                 │ click
              ▼                                       ▼
┌ textarea autoFocus rows=2 ─────────┐   ┌ input autoFocus ─────────────────┐
│ bg-white/90 border-slate-300       │   │ bg-white border-slate-300         │
│ onBlur → thoát                     │   │ onBlur / Enter → thoát            │
└────────────────────────────────────┘   └───────────────────────────────────┘
```

**(c) Props & trạng thái** — Không tách component; hành vi nằm trong `QuestionCard` với `editingAsk` (boolean) và `editingOptId` (string | null).

| Trạng thái | Biểu hiện thực tế | Ref |
|---|---|---|
| Default | Text hiển thị như chữ thường, có `title` hướng dẫn | [`L591-L595`](ref-ui.tsx#L591-L595) |
| Hover | Nền trắng mờ `hover:bg-white/60` (ask) / `hover:bg-white/80` (option) | [`L594`](ref-ui.tsx#L594), [`L724`](ref-ui.tsx#L724) |
| Focus | Input/textarea đang sửa: `focus:outline-none focus:border-[#262b33]` (chỉ đổi viền, không ring) | [`L588`](ref-ui.tsx#L588), [`L718`](ref-ui.tsx#L718) |
| Active | N/A | — |
| Disabled | N/A | — |
| Loading | N/A | — |
| Empty | Placeholder nghiêng `slate-400`: “(Chưa có nội dung câu hỏi - Nhấn vào để nhập)” / “(Nhấn để nhập lựa chọn)” | [`L596-L600`](ref-ui.tsx#L596-L600), [`L726-L728`](ref-ui.tsx#L726-L728) |
| Error | N/A — lưu mọi keystroke, không validate | — |
| Selected | Đang edit: textarea/input thay thế hoàn toàn text (unmount) | [`L580`](ref-ui.tsx#L580), [`L707`](ref-ui.tsx#L707) |

**(d) Style chính** — View: `cursor-text p-1.5 -m-1.5 rounded-xl hover:bg-white/60` (ask) và `py-0.5 px-1.5 -mx-1.5 rounded-lg hover:bg-white/80` (option). Edit: `bg-white/90 border border-slate-300 rounded-xl p-2.5 text-sm`.

**(e) Hành vi & a11y** — Mỗi keystroke gọi `onUpdateQuestion` → cập nhật state và **serialize lại toàn bộ** JSON/TXT (`syncQuestionsToRawText`) — [`L2458-L2463`](ref-ui.tsx#L2458-L2463). Ask thoát bằng **blur** (textarea, Enter = xuống dòng); option thoát bằng **blur hoặc Enter**. Không Escape để huỷ; không có undo. Không `aria-label` (“Nhấn để sửa…” chỉ là `title`).

**(f) Ràng buộc** — Chỉ tồn tại ở `mode='editor'`; mỗi lúc chỉ 1 option được sửa (`editingOptId` đơn trị). Textarea ask `rows=2` không auto-giãn theo nội dung → phải cuộn trong ô khi câu dài.

### 4.35 AnswerBadge

**(a) Vai trò & nơi dùng** — Nhóm badge trạng thái nhỏ: “Đúng”, “Đáp án đúng”, “Vừa xong”, “Đồng bộ”. Ở editor [`ref-ui.tsx:L739-L743`](ref-ui.tsx#L739-L743), preview [`L756-L760`](ref-ui.tsx#L756-L760), result [`L2748-L2752`](ref-ui.tsx#L2748-L2752), sync hint [`L2543-L2545`](ref-ui.tsx#L2543-L2545).

**UC liên quan:** UC-07, UC-11, UC-16, UC-20, UC-21

**(b) Cấu trúc**

```
span (4 biến thể)
├── “Đúng”           px-2 py-0.5 rounded-md   bg-emerald-500/15  text-emerald-700  text-[11px]
├── “Đáp án đúng”    px-2.5 py-0.5 rounded-lg bg-emerald-600     text-white        text-xs
├── “Vừa xong”       px-2 py-0.5 rounded-md   bg-[#262b33]       text-white        text-[10px]
└── “✓ Đồng bộ”      inline flex text-emerald-600 font-bold     text-[11px]
```

**(c) Props & trạng thái** — `variant: 'correct-soft' | 'correct-solid' | 'new' | 'sync'`; không có prop size.

| Trạng thái | Biểu hiện thực tế | Ref |
|---|---|---|
| Default | Nền/ chữ theo variant, không viền | [`L740`](ref-ui.tsx#L740), [`L757`](ref-ui.tsx#L757) |
| Hover | N/A — không tương tác | — |
| Focus | N/A | — |
| Active | N/A | — |
| Disabled | N/A | — |
| Loading | N/A — không có “Đang lưu…” | — |
| Empty | Không render khi không đủ điều kiện (option không đúng) | [`L739`](ref-ui.tsx#L739) |
| Error | Không có biến thể “Sai”/“Lỗi” ở cấp badge (sai dùng icon ✗) | — |
| Selected | N/A | — |

**(d) Style chính** — `rounded-md`/`rounded-lg`, chữ 10–12px `font-bold`, nền phẳng (không neu) — badge là **ngoại lệ** của hệ nổi.

**(e) Hành vi & a11y** — Tĩnh, trang trí ngữ nghĩa; không có `role`, không `aria-label`; màu là tín hiệu chính nhưng luôn kèm chữ (“Đúng”, “Đáp án đúng”) nên không vi phạm WCAG 1.4.1.

**(f) Ràng buộc** — Luôn `shrink-0`; không đặt trong vùng `truncate`; “Đáp án đúng” chiếm ~90px nên hàng option dài có thể bị ép text.

### 4.36 EditorTitleBar

**(a) Vai trò & nơi dùng** — Thanh trên cùng SCREEN-05: nhập tên bộ đề, đếm số câu, nút Lưu — [`ref-ui.tsx:L2332-L2356`](ref-ui.tsx#L2332-L2356).

**UC liên quan:** UC-06, UC-15

**(b) Cấu trúc**

```
┌ div.neu-card.rounded-2xl.p-4.flex.flex-col.sm:flex-row.justify-between.gap-3 ┐
│ ┌ trái.flex-1.flex.gap-3 ─────────────────────────────────────────────┐ │
│ │  <FileText 20px slate-500>  [ input neu-card-inset flex-1 py-2 ]      │ │
│ └──────────────────────────────────────────────────────────────────────┘ │
│ ┌ phải.flex.gap-2.5 ────────────────────────────────────────────────┐ │
│ │  [ 42 câu ] .neu-pill px-3 py-2 rounded-xl   [💾 Lưu bộ đề]       │ │
│ └──────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

**(c) Props & trạng thái** — `title`, `questionCount`, `onTitleChange`, `onSave`.

| Trạng thái | Biểu hiện thực tế | Ref |
|---|---|---|
| Default | Input inset, chữ 14px `font-bold`, placeholder “Nhập tên bộ đề mới (Mặc định: Chưa có tiêu đề)…” | [`L2336-L2342`](ref-ui.tsx#L2336-L2342) |
| Hover | N/A | — |
| Focus | `focus:outline-none` — **mất focus ring** | [`L2341`](ref-ui.tsx#L2341) |
| Active | N/A | — |
| Disabled | N/A — Lưu không disable khi 0 câu (báo bằng toast) | [`L1025-L1028`](ref-ui.tsx#L1025-L1028) |
| Loading | N/A | — |
| Empty | Tiêu đề rỗng → khi lưu tự đặt “Chưa có tiêu đề” | [`L1029`](ref-ui.tsx#L1029) |
| Error | Ref N/A; **[CẬP NHẬT Q-15]** `[YÊU CẦU MỚI]` — tên bộ đề **unique trong cùng môn**: trùng → inline error rose-600 dưới input (“Tên bộ đề đã tồn tại trong môn này.”), chặn Lưu, ở lại editor | — |
| Selected | N/A | — |

**(d) Style chính** — `.neu-card rounded-2xl p-4`; input `w-full px-4 py-2 rounded-xl neu-card-inset text-sm font-bold`; đếm `.neu-pill px-3 py-2 rounded-xl text-xs font-bold text-slate-500`; lưu `.neu-dark-btn px-5 py-2.5`.

**(e) Hành vi & a11y** — `editingExamTitle` cập nhật mỗi keystroke; lưu tạo mới hoặc cập nhật (`isEditingExistingExam`) rồi về `examDetail` + toast ([`ref-ui.tsx:L1024-L1056`](ref-ui.tsx#L1024-L1056)). Không có chỉ báo “chưa lưu”; rời editor bằng breadcrumb sẽ **mất toàn bộ** thay đổi không cảnh báo. Input không có `<label>`.

**(f) Ràng buộc** — Chuyển `flex-col → sm:flex-row`; input co giãn, nút phải `justify-end`; tiêu đề dài không giới hạn ký tự.

### 4.37 EditorSplitPane

**(a) Vai trò & nơi dùng** — Bố cục 2 cột Render | Editor của SCREEN-05 — [`L2358-L2562`](ref-ui.tsx#L2358-L2562).

**UC liên quan:** UC-06 .. UC-15

**(b) Cấu trúc**

```
div.grid.grid-cols-1.lg:grid-cols-2.gap-6.flex-1
├── LEFT  div.neu-card.rounded-[26px].p-5.flex.flex-col.h-[640px].relative
│   ├── header.pb-3.mb-3.border-b → title + subtitle + QuestionJumpPopover(editor)
│   └── div.flex-1.overflow-y-auto.pr-1.space-y-1
│       ├── InsertQuestionGap(index 0)
│       └── QuestionCard(editor) + InsertQuestionGap(i+1) × n
└── RIGHT div.neu-card.rounded-[26px].p-5.flex.flex-col.h-[640px]
    ├── header.pb-3.mb-3.border-b → title + subtitle + FormatTabs
    ├── ParseErrorBanner (hint bar)
    └── CodeEditorTextarea (flex-1)
```

**(c) Props & trạng thái** — `questions`, `questionsRef`, `focusedId`, callbacks, `rawText`, `format`, `parseError`.

| Trạng thái | Biểu hiện thực tế | Ref |
|---|---|---|
| Default | 2 pane `h-[640px]`, cách nhau `gap-6` | [`L2359-L2361`](ref-ui.tsx#L2359-L2361) |
| Hover | Chỉ gap chèn câu hover; pane không hover | [`L2437-L2483`](ref-ui.tsx#L2437-L2483) |
| Focus | Từng control bên trong | — |
| Active | N/A | — |
| Disabled | N/A | — |
| Loading | N/A | — |
| Empty | 0 câu: chỉ còn nút “Chèn câu hỏi vào vị trí đầu” (ẩn đến khi hover) — pane trái trông trống | [`L2436-L2446`](ref-ui.tsx#L2436-L2446) |
| Error | `parseError` không đổi màu pane; chỉ hint bar đổi chữ amber | [`L2538-L2541`](ref-ui.tsx#L2538-L2541) |
| Selected | `focusedQuestionId` → ring trên QuestionCard tương ứng | [`L2454`](ref-ui.tsx#L2454) |

**(d) Style chính** — Hai card cùng `rounded-[26px] p-5 h-[640px] flex-col`; header `border-b border-slate-200/80`; vùng list `overflow-y-auto pr-1 space-y-1`.

**(e) Hành vi & a11y** — Đồng bộ **hai chiều**: sửa render → serialize ra text; sửa text → parse ra render ([`ref-ui.tsx:L879-L914`](ref-ui.tsx#L879-L914)). `h-[640px]` cố định làm pane không theo viewport — ở cửa sổ 600px cao, pane đã tràn (QDS-09). Không có divider kéo được (không phải splitter thật).

**(f) Ràng buộc** — `lg:grid-cols-2` (mỗi pane ~50%); dưới `lg` xếp dọc, tổng cao 1280px + header; không có `min-h-0` nên `flex-1` + `overflow` vẫn hoạt động nhờ chiều cao cố định.

### 4.38 FormatTabs (TXT / JSON)

**(a) Vai trò & nơi dùng** — Chuyển định dạng code ở pane phải editor — [`L2501-L2524`](ref-ui.tsx#L2501-L2524).

**UC liên quan:** UC-14

**(b) Cấu trúc**

```
┌ div.neu-card-inset.p-1.rounded-xl.flex.gap-1 ─┐
│  [ txt ]   [ json ]                            │
│  active: bg-#262b33 text-white shadow          │
│  inactive: text-slate-500 hover:text-#262b33   │
└────────────────────────────────────────────────┘
```

**(c) Props & trạng thái** — `value: 'txt' | 'json'`, `onChange`.

| Trạng thái | Biểu hiện thực tế | Ref |
|---|---|---|
| Default | Container inset `p-1 rounded-xl`; 2 nút `px-3.5 py-1 rounded-lg text-xs font-bold uppercase` | [`L2502-L2522`](ref-ui.tsx#L2502-L2522) |
| Hover | Inactive đổi màu chữ sang `#262b33` | [`L2508`](ref-ui.tsx#L2508) |
| Focus | Mặc định trình duyệt | — |
| Active | Nền `#262b33`, chữ trắng, `shadow` | [`L2507`](ref-ui.tsx#L2507) |
| Disabled | N/A | — |
| Loading | N/A | — |
| Empty | N/A | — |
| Error | N/A | — |
| Selected | `editorFormatTab === 'txt'` (mặc định là `'json'` — [`L830`](ref-ui.tsx#L830), [`L1009`](ref-ui.tsx#L1009)) | [`L2506`](ref-ui.tsx#L2506) |

**(d) Style chính** — `uppercase`, 12px, `font-bold`, active `bg-[#262b33] text-white shadow`.

**(e) Hành vi & a11y** — Chuyển tab **serialize lại từ state** (`questionsToJsonString` / `questionsToTxtString`) — [`ref-ui.tsx:L889-L897`](ref-ui.tsx#L889-L897), nên format thủ công (khoảng trắng, comment JSON) bị mất; nếu raw text đang lỗi cú pháp, phần không parse được cũng mất khi chuyển tab (QDS-32). Không `role="tab"`, không `aria-selected`. **[CẬP NHẬT R4]** Khi port, tab TXT dùng [`SyntaxHighlightedTextarea`](#459-syntaxhighlightedtextarea) (4.59) thay textarea thường; tab JSON giữ nguyên `CodeEditorTextarea`.

**(f) Ràng buộc** — 2 tab cố định, nhãn chữ thường trong code (`txt`, `json`) + `uppercase` → hiển thị “TXT”, “JSON”.

### 4.39 CodeEditorTextarea

**(a) Vai trò & nơi dùng** — Vùng nhập TXT/JSON thô, nguồn đồng bộ sang render — [`ref-ui.tsx:L2549-L2560`](ref-ui.tsx#L2549-L2560). **[CẬP NHẬT R4]** Khi port: **tab TXT** được thay bằng [`SyntaxHighlightedTextarea`](#459-syntaxhighlightedtextarea) (4.59 — tô `ask` đỏ, `ans.`/`ans.*` xanh); component này còn nguyên giá trị cho **tab JSON** (không tô màu).

**UC liên quan:** UC-12, UC-13

**(b) Cấu trúc**

```
┌ textarea.flex-1.w-full.p-4.rounded-2xl.neu-card-inset.font-mono ─┐
│  text-xs sm:text-sm  leading-relaxed  resize-none               │
│  spellCheck=false   focus:outline-none                          │
│  placeholder: mẫu TXT hoặc mẫu JSON (đa dòng)                   │
└─────────────────────────────────────────────────────────────────┘
```

**(c) Props & trạng thái** — `value`, `format`, `onChange`, `placeholder`.

| Trạng thái | Biểu hiện thực tế | Ref |
|---|---|---|
| Default | Inset, mono 12–14px, `leading-relaxed`, cao `flex-1` | [`L2559`](ref-ui.tsx#L2559) |
| Hover | N/A | — |
| Focus | `focus:outline-none` — **không có bất kỳ dấu hiệu focus** | [`L2559`](ref-ui.tsx#L2559) |
| Active | N/A | — |
| Disabled | N/A | — |
| Loading | N/A | — |
| Empty | Placeholder mẫu: TXT 5 dòng `ask :`/`ans.`/`ans.*`; JSON object mảng có tab | [`L2554-L2558`](ref-ui.tsx#L2554-L2558) |
| Error | Không đổi style; lỗi hiện ở ParseErrorBanner | [`L911-L913`](ref-ui.tsx#L911-L913) |
| Selected | N/A | — |

**(d) Style chính** — `p-4 rounded-2xl neu-card-inset font-mono text-xs sm:text-sm leading-relaxed resize-none`.

**(e) Hành vi & a11y** — Parse **mỗi keystroke** ([`L899-L914`](ref-ui.tsx#L899-L914)): JSON dùng `JSON.parse` trong try/catch → khi gõ dở, render giữ dữ liệu cũ và bật cờ lỗi. `spellCheck={false}` (tốt). Tab không chèn indent (chuyển focus); không có line number, không syntax highlight, không auto-indent. Không có `aria-invalid`, không `aria-describedby` tới thông báo lỗi. **[CẬP NHẬT R4]** Highlight TXT dùng overlay `<pre>` dưới textarea trong suốt (xem [4.59](#459-syntaxhighlightedtextarea)) — không đổi bản chất control; bắt buộc bổ sung `aria-invalid` + `aria-describedby` khi có lỗi dòng.

**(f) Ràng buộc** — `resize-none` cố định trong pane; nội dung dài cuộn dọc; JSON lỗi không chặn lưu (chỉ chặn khi `editorQuestions` rỗng) — QDS-33.

### 4.40 ParseErrorBanner

**(a) Vai trò & nơi dùng** — Thanh trạng thái cú pháp phía trên textarea: gợi ý cú pháp bên trái + trạng thái đồng bộ/lỗi bên phải — [`ref-ui.tsx:L2526-L2547`](ref-ui.tsx#L2526-L2547). **[CẬP NHẬT R4]** Đợt 2 mở rộng: validate TXT sinh **lỗi theo dòng** (mỗi câu cần ≥ 2 lựa chọn và ≥ 1 đáp án đúng — hợp đồng TXT đợt 1); banner liệt kê dạng “Dòng 12: câu hỏi chỉ có 1 lựa chọn. | Dòng 20: thiếu đáp án đúng (cần ≥ 1 `ans.*`).”; thêm `aria-live="polite"`; các dòng lỗi được tô nền trong [`SyntaxHighlightedTextarea`](#459-syntaxhighlightedtextarea) (`bg-rose-500/10` `[GIẢ ĐỊNH]` — QDS-46).

**UC liên quan:** UC-12, UC-13

**(b) Cấu trúc**

```
┌ div.mb-2.5.px-3.py-2.rounded-xl.bg-white/50.text-[11px].text-slate-500.flex.justify-between ┐
│ trái:  “Cú pháp:  ask : …  |  ans. Sai  |  ans.* Đúng”   (hoặc mẫu JSON)                 │
│ phải:  parseError ? “Đang chờ cú pháp chuẩn…” (amber-600)                                 │
│                    : “✓ Đồng bộ” (emerald-600)                                            │
└─────────────────────────────────────────────────────────────────────────────────────────────┘
```

**(c) Props & trạng thái** — `format`, `parseError: string | null`.

| Trạng thái | Biểu hiện thực tế | Ref |
|---|---|---|
| Default | Nền `bg-white/50`, chữ 11px `slate-500`, mã cú pháp trong `<code>` | [`L2527-L2537`](ref-ui.tsx#L2527-L2537) |
| Hover | N/A | — |
| Focus | N/A | — |
| Active | N/A | — |
| Disabled | N/A | — |
| Loading | N/A | — |
| Empty | N/A — luôn có gợi ý cú pháp | — |
| Error | Chỉ đổi **chữ phải** sang `text-amber-600 font-bold` “Đang chờ cú pháp chuẩn...”; **không** đổi nền/viền, **không** hiện `parseError.message` — **[CẬP NHẬT R4]** bản port liệt kê nội dung lỗi theo dòng + `role="status"` | [`L2538-L2541`](ref-ui.tsx#L2538-L2541) |
| Selected | N/A | — |

**(d) Style chính** — `bg-white/50 rounded-xl px-3 py-2 text-[11px]`; trạng thái OK `text-emerald-600 font-bold` + icon `Check` 12px.

**(e) Hành vi & a11y** — Đây **không** phải banner lỗi thực thụ: không `role="alert"`, màu amber trên trắng chỉ ~2.7:1, và thông điệp không nói lỗi ở đâu. `parseError` (message từ `JSON.parse`) bị bỏ qua hoàn toàn — QDS-31. Trạng thái “Đồng bộ” hiện cả khi JSON hợp lệ nhưng rỗng mảng. **[CẬP NHẬT R4]** Khi port bắt buộc: hiện thông điệp lỗi tóm tắt theo dòng (đóng một phần QDS-31), thêm `role="status" aria-live="polite"`, và chạy bảng validate TXT (≥2 lựa chọn, ≥1 `ans.*`); lỗi validate **không** chặn gõ nhưng **chặn Lưu** cùng nhóm với BR-08 (cần ≥1 câu hợp lệ).

**(f) Ràng buộc** — Một dòng `flex justify-between`; chuỗi cú pháp TXT dài (~340px) có thể chèn ép phần trạng thái ở pane hẹp; mẫu JSON dùng template string trong `<code>` nên không wrap đẹp.

### 4.41 InsertQuestionGap

**(a) Vai trò & nơi dùng** — Vùng chèn câu hỏi bằng hover giữa các câu (và ở đầu danh sách) trong pane Render — [`ref-ui.tsx:L2436-L2483`](ref-ui.tsx#L2436-L2483).

**UC liên quan:** UC-08

**(b) Cấu trúc**

```
ĐẦU DANH SÁCH (variant "top")
 div.group.py-1.5.flex.justify-center
 └── button.opacity-0.group-hover:opacity-100  [ + Chèn câu hỏi vào vị trí đầu ]

GIỮA 2 CÂU (variant "between")
 div.group.py-2.flex.center.relative
 ├── div.w-full.border-t.border-dashed.transparent → hover:border-slate-300
 └── button.absolute.opacity-0.group-hover:opacity-100  [ + Chèn câu mới tại đây ]
```

**(c) Props & trạng thái** — `insertIndex`, `onInsert`.

| Trạng thái | Biểu hiện thực tế | Ref |
|---|---|---|
| Default | Nút **ẩn hoàn toàn** (`opacity-0`), chỉ còn khoảng trống 12–16px | [`L2440`](ref-ui.tsx#L2440), [`L2477`](ref-ui.tsx#L2477) |
| Hover | Vùng cha `group` hover → nút `opacity-100`; variant between: đường nét đứt hiện `slate-300`; nút `hover:scale-105` | [`L2474`](ref-ui.tsx#L2474), [`L2477`](ref-ui.tsx#L2477) |
| Focus | `focus:opacity-100` — tab tới sẽ hiện nút (không `focus-visible`) | [`L2440`](ref-ui.tsx#L2440) |
| Active | N/A | — |
| Disabled | N/A | — |
| Loading | N/A | — |
| Empty | Danh sách 0 câu: chỉ còn nút “chèn vào vị trí đầu” (vẫn ẩn đến hover) | [`L2436-L2446`](ref-ui.tsx#L2436-L2446) |
| Error | N/A | — |
| Selected | N/A | — |

**(d) Style chính** — Nút `px-3 py-1 rounded-full bg-[#262b33] text-white text-[11px] font-bold shadow(-md)`; transition `all 200ms`; đường kẻ `border-t border-dashed`.

**(e) Hành vi & a11y** — Click → `handleInsertQuestionAt(index)`: tạo câu mặc định (ask `Câu hỏi mới #N`, 4 option với B đúng), chèn vào vị trí, set focus và `scrollIntoView({ behavior:'smooth', block:'center' })` sau 80ms — [`ref-ui.tsx:L916-L935`](ref-ui.tsx#L916-L935). Không có drag & drop thực sự (chỉ hover-insert) (QDS-34). Nút ẩn có thể khiến người dùng bàn phím không biết có tồn tại — `focus:opacity-100` giúp nhưng không có nhãn thường trực.

**(f) Ràng buộc** — Vùng hover cao 12–16px, dễ trượt chuột; khi có nhiều câu, khoảng cách `space-y-1` + gap làm vùng chèn khá sát nội dung.

### 4.42 QuestionJumpPopover (editor) — OVL-03

**(a) Vai trò & nơi dùng** — Popover “All (n)” liệt kê toàn bộ câu hỏi để nhảy nhanh, neo vào header pane Render — [`L2372-L2431`](ref-ui.tsx#L2372-L2431). **[CẬP NHẬT R3]** Khi port: **bỏ hình thức popover**, gộp cùng bản quiz thành **một** component [`QuestionNavigatorDialog`](#456-questionnavigatordialog) ([4.56](#456-questionnavigatordialog)) — **variant `editor`**; mã 4.42 / OVL-03 giữ nguyên để truy vết ref.

**UC liên quan:** UC-08 (OVL-03)

**(b) Cấu trúc**

```
┌ div.relative ──────────────────────────────────────────────┐
│  [▤ All (42)] .neu-pill px-3.5 py-1.5 rounded-xl           │
│  ┌ div.absolute.right-0.mt-2.w-72.max-h-80.overflow-y-auto ┐│
│  │ .neu-shell.rounded-2xl.p-3.5.z-30.shadow-2xl.border-white││
│  │  “Danh sách câu hỏi (42)”                        [X]    ││
│  │  grid.grid-cols-4.gap-2  → [Câu 1][Câu 2]…[Câu 42]     ││
│  │  ─────────────────────────────────────────────────     ││
│  │  #1  Nội dung câu hỏi… (truncate)                       ││
│  │  #2  …                                                  ││
│  └─────────────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────────┘
```

**(c) Props & trạng thái** — `open`, `questions`, `onSelect(id)`, `onClose`.

| Trạng thái | Biểu hiện thực tế | Ref |
|---|---|---|
| Default | Panel `w-72`, nền `.neu-shell`, `z-30`, đổ bóng `shadow-2xl` | [`L2386`](ref-ui.tsx#L2386) |
| Hover | Nút số: `hover:bg-[#262b33] hover:text-white`; dòng list: `hover:bg-white/80` | [`L2405`](ref-ui.tsx#L2405), [`L2418`](ref-ui.tsx#L2418) |
| Focus | Mặc định trình duyệt | — |
| Active | N/A | — |
| Disabled | N/A | — |
| Loading | N/A | — |
| Empty | 0 câu: grid rỗng, list rỗng — không có thông báo | [`L2398-L2428`](ref-ui.tsx#L2398-L2428) |
| Error | N/A | — |
| Selected | Không có trạng thái “đang ở câu X” — mọi ô giống nhau | [`L2399-L2409`](ref-ui.tsx#L2399-L2409) |

**(d) Style chính** — `.neu-shell rounded-2xl p-3.5`, `max-h-80 overflow-y-auto` (cuộn 6px), grid `grid-cols-4 gap-2`, nút `neu-pill py-1.5 rounded-lg text-xs font-bold`.

**(e) Hành vi & a11y** — Mở/đóng bằng nút “All (n)” (toggle). Chọn → `handleFocusQuestionFromAllDialog`: đóng popover, focus câu, scroll smooth, bỏ highlight sau 2200ms — [`ref-ui.tsx:L937-L946`](ref-ui.tsx#L937-L946). **Không đóng** khi click ra ngoài hay Escape (QDS-35). Không `role="dialog"`, không `aria-expanded` trên nút mở.

**(f) Ràng buộc** — `right-0` neo theo header nên không tràn phải; `max-h-80` = 320px; nhiều câu → 2 vùng cuộn lồng nhau (grid + list) trong cùng panel.

### 4.43 QuizControlBar

**(a) Vai trò & nơi dùng** — Thanh điều khiển sticky khi làm bài: đồng hồ, tiến độ, All, Nộp bài — [`L2571-L2646`](ref-ui.tsx#L2571-L2646). **[CẬP NHẬT R3/R1]** Khi port: nút “All (n)” thành nút **“Danh sách câu”** mở [`QuestionNavigatorDialog`](#456-questionnavigatordialog) (bản quiz); nút “Nộp bài” mở [`SubmitWarningDialog`](#457-submitwarningdialog) (Q-11) khi còn câu trống.

**UC liên quan:** UC-19, UC-20

**(b) Cấu trúc**

```
┌ div.neu-card.rounded-2xl.p-4.sm:p-5.sticky.top-2.z-20.flex.flex-wrap.justify-between.gap-4 ┐
│ ┌ trái.flex.gap-4 ─────────────────────┐  ┌ phải.flex.gap-3.relative ──────────────┐ │
│ │ [🕐 12:34] .neu-pill px-4 py-2        │  │ [▤ All (25)]  [✔ Nộp bài] .neu-dark-btn │ │
│ │ div: “Đã chọn: 7 / 25 câu”            │  │           └── QuestionJumpPopover(quiz)│ │
│ │      ▓▓▓▓▓░░░░░░ w-36 sm:w-48 h-2    │  └──────────────────────────────────────────┘ │
│ └───────────────────────────────────────┘                                                │
└────────────────────────────────────────────────────────────────────────────────────────────┘
```

**(c) Props & trạng thái** — `elapsedSec`, `answeredCount`, `total`, `onOpenAll`, `onSubmit`.

| Trạng thái | Biểu hiện thực tế | Ref |
|---|---|---|
| Default | `sticky top-2 z-20`, nền `.neu-card`, padding 16–20px | [`L2572`](ref-ui.tsx#L2572) |
| Hover | Chỉ nút con (`.neu-pill`, `.neu-dark-btn`) | — |
| Focus | Mặc định | — |
| Active | N/A | — |
| Disabled | N/A — “Nộp bài” luôn bật dù 0/25 câu | [`L2639`](ref-ui.tsx#L2639) |
| Loading | N/A | — |
| Empty | `0 / 25` → progress 0%; timer vẫn chạy | [`L2590-L2596`](ref-ui.tsx#L2590-L2596) |
| Error | N/A | — |
| Selected | N/A | — |

**(d) Style chính** — `.neu-card rounded-2xl p-4 sm:p-5`, `flex flex-wrap items-center justify-between gap-4`, `sticky top-2 z-20`; đồng hồ `.neu-pill px-4 py-2 rounded-xl text-sm font-bold`; thanh tiến độ `h-2 rounded-full bg-slate-200` + fill `bg-[#262b33]`; nút nộp `.neu-dark-btn px-6 py-2.5`.

**(e) Hành vi & a11y** — Đồng hồ đếm **tăng** từ `quizStartTime`, cập nhật mỗi 1s ([`L856-L862`](ref-ui.tsx#L856-L862)); không giới hạn thời gian, không auto-submit. Nộp bài không xác nhận, không chặn câu chưa trả lời; kết quả `(đúng/tổng)*10` làm tròn 1 chữ số ([`ref-ui.tsx:L1116-L1127`](ref-ui.tsx#L1116-L1127)). Không `aria-live` cho đồng hồ (tránh ồn — hợp lý) nhưng cũng không có nhãn “thời gian đã làm”. **[CẬP NHẬT R3/R1]** Port: (1) “Nộp bài” → nếu `answeredCount < total` mở [`SubmitWarningDialog`](#457-submitwarningdialog) liệt kê số thứ tự câu trống + 2 nút “Quay lại làm tiếp” / “Vẫn nộp” (Q-11 — QDS-43 đóng); đã làm hết thì nộp trực tiếp `[GIẢ ĐỊNH]`; (2) đồng hồ hiển thị `mm:ss`; (3) mọi mốc thời gian hiển thị theo `Asia/Ho_Chi_Minh` (Q-06).

**(f) Ràng buộc** — `sticky top-2` trong `<main>` có padding → dải dính cách mép trên 8px; `flex-wrap` làm 2 nhóm xuống dòng ở cửa sổ hẹp; progress cố định `w-36 sm:w-48`.

### 4.44 QuizProgress

**(a) Vai trò & nơi dùng** — Cụm văn bản + thanh tiến độ trong QuizControlBar — [`L2581-L2598`](ref-ui.tsx#L2581-L2598).

**UC liên quan:** UC-19

**(b) Cấu trúc**

```
div
├── p.text-xs.font-bold  “Đã chọn: 7 / 25 câu”
└── div.w-36.sm:w-48.h-2.rounded-full.bg-slate-200.overflow-hidden.mt-1
     └── div.h-full.bg-[#262b33].transition-all  (style width %)
```

**(c) Props & trạng thái** — `answered`, `total`.

| Trạng thái | Biểu hiện thực tế | Ref |
|---|---|---|
| Default | Track `slate-200` 8px, fill than chì, rộng 144px (mobile) / 192px (sm) | [`L2586`](ref-ui.tsx#L2586) |
| Hover | N/A | — |
| Focus | N/A | — |
| Active | Fill đổi chiều rộng với `transition-all` (150ms mặc định) | [`L2588`](ref-ui.tsx#L2588) |
| Disabled | N/A | — |
| Loading | N/A | — |
| Empty | `0 / 25` → width 0% (track trống) | [`ref-ui.tsx:L2590-L2594`](ref-ui.tsx#L2590-L2594) |
| Error | N/A | — |
| Selected | N/A | — |

**(d) Style chính** — `h-2 rounded-full bg-slate-200 overflow-hidden`; fill `bg-[#262b33]`.

**(e) Hành vi & a11y** — Không phải `<progress>`; không `role="progressbar"`, không `aria-valuenow`. `Math.max(1, total)` tránh chia 0.

**(f) Ràng buộc** — Văn bản “Đã chọn: N / M câu” và thanh cùng khối; số > 99 vẫn vừa; không hiển thị %.

### 4.45 QuestionJumpPopover (quiz) — OVL-04

**(a) Vai trò & nơi dùng** — Lưới số câu để nhảy nhanh khi làm bài, đánh dấu câu đã trả lời — [`ref-ui.tsx:L2601-L2636`](ref-ui.tsx#L2601-L2636). **[CẬP NHẬT R3]** Khi port: nâng cấp thành **dialog đầy đủ** (backdrop + Escape + focus trap) — cùng component [`QuestionNavigatorDialog`](#456-questionnavigatordialog) với **variant `quiz`**; mã 4.45 / OVL-04 giữ để truy vết ref. So với bản editor: hiển thị trạng thái **đã làm / chưa làm / câu hiện tại** + cờ đánh dấu câu `[YÊU CẦU MỚI]`, không kèm danh sách text trích.

**UC liên quan:** UC-19 (OVL-04)

**(b) Cấu trúc**

```
┌ div.relative ──────────────────────────────────────────────┐
│  [▤ All (25)] .neu-pill px-4 py-2.rounded-xl                │
│  ┌ div.absolute.right-28.top-12.w-64.neu-shell ───────────┐ │
│  │  “Chuyển nhanh đến câu:” (text-xs bold)                 │ │
│  │  grid.grid-cols-5.gap-1.5.max-h-56.overflow-y-auto      │ │
│  │   [1■][2 ][3■][4 ][5 ]   ■ = đã trả lời (nền than chì) │ │
│  │   [6 ][7■]…                                              │ │
│  └──────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

**(c) Props & trạng thái** — `open`, `questions`, `answers: Record<qid, optId>`, `onSelect`.

| Trạng thái | Biểu hiện thực tế | Ref |
|---|---|---|
| Default | Panel 256px, `right-28 top-12`, `z-30`, `shadow-xl` | [`L2611`](ref-ui.tsx#L2611) |
| Hover | Không có hover riêng cho ô số | [`L2619-L2632`](ref-ui.tsx#L2619-L2632) |
| Focus | Mặc định | — |
| Active | N/A | — |
| Disabled | N/A | — |
| Loading | N/A | — |
| Empty | 0 câu → lưới rỗng (không xảy ra vì quiz cần ≥1) | — |
| Error | N/A | — |
| Selected (đã trả lời) | Ô `bg-[#262b33] text-white`; chưa trả lời → `.neu-pill text-slate-600` | [`L2624-L2628`](ref-ui.tsx#L2624-L2628) |

**(d) Style chính** — `.neu-shell rounded-2xl p-3.5`, `w-64`, `grid-cols-5 gap-1.5`, ô `py-1.5 rounded-lg text-xs font-bold`.

**(e) Hành vi & a11y** — Chọn → đóng cả 2 popover, scroll + highlight 2.2s (dùng chung `handleFocusQuestionFromAllDialog`). Chỉ phân biệt “đã trả lời” bằng **màu**, không có ký hiệu khác (QDS-36). Không đóng khi click ngoài/Escape.

**(f) Ràng buộc** — `right-28` (112px) + `top-12` là offset cứng để né nút Nộp bài → ở cửa sổ hẹp panel có thể tràn trái; `max-h-56` (224px) cho ~8 hàng.

### 4.46 ScoreBanner

**(a) Vai trò & nơi dùng** — Banner tổng kết điểm ở SCREEN-07: vòng điểm hệ 10 + thông tin + 2 hành động — [`ref-ui.tsx:L2678-L2725`](ref-ui.tsx#L2678-L2725).

**UC liên quan:** UC-20, UC-22

**(b) Cấu trúc**

```
┌ div.neu-card.rounded-[28px].p-6.sm:p-8.flex.flex-col.md:flex-row.items-center.justify-between.gap-6 ┐
│ ┌ trái.flex.gap-5 ──────────────────────┐  ┌ phải.flex.gap-3 ────────────────────┐ │
│ │   ╭───────╮   [Hoàn thành bài kiểm tra] │  │ [← Về tổng quan đề]  [↺ Làm lại đề]  │ │
│ │   │  9.2  │   h2 Tên bộ đề             │  │  .neu-pill            .neu-dark-btn  │ │
│ │   │ ĐIỂM/10│  “Trả lời đúng 23/25 câu…”  │  └──────────────────────────────────────┘ │
│ │   ╰───────╯   (vòng 96px, border-4)   │                                          │
│ └──────────────────────────────────────┘                                          │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

**(c) Props & trạng thái** — `result: { score, examTitle, correctCount, totalQuestions, durationSec }`, `onBack`, `onRetry`.

| Trạng thái | Biểu hiện thực tế | Ref |
|---|---|---|
| Default | Card `[28px] p-6 sm:p-8`; vòng 96px `.neu-pill` + `border-4 border-[#262b33]` | [`L2679-L2688`](ref-ui.tsx#L2679-L2688) |
| Hover | Chỉ 2 nút | — |
| Focus | Mặc định | — |
| Active | N/A | — |
| Disabled | N/A | — |
| Loading | N/A — kết quả tính đồng bộ khi nộp | — |
| Empty | Không thể 0 câu (quiz cần ≥1); điểm 0.0 vẫn hiện bình thường | — |
| Error | N/A | — |
| Selected | Badge “Hoàn thành bài kiểm tra” luôn hiện, **không đổi theo điểm** (kể cả 0 điểm vẫn xanh) | [`L2690-L2692`](ref-ui.tsx#L2690-L2692) |

**(d) Style chính** — `rounded-[28px] p-6 sm:p-8`; vòng `w-24 h-24 rounded-full neu-pill border-4 border-[#262b33]`; score `text-2xl font-bold`; nhãn `text-[10px] font-bold uppercase text-slate-400`; badge `.neu-pill text-emerald-700`.

**(e) Hành vi & a11y** — “Làm lại đề” mở lại **modal config** (không dùng lại số câu cũ — input giữ giá trị trước đó); “Về tổng quan đề” về `examDetail`. Không có chia sẻ/xuất. Vòng điểm không có `role="img"`/`aria-label`; số điểm đọc được dạng text.

**(f) Ràng buộc** — `md:flex-row`; dưới `md` xếp dọc, vòng điểm ở trên; thời gian hiển thị bằng **giây** thô (`durationSec`) không format phút:giây (QDS-37).

### 4.47 ResultHistoryRow

**(a) Vai trò & nơi dùng** — Dòng lịch sử trong SCREEN-07, làm nổi lượt vừa làm — [`ref-ui.tsx:L2733-L2762`](ref-ui.tsx#L2733-L2762).

**UC liên quan:** UC-20, UC-22

**(b) Cấu trúc**

```
LƯỢT VỪA XONG                            LƯỢT CŨ
┌ bg-white.border.#262b33/30.shadow-sm ┐  ┌ .neu-card-inset.text-slate-600 ─────┐
│ #3  2026-10-23 21:05  [Vừa xong]      │  │ #2  2026-10-21 15:10                 │
│ Đúng 20/25 câu        8.0 điểm        │  │ Đúng 26/32 câu       8.1 điểm        │
└───────────────────────────────────────┘  └──────────────────────────────────────┘
```

**(c) Props & trạng thái** — `attempt`, `index`, `isLatest`.

| Trạng thái | Biểu hiện thực tế | Ref |
|---|---|---|
| Default | `px-4 py-3 rounded-xl flex justify-between text-xs sm:text-sm`; cũ dùng inset | [`L2739-L2743`](ref-ui.tsx#L2739-L2743) |
| Hover | Không có | — |
| Focus | N/A | — |
| Active | N/A | — |
| Disabled | N/A | — |
| Loading | N/A | — |
| Empty | Không render (danh sách rỗng) | — |
| Error | N/A | — |
| Selected (`isLatest`) | Nền trắng, `font-bold`, viền `#262b33/30`, `shadow-sm`, badge “Vừa xong” `bg-#262b33 text-white text-[10px]` | [`ref-ui.tsx:L2740-L2752`](ref-ui.tsx#L2740-L2752) |

**(d) Style chính** — `rounded-xl px-4 py-3`; badge `px-2 py-0.5 rounded-md`; số điểm `font-bold text-[#1e232a]`.

**(e) Hành vi & a11y** — Tĩnh, không click để xem lại lượt cũ (QDS-24). So sánh bằng `att.id === lastQuizResult.id` nên chỉ đúng ngay sau khi nộp.

**(f) Ràng buộc** — 3 cụm `justify-between`; timestamp dài + badge có thể chèn ép ở <400px.

### 4.48 ResultReviewRow

**(a) Vai trò & nơi dùng** — Hàng xem lại đáp án trong SCREEN-07: là `QuestionCard mode="result"` + `OptionRow` với luật màu riêng — [`L2765-L2779`](ref-ui.tsx#L2765-L2779), luật màu [`L641-L647`](ref-ui.tsx#L641-L647).

**UC liên quan:** UC-21

**(b) Cấu trúc**

```
QuestionCard(mode=result, selectedOptionId)
├── [Câu n]  Nội dung câu hỏi
├── OptionRow đúng   → nền emerald + ✓ CheckCircle2 emerald-600
├── OptionRow đã chọn & sai → nền rose + ✗ XCircle rose-600
└── OptionRow khác   → nền base, radio rỗng
```

**(c) Props & trạng thái** — `question`, `selectedOptionId`; không có callback (read-only).

| Trạng thái | Biểu hiện thực tế | Ref |
|---|---|---|
| Default | Câu + các option, đáp án đúng luôn hiện | [`L2770-L2778`](ref-ui.tsx#L2770-L2778) |
| Hover | Option `hover:bg-white/60` (vẫn không bấm được) | [`L634`](ref-ui.tsx#L634) |
| Focus | N/A | — |
| Active | N/A | — |
| Disabled | N/A | — |
| Loading | N/A | — |
| Empty | Câu rỗng → “(Câu hỏi trống)”; câu không chọn → không có option nào tô màu, chỉ option đúng xanh | [`L606`](ref-ui.tsx#L606) |
| Error | Không có nhãn “Bạn chọn sai” — chỉ icon ✗ | [`L765-L767`](ref-ui.tsx#L765-L767) |
| Selected | `selectedOptionId` quyết định hàng rose; đúng luôn emerald bất kể chọn | [`ref-ui.tsx:L628-L647`](ref-ui.tsx#L628-L647) |

**(d) Style chính** — Emerald `bg-emerald-50/90 border-emerald-400`, rose `bg-rose-50/90 border-rose-400`; icon 16px `shrink-0`.

**(e) Hành vi & a11y** — Không tương tác (đúng). Không có chú thích “Đáp án của bạn” / “Đáp án đúng” dạng chữ → người mù màu chỉ thấy ✓/✗ (vẫn đủ). Không hiển thị giải thích đáp án.

**(f) Ràng buộc** — Không có phân trang; 40 câu → 40 card dài; không có nút “Thu gọn đáp án đúng”.

### 4.49 GuideStepCard

**(a) Vai trò & nơi dùng** — 3 thẻ hướng dẫn từng bước ở SCREEN-08 — [`ref-ui.tsx:L2805-L2867`](ref-ui.tsx#L2805-L2867).

**UC liên quan:** UC-23

**(b) Cấu trúc**

```
┌ grid.grid-cols-1.md:grid-cols-3.gap-4.pt-2 ─────────────────────────────┐
│ ┌ .neu-card-inset.p-4.rounded-2xl.space-y-2 ┐  (×3)                    │
│ │ [Bước 1 • Truy cập AI] .neu-pill          │                          │
│ │ Mở các nền tảng AI… Google Gemini ↗ ,     │                          │
│ │ ChatGPT ↗ hoặc Claude AI ↗               │                          │
│ └────────────────────────────────────────────┘                          │
└─────────────────────────────────────────────────────────────────────────┘
```

**(c) Props & trạng thái** — `step: 1|2|3`, `title`, `children`; bước 1 có links, bước 3 có inline button.

| Trạng thái | Biểu hiện thực tế | Ref |
|---|---|---|
| Default | Inset `p-4 rounded-2xl`, badge pill 12px, body 12–14px `slate-600 leading-relaxed` | [`L2807-L2811`](ref-ui.tsx#L2807-L2811) |
| Hover | Chỉ link: `hover:text-blue-600` + underline luôn bật | [`L2817`](ref-ui.tsx#L2817) |
| Focus | Mặc định trình duyệt (link/button) | — |
| Active | N/A | — |
| Disabled | N/A | — |
| Loading | N/A | — |
| Empty | N/A — nội dung tĩnh | — |
| Error | N/A | — |
| Selected | N/A | — |

**(d) Style chính** — `.neu-card-inset p-4 rounded-2xl space-y-2`; badge `.neu-pill px-2.5 py-1 rounded-lg text-xs font-bold`; link `font-bold text-[#1e232a] underline inline-flex items-center gap-0.5`.

**(e) Hành vi & a11y** — Link ngoài `target="_blank" rel="noreferrer"` (thiếu `noopener` tường minh nhưng `noreferrer` bao hàm). Bước 3 có `<button>` “Đề kiểm tra” chuyển tab (không phải link — đúng vì không đổi URL). Không đánh số bằng `<ol>`.

**(f) Ràng buộc** — 3 cột ở `md`; body chứa `<strong>` và link dài, có thể xuống 4–5 dòng; không cắt bớt.

### 4.50 PromptBox

**(a) Vai trò & nơi dùng** — Khối hiển thị nguyên văn prompt AI cố định — [`ref-ui.tsx:L2892-L2894`](ref-ui.tsx#L2892-L2894); nội dung [`L468-L500`](ref-ui.tsx#L468-L500).

**UC liên quan:** UC-23

**(b) Cấu trúc**

```
┌ pre.neu-card-inset.p-5.rounded-2xl ────────────────────────────┐
│ font-mono text-xs sm:text-sm whitespace-pre-wrap                │
│ leading-relaxed overflow-x-auto                                 │
│ “Bạn là một chuyên gia biên soạn đề kiểm tra…”                  │
│ [mảng JSON mẫu + quy tắc TXT]                                  │
└─────────────────────────────────────────────────────────────────┘
```

**(c) Props & trạng thái** — `children` (chuỗi `FIXED_AI_PROMPT`); không có prop format.

| Trạng thái | Biểu hiện thực tế | Ref |
|---|---|---|
| Default | Inset, mono 12–14px, `whitespace-pre-wrap`, padding 20px | [`L2892`](ref-ui.tsx#L2892) |
| Hover | N/A | — |
| Focus | Không focus được (không `tabIndex`) | — |
| Active | N/A | — |
| Disabled | N/A | — |
| Loading | N/A | — |
| Empty | N/A — chuỗi hằng | — |
| Error | N/A | — |
| Selected | Chọn text được (trình duyệt mặc định), không có nút “chọn tất cả” | — |

**(d) Style chính** — `pre` + `neu-card-inset p-5 rounded-2xl font-mono text-xs sm:text-sm whitespace-pre-wrap leading-relaxed overflow-x-auto`.

**(e) Hành vi & a11y** — Nội dung chỉ đọc. `overflow-x-auto` gần như vô dụng vì đã `pre-wrap` (không tràn ngang trừ token rất dài). Không có `aria-label` cho vùng.

**(f) Ràng buộc** — Prompt dài ~33 dòng → chiếm nhiều chiều cao; không thu gọn được; nếu dịch/nội dung dài hơn sẽ đẩy nút copy ra khỏi màn hình đầu.

### 4.51 CopyPromptButton

**(a) Vai trò & nơi dùng** — Nút “Sao chép Prompt” ở header section PromptBox — [`ref-ui.tsx:L2883-L2889`](ref-ui.tsx#L2883-L2889); handler [`L1240-L1249`](ref-ui.tsx#L1240-L1249).

**UC liên quan:** UC-23

**(b) Cấu trúc**

```
button.neu-dark-btn.px-5.py-2.5.rounded-xl.text-xs.sm:text-sm.font-bold
└── <Copy w-4 h-4 />  “Sao chép Prompt”
```

**(c) Props & trạng thái** — `onCopy`, `label`.

| Trạng thái | Biểu hiện thực tế | Ref |
|---|---|---|
| Default | Nút tối, icon Copy + nhãn | [`L2885-L2888`](ref-ui.tsx#L2885-L2888) |
| Hover | `brightness(1.08)` + `translateY(-1px)` | [`L1314-L1317`](ref-ui.tsx#L1314-L1317) |
| Focus | Mặc định | — |
| Active | Không có phản hồi nhấn | — |
| Disabled | N/A | — |
| Loading | N/A | — |
| Empty | N/A | — |
| Error | **Không có** — copy thất bại vẫn báo thành công | [`L1246-L1248`](ref-ui.tsx#L1246-L1248) |
| Selected | Không đổi nhãn/icon sang “Đã sao chép” — chỉ toast | — |

**(d) Style chính** — `.neu-dark-btn px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2`.

**(e) Hành vi & a11y** — Dùng `document.execCommand('copy')` với `<textarea>` ẩn (API **deprecated**), không dùng `navigator.clipboard` — QDS-38. Không `await`, không xử lý reject. Toast “Đã sao chép Prompt JSON vào bộ nhớ tạm!” luôn hiện ngay.

**(f) Ràng buộc** — Ở Tauri/webview `execCommand` vẫn chạy nhưng có thể bị chặn bởi quyền clipboard trên một số nền tảng; không có fallback hiển thị prompt để copy tay.

### 4.52 ModalShell

**(a) Vai trò & nơi dùng** — Pattern vỏ modal (backdrop + panel) — **không** tồn tại dạng component trong ref, chỉ có 1 instance inline ở OVL-02 — [`ref-ui.tsx:L2903-L2905`](ref-ui.tsx#L2903-L2905).

**UC liên quan:** dùng chung — UC-18, UC-22 (OVL-02)

**(b) Cấu trúc**

```
┌ div.fixed.inset-0.z-50.bg-slate-900/35.backdrop-blur-xs.flex.center.p-4 ┐
│   ┌ div.neu-shell.rounded-[28px].max-w-md.w-full.p-6.space-y-5 ──────┐  │
│   │  (nội dung modal)                                                 │  │
│   └───────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────┘
```

**(c) Props & trạng thái** — Đề xuất `open`, `onClose`, `title`, `size: 'md'`, `children`, `footer` (chưa có trong ref — QDS-39).

| Trạng thái | Biểu hiện thực tế | Ref |
|---|---|---|
| Default | Backdrop `slate-900/35` + blur `xs`, panel `max-w-md` | [`L2904-L2905`](ref-ui.tsx#L2904-L2905) |
| Hover | N/A | — |
| Focus | Không trap; focus đầu tiên không được đặt vào modal | — |
| Active | N/A | — |
| Disabled | N/A | — |
| Loading | N/A | — |
| Empty | Panel vẫn hiện khung (nội dung do consumer) | — |
| Error | N/A | — |
| Selected | N/A | — |

**(d) Style chính** — `fixed inset-0 z-50`, `bg-slate-900/35`, `backdrop-blur-xs` (**class không tồn tại** ở Tailwind v3 — QDS-06), panel `.neu-shell rounded-[28px] max-w-md w-full p-6` + `animate-fadeIn` (**keyframes không định nghĩa**).

**(e) Hành vi & a11y** — Không đóng bằng backdrop click, không `Escape`, không khoá scroll body, không `role="dialog"`/`aria-modal`, không `aria-labelledby`. Đây là **thiếu sót hệ thống** cần bổ sung khi tách component (mục 8).

**(f) Ràng buộc** — `max-w-md` (448px) cứng cho mọi modal tương lai; `p-4` ngoài đảm bảo không sát mép khi cửa sổ nhỏ.

### 4.53 QuizConfigModal — OVL-02

**(a) Vai trò & nơi dùng** — Modal cấu hình số câu trước khi làm bài — [`ref-ui.tsx:L2903-L2990`](ref-ui.tsx#L2903-L2990). **[CẬP NHẬT đợt 2 — R1]** `[YÊU CẦU MỚI]`: thêm công tắc **“Xáo câu hỏi & đáp án”** (mặc định **BẬT**, người dùng có thể tắt `[GIẢ ĐỊNH]`).

**UC liên quan:** UC-18, UC-22

**(b) Cấu trúc**

```
┌ ModalShell (z-50) ────────────────────────────────────────────────────┐
│ ┌ panel.neu-shell.rounded-[28px].max-w-md.w-full.p-6.space-y-5 ─────┐ │
│ │  “Cấu hình Bài kiểm tra”                              [X] 32px    │ │
│ │  p: Bộ đề: <strong>Tên</strong> (Hiện có 42 câu gốc)              │ │
│ │  label “Nhập số câu muốn lấy ra để làm:”                           │ │
│ │  input[number min=1 max=200] .neu-card-inset.py-3                 │ │
│ │  PresetCountGrid: [25][32][40][Tất cả (42)]                        │ │
│ │  ────────────────────────────────────────────────────────────    │ │
│ │                                    [Đóng]  [▶ Làm bài ngay]      │ │
│ └───────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
```

**(c) Props & trạng thái** — `open`, `exam`, `count`, `onCountChange`, `onClose`, `onStart`; **[CẬP NHẬT R1]** thêm `randomize?: boolean` (mặc định `true`) + `onRandomizeChange?` `[YÊU CẦU MỚI]`.

| Trạng thái | Biểu hiện thực tế | Ref |
|---|---|---|
| Default | Input mặc định `25` (hoặc `min(25, tổng)` khi mở từ ExamDetail) | [`L825`](ref-ui.tsx#L825), [`L2254-L2256`](ref-ui.tsx#L2254-L2256) |
| Hover | Nút preset không chọn: `hover:bg-white` | [`L2950`](ref-ui.tsx#L2950) |
| Focus | Input `focus:outline-none` — mất dấu hiệu focus | [`L2932`](ref-ui.tsx#L2932) |
| Active | N/A | — |
| Disabled | N/A — “Làm bài ngay” luôn bật | [`L2980-L2987`](ref-ui.tsx#L2980-L2987) |
| Loading | N/A | — |
| Empty | Mở khi bộ đề 0 câu: vẫn hiện, “Tất cả (0)”, bấm Làm bài → `handleStartQuiz` return sớm, **không có phản hồi** | [`L1083`](ref-ui.tsx#L1083) |
| Error | Không có validation inline: nhập `0`, `-5`, `abc` → ô trống; submit dùng `Math.max(1, parseInt(...) \|\| 1)` | [`L1084`](ref-ui.tsx#L1084) |
| Selected | Preset đang khớp `Number(count)`: nền `#262b33`, chữ trắng, `shadow-md` | [`L2947-L2951`](ref-ui.tsx#L2947-L2951) |
| Selected (R1) | Công tắc “Xáo câu hỏi & đáp án” tái sử dụng pattern switch (track 40×20, ON `emerald-500`) — mặc định **ON** | [YÊU CẦU MỚI] |

**(d) Style chính** — Panel `.neu-shell rounded-[28px] max-w-md w-full p-6 space-y-5`; input `px-4 py-3 rounded-xl neu-card-inset text-base font-bold`; preset `py-2.5 rounded-xl text-xs font-bold`; footer `justify-end gap-3 pt-3 border-t border-slate-200/80`.

**(e) Hành vi & a11y** — `type="number" min="1" max="200"` chỉ là ràng buộc HTML — **không clamp khi submit**; nhập 999 → `handleStartQuiz` tạo 999 câu bằng cách lặp pool và gắn nhãn “(Lượt ôn #k)” ([`ref-ui.tsx:L1093-L1106`](ref-ui.tsx#L1093-L1106)) — QDS-40. Không `role="dialog"`, không focus vào input khi mở, không đóng bằng backdrop/Escape, không khoá scroll. `<label>` không gắn `htmlFor`.

**(f) Ràng buộc** — `max-w-md`; preset grid `grid-cols-4` với “Tất cả (42)” có thể xuống 2 dòng chữ; tổng số câu hiển thị lấy `currentExam.questions.length`.

**[CẬP NHẬT R1] — hợp đồng bắt đầu phiên (thay đổi so với ref):** `requestedCount = min(N, pool.length)` — **N ≥ tổng số câu thì lấy hết nhưng VẪN xáo**; **bỏ** cơ chế lặp pool + nhãn “(Lượt ôn #k)” của ref [`L1093-L1106`](ref-ui.tsx#L1093-L1106) `[YÊU CẦU MỚI]`. `randomize=false` → giữ nguyên thứ tự gốc của bộ đề; **thứ tự câu của phiên được lưu theo `Attempt`**. Nhiều đáp án đúng được phép trong phiên (Q-10) — các câu này dùng checkbox ở quiz (xem [4.32](#432-questioncard)).

### 4.54 PresetCountGrid

**(a) Vai trò & nơi dùng** — Lưới 4 nút chọn nhanh số câu 25 / 32 / 40 / Tất cả trong QuizConfigModal — [`L2936-L2970`](ref-ui.tsx#L2936-L2970).

**UC liên quan:** UC-18

**(b) Cấu trúc**

```
div.grid.grid-cols-4.gap-2.5
├── [25 câu]      active → bg-#262b33 text-white shadow-md
├── [32 câu]      inactive → .neu-pill hover:bg-white
├── [40 câu]
└── [Tất cả (42)]
```

**(c) Props & trạng thái** — `value: number`, `presets = [25, 32, 40]`, `total`, `onChange`.

| Trạng thái | Biểu hiện thực tế | Ref |
|---|---|---|
| Default | 4 cột đều, nút `py-2.5 rounded-xl text-xs font-bold` | [`L2941-L2968`](ref-ui.tsx#L2941-L2968) |
| Hover | Inactive `hover:bg-white` | [`L2950`](ref-ui.tsx#L2950) |
| Focus | Mặc định trình duyệt | — |
| Active | Không có hiệu ứng nhấn | — |
| Disabled | N/A — preset 40 vẫn bấm được khi bộ đề chỉ có 10 câu | — |
| Loading | N/A | — |
| Empty | Bộ đề 0 câu: “Tất cả (0)” vẫn hiện | [`L2967`](ref-ui.tsx#L2967) |
| Error | N/A | — |
| Selected | So sánh `Number(quizQuestionCountInput) === num` (hoặc `=== total`) → nền than chì | [`ref-ui.tsx:L2948`](ref-ui.tsx#L2948), [`L2962`](ref-ui.tsx#L2962) |

**(d) Style chính** — `grid-cols-4 gap-2.5`; active `bg-[#262b33] text-white shadow-md`; inactive `.neu-pill text-[#1e232a]`.

**(e) Hành vi & a11y** — Bấm preset chỉ **ghi vào input**, không tự submit. Preset không bị giới hạn theo số câu thực tế → người dùng có thể chọn 40 cho bộ 10 câu và nhận câu lặp (QDS-40). Không `aria-pressed`.

**(f) Ràng buộc** — 4 cột cứng; nhãn “Tất cả (n)” dài nhất; n > 999 có thể tràn ô.

### 4.55 ThemeToggle

> `[YÊU CẦU MỚI]` (R2) — **không có trong ref-ui** (ref không có bất kỳ khái niệm theme nào: không `Sun`/`Moon`/`Monitor`, không `prefers-color-scheme`, không state theme — kiểm tra toàn file 0 match). Thay thế 2 nút Settings/Power đã bị loại bỏ ([4.7](#47-sidebarutilitybutton)).

**(a) Vai trò & nơi dùng** — Nút **duy nhất** trong cụm utility đáy Sidebar ([4.2](#42-sidebar)); bấm ra menu 3 chế độ giao diện: **Sáng / Tối / Theo hệ thống**. Là nơi duy nhất đổi theme của app (vì không có màn Settings).

**UC liên quan:** UC-28 (đổi giao diện Sáng/Tối/Hệ thống, `[YÊU CẦU MỚI]`); phục vụ mọi màn hình

**(b) Cấu trúc**

```
NÚT (cùng vị trí 2 utility cũ)                 MENU MỞ RỘNG
┌ .neu-icon-btn.w-10.h-10.rounded-xl ───┐     ┌ div.absolute.bottom-full.mb-2.left-0.w-40 ─┐
│  icon: light→<Sun/>  dark→<Moon/>       │     │ .neu-shell.rounded-2xl.p-1.5.z-50            │
│         system→<Monitor/>  (w-4 h-4)    │     │ ┌ menuitemradio ───────────────────────┐   │
│  + chấm nhỏ góc dưới phải khi “system” │     │ │ ☀  Sáng                    [✓]      │   │
└─────────────────────────────────────────┘     │ ├────────────────────────────────────────┤   │
                                                │ │ 🌙 Tối                           │   │
Collapsed (w-20): giữ nguyên 40×40, icon-only   │ ├────────────────────────────────────────┤   │
                                                │ │ 💻 Theo hệ thống                │   │
                                                │ └────────────────────────────────────────┘   │
                                                └───────────────────────────────────────────────┘
```

**(c) Props & trạng thái** — `theme: 'light' | 'dark' | 'system'`, `resolvedTheme: 'light' | 'dark'` (khi `system` → giá trị thật từ OS), `onThemeChange(mode)`, `collapsed?: boolean`.

| Trạng thái | Biểu hiện thực tế | Ref |
|---|---|---|
| Default | `.neu-icon-btn w-10 h-10 rounded-xl`; icon = `Sun` (Sáng) / `Moon` (Tối) / `Monitor` (Theo hệ thống), `text-[#262b33]` | [YÊU CẦU MỚI] |
| Hover | Shadow 2px + `translateY(1px)` (giữ style `.neu-icon-btn:hover`) | [YÊU CẦU MỚI] |
| Focus | `focus-visible:ring-2 ring-[#262b33]` — **bắt buộc** bổ sung (ref không có) | [YÊU CẦU MỚI] |
| Active | Shadow inset 3px | [YÊU CẦU MỚI] |
| Disabled | N/A — luôn dùng được | — |
| Loading | N/A | — |
| Empty | N/A — luôn render (mặc định `system`) | — |
| Error | Ghi `app_settings` thất bại → giữ theme RAM + toast lỗi (biến thể lỗi của Toast, QDS-14) | [YÊU CẦU MỚI] |
| Selected | Item đang chọn trong menu: `.neu-pill-active` + dấu `Check` 12px phải; icon nút đổi theo `theme` | [YÊU CẦU MỚI] |

**(d) Style chính** — Nút: `.neu-icon-btn w-10 h-10 rounded-xl` (giống hệt 2 nút cũ — giữ layout đáy sidebar). Menu: `.neu-shell rounded-2xl p-1.5 w-40`, item `w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium`, active `.neu-pill-active`. Icon lucide `Sun` / `Moon` / `Monitor` (ASDS-05, R2).

**(e) Hành vi & a11y**

- Click nút → mở/đóng menu (`aria-haspopup="menu"`, `aria-expanded`); chọn item → set theme + **persist vào bảng `app_settings` key `theme`** (`'light'|'dark'|'system'`) `[YÊU CẦU MỚI]` (đã có `app_settings` — key/value/updated_at, seed `theme=system` — trong `db.dbml`; QDS-47 **ĐÃ CHỐT**) → ghi SQLite local qua Tauri command `setting_get`/`setting_set` (structure-be §6.2), **không** cloud.
- `'system'` → đọc `prefers-color-scheme` + đăng ký `matchMedia('(prefers-color-scheme: dark)')` listener → **tự cập nhật khi OS đổi theme**, không cần restart.
- Áp class `dark` trên `<html>`; **áp trước khi render** (inline script trong `index.html` đọc `app_settings` — xem [8.4](#84-tích-hợp-tailwind--css-variables)) → **không nháy trắng** khi mở app.
- Keyboard: `Enter`/`Space` mở menu, `↑`/`↓` di chuyển, `Enter` chọn, `Escape` đóng + trả focus về nút; click ra ngoài đóng.
- `title` + `aria-label` luôn mô tả chế độ hiện tại, vd: `“Giao diện: Theo hệ thống — bấm để đổi”`.
- Phím tắt nhanh đề xuất `Ctrl/Cmd+Shift+T` xoay vòng 3 chế độ `[GIẢ ĐỊNH]` (chưa chốt — QDS-48).

**(f) Ràng buộc** — Vị trí 40×40 giữ nguyên (cụm `border-t` đáy sidebar — [4.7](#47-sidebarutilitybutton)); menu neo `bottom-full` nên ở sidebar thu gọn (`w-20 p-4 = 48px`) menu `w-40` phải neo `left-0` và **không** được tràn khỏi viewport; mọi giá trị màu dark phải đi qua CSS variable (§2.1e), **không** hardcode trong JSX; nếu `theme` chưa từng lưu → mặc định `system`.

### 4.56 QuestionNavigatorDialog

> `[YÊU CẦU MỚI]` (R3) — **thống nhất tên gọi + tái sử dụng 1 component (DRY)** cho 2 overlay ref đang gộp chung tên `QuestionJumpPopover`: OVL-03 (editor, [4.42](#442-questionjumppopover-editor--ovl-03)) và OVL-04 (quiz, [4.45](#445-questionjumppopover-quiz--ovl-04)). Từ đây về sau tên chuẩn là **`QuestionNavigatorDialog`** — mã 4.42/4.45 và OVL-03/OVL-04 chỉ còn để truy vết ref.

**(a) Vai trò & nơi dùng** — Dialog liệt kê **toàn bộ câu của lượt hiện tại** dưới dạng lưới số thứ tự; bấm số → đóng dialog, scroll + focus tới đúng câu. Dùng ở SCREEN-05 (bản `editor`) và SCREEN-06 (bản `quiz`); lưới số này cũng là khối tái sử dụng bên trong [`SubmitWarningDialog`](#457-submitwarningdialog) (4.57).

**UC liên quan:** UC-08 (bản editor), UC-19, UC-29 (bản quiz — `[YÊU CẦU MỚI]` R3)

**(b) Cấu trúc**

```
╔ backdrop fixed inset-0 z-50 bg-black/40 flex center p-4 ═══════════════════╗
║ ┌ .neu-shell rounded-[28px] max-w-lg w-full p-6 space-y-4 ──────────────┐ ║
║ │  “Danh sách câu hỏi (25)”                                [X] 32px     │ ║
║ │  ┌ grid.grid-cols-5.gap-2.max-h-80.overflow-y-auto ─────────────────┐ │ ║
║ │  │ [1✓][2 ][3●][4▲][5 ]   ● ring = câu hiện tại (bản quiz)        │ │ ║
║ │  │ [6 ][7✓]…                    ✓ = đã làm (nền than chì)           │ │ ║
║ │  │                        ▲ = đã đánh dấu (flag, chỉ quiz)          │ │ ║
║ │  └──────────────────────────────────────────────────────────────────┘ │ ║
║ │  (bản editor) — thêm list trích nội dung:  #1 Giao thức nào ở tầng…  │ ║
║ │  ──────────────────────────────────────────────────────────────────  │ ║
║ │                                    [Đóng]                             │ ║
║ └───────────────────────────────────────────────────────────────────────┘ ║
╚═══════════════════════════════════════════════════════════════════════════╝
```

**Khác biệt 2 bản (hợp nhất nhưng không hoà lẫn):**

| Khía cạnh | Bản `editor` (OVL-03 cũ) | Bản `quiz` (OVL-04 cũ) |
|---|---|---|
| Mở từ | Nút “All (n)” ở header pane Render | Nút “Danh sách câu” trong QuizControlBar |
| Số cột lưới | 4 (giữ `grid-cols-4` ref) | 5 (giữ `grid-cols-5` ref) |
| Trạng thái ô | Không (mọi ô như nhau — ref [`L2399-L2409`](ref-ui.tsx#L2399-L2409)) | Đã làm / chưa làm / câu hiện tại (`ring-2`) / flag `[YÊU CẦU MỚI]` |
| List text trích | Có (dòng `#n` + nội dung truncate) | Không |
| Hành động khi chọn | Scroll + highlight ring 2.2s (pattern [6.9](#69-scroll-into-view--highlight-tạm-22s)) | Giống hệt, dùng chung `handleFocusQuestionFromAllDialog` [`L937-L946`](ref-ui.tsx#L937-L946) |

**(c) Props & trạng thái** — `open`, `variant: 'editor' | 'quiz'`, `questions`, `currentIndex?`, `answers?: Record<qid, optId[]>` `[YÊU CẦU MỚI]` (mảng — hỗ trợ đa đáp án R1), `flags?: Set<qid>` `[YÊU CẦU MỚI]`, `onToggleFlag?`, `onSelect(index)`, `onClose`.

| Trạng thái | Biểu hiện thực tế | Ref |
|---|---|---|
| Default | `max-w-lg` (512px), `.neu-shell rounded-[28px] p-6`, lưới `grid-cols-4|5 gap-2`, `max-h-80 overflow-y-auto` | Lấy từ [`L2386`](ref-ui.tsx#L2386), [`L2611`](ref-ui.tsx#L2611) |
| Hover | Ô số: `hover:bg-[#262b33] hover:text-white`; dòng trích: `hover:bg-white/80` | [`L2405`](ref-ui.tsx#L2405), [`L2418`](ref-ui.tsx#L2418) |
| Focus | Focus trap trong dialog; ô đang focus `ring-2 ring-[#262b33]` | [YÊU CẦU MỚI] |
| Active | Đang ở câu X (quiz): ô `ring-2 ring-[#262b33]` + `shadow-sm` | [YÊU CẦU MỚI] |
| Disabled | N/A | — |
| Loading | N/A | — |
| Empty | 0 câu: lưới rỗng + dòng “Bộ đề chưa có câu hỏi.” (bổ sung — QDS-27) | [YÊU CẦU MỚI] |
| Error | N/A | — |
| Selected | Đã làm (quiz): ô `bg-[#262b33] text-white` + dấu `✓` 10px (bổ sung — đóng QDS-36, không chỉ dùng màu) | [`L2624-L2628`](ref-ui.tsx#L2624-L2628) |

**(d) Style chính** — Vỏ: `.neu-shell rounded-[28px] max-w-lg w-full p-6` (lấy pattern [4.52 ModalShell](#452-modalshell)); ô số `py-1.5 rounded-lg text-xs font-bold text-center` (`.neu-pill` khi chưa làm, `bg-[#262b33]` khi đã làm); flag: icon lucide `Flag` 10px `amber-500` góc trên phải ô `[YÊU CẦU MỚI]`.

**(e) Hành vi & a11y**

- Mở/đóng: nút “Danh sách câu”/“All (n)” toggle, `Escape`, backdrop click, nút X/“Đóng” — **khác hẳn ref** (popover cũ không đóng khi click ngoài/Escape — QDS-35 → đóng khi port).
- Chọn câu → `onSelect(index)`: **đóng dialog trước**, rồi `scrollIntoView({behavior:'smooth', block:'center'})` sau 80ms + highlight ring 2.2s (pattern [6.9](#69-scroll-into-view--highlight-tạm-22s)); clear timer cũ khi bấm liên tiếp (đóng QDS-41).
- `role="dialog" aria-modal="true" aria-labelledby`, focus trap, focus đầu tiên vào lưới số, trả focus về nút mở khi đóng.
- Flag `[YÊU CẦU MỚI]`: double-click hoặc click icon `Flag` trên ô toggle trạng thái “đã đánh dấu” — chỉ tồn tại trong phiên quiz, không persist; **chưa có trong ref** → style `[GIẢ ĐỊNH]`.

**(f) Ràng buộc** — **Một** implementation cho cả 2 variant — **không** tách 2 component, **không** copy-paste lưới số (DRY, R3); khối lưới số tách con `QuestionNumberGrid` để [`SubmitWarningDialog`](#457-submitwarningdialog) tái sử dụng; `max-h-80` giữ; cửa sổ tối thiểu 1024 (ASDS-03) nên dialog không cần responsive đặc biệt; khác biệt popover-to-dialog làm nội dung sprint riêng — giữ nhãn text/ref của 2 mã cũ trong tài liệu.

### 4.57 SubmitWarningDialog

> `[YÊU CẦU MỚI]` (Q-11 / R3) — ref **không** có xác nhận khi nộp bài ([`L2639`](ref-ui.tsx#L2639): nút Nộp bài luôn active, không confirm); QDS-43 → **ĐÃ CHỐT: có dialog**.

**(a) Vai trò & nơi dùng** — Hộp thoại xác nhận trước khi nộp bài khi còn câu **chưa trả lời**: nêu rõ số câu trống + danh sách số thứ tự, 2 hành động “Quay lại làm tiếp” / “Vẫn nộp”. Dùng ở SCREEN-06 (QuizControlBar).

**UC liên quan:** UC-20 (nộp bài), UC-30 (cảnh báo khi còn câu trống — `[YÊU CẦU MỚI]`) — phần mở rộng Q-11

**(b) Cấu trúc**

```
┌ .neu-shell.rounded-[28px].max-w-md.w-full.p-6.space-y-4 ─────────────────┐
│  ⚠️  “Còn 5 câu chưa làm trong 25 câu.”            (font-bold text-base) │
│  “Nếu nộp bây giờ, các câu trống sẽ được tính sai. Bạn có chắc không?” │
│  “Câu chưa làm:”  [ 3 ][ 7 ][ 12 ][ 18 ][ 21 ]  (QuestionNumberGrid con) │
│  ────────────────────────────────────────────────────────────────────    │
│                        [Quay lại làm tiếp]  [Vẫn nộp]                    │
│                        .neu-pill                   .neu-dark-btn          │
└───────────────────────────────────────────────────────────────────────────┘
```

**(c) Props & trạng thái** — `open`, `unansweredIndexes: number[]`, `total: number`, `onBack`, `onConfirm`.

| Trạng thái | Biểu hiện thực tế | Ref |
|---|---|---|
| Default | Panel `max-w-md`, đếm câu trống trong tiêu đề | [YÊU CẦU MỚI] |
| Hover | Chỉ 2 nút (`.neu-pill` / `.neu-dark-btn`) | [YÊU CẦU MỚI] |
| Focus | Focus **mặc định vào “Quay lại làm tiếp”** (lựa chọn an toàn) | [YÊU CẦU MỚI] |
| Active | Nút `.neu-dark-btn` có hover brightness + `translateY(-1px)` như hệ | [YÊU CẦU MỚI] |
| Disabled | N/A | — |
| Loading | N/A — chấm điểm đồng bộ | — |
| Empty | `unansweredIndexes = []` → **không mở** (nộp trực tiếp) `[GIẢ ĐỊNH]` | [YÊU CẦU MỚI] |
| Error | N/A | — |
| Selected | Không có lựa chọn mặc định khác — focus đã đặt | [YÊU CẦU MỚI] |

**(d) Style chính** — Panel `.neu-shell rounded-[28px] max-w-md p-6 space-y-4`; icon `TriangleAlert` (lucide) `amber-500` 20px; ô số trống: reuse `QuestionNumberGrid` variant `muted` (`bg-slate-200 text-slate-500`, disabled, `aria-disabled`); nút phụ `.neu-pill px-4 py-2`, nút chính `.neu-dark-btn px-5 py-2.5`.

**(e) Hành vi & a11y**

- Mở từ `QuizControlBar.onSubmit` khi `answeredCount < total`; `Escape` + backdrop click + “Quay lại làm tiếp” → đóng, **không** nộp; “Vẫn nộp” → `handleSubmitQuiz` (giữ nguyên cách chấm [`L1116-L1127`](ref-ui.tsx#L1116-L1127)).
- `role="dialog" aria-modal="true"`; `aria-labelledby` trỏ tiêu đề (“Còn N câu chưa làm…”); focus trap; trả focus về nút Nộp bài khi đóng.
- Danh sách số trống có thể bấm → **đóng dialog + jump tới câu đó** (tái sử dụng `onSelect` của QuestionNavigatorDialog) `[YÊU CẦU MỚI]` — tuỳ chọn nâng cao.

**(f) Ràng buộc** — Không lồng 2 backdrop (không mở từ trong QuestionNavigatorDialog); luôn `z-50` cùng bậc với OVL-02; số trống > 10 → wrap trong vùng `max-h-40 overflow-y-auto`; nhãn tiếng Việt giữ nguyên (“Quay lại làm tiếp” / “Vẫn nộp”).

### 4.58 DeleteConfirmDialog

> `[YÊU CẦU MỚI]` (Q-01) — ref **không** có xoá môn/xoá bộ đề ([`domain-core.md` §1.4](domain-core.md)); đây là dialog dùng chung cho cả 2 lời gọi xoá.

**(a) Vai trò & nơi dùng** — Xác nhận xoá **môn học** (từ SubjectCard, SCREEN-02) hoặc **bộ đề** (từ ExamCard, SCREEN-03) — soft delete (`deleted_at`), không xoá cứng. Một component, 2 ngữ cảnh.

**UC liên quan:** UC-04 (danh sách môn), UC-05 (danh sách bộ đề), UC-26 (xóa môn), UC-27 (xóa bộ đề) — `[YÊU CẦU MỚI]` mở rộng Q-01

**(b) Cấu trúc**

```
┌ .neu-shell.rounded-[28px].max-w-md.w-full.p-6.space-y-4 ─────────────────┐
│  🗑  “Xoá môn học “Mạng Máy Tính”?”          (font-bold, truncate 2 dòng) │
│  “Môn có 2 bộ đề • 65 câu hỏi. Các lượt làm bài sẽ giữ nguyên lịch sử.”  │
│  “Hành động này không thể hoàn tác.”                        (rose-600 xs) │
│  ────────────────────────────────────────────────────────────────────    │
│                         [Giữ lại]      [Xoá môn]                          │
│                         .neu-pill       .neu-dark-btn tone=rose           │
└───────────────────────────────────────────────────────────────────────────┘
```

**(c) Props & trạng thái** — `open`, `targetType: 'subject' | 'exam'`, `targetName`, `meta?: { examCount?, questionCount?, attemptCount? }`, `onCancel`, `onConfirm`.

| Trạng thái | Biểu hiện thực tế | Ref |
|---|---|---|
| Default | Panel `max-w-md`; tiêu đề “Xoá môn học “X”?” / “Xoá bộ đề “X”?” | [YÊU CẦU MỚI] |
| Hover | Chỉ 2 nút | [YÊU CẦU MỚI] |
| Focus | Focus mặc định vào **“Giữ lại”** (lựa chọn an toàn) | [YÊU CẦU MỚI] |
| Active | Nút xác nhận: `filter:brightness` khi hover (giữ pattern `.neu-dark-btn`) | [YÊU CẦU MỚI] |
| Disabled | Nút xác nhận `disabled` + `opacity-50` **sau khi đã bấm** (chống double-submit) | [YÊU CẦU MỚI] |
| Loading | Ghi DB đang chạy → nút xác nhận hiện `Loader2 animate-spin` thay chữ | [YÊU CẦU MỚI] |
| Empty | `meta = []` → bỏ dòng thống kê, chỉ còn tiêu đề + cảnh báo | [YÊU CẦU MỚI] |
| Error | Ghi DB thất bại → đóng dialog + toast lỗi (biến thể error của Toast) | [YÊU CẦU MỚI] |
| Selected | Nút xác nhận rose-600 (không phải CTA than chì — chủ đích khác biệt với CTA thường) | [YÊU CẦU MỚI] |

**(d) Style chính** — Panel theo [4.52 ModalShell](#452-modalshell); icon lucide `Trash2` 20px `rose-500`; nút xác nhận: `.neu-dark-btn` đổi gradient sang `from-[#e11d48] to-[#be123c]` `[GIẢ ĐỊNH]` (hoặc `.neu-dark-btn` thường + chữ rose — chốt khi port, QDS-45); nút “Giữ lại” `.neu-pill`.

**(e) Hành vi & a11y**

- `Escape` + backdrop click + “Giữ lại” → `onCancel` (đóng, không làm gì); “Xoá môn” → `onConfirm` → soft delete + điều hướng: xoá môn → về root; xoá bộ đề → về SCREEN-03 của môn + toast.
- `role="dialog" aria-modal="true" aria-labelledby` + mô tả đếm (`aria-describedby` dòng thống kê).
- Tên target dài: `line-clamp-2` + `title` đầy đủ.

**(f) Ràng buộc** — **Soft delete** — DB giữ row + `deleted_at`; bộ đề đã có `Attempt` vẫn giữ lịch sử (snapshot `examTitle` [`L1140`](ref-ui.tsx#L1140)); xoá môn soft-delete cascade các bộ đề con `[GIẢ ĐỊNH]` (cần domain-core chốt — Q-01); tên hiển thị trong tiêu đề phải escape ký tự `“ ”` của tên môn/bộ đề; không đổi nhãn tiếng Việt.

#### Biến thể “Xóa vĩnh viễn” — `[YÊU CẦU MỚI]` (đợt 3)

> Không tạo component mới: tái sử dụng cùng [`DeleteConfirmDialog`](#458-deleteconfirmdialog) với prop `variant: 'soft' | 'permanent'` (mặc định `'soft'`). Dùng cho thao tác **Xóa vĩnh viễn** trong [`TrashList`](#460-trashlist) (4.60) / [`TrashItemRow`](#461-trashitemrow) (4.61) — đã qua soft delete trước đó.

**(a) Vai trò & nơi dùng** — Xác nhận xóa **vĩnh viễn** một Môn đã xóa hoặc Bộ đề đã xóa trong Thùng rác (SCREEN-09). Không thể hoàn tác, dữ liệu bị xóa khỏi SQLite.

**(b) Cấu trúc**

```
┌ .neu-shell.rounded-[28px].max-w-md.w-full.p-6.space-y-4 ─────────────────┐
│  🗑  “Xóa vĩnh viễn “Mạng Máy Tính”?”   (font-bold, rose-600, 2 dòng)   │
│  “Môn có 2 bộ đề • 65 câu hỏi • 3 lượt làm bài sẽ bị xóa cùng.”          │
│  “Hành động này KHÔNG THỂ HOÀN TÁC.”                 (rose-600 xs bold)   │
│  ────────────────────────────────────────────────────────────────────    │
│                         [Hủy]      [Xóa vĩnh viễn]                        │
│                         .neu-pill   .neu-dark-btn tone=rose (nền rose)     │
└───────────────────────────────────────────────────────────────────────────┘
```

**(c) Props** — reuse `DeleteConfirmDialogProps` + `variant='permanent'`; thêm `cascadeCount?: { exams?: number; questions?: number; attempts?: number }` để hiển thị số con bị xóa cùng.

**(d) Style chính** — giống biến thể soft, nhưng tiêu đề + cảnh báo **rose-600 bold**; nút xác nhận nền rose đậm `from-[#e11d48] to-[#be123c]`, chữ trắng; icon `Trash2` rose-600.

**(e) Hành vi & a11y** — `Escape`/backdrop/“Hủy” → đóng, không xóa; “Xóa vĩnh viễn” → `onConfirm` → xóa cứng + toast + cập nhật `NavBadge`. Focus mặc định vào **“Hủy”** (lựa chọn an toàn — §6.14). `aria-labelledby` tiêu đề, `aria-describedby` dòng cảnh báo.

**(f) Ràng buộc** — Chỉ mở từ SCREEN-09 (không từ SubjectCard/ExamCard); không soft delete lại; khi đang xử lý (`processing`) nút xác nhận `disabled` + spinner; phải đồng bộ `NavBadge` sau khi xóa (giảm số mục).

### 4.59 SyntaxHighlightedTextarea

> `[YÊU CẦU MỚI]` (R4) — ref dùng `CodeEditorTextarea` thuần (`bg-transparent` không có highlight, [`L2549-L2560`](ref-ui.tsx#L2549-L2560)); token màu xem [§2.1f](#f-token-cú-pháp-txt--syntax-ask--syntax-ans---yêu-cầu-mới-r4).

**(a) Vai trò & nơi dùng** — Vùng soạn **TXT** ở SCREEN-05 (pane phải) có **tô màu cú pháp**: token `ask` tô đỏ, token `ans.`/`ans.*` tô xanh; giữ nguyên trải nghiệm gõ của textarea (không dùng editor nặng). Dùng khi `editorFormatTab === 'txt'`; tab JSON giữ `CodeEditorTextarea` (4.39).

**UC liên quan:** UC-13 (dán/parse TXT), UC-12, UC-14

**(b) Cấu trúc (overlay highlight dưới textarea)**

```
┌ div.relative.w-full.h-full.neu-card-inset.rounded-2xl.overflow-hidden ──────────┐
│ ┌ pre.absolute.inset-0.p-4.font-mono.text-xs.sm:text-sm.leading-relaxed ──────┐ │
│ │ pointer-events-none  text-[#262b33]  white-space:pre-wrap  word-break:break-word│
│ │ <span style=var(--syntax-ask)>ask</span> : Giao thức nào ở tầng Transport?     │ │
│ │ <span style=var(--syntax-ans)>ans.</span> HTTP và FTP                            │ │
│ │ <span style=var(--syntax-ans)>ans.*</span> TCP và UDP          ← xanh đậm      │ │
│ │ (dòng continuation → không span, giữ màu thường)                              │ │
│ └─────────────────────────────────────────────────────────────────────────────────┘ │
│ ┌ textarea.absolute.inset-0.p-4.font-mono.bg-transparent.text-transparent ─────┐ │
│ │ caret-shown  spellCheck=false  resize-none  focus:outline-none               │ │
│ │ selection + caret hiển thị bình thường (text trong suốt, `::selection` opaque)│ │
│ └─────────────────────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────────────────┘
```

**(c) Props & trạng thái** — `value`, `onChange`, `lineErrors?: number[]` (số dòng 0-based vi phạm validate TXT — nhận từ parser), `placeholder`, `onCaretMove?`.

| Trạng thái | Biểu hiện thực tế | Ref |
|---|---|---|
| Default | Overlay `<pre>` + textarea trong suốt cùng font/size/leading/padding tuyệt đối | [YÊU CẦU MỚI] |
| Hover | Không đổi (giữ hành vi textarea thường) | [YÊU CẦU MỚI] |
| Focus | Nhánh `focus:` hiện caret + `::selection` `bg-[#262b33]/20`; outline vẫn `none` (giữ ref) — **phải** thêm `focus-visible:ring-2` (QDS-17) | [YÊU CẦU MỚI] |
| Active | Gõ → re-highlight mỗi keystroke (regex/đường, O(n)) | [YÊU CẦU MỚI] |
| Disabled | N/A | — |
| Loading | N/A — parse đồng bộ | — |
| Empty | Placeholder mẫu TXT 5 dòng (giữ [`L2554-L2558`](ref-ui.tsx#L2554-L2558)) | giữ ref |
| Error | Dòng vi phạm validate: nền `bg-rose-500/10` `[GIẢ ĐỊNH]` (QDS-46) + nội dung lỗi ở `ParseErrorBanner` (4.40); textarea `aria-invalid="true"` | [YÊU CẦU MỚI] |
| Selected | Chọn text bình thường (`::selection` opaque trên nền trong suốt) | [YÊU CẦU MỚI] |

**(d) Style chính** — Vùng: `neu-card-inset rounded-2xl` (giữ [`L2559`](ref-ui.tsx#L2559)); cả `<pre>` và `<textarea>` dùng **cùng** `p-4 font-mono text-xs sm:text-sm leading-relaxed whitespace-pre-wrap break-words`; token: `span` tô `var(--syntax-ask)` / `var(--syntax-ans)` (§2.1f — đỏ rose / xanh blue, dark mode qua `.dark`); textarea `bg-transparent text-transparent caret-shown resize-none`.

**(e) Hành vi & a11y**


- Highlight: tách `value` theo dòng, mỗi dòng trim-leading rồi test regex **giống hệt parser ref**: `/^ask\s*:/i` → tô `ask` + dấu `:`; `/^ans\.\*/i` → tô `ans.*` (**kiểm tra trước** nhánh `ans.` — thứ tự regex trong [`L109/L119`](ref-ui.tsx#L109-L128)); `/^ans\./i` → tô `ans.`; dòng thường → không tô (continuation [`L129-L136`](ref-ui.tsx#L129-L136)). **Chỉ token đầu dòng được tô**, phần còn lại màu thường — khớp chính xác parser TXT.
- Textarea **giữ nguyên** vai trò control gốc (native textarea) → a11y tốt hơn mọi editor nhúng; thêm `aria-invalid` + `aria-describedby="parse-error"` (id của ParseErrorBanner) khi có `lineErrors`.
- Không đổi hợp đồng sync 2 chiều với pane render ([`L879-L914`](ref-ui.tsx#L879-L914)): mọi keystroke vẫn parse; highlight là lớp trang trí, **không** tham gia parse.
- **Hợp đồng với BE:** parser TXT ở Tauri/Rust phải dùng regex tương đương (`ask\s*:`, `ans\.\*`, `ans\.`, case-insensitive, trim đầu dòng, dòng thường nối vào phần tử trước) — sai khác sẽ làm highlight “nói dối” về hành vi parse.
- Tab: giữ hành vi ref (chuyển focus, không chèn indent) — `Tab` không được nuốt.

**(f) Ràng buộc** — Phải canh **hoàn toàn chính xác** offset `padding/font/line-height/word-break` giữa 2 lớp — lệch 1px là lỗi hiển thị nặng nhất của pattern này; `<pre>` và `textarea` phải chia sẻ scrollbar/`overflow` (khuyến nghị `overflow-hidden` ở wrapper + tự cuộn đồng bộ qua `onScroll` `[GIẢ ĐỊNH]`); chỉ dùng cho TXT (JSON không tô — §2.1f); validate dòng (≥2 lựa chọn, ≥1 `ans.*`) chỉ **báo**, không chặn gõ; màu highlight bắt buộc đi qua CSS variable để tự có bản dark.

---

### 4.60 TrashList

> `[YÊU CẦU MỚI]` (đợt 3) — **không có trong ref-ui**; màn hình Thùng rác (SCREEN-09).

**(a) Vai trò & nơi dùng** — Danh sách thùng rác, chia **2 nhóm**: **Môn đã xóa** và **Bộ đề đã xóa** (soft delete). Hỗ trợ **tìm kiếm/lọc theo loại**, **badge số mục trên tab sidebar** ([`NavBadge`](#463-navbadge)), và 5 trạng thái: rỗng / loading / data / error / processing. Dùng ở SCREEN-09.

**UC liên quan:** UC-33 (xem thùng rác, tìm kiếm/lọc/badge), UC-34 (khôi phục môn), UC-35 (khôi phục bộ đề), UC-36 (xóa vĩnh viễn), UC-37 (dọn sạch), UC-38 (toast hoàn tác)

**(b) Cấu trúc**

```
┌ div.space-y-5 ────────────────────────────────────────────────────────────────┐
│ ┌ header.neu-card.rounded-2xl.p-4.flex.justify-between ───────────────────┐ │
│ │  🗑 Thùng rác   [Tìm kiếm … inset]   [Lọc: Tất cả|Môn|Bộ đề] (pill)    │ │
│ └──────────────────────────────────────────────────────────────────────────┘ │
│ ┌ section.neu-card.rounded-2xl.p-5.space-y-3 ─────────────────────────────┐ │
│ │  “Môn đã xóa (N)”  (uppercase xs slate-400)                            │ │
│ │  TrashItemRow × N   (hoặc EmptyState rỗng)                              │ │
│ └──────────────────────────────────────────────────────────────────────────┘ │
│ ┌ section.neu-card.rounded-2xl.p-5.space-y-3 ─────────────────────────────┐ │
│ │  “Bộ đề đã xóa (M)”                                                    │ │
│ │  TrashItemRow × M                                                       │ │
│ │  [Dọn sạch thùng rác] (.neu-dark-btn tone=rose, disabled khi rỗng)      │ │
│ └──────────────────────────────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────────────────────────────┘
```

**(c) Props & trạng thái** — `items: TrashItem[]`, `query`, `filter: 'all' | 'subject' | 'exam'`, `onQueryChange`, `onFilterChange`, `onRestore(id)`, `onPermanentDelete(id)`, `onEmptyAll`, `status: 'idle' | 'loading' | 'error' | 'processing'`.

| Trạng thái | Biểu hiện thực tế | Ref |
|---|---|---|
| **Rỗng** | 2 section rỗng + EmptyState (icon `Trash2` 56px, “Thùng rác trống”, mô tả, không CTA — hoặc ẩn nút Dọn sạch disabled) | [YÊU CẦU MỚI] |
| **Loading** | Skeleton: 3 hàng inset pulse (`animate-pulse`) trong mỗi section; không có spinner toàn màn | [YÊU CẦU MỚI] |
| **Data** | 2 nhóm + hàng mục; badge `NavBadge` = tổng N+M | [YÊU CẦU MỚI] |
| **Error** | Banner rose-600 “Không tải được thùng rác. [Thử lại]” trong mỗi section, giữ dữ liệu cũ nếu có | [YÊU CẦU MỚI] |
| **Processing** | Hàng đang khôi phục/xóa: `opacity-60 pointer-events-none` + spinner nhỏ; nút “Dọn sạch” disabled + spinner | [YÊU CẦU MỚI] |

**(d) Style chính** — Section `.neu-card rounded-2xl p-5 space-y-3`; header tìm kiếm `.neu-card-inset rounded-xl px-3 py-2`; filter pill `.neu-pill` active `.neu-pill-active`; tiêu đề nhóm `text-[11px] uppercase font-bold text-slate-400`.

**(e) Hành vi & a11y** — Tìm kiếm lọc theo tên (case-insensitive, debounce 200ms `[GIẢ ĐỊNH]`); lọc theo loại ẩn nhóm rỗng; “Dọn sạch” mở [`DeleteConfirmDialog`](#458-deleteconfirmdialog) biến thể xóa vĩnh viễn với `targetType='all'` hoặc confirm riêng; `role="region"` + `aria-labelledby` cho mỗi nhóm; danh sách dùng `<ul>`/`<li>`.

**(f) Ràng buộc** — Soft delete cascade: xóa môn → các bộ đề con cũng vào thùng rác (cascade theo `delete_batch_id`, BR-71) — domain-core đã chốt; tổng số mục cho `NavBadge` = số row `deleted_at IS NOT NULL`; không phân trang ở đợt 3 (tối đa vài trăm mục); tên nhóm không đổi tiếng Việt.

---

### 4.61 TrashItemRow

> `[YÊU CẦU MỚI]` (đợt 3).

**(a) Vai trò & nơi dùng** — Một dòng mục thùng rác: tên, môn gốc (với bộ đề), thời điểm xóa (giờ VN), số câu/lượt, nhãn “xóa cùng môn”, nút Khôi phục / Xóa vĩnh viễn, trạng thái processing. Dùng trong [`TrashList`](#460-trashlist) (4.60).

**UC liên quan:** UC-34 (khôi phục môn), UC-35 (khôi phục bộ đề), UC-36 (xóa vĩnh viễn), UC-33 (tìm kiếm/lọc)

**(b) Cấu trúc**

```
┌ div.neu-card-inset.px-4.py-3.rounded-xl.flex.items-center.justify-between.gap-3 ─┐
│ ┌ trái.flex-1.min-w-0 ────────────────────────────────────────────────────────┐  │
│ │  [Môn|Bộ đề] badge nhỏ (nền màu môn / slate)   h4 tên (truncate, bold)     │  │
│ │  p “Môn gốc: Mạng Máy Tính” (chỉ với bộ đề)  • “Xóa cùng môn” (rose xs)   │  │
│ │  p “Xóa lúc: 24/10/2026 10:28 (VN)”  • “42 câu • 3 lượt làm”             │  │
│ └─────────────────────────────────────────────────────────────────────────────┘  │
│ ┌ phải.flex.gap-2.shrink-0 ─────────────────────────────────────────────────┐  │
│ │  [↩ Khôi phục] .neu-pill   [🗑 Xóa vĩnh viễn] .neu-pill tone=rose        │  │
│ └─────────────────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────────────────┘
```

**(c) Props & trạng thái** — `item: { id, type: 'subject' | 'exam', name, originSubjectName?, deletedAt, questionCount, attemptCount, deletedWithSubject?: boolean }`, `processing?: boolean`, `onRestore`, `onPermanentDelete`.

| Trạng thái | Biểu hiện thực tế | Ref |
|---|---|---|
| Default | Hàng inset `px-4 py-3 rounded-xl`, tên 14px bold, metadata 11px `slate-400` | [YÊU CẦU MỚI] |
| Hover | `hover:bg-white/60` (chỉ đổi nền) | [YÊU CẦU MỚI] |
| Focus | Nút nhận focus mặc định; hàng không focus được | [YÊU CẦU MỚI] |
| Active | N/A (hàng không bấm) | — |
| Disabled | Nút disabled khi `processing` | [YÊU CẦU MỚI] |
| Loading | N/A (màn loading do `TrashList`) | — |
| Empty | Không render (TrashList xử lý rỗng) | — |
| Error | N/A (Toast báo lỗi) | — |
| Selected | `processing` → hàng `opacity-60 pointer-events-none` + spinner nhỏ ở phải | [YÊU CẦU MỚI] |

**(d) Style chính** — Hàng `.neu-card-inset rounded-xl px-4 py-3`; badge loại `px-2 py-0.5 rounded-md text-[10px] font-bold` (môn: nền màu môn chữ trắng; bộ đề: `bg-slate-200 text-slate-600`); nhãn “Xóa cùng môn” `text-[10px] font-bold text-rose-600`; thời điểm `text-[11px] text-slate-400` (giờ VN — Q-06).

**(e) Hành vi & a11y** — “Khôi phục” mở [`RestoreDialog`](#462-restoredialog) (4.62) (đổi tên khi xung đột unique); “Xóa vĩnh viễn” mở [`DeleteConfirmDialog`](#458-deleteconfirmdialog) biến thể vĩnh viễn; tên dài `truncate` + `title`; thời điểm format theo `Asia/Ho_Chi_Minh` (Q-06). Hàng dùng `<li>`; nút có `aria-label` đầy đủ (“Khôi phục môn Mạng Máy Tính”, “Xóa vĩnh viễn bộ đề …”).

**(f) Ràng buộc** — Không click cả hàng (tránh nhầm); metadata tối đa 2 dòng; nếu `deletedWithSubject=true` hiển thị nhãn “Xóa cùng môn” rose; số câu/lượt là snapshot tại thời điểm xóa (`questionCount`, `attemptCount`); không cho phép khôi phục nếu tên xung đột mà người dùng hủy đổi tên.

---

### 4.62 RestoreDialog

> `[YÊU CẦU MỚI]` (đợt 3).

**(a) Vai trò & nơi dùng** — Dialog khôi phục một mục thùng rác. Nếu tên gốc **xung đột** (trùng với mục đang tồn tại cùng scope unique), hiển thị input để **đổi tên mới** trước khi khôi phục. Dùng từ [`TrashItemRow`](#461-trashitemrow) (4.61).

**UC liên quan:** UC-35 (khôi phục)

**(b) Cấu trúc**

```
┌ .neu-shell.rounded-[28px].max-w-md.w-full.p-6.space-y-4 ─────────────────┐
│  ↩  “Khôi phục “Mạng Máy Tính”?”            (font-bold, 2 dòng)          │
│  “Môn này trùng tên với môn đang tồn tại. Nhập tên mới để khôi phục.”    │
│  ┌ label “Tên mới” + input.neu-card-inset ──────────────────────────────┐ │
│  │  [Mạng Máy Tính (khôi phục)]                                        │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│  “Hành động này sẽ đưa mục về danh sách chính.”            (slate xs)     │
│  ────────────────────────────────────────────────────────────────────    │
│                         [Hủy]      [Khôi phục]                            │
│                         .neu-pill   .neu-dark-btn                          │
└───────────────────────────────────────────────────────────────────────────┘
```

**(c) Props & trạng thái** — `open`, `item`, `conflict: boolean`, `suggestedName?: string`, `onCancel`, `onConfirm(newName?)`.

| Trạng thái | Biểu hiện thực tế | Ref |
|---|---|---|
| Default (không xung đột) | Chỉ tiêu đề + mô tả + 2 nút; **không** hiện input | [YÊU CẦU MỚI] |
| Default (xung đột) | Hiện input với `suggestedName` điền sẵn (gợi ý “(khôi phục)”); nút “Khôi phục” disabled nếu tên rỗng/trùng | [YÊU CẦU MỚI] |
| Hover | Chỉ 2 nút | [YÊU CẦU MỚI] |
| Focus | Focus mặc định vào input khi xung đột, vào “Hủy” khi không xung đột | [YÊU CẦU MỚI] |
| Active | Nút xác nhận hover brightness + `translateY(-1px)` | [YÊU CẦU MỚI] |
| Disabled | “Khôi phục” disabled + `opacity-50` khi tên rỗng hoặc đang ghi DB | [YÊU CẦU MỚI] |
| Loading | Nút xác nhận hiện `Loader2 animate-spin` | [YÊU CẦU MỚI] |
| Empty | N/A | — |
| Error | Inline error rose-600 dưới input nếu tên vẫn trùng; DB lỗi → toast | [YÊU CẦU MỚI] |
| Selected | N/A | — |

**(d) Style chính** — Panel theo [4.52 ModalShell](#452-modalshell); input `.neu-card-inset rounded-xl px-3 py-2 text-sm font-medium`; nút phụ `.neu-pill`, nút chính `.neu-dark-btn px-5 py-2.5`.

**(e) Hành vi & a11y** — `Escape`/backdrop/“Hủy” → đóng, không khôi phục; “Khôi phục” → `onConfirm(newName)` → soft-undelete (`deleted_at = NULL`) + đổi tên nếu cần → toast + cập nhật `NavBadge`; `role="dialog" aria-modal="true" aria-labelledby`; input có `<label htmlFor>` + `aria-invalid` + `aria-describedby` khi lỗi.

**(f) Ràng buộc** — Scope unique: tên môn **duy nhất toàn cục** (Q-15), tên bộ đề **unique trong cùng môn** (Q-15); khi xung đột bắt buộc đổi tên, không cho phép giữ tên gốc; gợi ý tên mặc định thêm hậu tố “(khôi phục)” `[GIẢ ĐỊNH]`; không cho phép khôi phục nếu tên mới vẫn trùng.

---

### 4.63 NavBadge

> `[YÊU CẦU MỚI]` (đợt 3).

**(a) Vai trò & nơi dùng** — Badge số mục trên tab sidebar (chỉ dùng cho tab **Thùng rác**), **ẩn khi số = 0**. Dùng trong [`NavItem`](#46-navitem) (4.6).

**UC liên quan:** UC-33 (badge số mục trên tab Thùng rác)

**(b) Cấu trúc**

```
┌ span.neu-pill.inline-flex.items-center.justify-center ───────────────┐
│  min-w-[18px] h-[18px] px-1.5  rounded-full  text-[10px] font-bold   │
│  bg-#262b33  text-white   (khi count > 0)                            │
│  (không render khi count = 0)                                        │
└───────────────────────────────────────────────────────────────────────┘
```

**(c) Props & trạng thái** — `count: number`, `max?: 99` (mặc định 99, >99 hiển thị “99+”).

| Trạng thái | Biểu hiện thực tế | Ref |
|---|---|---|
| Default (count = 0) | **Không render** (ẩn) | [YÊU CẦU MỚI] |
| Default (count > 0) | Pill nhỏ 18px, nền than chì, chữ trắng 10px bold, `min-w-[18px]` | [YÊU CẦU MỚI] |
| Hover | N/A (badge không tương tác) | — |
| Focus | N/A | — |
| Active | N/A | — |
| Disabled | N/A | — |
| Loading | N/A | — |
| Empty | count = 0 → ẩn | [YÊU CẦU MỚI] |
| Error | N/A | — |
| Selected | N/A | — |

**(d) Style chính** — `.neu-pill` thu nhỏ: `min-w-[18px] h-[18px] px-1.5 rounded-full text-[10px] font-bold bg-[#262b33] text-white`; neo góc trên-phải của NavItem (`absolute -top-1 -right-1`).

**(e) Hành vi & a11y** — Tĩnh, không click; `aria-label="{count} mục trong thùng rác"` trên NavItem (hoặc badge có `aria-hidden` + số đọc qua NavItem label); cập nhật realtime khi soft delete / khôi phục / xóa vĩnh viễn; `count` lấy từ tổng số row `deleted_at IS NOT NULL`.

**(f) Ràng buộc** — Chỉ dùng cho tab Thùng rác (không dùng cho tab khác); khi count > 99 hiển thị “99+”; không animation; màu badge than chì (không dùng rose) để khác nút xóa.

---

## 5. Mô tả từng màn hình/page

Sơ đồ điều hướng (khớp §7 của [`domain-core.md`](domain-core.md)):

```
SIDEBAR ──┬── OVERVIEW  → SCREEN-01
          ├── ĐỀ KIỂM TRA → SCREEN-02 ──► SCREEN-03 ──► SCREEN-04 ──┬──► SCREEN-05
          │                                                          ├──► OVL-02 → SCREEN-06 ──► SCREEN-07 ──► OVL-02
          │                                                          └──► OVL-05
          ├── AI GUIDE   → SCREEN-08
          └── THÙNG RÁC → SCREEN-09
```

> Mọi màn hình đều nằm trong `<main>` (`flex-1 neu-shell rounded-[32px] p-5 sm:p-8 overflow-x-hidden flex flex-col gap-6`, [`ref-ui.tsx:L1486`](ref-ui.tsx#L1486)); tab được chọn bằng `activeTab`, view trong tab Đề kiểm tra chọn bằng `examViewMode` — không có URL/router.

### SCREEN-01 Overview (Dashboard) — `activeTab = 'home'`

**Mục đích:** Tổng quan học tập: 4 chỉ số, biểu đồ tiến độ/điểm, phổ điểm, 6 lượt làm gần nhất.

**Use case liên quan: UC-01, UC-02, UC-03, UC-32** (kèm UC-25 cho shell; UC-32 — lọc thống kê thật theo kỳ `[YÊU CẦU MỚI]`, hạng mục sprint cuối).

**Bố cục** — [`L1490-L1861`](ref-ui.tsx#L1490-L1861):

```
┌ div.space-y-6.animate-fadeIn ───────────────────────────────────────────────────┐
│ ┌ section.neu-card.[26px].p-5.sm:p-6 ────────────────────────────────────────┐ │
│ │ “Overall Data • Tổng quan Học tập”      [Theo Tuần|Tháng|Năm] (inset)    │ │
│ │ ┌ MetricCard ┐┌ MetricCard ┐┌ MetricCard ┐┌ MetricCard ┐               │ │
│ │ │ Đã làm     ││ Điểm TB    ││ Câu đã giải││ Tỉ lệ đúng │               │ │
│ │ └────────────┘└────────────┘└────────────┘└────────────┘               │ │
│ └─────────────────────────────────────────────────────────────────────────────┘ │
│ ┌ grid.lg:grid-cols-3.gap-6 ────────────────────────────────────────────────┐ │
│ │ ┌ ComboChart (lg:col-span-2) ──────────────┐  ┌ DonutGauge + Legend ────┐ │ │
│ │ │ “Biểu đồ Tiến độ & Điểm số”  [both][score]│  │ “Phổ Điểm (Tỉ lệ)” AllTime│ │ │
│ │ │ ▮╱▮╱▮ cột + đường xanh + lưới 10→0     │  │   ◕ 8.4đ  + 3 legend   │ │ │
│ │ └────────────────────────────────────────────┘  └────────────────────────┘ │ │
│ └──────────────────────────────────────────────────────────────────────────────┘ │
│ ┌ section.neu-card.[26px] ────────────────────────────────────────────────────┐ │
│ │ “Overview of Works • Lịch sử Làm bài Gần đây”        [Làm đề mới →]        │ │
│ │ STT | Tên bộ đề | Môn học | Thời gian nộp | Kết quả câu | Điểm số          │ │
│ │ 1   | …         | …       | …              | 23/25 câu    | [9.2 đ]         │ │
│ └──────────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

**Bảng component sử dụng (theo thứ tự DOM)**

| # | Component | Vai trò trong màn hình | Ref |
|---|---|---|---|
| 1 | `PeriodTabs` | Lọc kỳ thống kê `week/month/year` | [`L1505-L1523`](ref-ui.tsx#L1505-L1523) |
| 2 | `MetricCard` × 4 | 4 chỉ số: bài đã làm, điểm TB, câu đã giải, tỉ lệ đúng | [`L1527-L1587`](ref-ui.tsx#L1527-L1587) |
| 3 | `ChartMetricToggle` | 2 nút chọn chế độ biểu đồ (chỉ đổi style) | [`L1604-L1625`](ref-ui.tsx#L1604-L1625) |
| 4 | `ComboChart` | Lưới 5 mốc + 7 cột capsule + polyline `#3b82f6` + tooltip hover | [`L1628-L1705`](ref-ui.tsx#L1628-L1705) |
| 5 | `DonutGauge` | Vòng 176px, 2 segment + tâm inset hiện điểm TB | [`L1717-L1768`](ref-ui.tsx#L1717-L1768) |
| 6 | `DonutLegend` | 3 cột Xuất sắc / Khá giỏi / Cần cố gắng | [`L1770-L1799`](ref-ui.tsx#L1770-L1799) |
| 7 | `RecentAttemptList` + `RecentAttemptRow` | Bảng 6 lượt gần nhất + nút “Làm đề mới →” | [`L1803-L1860`](ref-ui.tsx#L1803-L1860) |

**Trạng thái**

- **Rỗng (0 attempt):** metric hiện `0 / 0.0 / 0 / 0.0%`; chart **vẫn vẽ** series hard-code; donut chỉ còn track + `0.0đ`; bảng chỉ còn header ([`L1164-L1174`](ref-ui.tsx#L1164-L1174), [`L1830`](ref-ui.tsx#L1830)).
- **Loading:** không có — toàn bộ tính đồng bộ trong `useMemo` ([`ref-ui.tsx:L1163-L1238`](ref-ui.tsx#L1163-L1238)).
- **Error:** không có error boundary / empty-error state.

**Responsive:** metric `grid-cols-1 sm:grid-cols-2 xl:grid-cols-4`; hàng chart `lg:grid-cols-3` (dưới `lg` xếp dọc, chart full width); bảng cuộn ngang `overflow-x-auto`.

**Ghi chú:** số liệu tháng/năm được **cộng offset giả** (+59 bài, +1420 câu, +242, +6150 — [`L1216-L1229`](ref-ui.tsx#L1216-L1229)) chứ không lọc theo `timestamp` → trùng nội dung **Q-05** của domain-core.

### SCREEN-02 Exam Root — Danh sách Môn học — `examViewMode = 'root'`

**Mục đích:** Cấp gốc của cây nội dung: xem toàn bộ môn, tạo môn mới.

**Use case liên quan: UC-04, UC-24, UC-26** (UC-05 là hành vi rời màn khi click card; UC-26 — xóa môn qua `DeleteConfirmDialog` `[YÊU CẦU MỚI]`).

**Bố cục** — [`L1969-L2102`](ref-ui.tsx#L1969-L2102):

```
┌ div.space-y-6 ───────────────────────────────────────────────────────────────┐
│ ┌ form.neu-card.rounded-2xl.p-5 (chỉ khi showCreateSubjectForm) ──────────┐ │
│ │  “Tạo môn học mới”                                              [X]     │ │
│ │  [Tên môn học ..............]   [● ● ● ● ● ● ● ●] 8 swatch             │ │
│ │                                    [Hủy]  [Lưu môn học]                │ │
│ └──────────────────────────────────────────────────────────────────────────┘ │
│ ┌ grid.grid-cols-1.sm:grid-cols-2.lg:grid-cols-3.gap-5 ───────────────────┐ │
│ │ ┌ SubjectCard ┐┌ SubjectCard ┐┌ SubjectCard ┐                          │ │
│ │ │ [M] 2 bộ đề ││ [C] 2 bộ đề ││ [H] 1 bộ đề │                          │ │
│ │ │ Mạng Máy Tính││ Cấu Trúc…  ││ Hệ Quản Trị │                          │ │
│ │ │ 45 câu      ││ 20 câu      ││ 12 câu      │                          │ │
│ │ │ ● Mở đề   › ││ ● Mở đề   › ││ ● Mở đề   › │                          │ │
│ │ └─────────────┘└─────────────┘└─────────────┘                          │ │
│ └──────────────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Bảng component sử dụng**

| # | Component | Vai trò | Ref |
|---|---|---|---|
| 1 | `Breadcrumb` (root) | Chỉ hiện “root” + CTA “Tạo môn học” | [`L1870-L1967`](ref-ui.tsx#L1870-L1967) |
| 2 | `CreateSubjectForm` | Form inline tạo môn | [`L1975-L2050`](ref-ui.tsx#L1975-L2050) |
| 3 | `ColorSwatchGrid` | 8 màu chọn nhận diện môn | [`L2011-L2030`](ref-ui.tsx#L2011-L2030) |
| 4 | `SubjectCard` × N | Card môn + số bộ đề + tổng câu | [`ref-ui.tsx:L2060-L2098`](ref-ui.tsx#L2060-L2098) |
| 5 | `DeleteConfirmDialog` `[YÊU CẦU MỚI]` | Xác nhận xoá môn (Q-01, soft delete) | [4.58](#458-deleteconfirmdialog) |

**Trạng thái**

- **Rỗng:** nếu `subjects = []` → lưới trống, **không có empty state** (QDS-27).
- **Loading / Error:** không có.
- **Form mở/đóng:** không animation; đóng không xoá tên đang gõ (QDS-26).
- **[CẬP NHẬT Q-01/Q-15 — R2]:** mỗi `SubjectCard` có nút “Xoá môn” (hover/focus mới hiện) → [`DeleteConfirmDialog`](#458-deleteconfirmdialog) → soft delete + về root; tạo môn trùng tên (unique toàn cục) → inline error rose-600 dưới input, không toast — `[YÊU CẦU MỚI]`.

**Responsive:** 1 → 2 (`sm`) → 3 cột (`lg`); form chuyển `md:grid-cols-2`.

**Ghi chú:** mỗi lần điều hướng, wrapper dùng `key={viewResetCounter}` ([`L1868`](ref-ui.tsx#L1868)) → remount toàn view (hiệu ứng vào lại, nhưng cũng xoá state con ngoài dự kiến).

### SCREEN-03 Subject Detail — Danh sách Bộ đề — `examViewMode = 'subject'`

**Mục đích:** Danh sách bộ đề của một môn; vào tổng quan hoặc tạo bộ đề mới.

**Use case liên quan: UC-05, UC-24, UC-26, UC-27** (UC-06 qua CTA “Tạo bộ đề”; UC-26/UC-27 — xóa môn/bộ đề qua `DeleteConfirmDialog` `[YÊU CẦU MỚI]`).

**Bố cục** — [`L2107-L2174`](ref-ui.tsx#L2107-L2174):

```
┌ div.space-y-5 ─────────────────────────────────────────────────────────────┐
│  (rỗng)  ┌ div.neu-card.rounded-3xl.p-12.text-center ─────────────────┐  │
│         │              [📖] 56px .neu-pill                            │  │
│         │   Môn Mạng Máy Tính chưa có bộ đề nào                        │  │
│         │   Hãy nhấn nút “Tạo bộ đề” để soạn câu hỏi…                  │  │
│         │        [ + Tạo bộ đề đầu tiên ]                              │  │
│         └──────────────────────────────────────────────────────────────┘  │
│  (có đề) ┌ grid.grid-cols-1.md:grid-cols-2.gap-5 ─────────────────────┐  │
│         │ ┌ ExamCard ──────────────┐ ┌ ExamCard ──────────────┐       │  │
│         │ │ [42 câu hỏi]  2026-…  │ │ [3 câu hỏi]   2026-…   │       │  │
│         │ │ Đề tổng hợp OSI…      │ │ Ôn tập Routing…        │       │  │
│         │ │ Đã làm 3 lượt • …     │ │ Đã làm 1 lượt • …      │       │  │
│         │ │ Xem tổng quan & Làm › │ │ Xem tổng quan & Làm ›  │       │  │
│         │ └────────────────────────┘ └────────────────────────┘       │  │
│         └──────────────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────────────────────┘
```

**Bảng component sử dụng**

| # | Component | Vai trò | Ref |
|---|---|---|---|
| 1 | `Breadcrumb` (root › môn) | Crumbs + CTA “Tạo bộ đề” | [`L1882-L1965`](ref-ui.tsx#L1882-L1965) |
| 2 | `EmptyState` | Hiện khi môn 0 bộ đề | [`ref-ui.tsx:L2111-L2128`](ref-ui.tsx#L2111-L2128) |
| 3 | `ExamCard` × N | Card bộ đề + số câu + số lượt đã làm | [`L2137-L2168`](ref-ui.tsx#L2137-L2168) |
| 4 | `DeleteConfirmDialog` `[YÊU CẦU MỚI]` | Xác nhận xoá bộ đề (Q-01, soft delete) | [4.58](#458-deleteconfirmdialog) |

**Trạng thái**

- **Rỗng:** có `EmptyState` đầy đủ (khác SCREEN-02).
- **Loading / Error:** không có.
- **Nhiều bộ đề:** lưới 2 cột, không phân trang.
- **[CẬP NHẬT Q-01 — R2]:** mỗi `ExamCard` có nút “Xoá bộ đề” (hover/focus mới hiện) → [`DeleteConfirmDialog`](#458-deleteconfirmdialog); bộ đề đã có lượt làm bài vẫn giữ lịch sử `Attempt` — `[YÊU CẦU MỚI]`. Tên bộ đề trùng trong cùng môn → lỗi inline ở `EditorTitleBar` khi Lưu (Q-15).

**Responsive:** 1 cột <768px, 2 cột từ `md`; CTA wrap dưới breadcrumb.

**Ghi chú:** tiêu đề bộ đề có thể xuống dòng tự do (không `truncate`); ngày tạo hiển thị thô `YYYY-MM-DD HH:mm` — **[CẬP NHẬT Q-06]:** hiển thị theo **giờ Việt Nam** (`Asia/Ho_Chi_Minh`, UTC+7); ref đang để chuỗi UTC từ `toISOString()` ([`L1030`](ref-ui.tsx#L1030), [`L1071`](ref-ui.tsx#L1071)) — khi port phải format lại trước khi render, không hiển thị chuỗi UTC/raw ISO.

### SCREEN-04 Exam Overview — Tổng quan Bộ đề — `examViewMode = 'examDetail'`

**Mục đích:** Xem toàn bộ câu hỏi của bộ đề (ẩn/hiện đáp án), mở lịch sử, sửa đề, bắt đầu làm bài.

**Use case liên quan: UC-15 (đích lưu), UC-16, UC-17, UC-18, UC-24, UC-27 (xóa bộ đề), UC-31 (phiên random qua OVL-02).**

**Bố cục** — [`L2179-L2325`](ref-ui.tsx#L2179-L2325):

```
┌ div.space-y-6 ─────────────────────────────────────────────────────────────────┐
│ ┌ ExamOverviewHeader .neu-card.[26px].p-6 ─────────────────────────────────┐ │
│ │ [● Mạng Máy Tính] [Tổng số: 42 câu]                                      │ │
│ │ h2 Đề tổng hợp OSI, TCP/IP & Chia mạng con                               │ │
│ │ p  Mặc định đáp án được ẩn…                                              │ │
│ │        [👁 Hiện đáp án ◯—] [🕐 Lịch sử] [✎ Sửa đề] [▶ Làm bài kiểm tra] │ │
│ └───────────────────────────────────────────────────────────────────────────┘ │
│ (OVL-05) ┌ AttemptHistoryPanel .neu-card.rounded-2xl ─────────────────────┐  │
│          │ 🕐 Lịch sử làm bài của bộ đề này                            [X] │  │
│          │ [Lần #1 • …   Đúng 23/25 câu   [9.2 điểm]]                      │  │
│          └───────────────────────────────────────────────────────────────┘  │
│ ┌ div.space-y-4 ────────────────────────────────────────────────────────┐   │
│ │ QuestionCard(mode=preview) × N (đáp án ẩn mặc định)                    │   │
│ └───────────────────────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────────────────────────┘
```

**Bảng component sử dụng**

| # | Component | Vai trò | Ref |
|---|---|---|---|
| 1 | `Breadcrumb` (root › môn › bộ đề) | Crumb bộ đề + reset cấp | [`L1904-L1922`](ref-ui.tsx#L1904-L1922) |
| 2 | `ExamOverviewHeader` | Badge môn, tổng số câu, tiêu đề, mô tả | [`L2181-L2203`](ref-ui.tsx#L2181-L2203) |
| 3 | `ShowAnswersSwitch` | Toggle hiện đáp án (mặc định OFF) | [`L2207-L2231`](ref-ui.tsx#L2207-L2231) |
| 4 | `AttemptHistoryPanel` (OVL-05) | Panel lịch sử của bộ đề | [`L2267-L2310`](ref-ui.tsx#L2267-L2310) |
| 5 | `QuestionCard mode="preview"` × N | Danh sách câu hỏi | [`L2313-L2323`](ref-ui.tsx#L2313-L2323) |

**Trạng thái**

- **Rỗng (0 câu):** header vẫn hiện “0 câu”, danh sách trống; nút “Làm bài” mở modal nhưng bấm tiếp không phản hồi ([`ref-ui.tsx:L1083`](ref-ui.tsx#L1083)).
- **Loading / Error:** không có.
- **Lịch sử rỗng:** dòng chữ trong panel (không dùng `EmptyState`).
- **Toggle:** reset về OFF mỗi lần vào lại do `handleNavigateToExamDetail` set `false` ([`L975`](ref-ui.tsx#L975)).
- **[CẬP NHẬT R1/Q-10]:** câu nhiều đáp án đúng hiển thị `QuestionCard mode="preview"` với **checkbox** (không radio) — dữ liệu nhập từ TXT/JSON cho phép nhiều `ans.*`.
- **[CẬP NHẬT R1]:** từ “Làm bài kiểm tra” → OVL-02 giờ có công tắc **“Xáo câu hỏi & đáp án”** (mặc định BẬT) — xem [OVL-02](#ovl-02-quiz-config-modal).

**Responsive:** header `lg:flex-row`; 4 nút wrap; danh sách câu 1 cột.

**Ghi chú:** đây là màn duy nhất có 4 hành động cạnh nhau — cần giữ đúng thứ tự (switch → history → edit → CTA tối).

### SCREEN-05 Exam Editor — Soạn/sửa Bộ đề — `examViewMode = 'examEditor'`

**Mục đích:** Soạn bộ đề bằng 2 cách đồng bộ: sửa trực quan trên card, hoặc dán/chỉnh TXT/JSON.

**Use case liên quan: UC-06, UC-07, UC-08, UC-09, UC-10, UC-11, UC-12, UC-13, UC-14, UC-15, UC-24.**

**Bố cục** — [`L2330-L2564`](ref-ui.tsx#L2330-L2564):

```
┌ div.space-y-5.flex-1.flex.flex-col ──────────────────────────────────────────────────┐
│ ┌ EditorTitleBar .neu-card.rounded-2xl.p-4 ──────────────────────────────────────┐ │
│ │ 📄 [Tên bộ đề …………………………………………]           [42 câu]  [💾 Lưu bộ đề]        │ │
│ └──────────────────────────────────────────────────────────────────────────────────┘ │
│ ┌ grid.grid-cols-1.lg:grid-cols-2.gap-6.flex-1 ─────────────────────────────────┐ │
│ │ ┌ RENDER .neu-card.[26px].p-5.h-[640px] ──────┐ ┌ EDITOR .neu-card.[26px] ───┐ │ │
│ │ │ Render • Trực quan Câu hỏi     [All (42)]▾ │ │ Editor • Đồng bộ Realtime  │ │ │
│ │ │ Click vào câu/đáp án để sửa…              │ │            [txt][json]     │ │ │
│ │ │ ┌ [+ Chèn câu hỏi vào vị trí đầu] (hover)┐ │ │ ┌ Cú pháp: ask : …   ✓ Đồng bộ ┐ │ │
│ │ │ │ QuestionCard(editor) #1                │ │ │ textarea.neu-card-inset      │ │ │
│ │ │ │ ┌ + Chèn câu mới tại đây ┐ (hover)      │ │ │ font-mono …                  │ │ │
│ │ │ │ QuestionCard(editor) #2                │ │ │                              │ │ │
│ │ │ └ overflow-y-auto ────────────────────────┘ │ └────────────────────────────┘ │ │
│ │ └──────────────────────────────────────────────┘ └──────────────────────────────┘ │ │
│ └──────────────────────────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

**Bảng component sử dụng**

| # | Component | Vai trò | Ref |
|---|---|---|---|
| 1 | `Breadcrumb` (root › môn › tiêu đề nháp) | Crumb nháp + reset editor | [`L1924-L1942`](ref-ui.tsx#L1924-L1942) |
| 2 | `EditorTitleBar` | Tên bộ đề, đếm câu, Lưu | [`L2332-L2356`](ref-ui.tsx#L2332-L2356) |
| 3 | `EditorSplitPane` | Khung 2 pane `h-[640px]` | [`L2358-L2562`](ref-ui.tsx#L2358-L2562) |
| 4 | `QuestionNavigatorDialog` (OVL-03 cũ — bản `editor`) `[CẬP NHẬT R3]` | Danh sách câu để nhảy nhanh (popover ref [`L2372-L2431`](ref-ui.tsx#L2372-L2431)) | [4.56](#456-questionnavigatordialog) |
| 5 | `InsertQuestionGap` × (N+1) | Vùng hover chèn câu | [`L2436-L2483`](ref-ui.tsx#L2436-L2483) |
| 6 | `QuestionCard mode="editor"` × N | Sửa ask/option, đổi đáp án, xoá, thêm option | [`L2450-L2470`](ref-ui.tsx#L2450-L2470) |
| 7 | `FormatTabs` | Chuyển `txt`/`json` | [`L2501-L2524`](ref-ui.tsx#L2501-L2524) |
| 8 | `ParseErrorBanner` | Gợi ý cú pháp + trạng thái đồng bộ + **lỗi TXT theo dòng** (R4) | [`L2526-L2547`](ref-ui.tsx#L2526-L2547) |
| 9 | `SyntaxHighlightedTextarea` `[YÊU CẦU MỚI]` (tab TXT) / `CodeEditorTextarea` (tab JSON) | Vùng dán/sửa raw text; TXT tô `ask` đỏ, `ans.` xanh | [4.59](#459-syntaxhighlightedtextarea) |

**Trạng thái**

- **Mới:** 2 câu mẫu, title rỗng, tab `json` ([`L984-L1012`](ref-ui.tsx#L984-L1012)) → không bao giờ mở với 0 câu.
- **Sửa:** clone câu hỏi từ exam hiện tại, title điền sẵn ([`ref-ui.tsx:L1014-L1022`](ref-ui.tsx#L1014-L1022)).
- **Rỗng:** xoá hết câu → pane trái chỉ còn vùng chèn; Lưu bị chặn bằng toast ([`L1025-L1028`](ref-ui.tsx#L1025-L1028)).
- **Lỗi cú pháp:** text giữ nguyên, cờ `parseError` bật, hint đổi chữ amber; **không** chặn Lưu.
- **[CẬP NHẬT R4] Lỗi TXT theo dòng:** parse TXT báo từng dòng vi phạm (mỗi câu cần ≥ 2 lựa chọn và ≥ 1 `ans.*`); `ParseErrorBanner` liệt kê “Dòng N: …”, dòng tương ứng tô nền rose trong [`SyntaxHighlightedTextarea`](#459-syntaxhighlightedtextarea); gõ vẫn tự do, Lưu bị chặn khi còn lỗi — `[YÊU CẦU MỚI]`.
- **Loading / Error:** không có.

**Responsive:** `lg:grid-cols-2`; dưới `lg` xếp dọc (2 × 640px); header bar chuyển `sm:flex-row`.

**Ghi chú:** đây là màn phức tạp nhất — 9 component, 2 nguồn sự thật đồng bộ 2 chiều, 11 UC. Mọi thay đổi UI ở đây phải giữ nguyên hợp đồng `editorQuestions ↔ rawTextCode`. **[CẬP NHẬT R4]** Hợp đồng TXT đợt 2: tokenize theo regex `/^ask\s*:/i`, `/^ans\.\*/i`, `/^ans\./i` trên dòng đã trim (khớp parser ref [`L92-L141`](ref-ui.tsx#L92-L141)); parser BE (Tauri/Rust) phải dùng regex tương đương để highlight không “nói dối”.

### SCREEN-06 Quiz Taking — Làm bài — `examViewMode = 'quizActive'`

**Mục đích:** Làm bài trong một phiên: chọn đáp án, theo dõi thời gian/tiến độ, nhảy câu, nộp bài.

**Use case liên quan: UC-18 (đầu vào), UC-19, UC-20, UC-29, UC-30** (kèm OVL-04; UC-29 — `QuestionNavigatorDialog`, UC-30 — `SubmitWarningDialog` `[YÊU CẦU MỚI]`).

**Bố cục** — [`L2569-L2671`](ref-ui.tsx#L2569-L2671):

```
┌ div.space-y-6 ────────────────────────────────────────────────────────────────┐
│ ┌ QuizControlBar .neu-card.sticky.top-2.z-20 ─────────────────────────────┐ │
│ │ [🕐 12:34]  Đã chọn: 7 / 25 câu     [📋 Danh sách câu] [✔ Nộp bài]   │ │
│ │             ▓▓▓▓▓▓▓░░░░░░░░░░ w-36/48 h-2                             │ │
│ └────────────────────────────────────────────────────────────────────────┘ │
│ ┌ div.space-y-4 ────────────────────────────────────────────────────────┐  │
│ │ [Câu 1]  Nội dung câu hỏi?                                             │  │
│ │  ● A. …   ○ B. …   ○ C. …   ○ D. …    ← click cả hàng hoặc radio      │  │
│ │ [Câu 2] …                                                             │  │
│ └───────────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Bảng component sử dụng**

| # | Component | Vai trò | Ref |
|---|---|---|---|
| 1 | `QuizControlBar` | Sticky bar: đồng hồ, tiến độ, “Danh sách câu”, Nộp (`SubmitWarningDialog`) | [`L2571-L2646`](ref-ui.tsx#L2571-L2646) |
| 2 | `QuizProgress` | Văn bản “Đã chọn” + thanh tiến độ | [`L2581-L2598`](ref-ui.tsx#L2581-L2598) |
| 3 | `QuestionNavigatorDialog` (bản `quiz`, OVL-04 cũ) `[CẬP NHẬT R3]` | Lưới số câu: đã làm / chưa làm / câu hiện tại + flag `[YÊU CẦU MỚI]` | [4.56](#456-questionnavigatordialog) (ref [`L2601-L2636`](ref-ui.tsx#L2601-L2636)) |
| 4 | `QuestionCard mode="quiz"` × N | Chọn đáp án (radio hoặc **checkbox** với câu đa đáp án — R1) | [`ref-ui.tsx:L2649-L2669`](ref-ui.tsx#L2649-L2669) |
| 5 | `SubmitWarningDialog` `[YÊU CẦU MỚI]` | Cảnh báo nộp bài còn câu trống, liệt kê số thứ tự (Q-11) | [4.57](#457-submitwarningdialog) |

**Trạng thái**

- **Chưa chọn gì:** `0 / N`, thanh 0%; bấm “Nộp bài” → [`SubmitWarningDialog`](#457-submitwarningdialog) liệt kê đủ N câu trống → “Vẫn nộp” cho điểm 0 (Q-11 — ref thì nộp ngay không cảnh báo).
- **Đã chọn một phần:** thanh tăng theo số câu có ≥ 1 đáp án được chọn (đếm theo câu, không theo số lựa chọn — R1).
- **Đã chọn hết:** 100% (không có nhãn “hoàn tất”); Nộp bài nộp trực tiếp, không mở dialog `[GIẢ ĐỊNH]`.
- **Câu nhiều đáp án đúng (R1/Q-10):** render **checkbox** thay radio, chọn đồng thời nhiều đáp án.
- **Thứ tự phiên (R1):** ngẫu nhiên (mặc định) hoặc theo thứ tự gốc (tắt “Xáo câu hỏi & đáp án”) — **thứ tự được lưu theo `Attempt`**.
- **Loading / Error:** không có; không auto-submit, không giới hạn thời gian.

**Responsive:** bar `flex-wrap`, progress cố định `w-36 sm:w-48`; danh sách 1 cột.

**Ghi chú:** câu hỏi được **nhân bản + shuffle** khi bắt đầu; id mới `quiz-q-{i}-{gốc}` ([`L1093-L1106`](ref-ui.tsx#L1093-L1106)) nên đáp án không thể gắn nhầm sang câu gốc. **[CẬP NHẬT R1]** Hợp đồng mới: `randomize` mặc định BẬT; **N ≥ tổng số câu → lấy hết nhưng VẪN xáo**; **bỏ** cơ chế lặp pool + nhãn “(Lượt ôn #k)” của ref `[YÊU CẦU MỚI]`; thứ tự câu của lượt lưu theo `Attempt` để SCREEN-07 hiển thị đúng thứ tự đã làm.

### SCREEN-07 Quiz Result — Kết quả & Xem lại — `examViewMode = 'quizResult'`

**Mục đích:** Tổng kết điểm, so sánh với lịch sử, xem lại từng câu đúng/sai, làm lại.

**Use case liên quan: UC-20, UC-21, UC-22** (OVL-02 khi “Làm lại đề”).

**Bố cục** — [`L2676-L2781`](ref-ui.tsx#L2676-L2781):

```
┌ div.space-y-6 ────────────────────────────────────────────────────────────────┐
│ ┌ ScoreBanner .neu-card.[28px].p-6.sm:p-8 ────────────────────────────────┐ │
│ │   ╭─────╮  [Hoàn thành bài kiểm tra]                                     │ │
│ │   │ 9.2 │  h2 Đề tổng hợp OSI, TCP/IP & Chia mạng con                    │ │
│ │   │ĐIỂM/10│ “Trả lời đúng 23/25 câu • Thời gian: 410 giây”             │ │
│ │   ╰─────╯            [← Về tổng quan đề]  [↺ Làm lại đề]              │ │
│ └──────────────────────────────────────────────────────────────────────────┘ │
│ ┌ “Lịch sử làm bài của bộ đề này” .neu-card ────────────────────────────┐  │
│ │ [#3 … [Vừa xong]  Đúng 20/25 câu  8.0 điểm]  ← nền trắng, viền đậm    │  │
│ │ [#2 …             Đúng 26/32 câu  8.1 điểm]  ← inset                    │  │
│ └──────────────────────────────────────────────────────────────────────────┘  │
│ h3 “Chi tiết đáp án bài làm”                                                   │
│ ┌ div.space-y-4 ────────────────────────────────────────────────────────┐   │
│ │ QuestionCard(mode=result) × N                                          │   │
│ └───────────────────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Bảng component sử dụng**

| # | Component | Vai trò | Ref |
|---|---|---|---|
| 1 | `Breadcrumb` (root › môn › bộ đề) | Vẫn hiển thị crumb bộ đề | [`L1904-L1922`](ref-ui.tsx#L1904-L1922) |
| 2 | `ScoreBanner` | Điểm hệ 10 + thông tin + 2 CTA | [`L2678-L2725`](ref-ui.tsx#L2678-L2725) |
| 3 | `ResultHistoryRow` × N | Lịch sử các lượt, nổi bật lượt mới | [`L2727-L2763`](ref-ui.tsx#L2727-L2763) |
| 4 | `ResultReviewRow` / `QuestionCard mode="result"` × N | Xem lại đáp án | [`ref-ui.tsx:L2765-L2779`](ref-ui.tsx#L2765-L2779) |

**Trạng thái**

- **Vừa nộp:** `lastQuizResult` tồn tại → banner + badge “Vừa xong”.
- **Điểm 0:** banner vẫn xanh “Hoàn thành”, không có trạng thái “chưa đạt”.
- **Rỗng:** không thể vào `quizResult` mà không có kết quả (`lastQuizResult` null → view không render).
- **[CẬP NHẬT R1/Q-10]:** câu nhiều đáp án render **checkbox**; hiển thị ✓/✗ theo từng lựa chọn, đúng khi tập đáp án chọn == tập đáp án đúng (rule chấm của domain-core Q-10).
- **Loading / Error:** không có.

**Responsive:** banner `md:flex-row`; bảng lịch sử là các row `justify-between` (không phải `<table>`) → dễ vỡ khi hẹp.

**Ghi chú:** thời lượng hiển thị bằng **giây thô** (`durationSec`) — QDS-37 (đề xuất format `mm:ss`). **[CẬP NHẬT Q-06]:** mọi mốc thời gian hiển thị ở đây (thời điểm nộp trong lịch sử, thời lượng) theo **giờ Việt Nam** `Asia/Ho_Chi_Minh` (UTC+7); ref đang mix UTC (`createdAt` sinh bằng `toISOString()` [`L1030`](ref-ui.tsx#L1030)) và giờ máy local (`timestamp` [`L1128-L1135`](ref-ui.tsx#L1128-L1135)) — port phải chuẩn hoá về 1 hàm format trong `lib/format/time.ts`.

### SCREEN-08 AI Guide — `activeTab = 'guide'`

**Mục đích:** Hướng dẫn 3 bước dùng AI ngoài để sinh bộ đề + cung cấp prompt chuẩn để copy.

**Use case liên quan: UC-23.**

**Bố cục** — [`L2788-L2897`](ref-ui.tsx#L2788-L2897):

```
┌ div.space-y-6.animate-fadeIn ─────────────────────────────────────────────────┐
│ ┌ section.neu-card.[26px].p-6.sm:p-8 ─────────────────────────────────────┐ │
│ │ [✨] Hướng dẫn Tạo Bộ Đề Tự Động với AI                                 │ │
│ │      “Chỉ mất 30 giây để biến file PDF/Word/Slide…”                    │ │
│ │ ┌ GuideStepCard ┐┌ GuideStepCard ┐┌ GuideStepCard ┐                   │ │
│ │ │ Bước 1        ││ Bước 2        ││ Bước 3        │                   │ │
│ │ │ Truy cập AI   ││ Đính kèm File ││ Dán Prompt    │                   │ │
│ │ │ Gemini ↗      ││ PDF/DOCX/TXT  ││ → Đề kiểm tra │                   │ │
│ │ └───────────────┘└───────────────┘└───────────────┘                   │ │
│ └──────────────────────────────────────────────────────────────────────────┘ │
│ ┌ section.neu-card.[26px].p-6 ───────────────────────────────────────────┐  │
│ │ “Khung Prompt JSON Chuẩn Cố Định”              [📋 Sao chép Prompt]    │  │
│ │ ┌ pre.neu-card-inset.p-5.font-mono ───────────────────────────────────┐ │  │
│ │ │ Bạn là một chuyên gia biên soạn đề kiểm tra… (FIXED_AI_PROMPT)   │ │  │
│ │ └─────────────────────────────────────────────────────────────────────┘ │  │
│ └──────────────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Bảng component sử dụng**

| # | Component | Vai trò | Ref |
|---|---|---|---|
| 1 | `GuideStepCard` × 3 | 3 bước, link ngoài + inline chuyển tab | [`L2805-L2867`](ref-ui.tsx#L2805-L2867) |
| 2 | `PromptBox` | Hiển thị `FIXED_AI_PROMPT` trong `<pre>` | [`ref-ui.tsx:L2892-L2894`](ref-ui.tsx#L2892-L2894) |
| 3 | `CopyPromptButton` | Copy prompt + toast | [`L2883-L2889`](ref-ui.tsx#L2883-L2889) |

**Trạng thái**

- **Rỗng / Loading / Error:** không có — nội dung tĩnh.
- **Copy thất bại:** vẫn báo thành công (QDS-38).
- **Link ngoài:** mở tab mới, không thay đổi app.

**Responsive:** 3 bước `md:grid-cols-3`, dưới đó xếp dọc; `pre` cuộn ngang nếu cần.

**Ghi chú:** prompt nhắc AI trả **4 lựa chọn, đúng 1** + mảng JSON và định dạng TXT dự phòng ([`L468-L500`](ref-ui.tsx#L468-L500)) — khớp hợp đồng parse ở SCREEN-05.

### SCREEN-09 Trash (Thùng rác) — `activeTab = 'trash'` (đợt 3)

> `[YÊU CẦU MỚI]` — **không có trong ref-ui**; soft delete đã tồn tại ở Subject/Exam (Q-01) nên cần màn để khôi phục/xóa vĩnh viễn.

**Mục đích:** Quản lý các Môn/Bộ đề đã xóa mềm: xem, tìm kiếm/lọc, khôi phục (đổi tên khi xung đột unique), xóa vĩnh viễn, dọn sạch; badge số mục trên tab sidebar.

**Use case liên quan: UC-33, UC-34, UC-35, UC-36, UC-37, UC-38.**

**Bố cục** — không có ref; thiết kế theo pattern SCREEN-02/03 + `TrashList` (4.60):

```
┌ div.space-y-6 ────────────────────────────────────────────────────────────────┐
│ ┌ header.neu-card.rounded-2xl.p-4 ────────────────────────────────────────┐ │
│ │  🗑 Thùng rác   [🔍 Tìm kiếm theo tên …] (inset)   [Tất cả|Môn|Bộ đề]  │ │
│ └──────────────────────────────────────────────────────────────────────────┘ │
│ ┌ section.neu-card.rounded-2xl.p-5 ───────────────────────────────────────┐ │
│ │  “MÔN ĐÃ XÓA (N)” (uppercase xs slate-400)                             │ │
│ │  TrashItemRow × N   (hoặc EmptyState “Chưa có môn nào bị xóa”)           │ │
│ └──────────────────────────────────────────────────────────────────────────┘ │
│ ┌ section.neu-card.rounded-2xl.p-5 ───────────────────────────────────────┐ │
│ │  “BỘ ĐỀ ĐÃ XÓA (M)”                                                    │ │
│ │  TrashItemRow × M   (hoặc EmptyState)                                    │ │
│ │  [Dọn sạch thùng rác] .neu-dark-btn tone=rose (disabled khi rỗng)       │ │
│ └──────────────────────────────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────────────────────────────┘
```

**Bảng component sử dụng**

| # | Component | Vai trò | Ref |
|---|---|---|---|
| 1 | `Breadcrumb` (root › Thùng rác) | Crumb “Thùng rác” (không có CTA tạo mới) | — (đợt 3) |
| 2 | `TrashList` | 2 nhóm + tìm kiếm/lọc + 5 trạng thái | [4.60](#460-trashlist) |
| 3 | `TrashItemRow` × (N+M) | Một dòng mục thùng rác | [4.61](#461-trashitemrow) |
| 4 | `RestoreDialog` | Khôi phục, đổi tên khi xung đột | [4.62](#462-restoredialog) |
| 5 | `DeleteConfirmDialog` (biến thể xóa vĩnh viễn) | Xác nhận xóa vĩnh viễn | [4.58](#458-deleteconfirmdialog) |
| 6 | `NavBadge` | Badge số mục trên tab sidebar (toàn cục) | [4.63](#463-navbadge) |

**Trạng thái**

- **Rỗng:** 2 section rỗng + EmptyState (icon `Trash2` 56px, “Thùng rác trống”, mô tả); nút “Dọn sạch” disabled; `NavBadge` ẩn.
- **Loading:** skeleton 3 hàng pulse trong mỗi section.
- **Data:** 2 nhóm + hàng mục; badge = tổng N+M.
- **Error:** banner rose “Không tải được thùng rác. [Thử lại]” trong mỗi section, giữ dữ liệu cũ nếu có.
- **Processing:** hàng đang xử lý `opacity-60 pointer-events-none` + spinner; nút “Dọn sạch” disabled + spinner.
- **Tìm kiếm không kết quả:** “Không tìm thấy mục nào khớp.” trong nhóm đang lọc.

**Responsive:** tìm kiếm + filter wrap; hàng mục `flex-wrap` ở <768; tên `truncate`.

**Ghi chú:** thời điểm xóa hiển thị theo giờ VN (Q-06); số câu/lượt là snapshot tại thời điểm xóa; badge cập nhật realtime khi soft delete (từ SCREEN-02/03) / khôi phục / xóa vĩnh viễn.

### OVL-01 Toast

**Mục đích:** Phản hồi ngắn cho mọi hành động có/không thành công (tạo môn, lưu đề, nộp bài, reset, copy).

**Use case liên quan: UC-04, UC-15, UC-20, UC-23, UC-24, UC-38 (toast hoàn tác sau xóa mềm)** (mọi toast trong [`domain-core.md` §5.8](domain-core.md)).

**Vị trí & vòng đời:** `fixed bottom-6 right-6 z-50`, nền `.neu-dark-btn`, icon `Sparkles` emerald, `animate-bounce`; hiện **2800ms** rồi tự ẩn — [`ref-ui.tsx:L1336-L1342`](ref-ui.tsx#L1336-L1342), [`L847-L853`](ref-ui.tsx#L847-L853).

| Component | Vai trò | Ref |
|---|---|---|
| `Toast` | Khối thông báo duy nhất (1 message/lúc) | [`L1336-L1342`](ref-ui.tsx#L1336-L1342) |

**Trạng thái:** mỗi message mới **ghi đè** message cũ; không có success/error/warning variant; không có nút đóng/pause.

**A11y:** không `role="status"`, không `aria-live` → screen reader không đọc.

### OVL-02 Quiz Config Modal

**Mục đích:** Chọn số câu trước khi tạo phiên làm bài. **[CẬP NHẬT R1]** Đợt 2 thêm công tắc **“Xáo câu hỏi & đáp án”** (mặc định BẬT) — `[YÊU CẦU MỚI]`.

**Use case liên quan: UC-18, UC-22, UC-31.**

**Vị trí & vòng đời:** `fixed inset-0 z-50` backdrop `slate-900/35`; panel `neu-shell rounded-[28px] max-w-md`; mở từ “Làm bài kiểm tra” (SCREEN-04) hoặc “Làm lại đề” (SCREEN-07); đóng bằng X / “Đóng” / “Làm bài ngay” — [`ref-ui.tsx:L2903-L2990`](ref-ui.tsx#L2903-L2990).

| Component | Vai trò | Ref |
|---|---|---|
| `ModalShell` | Backdrop + panel | [`L2904-L2905`](ref-ui.tsx#L2904-L2905) |
| `QuizConfigModal` | Nội dung + input + 2 nút | [`L2906-L2988`](ref-ui.tsx#L2906-L2988) |
| `PresetCountGrid` | 25 / 32 / 40 / Tất cả | [`L2936-L2970`](ref-ui.tsx#L2936-L2970) |
| `ShowAnswersSwitch`-style switch “Xáo câu hỏi & đáp án” `[YÊU CẦU MỚI]` | Bật/tắt random thứ tự — mặc định ON | [4.53](#453-quizconfigmodal--ovl-02) |

**Trạng thái:** mở/đóng tức thời (không animation vì `fadeIn` chưa định nghĩa); không khoá scroll; không focus trap; click backdrop **không** đóng; `Escape` **không** đóng. **[CẬP NHẬT R1]** Hợp đồng bắt đầu phiên: `requestedCount = min(N, pool.length)` — **N ≥ tổng số câu → lấy hết nhưng vẫn xáo**; tắt công tắc → giữ thứ tự gốc; **bỏ** cơ chế lặp “(Lượt ôn #k)” của ref [`L1093-L1106`](ref-ui.tsx#L1093-L1106) `[YÊU CẦU MỚI]`; thứ tự câu lưu theo `Attempt`.

### OVL-03 All Questions (editor) — bản `editor` của `QuestionNavigatorDialog`

> **[CẬP NHẬT R3]:** thống nhất tên gọi — 2 overlay ref dùng chung tên `QuestionJumpPopover` nay gộp thành **một** component [`QuestionNavigatorDialog`](#456-questionnavigatordialog) ([4.56](#456-questionnavigatordialog)); mã OVL-03 giữ để truy vết. Khi port, **không** tách 2 popover.

**Mục đích:** Nhảy nhanh tới câu bất kỳ khi soạn 40+ câu.

**Use case liên quan: UC-08.**

**Vị trí & vòng đời (ref):** popover `absolute right-0 mt-2 w-72 max-h-80 z-30` neo vào nút `All (n)` ở header pane Render; đóng khi chọn câu hoặc bấm X; **không** đóng khi click ngoài/Escape — [`ref-ui.tsx:L2372-L2431`](ref-ui.tsx#L2372-L2431). **Bản port:** dialog `max-w-lg` + backdrop, đóng bằng Escape/backdrop/X.

| Component | Vai trò | Ref |
|---|---|---|
| `QuestionJumpPopover` (editor) → **`QuestionNavigatorDialog` variant `editor`** | Lưới **4 cột** số câu + list trích nội dung | [`L2385-L2429`](ref-ui.tsx#L2385-L2429), [4.56](#456-questionnavigatordialog) |

**Trạng thái:** ref không đánh dấu câu hiện tại; 0 câu → panel rỗng. **Khác bản quiz:** có list text trích, không có trạng thái đã/chưa làm, không flag.

### OVL-04 All Questions (quiz) — bản `quiz` của `QuestionNavigatorDialog`

> **[CẬP NHẬT R3]:** cùng component [`QuestionNavigatorDialog`](#456-questionnavigatordialog) với OVL-03 (DRY); mã OVL-04 giữ để truy vết. Nút mở nâng cấp thành **“Danh sách câu”** trong `QuizControlBar`.

**Mục đích:** Nhảy nhanh giữa các câu và biết câu nào đã trả lời.

**Use case liên quan: UC-19.**

**Vị trí & vòng đời (ref):** popover `absolute right-28 top-12 w-64 z-30` trong cụm phải của QuizControlBar; đóng khi chọn câu; không đóng khi click ngoài — [`ref-ui.tsx:L2601-L2636`](ref-ui.tsx#L2601-L2636). **Bản port:** dialog + backdrop, Escape, focus trap, scroll+highlight 2.2s khi chọn.

| Component | Vai trò | Ref |
|---|---|---|
| `QuestionJumpPopover` (quiz) → **`QuestionNavigatorDialog` variant `quiz`** | Lưới **5 cột**, ô đã trả lời nền than chì + `✓`; thêm câu hiện tại (ring) + flag `[YÊU CẦU MỚI]` | [`L2610-L2635`](ref-ui.tsx#L2610-L2635), [4.56](#456-questionnavigatordialog) |

**Trạng thái:** `answered` ref dựa trên `Boolean(quizUserAnswers[q.id])` → chỉ màu, không dấu ✓ (QDS-36 → đóng khi port: thêm `✓`); **khác bản editor:** không list text trích, có trạng thái đã/chưa làm + câu hiện tại + flag.

### OVL-05 Attempt History panel

**Mục đích:** Xem các lượt đã làm của bộ đề đang mở.

**Use case liên quan: UC-17.**

**Vị trí & vòng đời:** **không phải overlay nổi** — panel chèn vào luồng DOM ngay dưới `ExamOverviewHeader`; toggle bằng nút “Lịch sử làm bài”, đóng bằng X hoặc bấm lại nút; tự đóng khi đổi bộ đề — [`ref-ui.tsx:L2267-L2310`](ref-ui.tsx#L2267-L2310), [`L976`](ref-ui.tsx#L976).

| Component | Vai trò | Ref |
|---|---|---|
| `AttemptHistoryPanel` | Header + danh sách row inset + empty text | [`L2268-L2310`](ref-ui.tsx#L2268-L2310) |

**Trạng thái:** rỗng → “Bạn chưa làm bài kiểm tra nào thuộc bộ đề này.”; nhiều lượt → danh sách dài không giới hạn.

### Dialog đợt 2 (chưa gán mã OVL — `[YÊU CẦU MỚI]`)

Bốn overlay mới của đợt 2 **chưa gán mã OVL** (tránh đụng mã với tài liệu FE/BE khác); truy vết qua component:

| Overlay | Component (mục 4) | Mở từ | Tái sử dụng | Quyết định |
|---|---|---|---|---|
| Danh sách câu (editor / quiz) | [`QuestionNavigatorDialog`](#456-questionnavigatordialog) (4.56) | Nút “All (n)” (SCREEN-05) / “Danh sách câu” (SCREEN-06) | Lưới số tách con `QuestionNumberGrid` | R3 — thay OVL-03/OVL-04 |
| Cảnh báo nộp bài | [`SubmitWarningDialog`](#457-submitwarningdialog) (4.57) | Nút “Nộp bài” (SCREEN-06) | `QuestionNumberGrid` (danh sách số câu trống) | Q-11 / R3 |
| Xác nhận xoá môn/bộ đề | [`DeleteConfirmDialog`](#458-deleteconfirmdialog) (4.58) | SubjectCard (SCREEN-02), ExamCard (SCREEN-03) | — | Q-01 |
| Khôi phục mục thùng rác | [`RestoreDialog`](#462-restoredialog) (4.62) | `TrashItemRow` (SCREEN-09) | input đổi tên khi xung đột unique | đợt 3 |
| Xác nhận xóa vĩnh viễn | [`DeleteConfirmDialog`](#458-deleteconfirmdialog) (biến thể vĩnh viễn) (4.58) | `TrashItemRow`, “Dọn sạch” (SCREEN-09) | — | đợt 3 |
| Menu chọn giao diện | menu của [`ThemeToggle`](#455-themetoggle) (4.55) | Nút ThemeToggle ở Sidebar (toàn cục) | pattern [6.3](#63-popover--dropdown-và-panel-mở-rộng) | R2 |

### Ghi chú: KHÔNG có màn hình Settings (Q-13 / Q-14 — ĐÃ BỊ LOẠI BỎ)

**[CẬP NHẬT đợt 2 — R2]** Trong `ref-ui.tsx` **không tồn tại** màn hình/route Settings: nút `⚙` ở đáy sidebar chỉ gọi `triggerToast('Hệ thống đang ở chế độ giao diện Neumorphic Soft UI')` — [`ref-ui.tsx:L1466-L1472`](ref-ui.tsx#L1466-L1472); nút `⏻` (Power) gọi `handleResetRoot()` — [`ref-ui.tsx:L1473-L1479`](ref-ui.tsx#L1473-L1479). Không có panel, modal, tab hay state `settings` nào. Theo quyết định R2:

- **Cả hai nút đã bị loại bỏ khỏi sidebar** và thay bằng [`ThemeToggle`](#455-themetoggle) (4.55) — nút utility duy nhất.
- **Q-13** (Power thoát/reset điều hướng) và **Q-14** (Settings có màn hình thật) **đã đóng** — không còn trong phạm vi sản phẩm; không cần ước lượng sprint cho chúng.
- Cài đặt **duy nhất** đợt 2 là giao diện: lưu ở bảng `app_settings` key `theme` (`light|dark|system`) `[YÊU CẦU MỚI]` — bảng này **đã có** trong `db.dbml` — `app_settings` (key/value/updated_at, seed `theme=system`); command `setting_get`/`setting_set` có trong structure-be §6.2 (**QDS-47 ĐÃ CHỐT**).
- Reset điều hướng (cái mà Power giả vờ làm) đã có sẵn qua **breadcrumb** (UC-24).
- **Đừng** dựng lại nút Settings/Power hay bất kỳ màn Settings nào trong sprint hiện tại.

### Bảng truy vết Screen ↔ Component ↔ Use case

| Screen | Component chính (mục 4) | UC |
|---|---|---|
| **SCREEN-01** Overview | `AppShell`, `PeriodTabs`, `MetricCard` ×4, `ChartMetricToggle`, `ComboChart`, `DonutGauge`, `DonutLegend`, `RecentAttemptList`, `RecentAttemptRow`, `ScrollArea` | UC-01, UC-02, UC-03, UC-32 |
| **SCREEN-02** Exam Root | `Breadcrumb`, `PrimaryActionButton`, `CreateSubjectForm`, `ColorSwatchGrid`, `SubjectCard`, `DeleteConfirmDialog` `[YÊU CẦU MỚI]` (Q-01) | UC-04, UC-24, UC-26 |
| **SCREEN-03** Subject Detail | `Breadcrumb`, `PrimaryActionButton`, `EmptyState`, `ExamCard`, `DeleteConfirmDialog` `[YÊU CẦU MỚI]` (Q-01) | UC-05, UC-24, UC-26, UC-27 |
| **SCREEN-04** Exam Overview | `Breadcrumb`, `ExamOverviewHeader`, `ShowAnswersSwitch`, `AttemptHistoryPanel`, `QuestionCard` (preview), `OptionRow` | UC-15, UC-16, UC-17, UC-18, UC-24, UC-27, UC-31 |
| **SCREEN-05** Exam Editor | `Breadcrumb`, `EditorTitleBar`, `EditorSplitPane`, **`QuestionNavigatorDialog` (OVL-03 cũ, bản `editor`)**, `InsertQuestionGap`, `QuestionCard` (editor), `InlineEditableText`, `AnswerBadge`, `FormatTabs`, `ParseErrorBanner`, **`SyntaxHighlightedTextarea` `[YÊU CẦU MỚI]` (TXT)** / `CodeEditorTextarea` (JSON) | UC-06 … UC-15, UC-24 |
| **SCREEN-06** Quiz Taking | `QuizControlBar`, `QuizProgress`, **`QuestionNavigatorDialog` (OVL-04 cũ, bản `quiz`)**, `QuestionCard` (quiz), `OptionRow`, **`SubmitWarningDialog` `[YÊU CẦU MỚI]` (Q-11)**, `Toast` | UC-18, UC-19, UC-20, UC-29, UC-30 |
| **SCREEN-07** Quiz Result | `ScoreBanner`, `ResultHistoryRow`, `ResultReviewRow`, `QuestionCard` (result), `Toast` | UC-20, UC-21, UC-22 |
| **SCREEN-08** AI Guide | `GuideStepCard` ×3, `PromptBox`, `CopyPromptButton`, `Toast` | UC-23 |
| **SCREEN-09** Trash (Thùng rác) `[YÊU CẦU MỚI]` | `Breadcrumb`, `TrashList`, `TrashItemRow`, `RestoreDialog`, `DeleteConfirmDialog` (biến thể xóa vĩnh viễn), `NavBadge` (toàn cục) | UC-33, UC-34, UC-35, UC-36, UC-37, UC-38 |

**Component toàn cục (không gắn một screen):** `AppShell`, `Sidebar`, `NavItem`, `BrandLogo`, `SidebarToggle`, `ProfileCard`, **`ThemeToggle`** `[YÊU CẦU MỚI]` (R2 — utility đáy sidebar, có ở mọi màn hình), **`NavBadge`** `[YÊU CẦU MỚI]` (đợt 3 — badge số mục trên tab Thùng rác), `Toast` (OVL-01), `ModalShell`.

**Kiểm tra phủ (đợt 3 — 38 UC):** 38/38 UC đều có ít nhất một screen hoặc overlay ánh xạ (UC-01..03, UC-32 → S01; UC-04, UC-26 → S02; UC-05, UC-26, UC-27 → S03; UC-06..15 → S05; UC-16..18, UC-27, UC-31 → S04+OVL-02; UC-19, UC-29, UC-30 → S06; UC-20..22 → S07; UC-23 → S08; UC-24 → S02..S05 + Breadcrumb; UC-25, UC-28 → Sidebar toàn cục; UC-33..UC-38 → S09 Trash). Component mới đợt 2 ánh xạ: `ThemeToggle` → Sidebar toàn cục (R2, UC-28); `QuestionNavigatorDialog` → S05 (UC-08) + S06 (UC-19/UC-29, thay OVL-03/OVL-04); `SubmitWarningDialog` → S06 (UC-20/UC-30, Q-11); `DeleteConfirmDialog` → S02 (UC-04/UC-26) + S03 (UC-05/UC-26, UC-27, Q-01) + S09 (biến thể vĩnh viễn, UC-36); `SyntaxHighlightedTextarea` → S05 (UC-13, R4). Component mới đợt 3 ánh xạ: `TrashList`/`TrashItemRow`/`RestoreDialog`/`NavBadge` → S09 (UC-33..UC-38). Các quyết định mới đợt 3 nay đã có UC riêng trong domain-core: thùng rác/khôi phục → **UC-33..UC-38**, xáo option → **BR-72**, xóa vĩnh viễn transaction → **NFR-18**.

---

## 6. Pattern tương tác chung

### 6.1 Modal / dialog

| Khía cạnh | Hiện trạng trong ref | Đề xuất `[GIẢ ĐỊNH]` |
|---|---|---|
| Mở | State boolean trong `App` (`showQuizConfigModal`), render có điều kiện | Tách `ModalShell` nhận `open` |
| Lớp phủ | `fixed inset-0 z-50 bg-slate-900/35 backdrop-blur-xs` ([`L2904`](ref-ui.tsx#L2904)) | `bg-slate-900/40` + blur 4px |
| Đóng | Chỉ nút X / nút “Đóng” / hành động chính | Thêm backdrop click + `Escape` |
| Focus | Không dời focus, không trap, không trả focus | Focus vào phần tử đầu, trap `Tab`, trả focus khi đóng |
| Scroll | Body vẫn cuộn sau lớp phủ | Khoá scroll + `overscroll-contain` |
| Animation | `animate-fadeIn` (không có keyframes) | 150ms opacity + scale 0.98→1 |
| A11y | Không `role="dialog"`, không `aria-modal`, không `aria-labelledby` | Bổ sung đủ |

Ref: [`L2903-L2991`](ref-ui.tsx#L2903-L2991). Chi tiết QDS-06, QDS-39.

**[CẬP NHẬT R3 — đợt 2]:** 3 dialog mới ([`SubmitWarningDialog`](#457-submitwarningdialog), [`DeleteConfirmDialog`](#458-deleteconfirmdialog), [`QuestionNavigatorDialog`](#456-questionnavigatordialog)) là **consumer đầu tiên** của `ModalShell` — chúng **bắt buộc** đạt đủ cột “Đề xuất”: Escape + backdrop click + focus trap + trả focus + `role="dialog"`/`aria-modal`/`aria-labelledby`. Ref chỉ có 1 modal nên các chuẩn này chưa từng được áp — đừng copy hành vi ref cho dialog mới.

### 6.2 Toast

- **Một** instance toàn cục; message mới ghi đè message cũ; tự ẩn sau `2800ms` ([`L848-L853`](ref-ui.tsx#L848-L853)).
- Vị trí `bottom-6 right-6`, `z-50`, nền `.neu-dark-btn`, icon `Sparkles` `emerald-400`.
- Không có variant (success/error), không nút đóng, không pause on hover, không xếp hàng.
- Timer cũ **không** bị clear khi có message mới → message mới có thể bị ẩn sớm bởi timer cũ (QDS-14).
- Không `role="status"`/`aria-live` → không được đọc (QDS-04 về a11y nói chung).

### 6.3 Popover / dropdown (và panel mở rộng)

| Overlay | Neo / vị trí | Kích thước | Đóng khi | Không đóng khi | Ref |
|---|---|---|---|---|---|
| OVL-03 All (editor) | `absolute right-0 mt-2` trong header pane | `w-72 max-h-80` | Chọn câu, X, bấm lại nút | Click ngoài, Escape | [`L2386`](ref-ui.tsx#L2386) |
| OVL-04 All (quiz) | `absolute right-28 top-12` trong cụm nút | `w-64 max-h-56` | Chọn câu, bấm lại nút | Click ngoài, Escape | [`L2611`](ref-ui.tsx#L2611) |
| OVL-05 History | **Trong luồng DOM** dưới header | full width | X, bấm lại nút, đổi exam | — | [`L2269`](ref-ui.tsx#L2269) |

Quy tắc chung đang dùng: **toggle bằng chính nút mở**, không có lớp bắt click ngoài, không portal (phụ thuộc `overflow` của cha). Khi refactor nên dùng component `Popover` có `useClickOutside` + `Escape` (QDS-35).

**[CẬP NHẬT R3/R2 — đợt 2]:** (1) OVL-03/OVL-04 **không còn là popover** — nâng thành dialog (bảng chốt ở [OVL-03](#ovl-03-all-questions-editor--bản-editor-của-questionnavigatordialog)); (2) menu của [`ThemeToggle`](#455-themetoggle) là dropdown **duy nhất còn theo pattern này** — neo `bottom-full mb-2 left-0`, dùng `role="menu"` + `menuitemradio` + `useClickOutside` + Escape (bổ sung a11y, ref không có).

### 6.4 Switch / toggle

- Không dùng `<input type="checkbox">`; là `<button>` chứa track + knob tự vẽ ([`L2207-L2231`](ref-ui.tsx#L2207-L2231)).
- Track `w-10 h-5` (40×20), knob `w-4 h-4` (16), dịch `translate-x-5` (20px) khi ON.
- Màu: ON `bg-emerald-500` + chữ `emerald-700`, OFF `bg-slate-300` + chữ `slate-600`.
- Không có `role="switch"`, `aria-checked` → QDS-28.
- **[CẬP NHẬT R1]** Công tắc **“Xáo câu hỏi & đáp án”** trong [`QuizConfigModal`](#453-quizconfigmodal--ovl-02) tái sử dụng đúng pattern này (track 40×20, ON emerald, mặc định ON) — `[YÊU CẦU MỚI]`; khi port bắt buộc bổ sung `role="switch"` + `aria-checked` cho **cả hai** công tắc (đóng luôn QDS-28).

### 6.5 Inline edit

| Đối tượng | Mở | Thoát | Phím | Ref |
|---|---|---|---|---|
| Nội dung câu hỏi (`ask`) | Click vào text | Blur | Enter = xuống dòng, **không** Escape | [`L578-L602`](ref-ui.tsx#L578-L602) |
| Nội dung lựa chọn | Click vào text | Blur hoặc `Enter` | `Enter` đóng; **không** Escape | [`L706-L730`](ref-ui.tsx#L706-L730) |
| Tiêu đề bộ đề | Luôn là input | — | — | [`L2336-L2342`](ref-ui.tsx#L2336-L2342) |

Không có nút “Lưu/Huỷ” cho inline edit: mọi keystroke được ghi ngay vào state cha (optimistic, không undo). Escape không hoàn tác → QDS-30 (cùng nhóm với QDS-29 về bàn phím).

### 6.6 Chèn câu (insert gap)

- Không có drag & drop thật; chỉ vùng hover 12–16px sinh nút `+` ([`L2436-L2483`](ref-ui.tsx#L2436-L2483)).
- Nút `opacity-0` → `group-hover:opacity-100` / `focus:opacity-100`, transition 200ms.
- Sau khi chèn: tạo câu mặc định, `scrollIntoView` smooth sau 80ms, gắn `focusedQuestionId` (highlight ring) ([`L916-L935`](ref-ui.tsx#L916-L935)).
- Dùng chung index với mảng `editorQuestions`; chèn ở `0` hoặc `idx+1`.

### 6.7 Copy to clipboard

- Tạo `<textarea>` ẩn, `select()`, `document.execCommand('copy')`, xoá node ([`L1241-L1249`](ref-ui.tsx#L1241-L1249)).
- API deprecated; không kiểm tra kết quả; luôn toast thành công → QDS-38.
- Không đổi trạng thái nút (không “Đã sao chép” 2s).

### 6.8 Breadcrumb reset

- Cùng một crumb vừa là **định vị** vừa là **reset**: bấm `root` → `handleResetRoot`; bấm tên môn → `handleNavigateToSubject(id, isReset)`; bấm tên bộ đề → `handleNavigateToExamDetail(id, isReset)`.
- Reset = set lại selection + tăng `viewResetCounter` (remount view) + toast “Đã đặt lại…” ([`L952-L982`](ref-ui.tsx#L952-L982)).
- Ở editor, bấm crumb → nạp lại draft và **mất thay đổi chưa lưu** (không cảnh báo) — trùng **Q-16** domain-core.

### 6.9 Scroll-into-view + highlight tạm 2.2s

```
setFocusedQuestionId(qId)                    → ring-2 ring-[#262b33] + shadow-lg + scale-[1.005]
setTimeout(80ms)  → el.scrollIntoView({behavior:'smooth', block:'center'})
setTimeout(2200ms) → setFocusedQuestionId(null)
```

Ref: [`L937-L946`](ref-ui.tsx#L937-L946), style ring [`L567-L569`](ref-ui.tsx#L567-L569). Dùng cho cả OVL-03 và OVL-04; không reset timer cũ nếu bấm liên tiếp (hai timeout có thể tắt sớm highlight mới — QDS-41).

**[CẬP NHẬT R3]** Pattern này là hợp đồng chung của [`QuestionNavigatorDialog`](#456-questionnavigatordialog) (cả 2 variant) và tuỳ chọn jump-từ-`SubmitWarningDialog`; khi port **phải** lưu timer id và clear trước khi set timer mới (đóng QDS-41).

### 6.10 Sticky header / sticky bar

- Chỉ **một** vùng sticky: `QuizControlBar` với `sticky top-2 z-20` ([`L2572`](ref-ui.tsx#L2572)).
- Breadcrumb **không** sticky; sidebar **không** sticky → khi cuộn dài, cả hai trôi khỏi viewport (QDS-10).
- Sticky nằm trong `<main>` có `overflow-x-hidden` — `overflow` theo trục X không tạo scroll container nên sticky vẫn hoạt động, nhưng nếu đổi thành `overflow-auto` sẽ **hỏng** sticky.

### 6.11 Empty state

| Ngữ cảnh | Cách xử lý hiện tại | Ref |
|---|---|---|
| Môn chưa có bộ đề | `EmptyState` đầy đủ (icon + tiêu đề + mô tả + CTA) | [`L2111-L2128`](ref-ui.tsx#L2111-L2128) |
| Bộ đề chưa có lượt làm | Text một dòng trong panel | [`L2284-L2286`](ref-ui.tsx#L2284-L2286) |
| Dashboard chưa có lượt | Không thông báo, chỉ số 0 | [`L1164-L1174`](ref-ui.tsx#L1164-L1174) |
| Danh sách môn rỗng | **Không có gì** (lưới trống) | [`L2053`](ref-ui.tsx#L2053) |
| Popover 0 câu | Panel rỗng | [`L2398-L2428`](ref-ui.tsx#L2398-L2428) |

→ Thiếu chuẩn hoá (QDS-27).

### 6.12 Disabled state

- Hầu như **không tồn tại**: không nút nào set `disabled`; `.neu-dark-btn`/`.neu-pill` không có style `[disabled]`, không `opacity-50`, không `cursor-not-allowed`.
- Các “khoá logic” được thay bằng: ẩn nút (xoá option khi ≤2), toast lỗi (Lưu khi 0 câu), hoặc return im lặng (bắt đầu quiz khi 0 câu).
- Hệ quả: người dùng không biết trước hành động nào không hợp lệ → cần bổ sung `disabled` + lý do (QDS-18).

### 6.13 Bàn phím & focus (tổng hợp)

| Tương tác | Hiện trạng | Ref |
|---|---|---|
| `Tab` | Đi được tới button/link/input, **kể cả radio `sr-only` của OptionRow** (chỉ không thấy focus ring); **không** tới SubjectCard/ExamCard (`div onClick`, không `tabIndex`) | [`L675-L681`](ref-ui.tsx#L675-L681), [`L2061`](ref-ui.tsx#L2061) |
| `Space`/`Enter` trên card | Không có tác dụng | — |
| `Enter` trong inline edit option | Thoát edit | [`L714-L716`](ref-ui.tsx#L714-L716) |
| `Escape` | **Không được xử lý ở bất kỳ đâu** | — |
| Arrow keys trên radio | **[CẦN XÁC MINH]** — `onChange` là noop nhưng radio native có thể phát `click` bubble lên `<label onClick>` ([`L660-L666`](ref-ui.tsx#L660-L666)); kiểm thủ công: mở quiz → Tab vào nhóm radio → ↑/↓ → xem “Đã chọn” có tăng | [`L675-L681`](ref-ui.tsx#L675-L681) |
| Tab trong textarea code | Chuyển focus (không chèn indent) | [`L2550`](ref-ui.tsx#L2550) |
| Focus ring | Chỉ input có `focus:border-*`, đa số `focus:outline-none` hoặc mặc định trình duyệt | QDS-17 |

### 6.14 Dialog hành động 2 nút — “lựa chọn an toàn được focus” (mới đợt 2)

> `[YÊU CẦU MỚI]` — pattern chung của [`SubmitWarningDialog`](#457-submitwarningdialog) (Q-11) và [`DeleteConfirmDialog`](#458-deleteconfirmdialog) (Q-01).

| Quy tắc | Áp dụng | |
|---|---|---|
| Thứ tự nút | Nút **không phá huỷ** bên trái, nút **xác nhận** bên phải (quy ước Windows/desktop Việt Nam) | “Quay lại làm tiếp” / “Vẫn nộp”; “Giữ lại” / “Xoá môn” |
| Focus mặc định | Luôn vào nút **không phá huỷ** — không thể vô tình xoá/nộp nhầm bằng Enter | [YÊU CẦU MỚI] |
| Escape / backdrop | = nút không phá huỷ (đóng, không thực hiện) | [YÊU CẦU MỚI] |
| Đòn bẩy trực quan | Nút xác nhận dùng `.neu-dark-btn` (rose-gradient riêng cho xoá); nút phụ `.neu-pill` | [YÊU CẦU MỚI] |
| Chống double-submit | Sau khi bấm xác nhận: `disabled` + `opacity-50` (tới khi ghi DB xong) | [YÊU CẦU MỚI] |
| Nội dung bắt buộc | Nêu **đủ dữ liệu để quyết định**: “Còn N câu chưa làm” + danh sách số; “Môn có X bộ đề • Y câu” | [YÊU CẦU MỚI] |
| A11y | `role="dialog" aria-modal="true"`, `aria-labelledby` tiêu đề, focus trap, trả focus về nút mở | [YÊU CẦU MỚI] |

### 6.15 Theme 3 trạng thái + áp dụng trước render (mới đợt 2)

> `[YÊU CẦU MỚI]` (R2) — không có trong ref; chi tiết component ở [`ThemeToggle`](#455-themetoggle) (4.55).

- **3 chế độ:** `light` (Sáng) / `dark` (Tối) / `system` (Theo hệ thống) — mặc định `system`; menu dropdown 3 item (`Sun`/`Moon`/`Monitor`), item đang chọn `.neu-pill-active` + `Check`.
- **Persist:** bảng `app_settings` key `theme` — **đã có trong `db.dbml`** (key/value/updated_at, seed `theme=system`); SQLite local, Tauri command `setting_get`/`setting_set` (structure-be §6.2) `[YÊU CẦU MỚI]` — `localStorage` key `theme` là cache đọc sớm chống nháy trắng trước khi `setting_get` trả về (**QDS-47 ĐÃ CHỐT**).
- **`system` = `prefers-color-scheme`:** đọc khi mount + đăng ký `matchMedia('(prefers-color-scheme: dark)').addEventListener('change', …)` → **tự đổi giao diện khi OS đổi theme**, không cần thao tác người dùng.
- **Không nháy trắng:** inline script trong `index.html` (chạy trước khi bundle React mount) đọc theme đã lưu → set `document.documentElement.classList.toggle('dark', …)` → màn sáng đầu tiên đã đúng theme.
- **Cơ chế duy nhất:** class `dark` trên `<html>` + CSS variables (§2.1e) — **không** rải `dark:` trong JSX cho giá trị đã là token; `dark:` chỉ dùng cho màu Tailwind palette.
- **Keyboard:** ↑/↓ di chuyển, Enter chọn, Escape đóng + trả focus; phím tắt nhanh đề xuất `Ctrl/Cmd+Shift+T` xoay vòng `[GIẢ ĐỊNH]` (QDS-48 — cần chốt vì có thể trùng shortcut của OS/webview).

---

## 7. Ràng buộc & quy tắc bắt buộc (DO / DON'T)

**Quy tắc task UI đợt 5:** chỉ dùng token cho cả hai theme từ Sprint 00, không hardcode hex; nếu thiếu màu thì bổ sung token light/dark trước khi dùng. Theme cache chỉ có key `theme`.

| ✅ DO | ❌ DON'T |
|---|---|
| Dùng đúng cặp shadow 2 chiều, offset dương = bóng tối `#cfd6e2…#c5cdd9`, offset âm = `#ffffff` | Không dùng `box-shadow` một chiều, không thay bằng `shadow-md`/`shadow-lg` cho khối neu |
| Dùng `--neu-surface` cho khối nổi, `--neu-inset` cho khối chìm ở cả hai theme | Không tự ý dùng `bg-white`, `bg-slate-50`, `bg-gray-100` cho khối lớn |
| Dùng token màu trong mục 2.1; thêm màu mới phải khai báo token + ghi vào tài liệu | Không hardcode hex trong JSX/CSS component, kể cả `SUBJECT_COLORS` (ánh xạ ID màu sang token) |
| Dùng `.neu-dark-btn` cho **một** CTA chính mỗi vùng | Không dùng nền xanh/emerald làm CTA chính (màu đó thuộc về dữ liệu/trạng thái) |
| Chọn radius theo thang: 12 → 16 → 24/26 → 28/30/32 | Không dùng `rounded-md`/`rounded-sm` cho card; không trộn 24px và 30px trong cùng cấp |
| Nội dung nhập liệu dùng `.neu-card-inset` | Không dùng inset cho vùng chỉ đọc lớn (gây hiểu nhầm là ô nhập) |
| Tối đa 2 lớp neu lồng nhau (shell → card → inset) | Không lồng `.neu-card` trong `.neu-card` trong `.neu-card` |
| Transition 200ms cho hover, 300ms cho layout, 500ms cho dữ liệu biểu đồ | Không animation > 500ms (trừ toast bounce) và không `transition-all` trên thuộc tính layout nặng |
| Chữ chính dùng `--ink-900`/`--ink-800`; chữ phụ dùng token có tương phản đủ đọc ở cả hai theme | Không dùng `slate-400` cho nội dung bắt buộc đọc (contrast ~2.5:1) |
| Mọi icon-only button phải có `title` (và nên thêm `aria-label`) | Không để nút chỉ có icon mà không có nhãn truy cập |
| Giữ label tiếng Việt nguyên văn: “Môn học”, “Bộ đề”, “Câu hỏi”, “Lựa chọn”, “Lượt làm bài”, “Hiện đáp án”, “Nộp bài”, “Làm lại đề” | Không đổi/ dịch label, không đổi “Bộ đề” thành “Đề thi”, “Lượt làm bài” thành “Attempt” trên UI |
| Truncate + `title` cho tiêu đề dài trong breadcrumb, popover, cột bảng | Không để text dài đẩy vỡ layout hoặc tràn khỏi card |
| Dùng `flex-wrap` cho nhóm ≥3 nút hành động | Không giả định cửa sổ rộng ≥1200px |
| Sticky bar phải nằm trong vùng không có `overflow` khác `visible`/`hidden` | Không đặt `overflow-auto` lên `<main>` (sẽ vô hiệu `sticky`) |
| Empty state phải có icon + câu giải thích + CTA khi có hành động hợp lệ | Không để lưới trống không thông báo (như SCREEN-02 hiện tại) |
| Dùng `ThemeToggle` (3 chế độ, persist `app_settings.theme`, áp trước render) cho cài đặt giao diện | Dựng lại nút Settings/Power hay màn Settings — đã bị loại bỏ (R2; Q-13/Q-14 đóng) |
| Hiển thị mọi ngày/giờ theo `Asia/Ho_Chi_Minh` (UTC+7) qua 1 hàm format chung | Hiển thị giờ UTC, chuỗi ISO hay chuỗi hard-code của mock (Q-06) |
| Tô màu TXT bằng token `--syntax-ask` / `--syntax-ans`, chỉ token đầu dòng theo regex parser | Tô “cả dòng”, hardcode hex highlight trong JSX, tô màu cho tab JSON |
| Câu nhiều đáp án đúng dùng checkbox (editor tick đáp án đúng, quiz chọn đáp án); 1 đáp án dùng radio | Trộn 2 loại control, chấm câu nhiều đáp án bằng radio đơn (Q-10) |
| Hành động phá huỷ (xoá môn/bộ đề, nộp bài còn trống) phải qua dialog xác nhận 2 nút an toàn | Xoá/nộp bài không xác nhận; xoá cứng thay soft delete (Q-01/Q-11) |
| Dark mode chỉ qua class `dark` trên `<html>` + CSS variables; shadow neu giữ nguyên logic 2 chiều | Đảo dấu offset shadow, viết `dark:` cho giá trị đã là token, hardcode hex dark trong JSX |

**Quy tắc đếm:** 21 DO — 21 DON'T (vượt mức tối thiểu 10/10; +6 cặp đợt 2 — `[CẬP NHẬT]`).

---

## 8. Gợi ý ánh xạ sang React component

> Toàn bộ mục này là **đề xuất** `[GIẢ ĐỊNH]` — ref hiện là single-file, chưa tách component, chưa có Tailwind trong `package.json`.

### 8.1 Cây thư mục đề xuất

```
src/
├── styles/
│   ├── tokens.css              # CSS variables (:root) — mục 2
│   ├── neumorphic.css          # 6 class .neu-* + scrollbar + @keyframes fadeIn
│   └── index.css               # @import "tailwindcss"; @custom-variant dark + import 2 file trên
├── components/
│   ├── ui/
│   │   ├── Card.tsx              InsetPanel.tsx      Pill.tsx
│   │   ├── IconButton.tsx        PrimaryActionButton.tsx
│   │   ├── Toast.tsx             ModalShell.tsx      ScrollArea.tsx
│   │   ├── EmptyState.tsx        AnswerBadge.tsx
│   │   ├── QuestionNavigatorDialog.tsx                # [R3] thay OVL-03/OVL-04
│   │   ├── QuestionNumberGrid.tsx                     # [R3] con dùng chung (nav + submit warning)
│   │   ├── SubmitWarningDialog.tsx                    # [Q-11] nộp bài còn câu trống
│   │   └── DeleteConfirmDialog.tsx                    # [Q-01] xoá môn/bộ đề
│   ├── layout/
│   │   ├── AppShell.tsx          Sidebar.tsx         BrandLogo.tsx
│   │   ├── SidebarToggle.tsx     ProfileCard.tsx     NavItem.tsx
│   │   ├── Breadcrumb.tsx        ThemeToggle.tsx     # [R2] thay Settings/Power
│   │   └── SidebarUtilityButton.tsx                   # [R2] KHÔNG còn dựng — giữ tên để truy vết
│   ├── dashboard/
│   │   ├── MetricCard.tsx        PeriodTabs.tsx      ChartMetricToggle.tsx
│   │   ├── ComboChart.tsx        DonutGauge.tsx      DonutLegend.tsx
│   │   ├── RecentAttemptList.tsx RecentAttemptRow.tsx
│   ├── exam/
│   │   ├── SubjectCard.tsx       CreateSubjectForm.tsx
│   │   ├── ColorSwatchGrid.tsx   ExamCard.tsx
│   │   ├── ExamOverviewHeader.tsx ShowAnswersSwitch.tsx
│   │   └── AttemptHistoryPanel.tsx
│   ├── question/
│   │   ├── QuestionCard.tsx      OptionRow.tsx       InlineEditableText.tsx
│   ├── editor/
│   │   ├── EditorTitleBar.tsx    EditorSplitPane.tsx FormatTabs.tsx
│   │   ├── CodeEditorTextarea.tsx ParseErrorBanner.tsx
│   │   ├── SyntaxHighlightedTextarea.tsx              # [R4] tab TXT (tô ask/ans)
│   │   └── InsertQuestionGap.tsx
│   ├── quiz/
│   │   ├── QuizControlBar.tsx    QuizProgress.tsx    ScoreBanner.tsx
│   │   ├── ResultHistoryRow.tsx  ResultReviewRow.tsx QuizConfigModal.tsx
│   │   └── PresetCountGrid.tsx
├── theme/
│   │   ├── ThemeProvider.tsx        # theme state + matchMedia listener
│   │   └── useTheme.ts              # đọc/ghi app_settings key 'theme'
├── features/
│   ├── dashboard/  DashboardScreen.tsx      useDashboardStats.ts
│   ├── exams/      ExamNavigator.tsx        useExamNavigation.ts
│   │                SubjectListScreen.tsx   ExamListScreen.tsx
│   │                ExamOverviewScreen.tsx
│   ├── editor/     ExamEditorScreen.tsx     useExamEditor.ts
│   │                serialize.ts            parse.ts
│   ├── quiz/       QuizScreen.tsx           ResultScreen.tsx
│   │                useQuizSession.ts
│   └── guide/      GuideScreen.tsx          fixedPrompt.ts
└── lib/
    ├── constants/subjectColors.ts   # 8 màu — L147-L156
    ├── format/time.ts               # format mm:ss, format ngày theo Asia/Ho_Chi_Minh (Q-06)
    ├── theme.ts                     # [R2] light/dark/system + anti-flash
    ├── syntax/txt.ts                # [R4] regex highlight khớp parser ref L92-L141
    └── clipboard.ts                 # copy text (thay execCommand) — QDS-38
```

### 8.2 Component → file & props chính

| Component | File | Props chính | Ghi chú |
|---|---|---|---|
| `AppShell` | `components/layout/AppShell.tsx` | `sidebarOpen`, `onToggleSidebar`, `children` | Giữ root `min-h-screen` + `p-3 sm:p-6` |
| `Sidebar` | `layout/Sidebar.tsx` | `open`, `activeTab`, `onNavigate`, `onToggle`, `profile`, **`theme`, `onThemeChange`** `[R2]` | Bỏ hard-code “Matthew Hayes”; đáy sidebar = `ThemeToggle` |
| `ThemeToggle` | `layout/ThemeToggle.tsx` | `theme`, `resolvedTheme`, `onThemeChange`, `collapsed?` | `[YÊU CẦU MỚI]` R2 — lucide `Sun`/`Moon`/`Monitor`; persist `app_settings.theme` |
| `QuestionNavigatorDialog` | `ui/QuestionNavigatorDialog.tsx` | `open`, `variant: 'editor'\|'quiz'`, `questions`, `currentIndex?`, `answers?`, `flags?`, `onSelect`, `onClose` | `[YÊU CẦU MỚI]` R3 — thay `QuestionJumpPopover` (4.42/4.45) |
| `SubmitWarningDialog` | `ui/SubmitWarningDialog.tsx` | `open`, `unansweredIndexes`, `total`, `onBack`, `onConfirm` | `[YÊU CẦU MỚI]` Q-11 — dùng `QuestionNumberGrid` |
| `DeleteConfirmDialog` | `ui/DeleteConfirmDialog.tsx` | `open`, `targetType`, `targetName`, `meta?`, `onCancel`, `onConfirm` | `[YÊU CẦU MỚI]` Q-01 — soft delete |
| `SyntaxHighlightedTextarea` | `editor/SyntaxHighlightedTextarea.tsx` | `value`, `onChange`, `lineErrors?`, `placeholder` | `[YÊU CẦU MỚI]` R4 — tab TXT; JSON giữ `CodeEditorTextarea` |
| `NavItem` | `layout/NavItem.tsx` | `id`, `label`, `sub`, `icon`, `active`, `collapsed`, `onClick` | `sub` hiện chỉ dùng cho `title` |
| `Toast` | `ui/Toast.tsx` | `message: string \| null`, `duration?: 2800`, `variant?: 'success' \| 'error'` | Thêm `role="status"` |
| `Card` | `ui/Card.tsx` | `as?`, `radius?: 16 \| 24 \| 26`, `padding?: 4 \| 5 \| 6 \| 8`, `className`, `children` | Wrapper quanh `.neu-card` |
| `Pill` | `ui/Pill.tsx` | `variant?: 'default' \| 'active' \| 'solid'`, `icon?`, `children` | `as` button khi bấm được |
| `IconButton` | `ui/IconButton.tsx` | `icon`, `label` (bắt buộc), `size?: 32 \| 40 \| 44`, `tone?` | `label` → `aria-label` + `title` |
| `PrimaryActionButton` | `ui/PrimaryActionButton.tsx` | `icon?`, `size?: 'sm' \| 'md' \| 'lg'`, `type?`, `disabled?`, `onClick`, `children` | Bổ sung `:active` + disabled |
| `Breadcrumb` | `layout/Breadcrumb.tsx` | `items: {label, color?, onClick, current}` | Render `<nav aria-label="breadcrumb">` |
| `MetricCard` | `dashboard/MetricCard.tsx` | `label`, `value`, `delta?`, `icon` | `tabular-nums`, chống tràn |
| `PeriodTabs` | `dashboard/PeriodTabs.tsx` | `value: 'week' \| 'month' \| 'year'`, `onChange` | `role="tablist"` (tuỳ chọn) |
| `ComboChart` | `dashboard/ComboChart.tsx` | `series: ChartPoint[]`, `metric: 'both' \| 'score'` | Nếu giữ `metric` thì phải dùng thật (QDS-15) |
| `DonutGauge` | `dashboard/DonutGauge.tsx` | `avgScore`, `distribution: {excellentPct, goodPct, averagePct}` | Bổ sung segment thứ 3 (QDS-21) |
| `SubjectCard` | `exam/SubjectCard.tsx` | `subject`, `examCount`, `totalQuestions`, `onOpen`, **`onDelete?`** `[Q-01]` | Dùng `<button>`/`role="button"` + `tabIndex` |
| `CreateSubjectForm` | `exam/CreateSubjectForm.tsx` | `open`, `onSubmit({name,color})`, `onCancel`, `defaultColor` | Validate inline: rỗng + **trùng tên (Q-15)** |
| `ExamCard` | `exam/ExamCard.tsx` | `exam`, `subjectColor`, `attemptCount`, `onOpen`, **`onDelete?`** `[Q-01]` | Như SubjectCard về a11y |
| `ShowAnswersSwitch` | `exam/ShowAnswersSwitch.tsx` | `checked`, `onChange`, `label?` | Dùng `role="switch"` + `aria-checked` |
| `QuestionCard` | `question/QuestionCard.tsx` | xem 8.3 | Tách `InlineEditableText` ra |
| `OptionRow` | `question/OptionRow.tsx` | xem 8.3 | Dùng `<label>` + input thật |
| `EditorSplitPane` | `editor/EditorSplitPane.tsx` | `left`, `right`, `height?: 640` | Đổi `h-[640px]` → `h-[min(640px,70vh)]` |
| `QuizControlBar` | `quiz/QuizControlBar.tsx` | `elapsedSec`, `answered`, `total`, `onSubmit`, **`onOpenNavigator`** `[R3]` | Nộp → `SubmitWarningDialog` (Q-11 — **đã chốt**, QDS-43 đóng) |
| `ScoreBanner` | `quiz/ScoreBanner.tsx` | `result: AttemptResult`, `onBack`, `onRetry` | Format `mm:ss` thay giây (QDS-37) |
| `QuizConfigModal` | `quiz/QuizConfigModal.tsx` | `open`, `exam`, `value`, `onChange`, `onClose`, `onStart` | Clamp 1..max (QDS-40) |

### 8.3 Props interface rút gọn cho component chính

```ts
type QuestionMode = 'preview' | 'editor' | 'quiz' | 'result';

interface AnswerOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

interface Question {
  id: string;
  ask: string;
  options: AnswerOption[]; // tối thiểu 2
}

interface QuestionCardProps {
  index: number;
  question: Question;
  mode?: QuestionMode;          // default 'preview'
  showAnswer?: boolean;         // chỉ áp dụng ở preview
  selectedOptionId?: string | null;
  isFocused?: boolean;          // ring tạm 2.2s
  onSelectOption?: (optionId: string) => void;
  onUpdateQuestion?: (next: Question) => void;
  onDeleteQuestion?: () => void;
  cardRef?: React.Ref<HTMLDivElement>;
}

interface OptionRowProps {
  option: AnswerOption;
  index: number;                // → nhãn A/B/C/D
  mode: QuestionMode;
  selected: boolean;
  showAnswer: boolean;
  onSelect?: () => void;        // quiz
  onSetCorrect?: () => void;    // editor
  onChangeText?: (text: string) => void;
  onRemove?: () => void;        // chỉ khi options.length > 2
  canRemove: boolean;
}

interface ScoreBannerProps {
  score: number;                // 0..10, 1 chữ số thập phân
  examTitle: string;
  correctCount: number;
  totalQuestions: number;
  durationSec: number;
  onBack: () => void;
  onRetry: () => void;
}

interface ModalShellProps {
  open: boolean;
  onClose: () => void;
  title: string;
  describedBy?: string;
  footer?: React.ReactNode;
  children: React.ReactNode;
}

// ==== [CẬP NHẬT đợt 2] component mới ====

type ThemeMode = 'light' | 'dark' | 'system';   // R2

interface ThemeToggleProps {
  theme: ThemeMode;
  resolvedTheme: 'light' | 'dark';              // giá trị thật đang áp
  onThemeChange: (mode: ThemeMode) => void;     // persist app_settings.key='theme'
  collapsed?: boolean;                          // sidebar thu gọn → icon-only
}

interface QuestionNavigatorDialogProps {        // R3 — thay OVL-03/OVL-04
  open: boolean;
  variant: 'editor' | 'quiz';
  questions: Question[];                        // câu của LƯỢT HIỆN TẠI
  currentIndex?: number;                        // quiz: đánh dấu câu đang xem
  answers?: Record<string, string[]>;           // quiz — mảng (hỗ trợ đa đáp án R1)
  flags?: Set<string>;                          // quiz — cờ đánh dấu [YÊU CẦU MỚI]
  onSelect: (index: number) => void;            // đóng + scroll + highlight 2.2s
  onClose: () => void;
}

interface SubmitWarningDialogProps {            // Q-11
  open: boolean;
  unansweredIndexes: number[];                  // số thứ tự 1-based của câu trống
  total: number;
  onBack: () => void;                           // quay lại làm tiếp (mặc định focus)
  onConfirm: () => void;                        // vẫn nộp
}

interface DeleteConfirmDialogProps {            // Q-01
  open: boolean;
  targetType: 'subject' | 'exam';
  targetName: string;
  meta?: { examCount?: number; questionCount?: number; attemptCount?: number };
  onCancel: () => void;                         // “Giữ lại” (mặc định focus)
  onConfirm: () => void;                        // soft delete
}

interface SyntaxHighlightedTextareaProps {      // R4
  value: string;
  onChange: (next: string) => void;
  lineErrors?: number[];                        // dòng 0-based vi phạm validate TXT
  placeholder?: string;
}
```

### 8.4 Tích hợp Tailwind + CSS variables

**Bước 1 — Tailwind v4 từ Sprint 00:** cài `tailwindcss` + `@tailwindcss/vite`, đăng ký plugin Vite; dùng `lucide-react` cho icon. Không dùng cấu hình Tailwind v3 dưới dạng `tailwind.config.ts`.

```css
/* src/index.css — các @import đứng đầu */
@import "tailwindcss";
@custom-variant dark (&:where(.dark, .dark *));
@theme inline {
  --color-app: var(--app-bg);
  --color-neu: var(--neu-surface);
  --color-neu-raised: var(--neu-surface-raised);
  --color-neu-inset: var(--neu-inset);
  --color-ink: var(--ink-800);
  --color-ink-strong: var(--ink-900);
  --color-cta-from: var(--cta-from);
  --color-cta-to: var(--cta-to);
  --color-border-strong: var(--border-strong);
}
```

Ánh xạ các token còn lại (shadow, radius, animation, màu trạng thái/môn học/cú pháp) tương tự; mọi utility của UI phải tham chiếu token. Bộ token light/dark đầy đủ theo §2 được dựng ngay Sprint 00.

**Bước 2 — CSS variables (`src/styles/tokens.css`):**

```css
:root {
  --app-bg: #e8edf4;
  --neu-surface: #eef2f7;
  --neu-surface-raised: #f5f8fc;
  --neu-inset: #e9eef5;
  --ink-900: #1e232a;
  --ink-800: #262b33;
  --ink-700: #2d333d; --ink-950: #1d2128; --ink-1000: #14171c;
  --shadow-1: #cfd6e2;
  --shadow-2: #d0d8e4;
  --shadow-3: #ced6e2;
  --shadow-4: #c9d2e0;
  --shadow-5: #c5cdd9;
  --shadow-inset: #cfd7e3;
}
```

**Bước 3 — đưa `<style>` thành file toàn cục:** copy **nguyên văn** 6 class `.neu-*` + block scrollbar từ [`L1261-L1333`](ref-ui.tsx#L1261-L1333) vào `src/styles/neumorphic.css`, thay hex bằng `var(--…)`. **Không** đặt `@import` sau các rule CSS trong cùng một file CSS (CSS bỏ qua `@import` không nằm đầu file) — tách 3 file và import trong `main.tsx` theo đúng thứ tự:

```ts
// main.tsx — [GIẢ ĐỊNH]
import './styles/index.css';      // @import "tailwindcss"; @custom-variant dark (&:where(.dark, .dark *));
import './styles/tokens.css';     // :root CSS variables
import './styles/neumorphic.css'; // .neu-* + scrollbar + @keyframes fadeIn
```

> **Chốt phiên bản (đợt 5): Tailwind v4.** CSS variables `:root` / `.dark` và `@theme inline` thay cấu hình v3; font self-host hoặc preload theo QDS-02/QDS-44.

**Bước 4 — thay class trong JSX:** `.neu-shell` → `shadow-shell bg-neu`, `.neu-card` → `shadow-neu bg-neu`, `.neu-card-inset` → `shadow-inset bg-neu-inset`, `.neu-pill` → `shadow-pill bg-neu rounded-full`, `.neu-pill-active` → `shadow-pill-active bg-neu-raised border-[1.5px] border-border-strong`, `.neu-icon-btn` → `shadow-icon hover:shadow-icon-hover active:shadow-icon-active`, `.neu-dark-btn` → `bg-gradient-to-br from-cta-from to-cta-to shadow-cta`.

**Bước 5 — keyframes `fadeIn`:** thêm vào `neumorphic.css` (không có trong ref — QDS-06):

```css
@keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: none; } }
@media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation-duration: .01ms !important; transition-duration: .01ms !important; } }
```

**Bước 6 — Dark mode + ThemeToggle (R2 — `[YÊU CẦU MỚI]`, chi tiết §2.1e/§6.15):**

1. `@custom-variant dark (&:where(.dark, .dark *));` đã thêm ở Bước 1; cơ chế đổi theme duy nhất = class `dark` trên `<html>` + CSS variables.
2. **Ngay Sprint 00**, `tokens.css` khai báo token light (§2.1f) + khối `.dark` (§2.1e); không chờ Sprint 06:

```css
/* light — bổ sung cho Bước 2 */
:root {
  --highlight: #ffffff;
  --border-strong: rgba(255, 255, 255, 0.85);
  --cta-from: #2d333d; --cta-to: #1d2128;
  --syntax-ask: #e11d48;  /* rose-600 — token `ask`/`ask :` */
  --syntax-ans: #2563eb;  /* blue-600 — token `ans.` / `ans.*` */
}

/* [GIẢ ĐỊNH] — QDS-45: bảng dark suy ra, cần chốt + kiểm tra tương phản AA */
.dark {
  --app-bg: #1a1f27;
  --neu-surface: #242b36;
  --neu-surface-raised: #2c3441;
  --neu-inset: #20262f;
  --ink-900: #eef2f7; --ink-800: #cbd5e1;
  --ink-700: #3a4552; --ink-950: #252d38; --ink-1000: #161b22;
  --shadow-1: #10141a; --shadow-2: #11161d; --shadow-3: #12171e;
  --shadow-4: #141a22; --shadow-5: #0e1218; --shadow-inset: #161b23;
  --highlight: #39424f;
  --border-strong: rgba(255, 255, 255, 0.06);
  --cta-from: #3a4552; --cta-to: #252d38;
  --syntax-ask: #fb7185;  /* rose-400 */
  --syntax-ans: #60a5fa;  /* blue-400 */
}
```

3. **Bắt buộc** chuyển hết hex trong 6 class `.neu-*` (Bước 3) sang `var(--…)` — với dark mode đây không còn là nice-to-have: mọi khối neu tự đổi theo `.dark`, **không** viết `dark:` cho giá trị đã là token.
4. **Anti-flash — áp trước khi render:** script inline trong `index.html` (chạy trước bundle) — đọc theme đã lưu rồi set class, không đọc từ DB trong `useEffect`:

```html
<script>
  (function () {
    var t = null;
    try { t = localStorage.getItem('theme'); } catch (e) {}  // key cache duy nhất, dùng chung Sprint 00/06
    if (t === 'light' || t === 'dark') document.documentElement.classList.toggle('dark', t === 'dark');
    else if (window.matchMedia('(prefers-color-scheme: dark)').matches) document.documentElement.classList.add('dark');
  })();
</script>
```

5. `ThemeProvider` (React, `src/theme/`): boot đọc bảng `app_settings` key `theme` qua Tauri command → đồng bộ class + `localStorage`; mode `system` đăng ký `matchMedia('(prefers-color-scheme: dark)')` listener để **tự đổi khi OS đổi theme**; `ThemeToggle` persist lại khi người dùng chọn (xem [4.55](#455-themetoggle)).
6. Màu palette trong JSX (slate/emerald/rose/amber…), backdrop và scrollbar phải ánh xạ sang token có giá trị light/dark. Không dùng hex trực tiếp hoặc thêm màu `dark:` thủ công thay cho token.
7. Icon cho `ThemeToggle`: `Sun` / `Moon` / `Monitor` từ `lucide-react` (đã có trong lệnh cài Bước 1 — ASDS-05).

**Bước 7 — Cửa sổ tối thiểu 1024 (ASDS-03 — ĐÃ CHỐT, `[YÊU CẦU MỚI]`):**

```jsonc
// src-tauri/tauri.conf.json
{ "windows": [{ "width": 1280, "height": 800, "minWidth": 1024, "minHeight": 700 }] }
```

Ref đang `800×600` không min ([`tauri.conf.json:L16-L17`](src-tauri/tauri.conf.json#L16-L17)); layout `lg` (chart 3 cột, editor 2 pane) chỉ bật từ 1024 → port **không** cần thiết kế cho < 1024 (§2.9).

### 8.5 Lưu ý khi port

1. **Không** đổi giá trị shadow/hex khi “làm sạch” code — đó là token, không phải magic number.
2. `h-[640px]` ở editor là chiều cao cứng; khi tách component nên cho phép override (QDS-09).
3. `#eef2f6` xuất hiện 2 lần ở base option row ([`L634`](ref-ui.tsx#L634), [`L692`](ref-ui.tsx#L692)) trong khi token là `#eef2f7` — coi là **lệch 1 bậc**, khi port hãy dùng token `--neu-surface` (ASDS-07).
4. Giữ `QuestionCard` là **một** component với 4 mode (đừng tách 4 component) để không lệch hành vi giữa preview/editor/quiz/result.
5. Các cải tiến a11y (radio thật, `aria-live`, focus trap) nên làm **sau** khi port xong pixel-perfect, tránh trộn thay đổi hình ảnh với thay đổi hành vi.
6. **[R2] Theme:** luôn resolve theme (đọc `app_settings` + anti-flash script) **trước** React render — không để 1 frame light rồi mới set class `dark`; `ThemeToggle` là nơi **duy nhất** đổi theme (không còn màn Settings).
7. **[R4] Hợp đồng TXT:** regex highlight (`lib/syntax/txt.ts`) phải **giống hệt** parser BE — `ask\s*:` / `ans\.\*` / `ans\.`, flag `/i`, trim đầu dòng, dòng thường nối vào phần tử trước ([`L92-L141`](ref-ui.tsx#L92-L141)); dùng chung fixture test cho 2 phía.
8. **[R1] Thứ tự câu của phiên** phải được persist theo `Attempt` — **không** shuffle lại khi render SCREEN-07/QuestionNavigatorDialog; bỏ hẳn cơ chế lặp “(Lượt ôn #k)” của ref.
9. **[R3]** `QuestionNavigatorDialog` là **một** implementation cho cả editor & quiz (2 variant) + `QuestionNumberGrid` con — đừng tạo file `QuestionJumpPopover.tsx` song song (trùng mã cũ 4.42/4.45 chỉ để truy vết).

---

## 9. Giả định và câu hỏi mở

### 9.1 Quy ước mã

- **`QDS-xx` / `ASDS-xx`** = vấn đề **riêng của design system** (màu, shadow, kích thước, a11y thị giác…).
- **`Q-xx` / `AS-xx`** = mã trong [`domain-core.md`](domain-core.md) — **không** tạo mã trùng nghĩa; khi trùng nội dung, ghi rõ “trùng Q-xx/AS-xx”.
- Các câu hỏi đã có ở domain-core **và** ảnh hưởng giao diện: **Q-01** (xoá môn/bộ đề → `DeleteConfirmDialog`, **[CẬP NHẬT R2] đang áp dụng**), **Q-05** (lọc kỳ thật — sprint cuối, UI giữ mock), **Q-06** (hiển thị giờ theo `Asia/Ho_Chi_Minh` — **đang áp dụng**), **Q-08** (`chartMetric`), **Q-09** (giới hạn 200 câu), **Q-10** (nhiều đáp án đúng → checkbox, **[CẬP NHẬT R1] đang áp dụng**), **Q-11** (xác nhận nộp bài → `SubmitWarningDialog` — **[CẬP NHẬT R3] ĐÃ CHỐT**), **Q-12** (giới hạn thời gian), **Q-15** (trùng tên → inline error — **[CẬP NHẬT R2] đang áp dụng**), **Q-16** (lưu draft), **Q-17** (font Google online), **AS-10** (tên thương hiệu). **Q-13** (nút Power) và **Q-14** (màn hình Settings) — **[CẬP NHẬT R2] ĐÃ BỊ LOẠI BỎ khỏi phạm vi** (nút Settings/Power bị xoá, thay bằng `ThemeToggle`).

### 9.2 Giả định thiết kế (ASDS)

| ID | Nội dung | Vì sao chưa chắc | Ảnh hưởng |
|---|---|---|---|
| **ASDS-01** | **[CẬP NHẬT đợt 5] Tailwind v4**, CSS variables light/dark + `@theme inline` + `@custom-variant dark` từ Sprint 00 (§8.4). | Ref dùng utility; token ánh xạ khi triển khai. | Mọi task UI chỉ dùng token; Sprint 06 chỉ chuyển đổi/persist/chống nháy trắng. |
| **ASDS-02** | Font stack thực tế khi chạy sẽ rơi về Plus Jakarta Sans (hoặc system) vì Google Sans không có trên máy người dùng. | Chỉ `@import` từ Google Fonts; Google Sans không phát hành public. | Chữ có thể rộng/hẹp khác ref → sai lệch layout nhỏ. |
| **ASDS-03** | Cửa sổ mặc định nên là **1280×800**, `minWidth: 1024`. | `tauri.conf.json` đang 800×600, không min. | Nếu giữ 800×600, layout `lg` không bao giờ bật → chart/editor luôn 1 cột. **[CẬP NHẬT đợt 2] → ĐÃ CHỐT (QDS-08 đóng):** áp dụng `minWidth: 1024`, `minHeight: 700`, mặc định 1280×800 — xem [8.4 Bước 7](#84-tích-hợp-tailwind--css-variables). |
| **ASDS-04** | Bề rộng sidebar mở là **256px** (`md:w-64`), đóng **80px** (`md:w-20`). | Suy ra từ class Tailwind mặc định. | Ảnh hưởng vùng nội dung còn lại. |
| **ASDS-05** | Icon set cố định là **lucide-react**, kích thước 12/14/16/20px theo ngữ cảnh; **phải cài `lucide-react`** (chưa có trong `package.json`). | Ref import 30 icon từ lucide (L2–L33) nhưng thiếu dependency. | Thiếu package → build fail; đổi icon set sẽ lệch stroke/màu. **[CẬP NHẬT R2 — applying]:** bộ icon bắt buộc mở rộng thêm `Sun`, `Moon`, `Monitor` (`ThemeToggle`), `Trash2` (`DeleteConfirmDialog`), `Flag` (navigator), `TriangleAlert` (submit warning). |
| **ASDS-06** | `rounded-lg=8`, `xl=12`, `2xl=16`, `3xl=24` theo mặc định Tailwind. | Không có config. | Nếu theme custom, thang radius trong 2.4 sai. |
| **ASDS-07** | `#eef2f6` (option row) là **lỗi 1 bậc** của `#eef2f7`, không phải token riêng. | Xuất hiện 2 lần, lệch 1 đơn vị so với toàn hệ. | Port đúng token sẽ khác 1 bậc rất nhỏ trên option row. |
| **ASDS-08** | Gradient nút tối là `linear-gradient(145deg, #2d333d, #1d2128)`. | Chỉ có trong CSS, không có token. | Cần đưa vào token để không lặp hex. |
| **ASDS-09** | Toast 2800ms là **quyết định sản phẩm** có thể đổi 2000–4000ms. | Không có tài liệu lý do. | Ảnh hưởng khả năng đọc thông báo dài. |
| **ASDS-10** | Prompt AI là hằng số **không chỉnh sửa** trong UI. | Không có input/edit cho prompt. | Nếu cho sửa, cần lưu local + version. |
| **ASDS-11** | Modal tương lai dùng chung `max-w-md` (448px). | Chỉ có một modal duy nhất. | Modal nội dung rộng (bảng) sẽ phải override — **[CẬP NHẬT R3]** `QuestionNavigatorDialog` đã override `max-w-lg` (512px); `SubmitWarningDialog`/`DeleteConfirmDialog` giữ `max-w-md`. |
| **ASDS-12** | Keyframes `fadeIn` đề xuất: opacity 0→1 + translateY(4px), 200ms ease-out. | Không tồn tại trong ref. | Chọn khác sẽ đổi cảm giác vào màn hình. |

### 9.3 Câu hỏi mở (QDS)

| ID | Nội dung | Vì sao chưa chắc | Ảnh hưởng |
|---|---|---|---|
| **QDS-01** | Tailwind chưa được cài — chốt **v3.4** (xem 8.4); có custom palette không? | `package.json` không có `tailwindcss`; không có config. | Toàn bộ class chỉ đúng nếu palette mặc định; `lucide-react` cũng phải cài thêm. **[CẬP NHẬT đợt 2] → ĐÃ CHỐT:** Tailwind **v3.4** + `tailwind.config.ts` + **`darkMode: 'class'`** (R2) — chỉ còn việc chạy lệnh cài của [8.4 Bước 1](#84-tích-hợp-tailwind--css-variables). |
| **QDS-02** | Google Sans không có weight 600 nhưng `font-semibold` dùng ~10 lần — có thay bằng 500/700 không? | `@import` chỉ có 400;500;700. | Chữ “semibold” hiện là synthetic hoặc fallback → nặng/nhẹ bất thường. |
| **QDS-03** | Trường `soft` trong `SUBJECT_COLORS` dùng để làm gì? | Khai báo 8 lần nhưng **không dùng** ở render. | Có thể là dự định cho nền badge môn → cần chốt trước khi bỏ. |
| **QDS-04** | Chữ phụ `slate-400` trên `#eef2f7` chỉ đạt ~2.5:1 — có nâng lên `slate-500`? | Đây là lựa chọn thẩm mỹ của ref. | Nếu giữ, vi phạm WCAG AA cho text thường (NFR-11 domain-core). |
| **QDS-05** | Toast và modal cùng `z-50` — cái nào phải trên? | Không có quy ước. | Toast có thể bị modal che khi lưu/nộp trong modal. |
| **QDS-06** | `animate-fadeIn` và `backdrop-blur-xs` **không được định nghĩa** ở đâu. | `<style>` không có `@keyframes`; `xs` không có trong Tailwind v3. | Hiện không có animation vào màn và không có blur nền → khác thiết kế. |
| **QDS-07** | Có cần tôn trọng `prefers-reduced-motion`? | Không có media query nào. | Người dùng nhạy cảm chuyển động vẫn bị bounce/pulse liên tục. |
| **QDS-08** | Kích thước cửa sổ tối thiểu của app là bao nhiêu? | Tauri config 800×600, không `minWidth`; ref thiết kế cho ≥1024. | Dưới 1024 mất layout 3 cột/biểu đồ. **[CẬP NHẬT đợt 2] → ĐÃ CHỐT:** `minWidth: 1024` + mặc định 1280×800 (trùng ASDS-03). |
| **QDS-09** | `h-[640px]` cố định cho pane editor có nên đổi sang viewport-relative? | Ref dùng chiều cao cứng; không có responsive height. | Trên màn 600px cao, editor tràn ngay từ đầu. |
| **QDS-10** | Sidebar/breadcrumb có nên sticky? | Cả hai nằm trong luồng cuộn. | Màn dài (quiz 40 câu) mất điều hướng khi cuộn. |
| **QDS-11** | Tên thương hiệu hiển thị “QUIZ Analysis / Smart Exam Studio” hay “ansask”? | Hard-code trong ref — **trùng AS-10** domain-core. | Ảnh hưởng logo, title bar, mọi ảnh marketing. |
| **QDS-12** | Profile “Matthew Hayes / ID: 308591433” là dữ liệu thật hay placeholder? | Không có state user — **liên quan AS-02** domain-core (single-user). | Nếu single-user, cần tên/ID thật hoặc bỏ khối profile. **[CẬP NHẬT R5] → ĐÃ CHỐT:** app **cá nhân, không login/phân quyền/cloud** — tên hiển thị lấy từ `app_settings` (mặc định “Người dùng cá nhân”) hoặc bỏ hẳn khối profile; **không** xây luồng auth. |
| **QDS-13** | Icon button 32–40px có đủ lớn cho touch/desktop? | Ref dùng 32px cho nút đóng popover. | Nếu có tablet, cần ≥44px. |
| **QDS-14** | Toast `animate-bounce` vô hạn trong 2.8s gây nhấp nháy — có đổi sang fade/slide? | Không có keyframes riêng. | Mỏi mắt, đặc biệt khi nhiều toast liên tiếp. |
| **QDS-15** | `chartMetric` có thực sự lọc series không? | State có `'count'` nhưng **không UI** nào set; không dùng khi vẽ — **trùng Q-08** domain-core. | Nút hiện chỉ đổi màu chữ → người dùng tưởng đã lọc. **[CẬP NHẬT Q-05]** — chốt hướng: **lọc kỳ THẬT là hạng mục sprint cuối**; sprint này UI giữ nguyên trạng thái mock (cộng offset giả [`L1216-L1229`](ref-ui.tsx#L1216-L1229)), hành vi đích = lọc attempts theo `timestamp` + bỏ offset. |
| **QDS-16** | SubjectCard/ExamCard là `<div onClick>` — có chuyển thành `<button>`/`<a>`? | Không có `tabIndex`/`role` — **liên quan NFR-11** domain-core. | Không điều hướng được bằng bàn phím. |
| **QDS-17** | Hầu hết input/textarea dùng `focus:outline-none` mà không thay thế — có thêm ring? | Chỉ đổi `border` ở vài chỗ, nhiều chỗ không đổi gì. | Mất dấu hiệu focus → lỗi a11y nghiêm trọng. |
| **QDS-18** | `.neu-dark-btn` không có `:active` và không có trạng thái disabled — có bổ sung? | Ref chỉ có hover. | Thiếu phản hồi khi bấm; có thể double-submit. |
| **QDS-19** | Scrollbar chỉ style `-webkit-*` — Firefox/Tauri (WebKitGTK) có cần fallback? | Không có `scrollbar-width/color`. | Trên Linux (WebKitGTK) thanh cuộn có thể khác hoàn toàn. |
| **QDS-20** | Metric delta luôn là mũi tên ↑ xanh — có cần trạng thái giảm? | Không có dữ liệu so sánh kỳ trước. | Gây hiểu sai khi điểm giảm. |
| **QDS-21** | Donut chỉ vẽ 2/3 nhóm (thiếu “Cần cố gắng”) — cố ý hay thiếu? | Chỉ có 2 `<circle>` segment. | Vòng không khép kín, sai tỉ lệ thị giác. **[CẬP NHẬT đợt 2] → ĐÃ CHỐT (applying):** bổ sung segment thứ 3 “Cần cố gắng” (`<7.0`) + cập nhật `DonutLegend` (§4.19/4.20). |
| **QDS-22** | Cột biểu đồ dùng 2 thang đo (số bài và điểm) trên cùng chiều cao — có gây hiểu sai? | `countTrackPct` và `scoreHeightPct` độc lập. | Cột cao không đồng nghĩa điểm cao. |
| **QDS-23** | Nút “Làm đề mới →” chỉ đổi tab, không reset về root — có đúng ý? | Handler chỉ `setActiveTab('exams')`. | Người dùng đang ở examDetail sẽ không thấy danh sách môn. |
| **QDS-24** | Row lịch sử (dashboard & result) không bấm được — có cần click row để mở lại lượt làm (UC-21 / `attempt_review`)? | Không có handler ở ref; **[CẬP NHẬT đợt 2] Q-03 ĐÃ CHỐT: có bảng `attempt_answers`** persist ⇒ row **đủ dữ liệu để mở lại lượt làm** xem chi tiết sau khi đóng app (UC-21). | Còn chốt hành vi: bấm row → mở lại lượt làm (UC-21) hay giữ row tĩnh; dữ liệu đã sẵn, chỉ còn UI handler. |
| **QDS-25** | Chữ trắng trên nền amber `#f59e0b` chỉ ~2.2:1 (chữ cái đầu môn) — có đổi sang chữ tối? | Màu môn dùng trực tiếp làm nền. | Chữ gần như không đọc được với môn màu sáng. |
| **QDS-26** | Đóng form tạo môn không xoá tên đang gõ — có phải bug? | Chỉ `setShowCreateSubjectForm(false)`. | Mở lại thấy dữ liệu cũ, dễ tạo trùng. |
| **QDS-27** | Thiếu empty state cho danh sách môn, dashboard, popover — có chuẩn hoá? | Chỉ SCREEN-03 có `EmptyState`. | Trải nghiệm không nhất quán khi dữ liệu rỗng. |
| **QDS-28** | Switch “Hiện đáp án” thiếu `role="switch"`/`aria-checked` — có sửa? | Track 40, knob 16, padding 2 mỗi phía, dịch 20 → knob sát mép. | A11y (thiếu ngữ nghĩa switch). |
| **QDS-29** | Radio `sr-only` với `onChange` rỗng khiến bàn phím không đổi được đáp án — có thay bằng radio thật? | `checked` controlled + noop. | Không làm bài được bằng bàn phím (NFR-11). |
| **QDS-30** | Ở preview, label radio vẫn `cursor-pointer` dù không làm gì — có bỏ? | Class cursor không phụ thuộc mode. | Affordance sai. |
| **QDS-31** | `parseError.message` không bao giờ hiển thị — có cần hiện lỗi cụ thể? | Chỉ hiện “Đang chờ cú pháp chuẩn...”. | Người dùng không biết sai ở đâu. |
| **QDS-32** | Chuyển tab TXT/JSON ghi đè raw text đang lỗi — có cảnh báo? | `handleSwitchEditorTab` serialize lại từ state — **liên quan UC-14**. | Mất nội dung đang gõ dở. |
| **QDS-33** | JSON hợp lệ nhưng nhiều `true` vẫn lưu được — có validate 1 đáp án đúng? | Không kiểm tra — **liên quan Q-10** domain-core. | Điểm có thể sai lệch. |
| **QDS-34** | Không có drag & drop chèn câu — có cần? | Chỉ có hover-insert. | Không thể sắp xếp lại câu đã tạo (phải xoá + tạo lại). |
| **QDS-35** | Popover không đóng khi click ngoài/Escape — có bổ sung? | Không có listener. | Popover có thể che nội dung, khó đóng. |
| **QDS-36** | Ô “đã trả lời” trong OVL-04 chỉ khác màu — có thêm dấu? | Không có icon/viền. | Khó phân biệt với ô đang focus/chọn. |
| **QDS-37** | Thời lượng hiển thị bằng giây thô (`410 giây`) — có format `06:50`? | Dùng trực tiếp `durationSec` — **liên quan Q-12** domain-core. | Khó đọc với bài dài. |
| **QDS-38** | Copy dùng `document.execCommand` (deprecated) và luôn báo thành công — có đổi sang Clipboard API? | Không kiểm tra kết quả. | Trên một số webview copy thất bại nhưng vẫn toast thành công. |
| **QDS-39** | Modal không được tách thành component dùng lại — có cần `ModalShell` chuẩn? | Chỉ một instance inline. | Modal thứ hai sẽ copy-paste lỗi a11y. |
| **QDS-40** | Số câu nhập tay không bị clamp theo `max=200` — có chặn? | Chỉ `Math.max(1, parseInt(...))` — **trùng Q-09** domain-core. | Có thể tạo phiên 999 câu, treo UI. |
| **QDS-41** | Highlight 2.2s dùng 2 `setTimeout` không clear — bấm liên tiếp có thể tắt sớm? | Không lưu timer id. | Highlight sai câu khi nhảy nhanh. |
| **QDS-42** | Ngày hiển thị: `createdAt` theo UTC còn `timestamp` theo local — có thống nhất format? | Hai nguồn thời gian khác nhau — **trùng Q-06** domain-core. | Lệch múi giờ khi so sánh “ngày tạo” và “thời gian nộp”. |
| **QDS-43** | Có cần hộp thoại xác nhận khi nộp bài còn câu trống? | Không có confirm — **trùng Q-11** domain-core. | Nộp nhầm, điểm thấp ngoài ý muốn. **[CẬP NHẬT đợt 2] → ĐÃ CHỐT (Q-11):** có [`SubmitWarningDialog`](#457-submitwarningdialog) (4.57) — nêu số câu trống + danh sách số thứ tự, 2 nút “Quay lại làm tiếp” / “Vẫn nộp”. |
| **QDS-44** | Font Google `@import` phụ thuộc mạng — có self-host? | `@import` từ fonts.googleapis.com — **trùng Q-17** domain-core (offline-first). | Không có mạng → fallback font, layout lệch. |
| **QDS-45** | Bảng token dark mode ở §2.1e là `[GIẢ ĐỊNH]` (ref chỉ có light) — có chốt đúng các hex này không? Cần kiểm tra tương phản AA cho chữ phụ + scrollbar dark. | Không có bất kỳ tham chiếu dark nào trong ref-ui (0 match `dark`/`Moon`/`theme`). | Sai hex → hệ dark mất logic neumorphic (bóng sáng hoá nền tối) hoặc chữ mờ. |
| **QDS-46** | Dòng lỗi TXT trong `SyntaxHighlightedTextarea` hiện được đề xuất tô nền `bg-rose-500/10` `[GIẢ ĐỊNH]` — chốt nền/ viền/ icon góc dòng? | Yêu cầu R4 chỉ nói “báo lỗi theo dòng”, không mô tả style. | Ảnh hưởng khả năng đọc TXT dài nhiều lỗi; có thể nhiễu thị giác. |
| **QDS-47** | Bảng `app_settings` (key `theme`) — **ĐÃ CHỐT (đợt 2): đã có `app_settings` (key/value/updated_at, seed `theme=system`) trong `db.dbml`; command `setting_get`/`setting_set` có trong structure-be §6.2** — việc còn lại chỉ là port FE đọc/ghi. | Ref không lưu gì (khác biệt này là chủ đích); anti-flash vẫn cần inline script đọc localStorage key `theme` trước render, sau đó đồng bộ DB. | `ThemeToggle` persist qua SQLite; `localStorage` key `theme` là cache đọc sớm chống nháy trắng. |
| **QDS-48** | Phím tắt theme đề xuất `Ctrl/Cmd+Shift+T` (`[GIẢ ĐỊNH]`) — có conflict với shortcut của OS/webview không? Cần in-app hay Tauri global shortcut? | Chưa chốt; ref không có phím tắt nào. | Shortcut trùng → người dùng không kích hoạt được hoặc mất chức năng hệ thống. |
| **QDS-49** | Câu nhiều đáp án đúng (Q-10): UI đã chốt checkbox — **thang điểm ĐÃ CHỐT theo Q-10/BR-63 domain-core**: chấm **exact-set** — câu chỉ đúng khi tập đáp án người dùng **trùng khớp hoàn toàn** tập đáp án đúng (**không** chấm đúng từng phần); chọn thiếu / chọn dư = sai, câu trống = sai; tổng `correct/total*10` làm tròn 1 chữ số thập phân (BR-25) — phần trình bày còn lại là `[GIẢ ĐỊNH]`. | Thuộc domain-core (Q-10, BR-63) — **đã chốt**, không còn mở; ảnh hưởng nhãn ScoreBanner/QuizProgress. | Việc còn lại chỉ là **ánh xạ nhãn UI** ScoreBanner/QuizProgress với rule chấm exact-set của BE. |

**Tổng hợp:** 12 giả định `ASDS`, **49 câu hỏi `QDS`** (`+5` mới đợt 2: QDS-45…QDS-49); trong đó **8 mục đã chốt/đang áp dụng ở đợt 2** (QDS-01, QDS-08, QDS-12, QDS-15, QDS-21, QDS-43, QDS-47, QDS-49) và 13 mục trùng/liên hệ trực tiếp domain-core (`Q-01`, `Q-05`, `Q-06`, `Q-08`, `Q-09`, `Q-10`, `Q-11`, `Q-12`, `Q-15`, `Q-17`, `AS-10`, `AS-02`, `NFR-11`) — **không** tạo mã trùng nghĩa, chỉ tham chiếu. Q-13/Q-14 **đã bị loại bỏ** khỏi phạm vi (R2).
