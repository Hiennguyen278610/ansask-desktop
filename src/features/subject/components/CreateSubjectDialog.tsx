import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { useCreateSubject } from '@/services/subject/queries';
import { Button } from '@/shared/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog';
import { Input } from '@/shared/components/ui/input';
import { SubjectIcon } from '@/shared/components/SubjectIcon';
import { getSubjectIconUrl, SUBJECT_ICONS } from '@/shared/lib/subject-icons';
import { createSubjectSchema, type CreateSubjectForm } from '../schema';
import { IconPickerDialog } from './IconPickerDialog';

interface CreateSubjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateSubjectDialog({ open, onOpenChange }: CreateSubjectDialogProps) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const create = useCreateSubject();
  const defaultIcon = SUBJECT_ICONS[0]?.key ?? '';

  const form = useForm<CreateSubjectForm>({
    resolver: zodResolver(createSubjectSchema),
    defaultValues: { name: '', icon: defaultIcon },
  });

  const selectedIcon = form.watch('icon');
  const iconUrl = getSubjectIconUrl(selectedIcon);

  const onSubmit = form.handleSubmit((data) => {
    create.mutate(data, {
      onSuccess: () => {
        toast.success('Đã tạo môn học');
        form.reset({ name: '', icon: defaultIcon });
        onOpenChange(false);
      },
    });
  });

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Tạo môn học</DialogTitle>
          </DialogHeader>
          <form onSubmit={onSubmit} className="mt-4 space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-[var(--text)]">Tên môn học</label>
              <Input
                placeholder="Ví dụ: Sinh học phân tử"
                {...form.register('name')}
                autoFocus
              />
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
              <Button type="submit" disabled={create.isPending}>
                Tạo môn học
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
