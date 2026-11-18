import { Link, useRouterState } from '@tanstack/react-router';
import { BookOpen, History, LayoutDashboard, Settings, Sparkles } from 'lucide-react';
import { cn } from '@/shared/lib/cn';

const NAV_ITEMS = [
  { to: '/', label: 'Tổng quan', icon: LayoutDashboard, matchPrefix: false },
  { to: '/exams', label: 'Đề bài', icon: BookOpen, matchPrefix: true },
  { to: '/history', label: 'Lịch sử', icon: History, matchPrefix: false },
  { to: '/guide', label: 'AI', icon: Sparkles, matchPrefix: false },
  { to: '/settings', label: 'Cài đặt', icon: Settings, matchPrefix: true },
] as const;

export function MobileBottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 px-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] md:hidden">
      <nav
        aria-label="Điều hướng chính"
        className="pointer-events-auto mx-auto grid max-w-md grid-cols-5 rounded-2xl bg-[var(--surface)] px-2 py-1.5 shadow-[0_8px_28px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_28px_rgba(0,0,0,0.45)]"
      >
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = item.matchPrefix ? pathname.startsWith(item.to) : pathname === item.to;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                'flex h-13 flex-col items-center justify-center gap-1 px-1 text-[11px] transition-colors',
                active
                  ? 'font-bold text-[var(--primary-text)]'
                  : 'font-medium text-[var(--text-muted)] hover:text-[var(--text)]',
              )}
            >
              <Icon
                className={cn(
                  'h-5 w-5 shrink-0 transition-transform',
                  active ? 'stroke-[2.8]' : 'stroke-[1.75]',
                )}
              />
              <span className="max-w-full truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
