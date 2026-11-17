import { useState } from 'react';
import { useNavigate, useParams } from '@tanstack/react-router';
import { Clock, Download, Eye, EyeOff, Pencil, Play, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { ExamQuestionList } from '@/features/exam/components/ExamQuestionList';
import { useExamIO } from '@/features/exam/hooks/useExamIO';
import { ExamConfigDialog } from '@/features/exam-taking/components/ExamConfigDialog';
import { useSessionStore } from '@/features/exam-taking/store/session.store';
import { HeaderActions } from '@/layouts/AppLayout/MainContent/HeaderSlot';
import { useExam, useExamQuestions } from '@/services/exam/queries';
import { useDeleteSessionDraft, useSessionDraft } from '@/services/session/queries';
import { GridSkeleton } from '@/shared/components/feedback/GridSkeleton';
import { Button } from '@/shared/components/ui/button';

export function ExamDetailPage() {
  const { subjectId, examId } = useParams({ from: '/_app/exams/$subjectId/$examId' });
  const navigate = useNavigate();
  const [showAnswers, setShowAnswers] = useState(false);
  const [configOpen, setConfigOpen] = useState(false);

  const examQ = useExam(examId);
  const questionsQ = useExamQuestions(examId);
  const draftQ = useSessionDraft(examId);
  const deleteDraft = useDeleteSessionDraft();
  const startSession = useSessionStore((s) => s.start);
  const { exportExam } = useExamIO(subjectId);

  const exam = examQ.data;
  const questions = questionsQ.data ?? [];
  const draft = draftQ.data;

  const handleResumeDraft = () => {
    if (!draft || !exam) return;
    startSession(
      {
        examId: exam.id,
        subjectId,
        examTitle: exam.title,
        mode: draft.mode,
        questions: draft.questions,
        startedAt: draft.startedAt,
        elapsedSecBase: draft.elapsedSec,
      },
      { answers: draft.answers, firstTry: draft.firstTry, index: draft.currentIndex },
    );
    navigate({ to: '/take' });
  };

  const answeredInDraft = draft
    ? draft.questions.filter((q) => draft.answers[q.id] != null).length
    : 0;

  return (
    <>
      <HeaderActions>
        <Button variant="outline" onClick={() => setShowAnswers((v) => !v)}>
          {showAnswers ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          {showAnswers ? 'Ẩn đáp án' : 'Hiện đáp án'}
        </Button>
        <Button
          variant="outline"
          disabled={!exam}
          onClick={() => exam && exportExam(exam.id, exam.title, 'txt')}
        >
          <Download className="h-4 w-4" />
          Xuất TXT
        </Button>
        <Button
          variant="outline"
          disabled={!exam}
          onClick={() => exam && exportExam(exam.id, exam.title, 'json')}
        >
          <Download className="h-4 w-4" />
          Xuất JSON
        </Button>
        <Button
          variant="outline"
          onClick={() =>
            navigate({ to: '/exams/$subjectId/$examId/edit', params: { subjectId, examId } })
          }
        >
          <Pencil className="h-4 w-4" />
          Sửa đề
        </Button>
        <Button disabled={!exam || exam.questionCount === 0} onClick={() => setConfigOpen(true)}>
          <Play className="h-4 w-4" />
          Làm đề
        </Button>
      </HeaderActions>

      {draft && exam && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-4 rounded-[var(--radius-lg)] bg-[var(--surface)] p-4 shadow-[var(--shadow-elevated)]">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--primary-soft)] text-[var(--primary-text)]">
              <Clock className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[var(--text)]">
                Bạn có phiên làm dở ({draft.mode === 'quiz' ? 'Trắc nghiệm' : 'Flash card'})
              </p>
              <p className="text-xs text-[var(--text-muted)]">
                Đã chọn {answeredInDraft}/{draft.questions.length} câu • Cập nhật lúc{' '}
                {new Date(draft.updatedAt).toLocaleString('vi-VN')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={deleteDraft.isPending}
              onClick={() =>
                deleteDraft.mutate(examId, {
                  onSuccess: () => toast.success('Đã xóa bản nháp'),
                })
              }
            >
              <Trash2 className="h-4 w-4" />
              Hủy bản nháp
            </Button>
            <Button type="button" size="sm" onClick={handleResumeDraft}>
              <Play className="h-4 w-4" />
              Tiếp tục làm bài
            </Button>
          </div>
        </div>
      )}

      {questionsQ.isLoading ? (
        <GridSkeleton columns={1} count={4} />
      ) : (
        <ExamQuestionList questions={questions} showAnswers={showAnswers} />
      )}

      {exam && (
        <ExamConfigDialog
          open={configOpen}
          onOpenChange={setConfigOpen}
          examId={exam.id}
          subjectId={subjectId}
          examTitle={exam.title}
          total={exam.questionCount}
        />
      )}
    </>
  );
}
