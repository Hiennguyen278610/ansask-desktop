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
    <aside
      className={`neu-shell rounded-[30px] shrink-0 flex flex-col justify-between transition-all duration-300 ease-in-out ${
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
  );
}
