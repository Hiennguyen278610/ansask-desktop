import { useState } from 'react';
import { SettingsDialog } from '@/features/settings/components/SettingsDialog';
import { cn } from '@/shared/lib/cn';
import { SidebarFooter } from './SidebarFooter';
import { SidebarHeader } from './SidebarHeader';
import { SidebarNav } from './SidebarNav';

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <>
      <aside
        className={cn(
          'hidden md:flex h-full shrink-0 flex-col bg-[var(--surface)] transition-[width] duration-200',
          collapsed ? 'w-16' : 'w-60',
        )}
      >
        <SidebarHeader collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />
        <SidebarNav collapsed={collapsed} />
        <SidebarFooter collapsed={collapsed} onOpenSettings={() => setSettingsOpen(true)} />
      </aside>
      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </>
  );
}
