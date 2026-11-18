import { Link, useRouterState } from '@tanstack/react-router';
import { BookOpen, History, LayoutDashboard, Sparkles } from 'lucide-react';
import { cn } from '@/shared/lib/cn';

const NAV_ITEMS = [
  { to: '/', label: 'Tổng quan', icon: LayoutDashboard, matchPrefix: false },
  { to: '/exams', label: 'Đề bài', icon: BookOpen, matchPrefix: true },
  { to: '/history', label: 'Lịch sử', icon: History, matchPrefix: false },
  { to: '/guide', label: 'Hướng dẫn AI', icon: Sparkles, matchPrefix: false },
] as const;

export function SidebarNav({ collapsed }: { collapsed: boolean }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto p-2">
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const active = item.matchPrefix ? pathname.startsWith(item.to) : pathname === item.to;
        return (
          <Link
            key={item.to}
            to={item.to}
            title={collapsed ? item.label : undefined}
            className={cn(
              'flex items-center gap-3 rounded-[var(--radius-md)] px-3 py-2.5 text-sm font-medium transition-colors',
              collapsed && 'justify-center px-2',
              active
                ? 'bg-[var(--sidebar-active)] text-[var(--sidebar-active-foreground)] font-semibold shadow-[var(--shadow-elevated)]'
                : 'text-[var(--text-muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--text)]',
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {!collapsed && <span className="truncate">{item.label}</span>}
          </Link>
        );
      })}
    </nav>
  );
}
