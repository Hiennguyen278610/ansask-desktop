import * as TabsPrimitive from '@radix-ui/react-tabs';
import { Heart, Settings2, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog';
import { cn } from '@/shared/lib/cn';
import { DonateTab } from './DonateTab';
import { GeneralTab } from './GeneralTab';
import { TrashTab } from './TrashTab';

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const TABS = [
  { value: 'general', label: 'Cấu hình chung', icon: Settings2 },
  { value: 'trash', label: 'Thùng rác', icon: Trash2 },
  { value: 'donate', label: 'Ủng hộ', icon: Heart },
] as const;

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl p-0 overflow-hidden">
        <DialogHeader className="border-b px-6 py-4">
          <DialogTitle>Cài đặt</DialogTitle>
        </DialogHeader>
        <TabsPrimitive.Root
          defaultValue="general"
          orientation="vertical"
          className="flex h-[26rem] min-h-0"
        >
          <TabsPrimitive.List className="flex w-48 shrink-0 flex-col gap-1 bg-[var(--surface-muted)] p-3">
            {TABS.map((t) => {
              const Icon = t.icon;
              return (
                <TabsPrimitive.Trigger
                  key={t.value}
                  value={t.value}
                  className={cn(
                    'flex items-center gap-2.5 rounded-[var(--radius-md)] px-3 py-2 text-left text-sm font-medium text-[var(--text-muted)] transition-colors cursor-pointer',
                    'hover:bg-[var(--surface-hover)] hover:text-[var(--text)]',
                    'data-[state=active]:bg-[var(--surface)] data-[state=active]:text-[var(--primary-text)]',
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{t.label}</span>
                </TabsPrimitive.Trigger>
              );
            })}
          </TabsPrimitive.List>

          <div className="min-w-0 flex-1 p-6">
            <TabsPrimitive.Content value="general" className="h-full focus:outline-none">
              <GeneralTab />
            </TabsPrimitive.Content>
            <TabsPrimitive.Content value="trash" className="h-full focus:outline-none">
              <TrashTab />
            </TabsPrimitive.Content>
            <TabsPrimitive.Content value="donate" className="h-full focus:outline-none">
              <DonateTab />
            </TabsPrimitive.Content>
          </div>
        </TabsPrimitive.Root>
      </DialogContent>
    </Dialog>
  );
}
