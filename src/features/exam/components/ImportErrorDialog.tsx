import type { ImportFileError } from '../hooks/useExamIO';
import { Button } from '@/shared/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog';

interface ImportErrorDialogProps {
  errors: ImportFileError[] | null;
  onClose: () => void;
}

export function ImportErrorDialog({ errors, onClose }: ImportErrorDialogProps) {
  return (
    <Dialog open={errors !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Lỗi định dạng khi nhập bộ đề</DialogTitle>
          <DialogDescription>Vui lòng kiểm tra và sửa các lỗi sau trong file:</DialogDescription>
        </DialogHeader>
        <div className="mt-4 max-h-80 space-y-4 overflow-y-auto pr-1">
          {errors?.map((fileErr, fi) => (
            <div key={fi} className="space-y-1.5">
              <p className="text-xs font-bold text-[var(--text)]">{fileErr.fileName}</p>
              {fileErr.errors.map((err, i) => (
                <div
                  key={i}
                  className="rounded-[var(--radius-md)] bg-[var(--destroy-soft)] px-3 py-2 text-sm text-[var(--destroy-text)]"
                >
                  {err.line !== undefined && <span className="font-semibold">Dòng {err.line}: </span>}
                  {err.path !== undefined && <span className="font-semibold">{err.path}: </span>}
                  <span>{err.message}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button onClick={onClose}>Đóng</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
