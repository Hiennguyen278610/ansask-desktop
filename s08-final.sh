#!/bin/bash
set -e

# ==========================================
# 1. TẠO LOGO SVG ĐỘNG (PIXEL FANTASY)
# ==========================================
mkdir -p public src-tauri/icons

cat > public/logo.svg << 'SVG_EOF'
<svg width="1024" height="1024" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges">
  <defs>
    <style>
      .bg { fill: #1a1f27; }
      .base { fill: #262b33; }
      .sword { fill: #cbd5e1; }
      .hilt { fill: #f59e0b; }
      .gem { fill: #10b981; animation: pulse 2s infinite alternate; }
      .spark { fill: #ffffff; animation: twinkle 1.5s infinite alternate; }
      @keyframes pulse { 0% { fill: #10b981; } 100% { fill: #34d399; } }
      @keyframes twinkle { 0% { opacity: 0; } 100% { opacity: 1; } }
    </style>
  </defs>
  
  <!-- Nền khối -->
  <rect class="bg" x="2" y="2" width="28" height="28" rx="4" />
  <rect class="base" x="4" y="4" width="24" height="24" rx="2" />
  
  <!-- Thanh kiếm pixel -->
  <!-- Lưỡi kiếm -->
  <rect class="sword" x="14" y="6" width="4" height="14" />
  <rect class="sword" x="15" y="4" width="2" height="2" />
  <!-- Chuôi kiếm -->
  <rect class="hilt" x="12" y="20" width="8" height="2" />
  <rect class="hilt" x="14" y="22" width="4" height="4" />
  <!-- Đá quý -->
  <rect class="gem" x="15" y="23" width="2" height="2" />
  
  <!-- Hiệu ứng lấp lánh -->
  <rect class="spark" x="8" y="10" width="2" height="2" style="animation-delay: 0s;" />
  <rect class="spark" x="22" y="14" width="2" height="2" style="animation-delay: 0.5s;" />
  <rect class="spark" x="10" y="22" width="2" height="2" style="animation-delay: 1s;" />
</svg>
SVG_EOF

# Tạo thêm bản PNG từ SVG bằng Tauri icon command (SVG phải vuông góc)
# Lưu ý: Tauri icon có thể nhận SVG trực tiếp, nhưng để chắc chắn ta dùng nó luôn
pnpm tauri icon public/logo.svg

# ==========================================
# 2. TẠO .GITIGNORE ĐẦY ĐỦ
# ==========================================
cat > .gitignore << 'GIT_EOF'
# ---------- Dependencies ----------
node_modules/
.pnpm-store/

# ---------- Build artifacts ----------
dist/
dist-ssr/
*.local
*.log
npm-debug.log*
pnpm-debug.log*
yarn-debug.log*
yarn-error.log*

# ---------- Tauri / Rust ----------
src-tauri/target/
src-tauri/gen/schemas/
src-tauri/target/debug/
src-tauri/target/release/

# ---------- OS / Editor ----------
.DS_Store
Thumbs.db
*.swp
.idea/
.vscode/
!.vscode/extensions.json

# ---------- Env ----------
.env
.env.*
!.env.example

# ---------- Local DB ----------
*.db
*.db-wal
*.db-shm
GIT_EOF

# ==========================================
# 3. TẠO README.md CHUẨN
# ==========================================
cat > README.md << 'MD_EOF'
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
    <a href="https://github.com/taho140303/ansask-desktop/stargazers">
      <img src="https://img.shields.io/github/stars/taho140303/ansask-desktop?style=social" alt="GitHub stars">
    </a>
    <a href="https://github.com/taho140303/ansask-desktop/network/members">
      <img src="https://img.shields.io/github/forks/taho140303/ansask-desktop?style=social" alt="GitHub forks">
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
git clone https://github.com/taho140303/ansask-desktop.git
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

[![Star History Chart](https://api.star-history.com/svg?repos=taho140303/ansask-desktop&type=Date)](https://star-history.com/#taho140303/ansask-desktop&Date)

## 📄 Giấy phép

Dự án được phân phối dưới giấy phép MIT. Xem [LICENSE](LICENSE) để biết thêm chi tiết.
MD_EOF
