import { useEffect, useMemo } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Play } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import type { Id } from '@/domain/types';
import { Button } from '@/shared/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog';
import { Input } from '@/shared/components/ui/input';
import { Switch } from '@/shared/components/ui/switch';
import { cn } from '@/shared/lib/cn';
import { useStartSession } from '../hooks/useStartSession';

const QUICK_COUNTS = [25, 32, 40] as const;

interface ExamConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  examId: Id;
  subjectId: Id;
  examTitle: string;
  total: number;
}

export function ExamConfigDialog({
  open,
  onOpenChange,
  examId,
  subjectId,
  examTitle,
  total,
}: ExamConfigDialogProps) {
  const { startSession, isStarting } = useStartSession();

  const schema = useMemo(
    () =>
      z.object({
        mode: z.enum(['quiz', 'flashcard']),
        count: z.coerce
          .number()
          .int('Số câu phải là số nguyên.')
          .min(1, 'Tối thiểu 1 câu.')
          .max(Math.max(1, total), `Tối đa ${total} câu.`),
        shuffle: z.boolean(),
      }),
    [total],
  );

  type FormValues = z.infer<typeof schema>;

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      mode: 'quiz',
      count: Math.min(10, Math.max(1, total)),
      shuffle: false,
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        mode: 'quiz',
        count: Math.min(10, Math.max(1, total)),
        shuffle: false,
      });
    }
  }, [open, total, form]);

  const mode = form.watch('mode');
  const shuffle = form.watch('shuffle');

  const onSubmit = form.handleSubmit(async (values) => {
    await startSession({
      examId,
      subjectId,
      examTitle,
      mode: values.mode,
      count: values.count,
      shuffle: values.shuffle,
    });
    onOpenChange(false);
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Cấu hình bài kiểm tra</DialogTitle>
        </DialogHeader>

        <form onSubmit={onSubmit} className="mt-4 space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-medium text-[var(--text)]">Chọn chế độ</label>
            <div className="grid grid-cols-2 gap-2 rounded-[var(--radius-md)] bg-[var(--surface-muted)] p-1">
              <button
                type="button"
                onClick={() => form.setValue('mode', 'quiz')}
                className={cn(
                  'rounded-[var(--radius-sm)] py-2 text-sm font-semibold transition-colors cursor-pointer',
                  mode === 'quiz'
                    ? 'bg-[var(--surface)] text-[var(--primary-text)]'
                    : 'text-[var(--text-muted)]',
                )}
              >
                Trắc nghiệm
              </button>
              <button
                type="button"
                onClick={() => form.setValue('mode', 'flashcard')}
                className={cn(
                  'rounded-[var(--radius-sm)] py-2 text-sm font-semibold transition-colors cursor-pointer',
                  mode === 'flashcard'
                    ? 'bg-[var(--surface)] text-[var(--primary-text)]'
                    : 'text-[var(--text-muted)]',
                )}
              >
                Flash card
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-[var(--text)]">Số câu</label>
            <Input
              type="number"
              min={1}
              max={total}
              {...form.register('count')}
            />
            {form.formState.errors.count && (
              <p className="text-xs text-[var(--destroy-text)]">
                {form.formState.errors.count.message}
              </p>
            )}

            <div className="pt-1">
              <p className="mb-1.5 text-xs font-medium text-[var(--text-muted)]">Chọn nhanh</p>
              <div className="grid grid-cols-4 gap-2">
                {QUICK_COUNTS.map((val) => (
                  <Button
                    key={val}
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={total <= val}
                    onClick={() => form.setValue('count', val, { shouldValidate: true })}
                  >
                    {val}
                  </Button>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={total < 1}
                  onClick={() => form.setValue('count', total, { shouldValidate: true })}
                >
                  Tất cả
                </Button>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between gap-4">
            <span className="text-sm font-medium text-[var(--text)]">Xáo đáp án & câu hỏi</span>
            <Switch
              checked={shuffle}
              onCheckedChange={(checked) => form.setValue('shuffle', checked)}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Đóng
            </Button>
            <Button type="submit" disabled={total < 1 || isStarting}>
              <Play className="h-4 w-4" />
              Làm bài
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
