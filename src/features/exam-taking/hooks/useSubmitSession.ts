import { useNavigate } from '@tanstack/react-router';
import { toast } from 'sonner';
import { evaluate } from '@/domain/scoring';
import { useSaveAttempt } from '@/services/attempt/queries';
import { getSessionElapsedSec, useSessionStore } from '../store/session.store';

export function useSubmitSession() {
  const navigate = useNavigate();
  const saveAttempt = useSaveAttempt();

  const submit = async () => {
    const s = useSessionStore.getState();
    if (!s.session) return;

    const result = evaluate(s.session.questions, s.answers, s.firstTry, s.session.mode);
    let id: string;
    try {
      ({ id } = await saveAttempt.mutateAsync({
        examId: s.session.examId,
        mode: s.session.mode,
        questions: s.session.questions,
        answers: result.answers,
        total: result.total,
        correct: result.correct,
        score: result.score,
        elapsedSec: getSessionElapsedSec(s.session),
        startedAt: s.session.startedAt,
      }));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không thể nộp bài');
      return;
    }

    const { subjectId, examId } = s.session;
    s.reset();
    await navigate({
      to: '/exams/$subjectId/$examId/result/$attemptId',
      params: { subjectId, examId, attemptId: id },
    });
  };

  return { submit, isSubmitting: saveAttempt.isPending };
}
