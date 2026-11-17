import { SubjectIcon } from '@/shared/components/SubjectIcon';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog';
import { cn } from '@/shared/lib/cn';
import { SUBJECT_ICONS } from '@/shared/lib/subject-icons';

interface IconPickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: string;
  onSelect: (key: string) => void;
}

export function IconPickerDialog({
  open,
  onOpenChange,
  value,
  onSelect,
}: IconPickerDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Chọn icon nhận diện</DialogTitle>
        </DialogHeader>
        <div className="mt-4 grid max-h-80 grid-cols-5 gap-2.5 overflow-y-auto pr-1">
          {SUBJECT_ICONS.map((icon) => {
            const active = icon.key === value;
            return (
              <button
                key={icon.key}
                type="button"
                title={icon.label}
                aria-label={icon.label}
                onClick={() => {
                  onSelect(icon.key);
                  onOpenChange(false);
                }}
                className={cn(
                  'flex aspect-square items-center justify-center rounded-[var(--radius-md)] bg-transparent p-3 transition-all focus-visible:outline-2 focus-visible:outline-[var(--primary)] cursor-pointer',
                  active
                    ? 'outline-2 outline-[var(--primary)]'
                    : 'hover:outline-2 hover:outline-[var(--text-subtle)]',
                )}
              >
                <SubjectIcon url={icon.url} label={icon.label} className="h-10 w-10" />
              </button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
