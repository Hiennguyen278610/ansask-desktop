# Đóng góp cho ansask-desktop

Cảm ơn bạn đã quan tâm đến dự án! Dưới đây là một số hướng dẫn để quá trình đóng góp diễn ra suôn sẻ.

## Quy trình Pull Request (PR)

1. **Fork** repo và tạo nhánh mới từ `main`: `git checkout -b feature/ten-tinh-nang`

2. **Cài đặt môi trường:** `pnpm install` và chạy `pnpm tauri dev` để kiểm tra.
3. **Code:** Tuân thủ cấu trúc thư mục hiện có. 
   - Frontend: React + Tailwind, file không quá 200 dòng.
   - Backend: Rust module hóa, dùng `Result<T, AppError>`.
4. **Kiểm thử:** 
   - Chạy `pnpm lint` và `bash scripts/verify-sprint-00.sh` (nếu còn) để đảm bảo pass gate.
   - Chạy `cargo test` ở thư mục `src-tauri`.
5. **Commit:** Sử dụng [Conventional Commits](https://www.conventionalcommits.org/), ví dụ: `feat: thêm tính năng xóa mềm`, `fix: sửa lỗi mất dữ liệu`.
6. **Tạo PR:** Mô tả rõ tính năng/bug, kèm ảnh chụp màn hình nếu có.

## Quy tắc viết code

- **Rust:** `cargo fmt` và `cargo clippy -D warnings` phải pass sạch.

- **TypeScript:** `pnpm lint` phải pass sạch (không dùng `any` bừa bãi).

- **Giao diện:** Tuân thủ design system Neumorphic (xem `docs/design-system.md`).


## Báo cáo lỗi (Issue)

Nếu phát hiện lỗi, hãy tạo Issue với:
- Hệ điều hành đang dùng.

- Các bước tái hiện lỗi.

- Log lỗi (nếu có) hoặc ảnh chụp màn hình.

