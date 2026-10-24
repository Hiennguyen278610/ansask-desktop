#!/bin/bash
set -e

# 1. Sửa BreadcrumbHeader (Giãn full width để nút Tạo bộ đề đẩy sang phải)
cat > src/components/layout/BreadcrumbHeader.tsx << 'TSX_EOF'
import type { ReactNode } from 'react';

export function BreadcrumbHeader({ children }: { children?: ReactNode }) {
  return (
    <header className="neu-card rounded-2xl px-5 py-4 flex flex-wrap items-center justify-between gap-4">
      <div className="flex flex-1 w-full items-center flex-wrap gap-1.5 text-sm font-bold">
        {children ?? <span className="text-slate-400">ansask</span>}
      </div>
    </header>
  );
}
TSX_EOF

# 2. Sửa AppShell (Thêm items-start để Sidebar không bị kéo giãn)
cat > src/components/layout/AppShell.tsx << 'TSX_EOF'
import { Outlet } from 'react-router';
import { Sidebar } from './Sidebar';

export function AppShell() {
  return (
    <div className="min-h-screen bg-app text-ink flex flex-col md:flex-row p-3 sm:p-6 gap-5 sm:gap-7 md:items-start">
      <Sidebar />
      <main className="flex-1 w-full neu-shell rounded-[32px] p-5 sm:p-8 overflow-x-hidden flex flex-col gap-6 min-h-[calc(100vh-1.5rem)] sm:min-h-[calc(100vh-3rem)]">
        <Outlet />
      </main>
    </div>
  );
}
TSX_EOF

# 3. Sửa Sidebar (Ghim cố định, thêm thanh cuộn riêng nếu nội dung quá dài)
cat > src/components/layout/Sidebar.tsx << 'TSX_EOF'
import { LayoutDashboard, BookOpen, Sparkles, Trash2, PanelLeft } from 'lucide-react';
import { NavLink } from 'react-router';
import { useUiStore } from '@/stores/uiStore';
import { ThemeToggle } from '@/features/theme/ThemeToggle';
import { useTrash } from '@/hooks/useTrash';

export function Sidebar() {
  const sidebarOpen = useUiStore((s) => s.sidebarOpen);
  const toggleSidebar = useUiStore((s) => s.toggleSidebar);
  const { data: trashItems } = useTrash();
  const trashCount = trashItems?.length || 0;

  const NAV_ITEMS = [
    { to: '/', label: 'OVERVIEW', icon: LayoutDashboard, end: true },
    { to: '/subjects', label: 'ĐỀ KIỂM TRA', icon: BookOpen, end: false },
    { to: '/guide', label: 'AI GUIDE', icon: Sparkles, end: false },
    { to: '/trash', label: 'THÙNG RÁC', icon: Trash2, end: false, badge: trashCount },
  ];

  return (
    <div className="shrink-0 sticky top-3 sm:top-6 h-[calc(100vh-1.5rem)] sm:h-[calc(100vh-3rem)] w-full md:w-auto z-30">
      <aside
        className={`neu-shell rounded-[30px] h-full flex flex-col justify-between transition-all duration-300 ease-in-out overflow-y-auto custom-scrollbar ${
          sidebarOpen ? 'w-full md:w-64 p-6' : 'w-full md:w-20 p-4 items-center'
        }`}
      >
        <div className="w-full">
          <div className={`flex items-center mb-6 ${sidebarOpen ? 'justify-between' : 'justify-center'}`}>
            <button
              onClick={toggleSidebar}
              className="neu-icon-btn w-11 h-11 rounded-2xl flex items-center justify-center relative"
              title={sidebarOpen ? 'Thu gọn Sidebar' : 'Mở rộng Sidebar'}
              aria-label={sidebarOpen ? 'Thu gọn Sidebar' : 'Mở rộng Sidebar'}
            >
              <PanelLeft className="w-5 h-5" />
            </button>
            {sidebarOpen && (
              <div>
                <h1 className="font-bold text-base tracking-tight">ansask</h1>
                <p className="text-[11px] text-slate-400 font-medium">Smart Exam Studio</p>
              </div>
            )}
          </div>

          <nav className="space-y-2">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  title={item.label}
                  className={({ isActive }) =>
                    `flex items-center rounded-full transition-colors relative ${
                      sidebarOpen ? 'px-4 py-3 gap-3' : 'p-3 justify-center'
                    } ${isActive ? 'neu-pill-active font-bold' : 'hover:bg-white/40 dark:hover:bg-white/10'}`
                  }
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {sidebarOpen && (
                    <span className="text-xs tracking-wider flex-1">{item.label}</span>
                  )}
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className={`bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center ${sidebarOpen ? 'px-2 py-0.5' : 'absolute -top-1 -right-1 w-5 h-5'}`}>
                      {item.badge > 99 ? '99+' : item.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        <div className="pt-6 mt-6 border-t border-slate-200/70 dark:border-slate-700/70 w-full flex justify-center">
          <ThemeToggle collapsed={!sidebarOpen} />
        </div>
      </aside>
    </div>
  );
}
TSX_EOF

# Format lại code
cd src-tauri && cargo fmt && cd ..
