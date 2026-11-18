import { useMemo, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { ChevronRight, History } from 'lucide-react';
import { HeaderActions } from '@/layouts/AppLayout/MainContent/HeaderSlot';
import { useAttemptList } from '@/services/attempt/queries';
import { useSubjectList } from '@/services/subject/queries';
import { InfiniteGrid } from '@/shared/components/data/InfiniteGrid';
import { EmptyState } from '@/shared/components/feedback/EmptyState';
import { Select } from '@/shared/components/ui/select';

export function HistoryPage() {
  const navigate = useNavigate();
  const [subjectId, setSubjectId] = useState<string>('');
  const subjectsQ = useSubjectList();
  const q = useAttemptList({ subjectId: subjectId || undefined });

  const subjectOptions = useMemo(
    () => [
      { value: '', label: 'Tất cả môn học' },
      ...subjectsQ.items.map((s) => ({ value: s.id, label: s.name })),
    ],
    [subjectsQ.items],
  );

  return (
    <>
      <HeaderActions>
        <Select
          ariaLabel="Lọc theo môn học"
          value={subjectId}
          onValueChange={setSubjectId}
          options={subjectOptions}
          className="w-full md:w-auto"
        />
      </HeaderActions>

      <InfiniteGrid
        items={q.items}
        columns={1}
        rowHeight={76}
        gap={12}
        getKey={(item) => item.id}
        hasNextPage={q.hasNextPage}
        isFetchingNextPage={q.isFetchingNextPage}
        isError={q.isFetchNextPageError}
        fetchNextPage={q.fetchNextPage}
        isLoading={q.isLoading}
        empty={
          <EmptyState
            icon={<History className="h-6 w-6" />}
            title="Chưa có lịch sử làm bài"
            description="Các bài kiểm tra sau khi nộp sẽ được lưu tại đây."
          />
        }
        renderItem={(item) => (
          <div
            role="button"
            tabIndex={0}
            onClick={() =>
              navigate({
                to: '/exams/$subjectId/$examId/result/$attemptId',
                params: {
                  subjectId: item.subjectId,
                  examId: item.examId,
                  attemptId: item.id,
                },
              })
            }
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                navigate({
                  to: '/exams/$subjectId/$examId/result/$attemptId',
                  params: {
                    subjectId: item.subjectId,
                    examId: item.examId,
                    attemptId: item.id,
                  },
                });
              }
            }}
            className="flex items-center justify-between gap-4 rounded-[var(--radius-lg)] bg-[var(--surface)] px-5 py-3.5 transition-all hover:outline-2 hover:outline-[var(--primary)] cursor-pointer"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-[var(--text)]">{item.examTitle}</p>
              <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                {item.subjectName} • {item.mode === 'quiz' ? 'Trắc nghiệm' : 'Flash card'} •{' '}
                {item.correct}/{item.total} câu đúng •{' '}
                {new Date(item.submittedAt).toLocaleString('vi-VN')}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <span className="rounded-[var(--radius-md)] bg-[var(--primary-soft)] px-2.5 py-1 text-xs font-bold text-[var(--primary-text)]">
                {Number(item.score.toFixed(2))}/10
              </span>
              <ChevronRight className="h-4 w-4 text-[var(--text-subtle)]" />
            </div>
          </div>
        )}
      />
    </>
  );
}
