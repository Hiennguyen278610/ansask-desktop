import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { ChevronRight, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import type { ExamSummary } from '@/domain/types';
import { ConfirmDialog } from '@/shared/components/feedback/ConfirmDialog';
import { RenameExamDialog } from './RenameExamDialog';

interface ExamCardProps {
  exam: ExamSummary;
  onDelete: () => Promise<unknown> | void;
}

export function ExamCard({ exam, onDelete }: ExamCardProps) {
  const navigate = useNavigate();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [renameTarget, setRenameTarget] = useState<ExamSummary | null>(null);

  const openDetail = () =>
    navigate({
      to: '/exams/$subjectId/$examId',
      params: { subjectId: exam.subjectId, examId: exam.id },
    });

  return (
    <>
      <div className="relative h-36 rounded-[var(--radius-lg)] bg-[var(--surface)] transition-all hover:outline-2 hover:outline-[var(--primary)]">
        <button
          type="button"
          onClick={openDetail}
          className="flex h-full w-full flex-col justify-between rounded-[var(--radius-lg)] p-4 text-left focus-visible:outline-2 focus-visible:outline-[var(--primary)] cursor-pointer"
        >
          <h3 className="line-clamp-2 pr-16 text-base font-semibold text-[var(--text)]">{exam.title}</h3>
          <p className="text-sm text-[var(--text-muted)]">{exam.questionCount} câu hỏi</p>
          <div className="flex w-full items-center justify-between text-xs font-semibold text-[var(--primary-text)]">
            <span>Xem chi tiết đề</span>
            <ChevronRight className="h-4 w-4" />
          </div>
        </button>
        <div className="absolute right-3 top-3 flex items-center gap-1">
          <button
            type="button"
            title="Đổi tên bộ đề"
            aria-label="Đổi tên bộ đề"
            onClick={() => setRenameTarget(exam)}
            className="rounded-[var(--radius-sm)] p-1.5 text-[var(--text-subtle)] transition-colors hover:bg-[var(--surface-hover)] hover:text-[var(--text)] focus-visible:outline-2 focus-visible:outline-[var(--primary)] cursor-pointer"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            type="button"
            title="Xóa bộ đề"
            aria-label="Xóa bộ đề"
            onClick={() => setConfirmOpen(true)}
            className="rounded-[var(--radius-sm)] p-1.5 text-[var(--text-subtle)] transition-colors hover:bg-[var(--destroy-soft)] hover:text-[var(--destroy-text)] focus-visible:outline-2 focus-visible:outline-[var(--primary)] cursor-pointer"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <RenameExamDialog
        exam={renameTarget}
        onOpenChange={(open) => {
          if (!open) setRenameTarget(null);
        }}
      />

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Xóa bộ đề?"
        description={`Bộ đề "${exam.title}" sẽ được chuyển vào thùng rác.`}
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
