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
        <DialogHeader className="border-b px-4 py-3.5 md:px-6 md:py-4">
          <DialogTitle>Cài đặt</DialogTitle>
        </DialogHeader>
        <TabsPrimitive.Root
          defaultValue="general"
          className="flex h-[70vh] max-h-[30rem] min-h-0 flex-col md:h-[26rem] md:flex-row"
        >
          <TabsPrimitive.List className="flex w-full shrink-0 flex-row gap-1 overflow-x-auto bg-[var(--surface-muted)] p-2 md:w-48 md:flex-col md:p-3">
            {TABS.map((t) => {
              const Icon = t.icon;
              return (
                <TabsPrimitive.Trigger
                  key={t.value}
                  value={t.value}
                  className={cn(
                    'flex shrink-0 items-center gap-2 rounded-[var(--radius-md)] px-3 py-2 text-left text-sm font-medium text-[var(--text-muted)] transition-colors cursor-pointer md:gap-2.5',
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

          <div className="min-w-0 flex-1 overflow-y-auto p-4 md:p-6">
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
