import { useEffect, useRef } from 'react';
import { useBlocker, useNavigate, useParams } from '@tanstack/react-router';
import { nanoid } from 'nanoid';
import { toast } from 'sonner';
import { toExamInput, validateDraft } from '@/domain/exam-format';
import { EditorHeader } from '@/features/exam-editor/components/EditorHeader';
import { EditorPane } from '@/features/exam-editor/components/EditorPane';
import { QuestionList, type QuestionListHandle } from '@/features/exam-editor/components/QuestionList';
import { useEditorStore } from '@/features/exam-editor/store/editor.store';
import { useCreateExam, useExam, useExamQuestions, useUpdateExam } from '@/services/exam/queries';
import { ConfirmDialog } from '@/shared/components/feedback/ConfirmDialog';
import { EmptyState } from '@/shared/components/feedback/EmptyState';
import { Button } from '@/shared/components/ui/button';
import { useIsMobile } from '@/shared/hooks/useMobile';

export function ExamEditorPage({ mode }: { mode: 'create' | 'edit' }) {
  const params = useParams({ strict: false }) as { subjectId: string; examId?: string };
  const subjectId = params.subjectId;
  const examId = params.examId;
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const questionListRef = useRef<QuestionListHandle>(null);
  const initializedRef = useRef(false);
  const bypassBlockRef = useRef(false);

  const examQ = useExam(examId ?? '');
  const questionsQ = useExamQuestions(examId ?? '');
  const createExam = useCreateExam(subjectId);
  const updateExam = useUpdateExam(subjectId, examId ?? '');

  const init = useEditorStore((s) => s.init);
  const markClean = useEditorStore((s) => s.markClean);
  const draft = useEditorStore((s) => s.draft);
  const editorText = useEditorStore((s) => s.editorText);
  const lastEdited = useEditorStore((s) => s.lastEdited);
  const isDirty = useEditorStore((s) => s.isDirty);
  const syncFromForm = useEditorStore((s) => s.syncFromForm);
  const applyEditorParse = useEditorStore((s) => s.applyEditorParse);

  const blocker = useBlocker({
    shouldBlockFn: () => isDirty && !bypassBlockRef.current,
    withResolver: true,
    enableBeforeUnload: () => isDirty && !bypassBlockRef.current,
  });

  useEffect(() => {
    initializedRef.current = false;
    bypassBlockRef.current = false;
  }, [mode, examId]);

  useEffect(() => {
    if (initializedRef.current) return;
    if (mode === 'create') {
      initializedRef.current = true;
      init({
        title: '',
        questions: [
          {
            uid: nanoid(),
            content: '',
            options: Array.from({ length: 4 }, () => ({
              uid: nanoid(),
              content: '',
              isCorrect: false,
            })),
          },
        ],
      });
    } else if (examQ.data && questionsQ.data) {
      initializedRef.current = true;
      init({
        title: examQ.data.title,
        questions: questionsQ.data.map((q) => ({
          uid: nanoid(),
          content: q.content,
          options: q.options.map((o) => ({
            uid: nanoid(),
            content: o.content,
            isCorrect: o.isCorrect,
          })),
        })),
      });
    }
  }, [mode, examQ.data, questionsQ.data, init]);

  // Debounced sync: form -> editor
  useEffect(() => {
    if (lastEdited !== 'form') return;
    const t = window.setTimeout(() => {
      syncFromForm();
    }, 300);
    return () => window.clearTimeout(t);
  }, [draft.questions, lastEdited, syncFromForm]);

  // Debounced sync: editor -> form
  useEffect(() => {
    if (lastEdited !== 'editor') return;
    const t = window.setTimeout(() => {
      applyEditorParse();
    }, 300);
    return () => window.clearTimeout(t);
  }, [editorText, lastEdited, applyEditorParse]);

  const handleBack = () => {
    if (mode === 'edit' && examId) {
      navigate({ to: '/exams/$subjectId/$examId', params: { subjectId, examId } });
    } else {
      navigate({ to: '/exams/$subjectId', params: { subjectId } });
    }
  };

  const handleSave = async () => {
    let state = useEditorStore.getState();
    if (state.lastEdited === 'editor') {
      state.applyEditorParse();
      state = useEditorStore.getState();
      if (state.parseErrors.length > 0) {
        toast.error(state.parseErrors[0].message);
        return;
      }
    }
    const errors = validateDraft(state.draft);
    if (errors.length > 0) {
      toast.error(errors[0].message);
      if (errors[0].questionIndex !== undefined) {
        questionListRef.current?.scrollToQuestion(errors[0].questionIndex);
      }
      return;
    }

    const input = toExamInput(state.draft);
    if (mode === 'create') {
      const created = await createExam.mutateAsync(input);
      bypassBlockRef.current = true;
      markClean();
      toast.success('Đã tạo bộ đề');
      navigate({
        to: '/exams/$subjectId/$examId',
        params: { subjectId, examId: created.id },
      });
    } else if (examId) {
      await updateExam.mutateAsync(input);
      bypassBlockRef.current = true;
      markClean();
      toast.success('Đã cập nhật bộ đề');
      navigate({
        to: '/exams/$subjectId/$examId',
        params: { subjectId, examId },
      });
    }
  };

  if (isMobile) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <EmptyState
          title="Không hỗ trợ tạo hoặc sửa đề trên di động"
          description="Trên điện thoại, bạn chỉ có thể nhập bộ đề (TXT/JSON) từ máy tính để luyện tập."
          action={
            <Button
              type="button"
              onClick={() =>
                navigate({
                  to: mode === 'edit' && examId ? '/exams/$subjectId/$examId' : '/exams/$subjectId',
                  params: mode === 'edit' && examId ? { subjectId, examId } : { subjectId },
                })
              }
            >
              Quay lại
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <EditorHeader
        onBack={handleBack}
        onSave={handleSave}
        saving={createExam.isPending || updateExam.isPending}
      />
      <div className="flex min-h-0 flex-1 overflow-hidden">
        <QuestionList ref={questionListRef} />
        <EditorPane />
      </div>

      <ConfirmDialog
        open={blocker.status === 'blocked'}
        onOpenChange={(open) => {
          if (!open && blocker.status === 'blocked') {
            blocker.reset();
          }
        }}
        title="Thay đổi chưa được lưu"
        description="Bạn có thay đổi chưa lưu trong bộ đề. Nếu rời đi, các thay đổi sẽ bị mất."
        confirmLabel="Rời khỏi"
        cancelLabel="Ở lại"
        destructive
        onConfirm={() => {
          if (blocker.status === 'blocked') {
            blocker.proceed();
          }
        }}
      />
    </div>
  );
}
