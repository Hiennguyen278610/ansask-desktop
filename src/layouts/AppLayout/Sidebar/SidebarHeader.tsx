import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { cn } from '@/shared/lib/cn';

interface SidebarHeaderProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function SidebarHeader({ collapsed, onToggle }: SidebarHeaderProps) {
  return (
    <div
      className={cn(
        'flex h-14 shrink-0 items-center border-b px-3',
        collapsed ? 'justify-center' : 'justify-between gap-2',
      )}
    >
      {!collapsed && (
        <div className="flex min-w-0 items-center gap-2.5">
          <img src="/logo.svg" alt="AnsAsk" className="h-8 w-8 shrink-0 rounded-[var(--radius-sm)]" />
          <div className="min-w-0">
            <p className="truncate text-sm font-bold leading-tight text-[var(--text)]">AnsAsk</p>
            <p className="truncate text-xs text-[var(--text-muted)]">Luyện đề trắc nghiệm</p>
          </div>
        </div>
      )}
      <button
        type="button"
        onClick={onToggle}
        title={collapsed ? 'Mở rộng sidebar' : 'Thu gọn sidebar'}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--radius-sm)] text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-hover)] hover:text-[var(--text)] cursor-pointer"
      >
        {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
      </button>
    </div>
  );
}
