import { useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import type { Subject } from '@/domain/types';
import { useRenameSubject } from '@/services/subject/queries';
import { Button } from '@/shared/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog';
import { Input } from '@/shared/components/ui/input';
import { renameSubjectSchema, type RenameSubjectForm } from '../schema';

interface RenameSubjectDialogProps {
  subject: Subject | null;
  onOpenChange: (open: boolean) => void;
}

export function RenameSubjectDialog({ subject, onOpenChange }: RenameSubjectDialogProps) {
  const rename = useRenameSubject();

  const form = useForm<RenameSubjectForm>({
    resolver: zodResolver(renameSubjectSchema),
    defaultValues: { name: subject?.name ?? '' },
  });

  useEffect(() => {
    if (subject) {
      form.reset({ name: subject.name });
    }
  }, [subject, form]);

  const onSubmit = form.handleSubmit((data) => {
    if (!subject) return;
    rename.mutate(
      { id: subject.id, name: data.name },
      {
        onSuccess: () => {
          toast.success('Đã đổi tên môn học');
          onOpenChange(false);
        },
      },
    );
  });

  return (
    <Dialog open={subject !== null} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Đổi tên môn học</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="mt-4 space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[var(--text)]">Tên môn học</label>
            <Input placeholder="Nhập tên môn học mới" {...form.register('name')} autoFocus />
            {form.formState.errors.name && (
              <p className="text-xs text-[var(--destroy-text)]">
                {form.formState.errors.name.message}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Hủy
            </Button>
            <Button type="submit" disabled={rename.isPending}>
              Lưu tên
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
