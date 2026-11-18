import { useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from '@tanstack/react-router';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import type { ExamSummary } from '@/domain/types';
import { useRenameExam } from '@/services/exam/queries';
import { Button } from '@/shared/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog';
import { Input } from '@/shared/components/ui/input';

const renameExamSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Tên bộ đề không được để trống.')
    .max(200, 'Tên bộ đề tối đa 200 ký tự.'),
});

type RenameExamForm = z.infer<typeof renameExamSchema>;

interface RenameExamDialogProps {
  exam: ExamSummary | null;
  onOpenChange: (open: boolean) => void;
}

export function RenameExamDialog({ exam, onOpenChange }: RenameExamDialogProps) {
  const router = useRouter();
  const rename = useRenameExam();

  const form = useForm<RenameExamForm>({
    resolver: zodResolver(renameExamSchema),
    defaultValues: { title: exam?.title ?? '' },
  });

  useEffect(() => {
    if (exam) {
      form.reset({ title: exam.title });
    }
  }, [exam, form]);

  const onSubmit = form.handleSubmit((data) => {
    if (!exam) return;
    rename.mutate(
      { id: exam.id, title: data.title },
      {
        onSuccess: () => {
          toast.success('Đã đổi tên bộ đề');
          void router.invalidate();
          onOpenChange(false);
        },
      },
    );
  });

  return (
    <Dialog open={exam !== null} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Đổi tên bộ đề</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="mt-4 space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[var(--text)]">Tên bộ đề</label>
            <Input placeholder="Nhập tên bộ đề mới" {...form.register('title')} autoFocus />
            {form.formState.errors.title && (
              <p className="text-xs text-[var(--destroy-text)]">
                {form.formState.errors.title.message}
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
