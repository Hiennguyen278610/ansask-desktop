import { useEffect, useRef } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { toast } from 'sonner';
import { FlashcardView } from '@/features/exam-taking/components/FlashcardView';
import { QuizView, type QuizViewHandle } from '@/features/exam-taking/components/QuizView';
import { TakingHeader } from '@/features/exam-taking/components/TakingHeader';
import { useFullscreen } from '@/features/exam-taking/hooks/useFullscreen';
import { useSubmitSession } from '@/features/exam-taking/hooks/useSubmitSession';
import {
  getSessionElapsedSec,
  useSessionStore,
} from '@/features/exam-taking/store/session.store';
import { useSaveSessionDraft } from '@/services/session/queries';

export function ExamTakingPage() {
  useFullscreen();
  const navigate = useNavigate();
  const session = useSessionStore((s) => s.session);
  const { submit, isSubmitting } = useSubmitSession();
  const saveDraft = useSaveSessionDraft();
  const saveDraftInBackground = saveDraft.mutate;
  const quizRef = useRef<QuizViewHandle>(null);

  // Periodic background draft save every 15s while taking
  useEffect(() => {
    const id = window.setInterval(() => {
      const state = useSessionStore.getState();
      if (!state.session) return;
      saveDraftInBackground({
        examId: state.session.examId,
        mode: state.session.mode,
        questions: state.session.questions,
        answers: state.answers,
        firstTry: state.firstTry,
        currentIndex: state.index,
        startedAt: state.session.startedAt,
        elapsedSec: getSessionElapsedSec(state.session),
      });
    }, 15_000);
    return () => window.clearInterval(id);
  }, [saveDraftInBackground]);

  if (!session) return null;

  const handleSaveAndExit = async () => {
    const state = useSessionStore.getState();
    if (!state.session) return;
    const { subjectId, examId } = state.session;
    try {
      await saveDraft.mutateAsync({
        examId,
        mode: state.session.mode,
        questions: state.session.questions,
        answers: state.answers,
        firstTry: state.firstTry,
        currentIndex: state.index,
        startedAt: state.session.startedAt,
        elapsedSec: getSessionElapsedSec(state.session),
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không thể lưu phiên làm dở');
      return;
    }
    state.reset();
    toast.success('Đã lưu phiên làm dở');
    await navigate({ to: '/exams/$subjectId/$examId', params: { subjectId, examId } });
  };

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <TakingHeader
        onSubmit={submit}
        onSaveAndExit={handleSaveAndExit}
        isSubmitting={isSubmitting}
        isSavingDraft={saveDraft.isPending}
        onJumpToQuestion={(i) => quizRef.current?.scrollToIndex(i)}
      />
      {session.mode === 'quiz' ? (
        <QuizView ref={quizRef} />
      ) : (
        <FlashcardView onFinish={submit} />
      )}
    </div>
  );
}
