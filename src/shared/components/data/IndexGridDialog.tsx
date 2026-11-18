import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog';
import { cn } from '@/shared/lib/cn';

interface IndexGridDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  count: number;
  onSelect: (index: number) => void;
  isDone?: (index: number) => boolean;
}

export function IndexGridDialog({
  open,
  onOpenChange,
  count,
  onSelect,
  isDone,
}: IndexGridDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Danh sách câu hỏi</DialogTitle>
        </DialogHeader>
        <div className="mt-4 max-h-72 overflow-y-auto pr-1">
          {count === 0 ? (
            <p className="py-6 text-center text-sm text-[var(--text-muted)]">Chưa có câu hỏi nào.</p>
          ) : (
            <div className="grid grid-cols-5 gap-2">
              {Array.from({ length: count }).map((_, i) => {
                const done = isDone?.(i) ?? false;
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      onSelect(i);
                      onOpenChange(false);
                    }}
                    className={cn(
                      'flex h-10 items-center justify-center rounded-[var(--radius-md)] text-sm font-semibold transition-colors cursor-pointer',
                      done
                        ? 'bg-[var(--primary-soft)] text-[var(--primary-text)]'
                        : 'bg-[var(--surface)] text-[var(--text)] hover:bg-[var(--surface-hover)]',
                    )}
                  >
                    {i + 1}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
