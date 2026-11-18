import { useEffect, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import type { Subject } from '@/domain/types';
import { useRenameSubject } from '@/services/subject/queries';
import { SubjectIcon } from '@/shared/components/SubjectIcon';
import { Button } from '@/shared/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog';
import { Input } from '@/shared/components/ui/input';
import { getSubjectIconUrl, SUBJECT_ICONS } from '@/shared/lib/subject-icons';
import { renameSubjectSchema, type RenameSubjectForm } from '../schema';
import { IconPickerDialog } from './IconPickerDialog';

interface RenameSubjectDialogProps {
  subject: Subject | null;
  onOpenChange: (open: boolean) => void;
}

export function RenameSubjectDialog({ subject, onOpenChange }: RenameSubjectDialogProps) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const rename = useRenameSubject();
  const fallbackIcon = SUBJECT_ICONS[0]?.key ?? '';

  const form = useForm<RenameSubjectForm>({
    resolver: zodResolver(renameSubjectSchema),
    defaultValues: { name: subject?.name ?? '', icon: subject?.icon || fallbackIcon },
  });

  useEffect(() => {
    if (subject) {
      form.reset({ name: subject.name, icon: subject.icon || fallbackIcon });
    }
  }, [subject, fallbackIcon, form]);

  const selectedIcon = form.watch('icon');
  const iconUrl = getSubjectIconUrl(selectedIcon);

  const onSubmit = form.handleSubmit((data) => {
    if (!subject) return;
    rename.mutate(
      { id: subject.id, name: data.name, icon: data.icon },
      {
        onSuccess: () => {
          toast.success('Đã cập nhật môn học');
          onOpenChange(false);
        },
      },
    );
  });

  return (
    <>
      <Dialog open={subject !== null} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Chỉnh sửa môn học</DialogTitle>
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

            <div className="flex items-center justify-between gap-4">
              <span className="text-sm font-medium text-[var(--text)]">Icon nhận diện</span>
              <Button
                type="button"
                variant="outline"
                onClick={() => setPickerOpen(true)}
                className="h-12 gap-3 px-3.5"
              >
                {iconUrl && <SubjectIcon url={iconUrl} className="h-8 w-8" />}
                <span>Chọn icon</span>
              </Button>
            </div>
            {form.formState.errors.icon && (
              <p className="text-xs text-[var(--destroy-text)]">
                {form.formState.errors.icon.message}
              </p>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Hủy
              </Button>
              <Button type="submit" disabled={rename.isPending}>
                Lưu thay đổi
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <IconPickerDialog
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        value={selectedIcon}
        onSelect={(key) => form.setValue('icon', key, { shouldValidate: true })}
      />
    </>
  );
}
