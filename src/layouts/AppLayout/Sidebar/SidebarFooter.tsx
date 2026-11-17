import { Settings } from 'lucide-react';
import { cn } from '@/shared/lib/cn';

export function SidebarFooter({
  collapsed,
  onOpenSettings,
}: {
  collapsed: boolean;
  onOpenSettings: () => void;
}) {
  return (
    <div className="shrink-0 border-t p-2">
      <button
        type="button"
        onClick={onOpenSettings}
        title={collapsed ? 'Cài đặt' : undefined}
        className={cn(
          'flex w-full items-center gap-3 rounded-[var(--radius-md)] px-3 py-2.5 text-sm font-medium text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-hover)] hover:text-[var(--text)] cursor-pointer',
          collapsed && 'justify-center px-2',
        )}
      >
        <Settings className="h-4 w-4 shrink-0" />
        {!collapsed && <span>Cài đặt</span>}
      </button>
    </div>
  );
}
