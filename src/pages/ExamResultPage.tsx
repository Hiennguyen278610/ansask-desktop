import { useMemo, useState } from 'react';
import { useNavigate, useParams } from '@tanstack/react-router';
import { AlertCircle, ArrowLeft, RefreshCw } from 'lucide-react';
import { buildRetrySession } from '@/domain/session/build-retry';
import { AttemptQuestionList } from '@/features/exam-result/components/AttemptQuestionList';
import { getQuestionStatus, type ResultFilter } from '@/features/exam-result/utils';
import { ResultActions } from '@/features/exam-result/components/ResultActions';
import { ScoreDonut } from '@/features/exam-result/components/ScoreDonut';
import { ExamConfigDialog } from '@/features/exam-taking/components/ExamConfigDialog';
import { useSessionStore } from '@/features/exam-taking/store/session.store';
import { useAttempt } from '@/services/attempt/queries';
import { useExam } from '@/services/exam/queries';
import { EmptyState } from '@/shared/components/feedback/EmptyState';
import { GridSkeleton } from '@/shared/components/feedback/GridSkeleton';
import { Button } from '@/shared/components/ui/button';
import { cn } from '@/shared/lib/cn';

function formatDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function ExamResultPage() {
  const { subjectId, examId, attemptId } = useParams({
    from: '/_app/exams/$subjectId/$examId/result/$attemptId',
  });
  const navigate = useNavigate();
  const [configOpen, setConfigOpen] = useState(false);
  const [filter, setFilter] = useState<ResultFilter>('all');

  const attemptQ = useAttempt(attemptId);
  const examQ = useExam(examId);
  const startSession = useSessionStore((s) => s.start);

  const attempt = attemptQ.data;

  const counts = useMemo(() => {
    if (!attempt) return { all: 0, correct: 0, wrong: 0, unanswered: 0 };
    let correct = 0;
    let wrong = 0;
    let unanswered = 0;
    for (const q of attempt.questions) {
      const st = getQuestionStatus(q, attempt.answers);
      if (st === 'correct') correct++;
      else if (st === 'wrong') wrong++;
      else unanswered++;
    }
    return { all: attempt.questions.length, correct, wrong, unanswered };
  }, [attempt]);

  if (attemptQ.isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-32 animate-pulse rounded-[var(--radius-lg)] bg-[var(--surface)]" />
        <GridSkeleton columns={1} count={3} />
      </div>
    );
  }

  if (attemptQ.isError || !attempt) {
    return (
      <EmptyState
        icon={<AlertCircle className="h-6 w-6 text-[var(--destroy-text)]" />}
        title="Không tải được kết quả bài làm"
        description={
          attemptQ.error instanceof Error
            ? attemptQ.error.message
            : 'Dữ liệu kết quả không tồn tại hoặc đã bị xóa.'
        }
        action={
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                navigate({ to: '/exams/$subjectId/$examId', params: { subjectId, examId } })
              }
            >
              <ArrowLeft className="h-4 w-4" />
              Về đề bài
            </Button>
            <Button type="button" onClick={() => attemptQ.refetch()}>
              <RefreshCw className="h-4 w-4" />
              Thử lại
            </Button>
          </div>
        }
      />
    );
  }

  const wrongCount = Math.max(0, attempt.total - attempt.correct);

  const handleRetryWrong = () => {
    const retryQuestions = buildRetrySession(attempt);
    if (retryQuestions.length === 0) return;
    startSession({
      examId,
      subjectId,
      examTitle: attempt.examTitle,
      mode: 'flashcard',
      questions: retryQuestions,
      startedAt: Date.now(),
    });
    navigate({ to: '/take' });
  };

  const filterTabs: { key: ResultFilter; label: string; count: number }[] = [
    { key: 'all', label: 'Tất cả', count: counts.all },
    { key: 'correct', label: 'Đúng', count: counts.correct },
    { key: 'wrong', label: 'Sai', count: counts.wrong },
    { key: 'unanswered', label: 'Bỏ trống', count: counts.unanswered },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-6 rounded-[var(--radius-lg)] bg-[var(--surface)] p-6 shadow-[var(--shadow-elevated)]">
        <div className="flex items-center gap-5">
          <ScoreDonut score={attempt.score} />
          <div>
            <h2 className="text-lg font-bold text-[var(--text)]">{attempt.examTitle}</h2>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              Hoàn thành bài kiểm tra • {attempt.correct}/{attempt.total} câu đúng •{' '}
              {formatDuration(attempt.elapsedSec)}
            </p>
            {attempt.mode === 'flashcard' && (
              <p className="mt-1 text-xs text-[var(--text-subtle)]">
                Flash card chỉ tính đúng khi chọn đúng ngay lần đầu.
              </p>
            )}
          </div>
        </div>

        <ResultActions
          wrongCount={wrongCount}
          onBack={() =>
            navigate({ to: '/exams/$subjectId/$examId', params: { subjectId, examId } })
          }
          onRetryWrong={handleRetryWrong}
          onPractice={() => setConfigOpen(true)}
        />
      </div>

      {attempt.questions.length === 0 ? (
        <EmptyState title="Không có câu hỏi nào trong bài làm này" />
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            {filterTabs.map((tab) => {
              const active = filter === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setFilter(tab.key)}
                  className={cn(
                    'rounded-[var(--radius-md)] px-3.5 py-1.5 text-sm font-semibold transition-all cursor-pointer',
                    active
                      ? 'bg-[var(--primary)] text-[var(--primary-foreground)]'
                      : 'border bg-transparent text-[var(--text)] hover:outline-2 hover:outline-[var(--primary)]',
                  )}
                >
                  {tab.label} ({tab.count})
                </button>
              );
            })}
          </div>

          <AttemptQuestionList
            questions={attempt.questions}
            answers={attempt.answers}
            mode={attempt.mode}
            filter={filter}
          />
        </div>
      )}

      <ExamConfigDialog
        open={configOpen}
        onOpenChange={setConfigOpen}
        examId={examId}
        subjectId={subjectId}
        examTitle={attempt.examTitle}
        total={examQ.data?.questionCount ?? attempt.total}
      />
    </div>
  );
}
