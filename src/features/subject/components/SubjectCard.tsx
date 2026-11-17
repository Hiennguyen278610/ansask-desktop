import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { ChevronRight, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import type { Subject } from '@/domain/types';
import { ConfirmDialog } from '@/shared/components/feedback/ConfirmDialog';
import { SubjectIcon } from '@/shared/components/SubjectIcon';
import { getSubjectIconUrl } from '@/shared/lib/subject-icons';
import { RenameSubjectDialog } from './RenameSubjectDialog';

interface SubjectCardProps {
  subject: Subject;
  onDelete: () => Promise<unknown> | void;
}

export function SubjectCard({ subject, onDelete }: SubjectCardProps) {
  const navigate = useNavigate();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [renameTarget, setRenameTarget] = useState<Subject | null>(null);
  const iconUrl = getSubjectIconUrl(subject.icon);

  return (
    <>
      <div className="group relative h-36 rounded-[var(--radius-lg)] bg-[var(--surface)] transition-all hover:outline-2 hover:outline-[var(--primary)]">
        <button
          type="button"
          onClick={() => navigate({ to: '/exams/$subjectId', params: { subjectId: subject.id } })}
          className="flex h-full w-full flex-col justify-between rounded-[var(--radius-lg)] p-4 text-left focus-visible:outline-2 focus-visible:outline-[var(--primary)] cursor-pointer"
        >
          <div className="flex min-w-0 items-center gap-3 pr-16">
            {iconUrl && <SubjectIcon url={iconUrl} className="h-10 w-10" />}
            <h3 className="truncate text-base font-semibold text-[var(--text)]">{subject.name}</h3>
          </div>
          <p className="text-sm text-[var(--text-muted)]">
            {subject.examCount} bộ đề • {subject.questionCount} câu hỏi
          </p>
          <div className="flex w-full items-center justify-between text-xs font-semibold text-[var(--primary-text)]">
            <span>Mở bộ đề</span>
            <ChevronRight className="h-4 w-4" />
          </div>
        </button>
        <div className="absolute right-3 top-3 flex items-center gap-1">
            <button
              type="button"
              title="Đổi tên môn học"
              aria-label="Đổi tên môn học"
              onClick={() => setRenameTarget(subject)}
              className="rounded-[var(--radius-sm)] p-1.5 text-[var(--text-subtle)] transition-colors hover:bg-[var(--surface-hover)] hover:text-[var(--text)] focus-visible:outline-2 focus-visible:outline-[var(--primary)] cursor-pointer"
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button
              type="button"
              title="Xóa môn học"
              aria-label="Xóa môn học"
              onClick={() => setConfirmOpen(true)}
              className="rounded-[var(--radius-sm)] p-1.5 text-[var(--text-subtle)] transition-colors hover:bg-[var(--destroy-soft)] hover:text-[var(--destroy-text)] focus-visible:outline-2 focus-visible:outline-[var(--primary)] cursor-pointer"
            >
              <Trash2 className="h-4 w-4" />
            </button>
        </div>
      </div>

      <RenameSubjectDialog
        subject={renameTarget}
        onOpenChange={(open) => {
          if (!open) setRenameTarget(null);
        }}
      />

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Xóa môn học?"
        description={`Môn "${subject.name}" sẽ được chuyển vào thùng rác.`}
        confirmLabel="Xóa"
        destructive
        onConfirm={async () => {
          await onDelete();
          toast.success('Đã chuyển vào thùng rác');
          setConfirmOpen(false);
        }}
      />
    </>
  );
}
