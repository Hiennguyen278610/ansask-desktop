<div align="center">
  <img src="public/logo.svg" width="120" alt="ansask logo" />
  <h1 align="center">ansask-desktop</h1>
  <p align="center">
    Ứng dụng desktop luyện thi trắc nghiệm thông minh, offline-first.<br/>
    Tạo đề nhanh bằng AI, làm bài mượt mà, thống kê chi tiết.
  </p>

  <p align="center">
    <a href="#"><img src="https://img.shields.io/badge/Rust-1.95+-orange?style=for-the-badge&logo=rust" alt="Rust"></a>
    <a href="#"><img src="https://img.shields.io/badge/Tauri-2.0-blue?style=for-the-badge&logo=tauri" alt="Tauri"></a>
    <a href="#"><img src="https://img.shields.io/badge/React-19-61dafb?style=for-the-badge&logo=react" alt="React"></a>
    <a href="#"><img src="https://img.shields.io/badge/SQLite-3-003b57?style=for-the-badge&logo=sqlite" alt="SQLite"></a>
  </p>

  <p align="center">
    <a href="https://github.com/Hiennguyen278610/ansask-desktop/stargazers">
      <img src="https://img.shields.io/github/stars/Hiennguyen278610/ansask-desktop?style=social" alt="GitHub stars">
    </a>
    <a href="https://github.com/Hiennguyen278610/ansask-desktop/network/members">
      <img src="https://img.shields.io/github/forks/Hiennguyen278610/ansask-desktop?style=social" alt="GitHub forks">
    </a>
  </p>
</div>

---

## ✨ Tính năng nổi bật

- 📚 **Quản lý thông minh:** Tạo môn học, bộ đề, câu hỏi với giao diện kéo thả trực quan.

- 🤖 **Tích hợp AI:** Dán kết quả từ ChatGPT/Gemini để tự động tạo hàng trăm câu hỏi chỉ trong vài giây (hỗ trợ JSON & TXT).

- 🎯 **Luyện tập hiệu quả:** Làm bài với đồng hồ đếm ngược, xáo trộn câu hỏi/đáp án, cảnh báo câu chưa làm.

- 📊 **Thống kê chi tiết:** Theo dõi tiến độ, biểu đồ phổ điểm, lịch sử làm bài, xem lại đáp án.

- 🗑️ **Thùng rác an toàn:** Xóa mềm, khôi phục dữ liệu, xử lý trùng tên thông minh.

- 🌙 **Dark Mode & Offline:** Lưu trữ cục bộ 100% qua SQLite, giao diện Sáng/Tối tự động theo hệ thống.


## 🛠️ Công nghệ sử dụng

- **Core:** Rust (Tauri 2), SQLite (rusqlite)

- **Frontend:** React 19, Tailwind CSS v4, TanStack Query, Zustand

- **Build Tool:** Vite 8, pnpm

- **CI/CD:** GitHub Actions


## 🚀 Bắt đầu nhanh

### Yêu cầu hệ thống
- Node.js >= 20

- pnpm >= 9

- Rust (Stable)

- Các thư viện hệ thống của Tauri: xem [hướng dẫn cài đặt](https://v2.tauri.app/start/prerequisites/)


### Cài đặt & Chạy dev
```bash
# 1. Clone repo
git clone https://github.com/Hiennguyen278610/ansask-desktop.git
cd ansask-desktop

# 2. Cài dependencies
pnpm install

# 3. Chạy dev
pnpm tauri dev
```

### Build production
```bash
pnpm tauri build
```
File cài đặt sẽ nằm trong `src-tauri/target/release/bundle/`.

## 🤝 Đóng góp

Mọi đóng góp đều được hoan nghênh! Vui lòng đọc [CONTRIBUTING.md](CONTRIBUTING.md) trước khi tạo Pull Request.

## ⭐ Lịch sử Star

[![Star History Chart](https://api.star-history.com/svg?repos=Hiennguyen278610/ansask-desktop&type=Date)](https://star-history.com/#Hiennguyen278610/ansask-desktop&Date)

## 📄 Giấy phép

Dự án được phân phối dưới giấy phép MIT. Xem [LICENSE](LICENSE) để biết thêm chi tiết.
