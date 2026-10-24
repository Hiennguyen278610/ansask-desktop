#!/bin/bash
set -e

# 1. Cập nhật commands.ts
cat > src/lib/tauri/commands.ts << 'EOF'
import { invoke } from './invoke';

export interface SettingValueDto { key: string; value: string; }
export interface SubjectSummary { id: string; name: string; color: string; createdAt: string; examCount: number; questionCount: number; }
export interface ExamSummary { id: string; subjectId: string; title: string; createdAt: string; attemptCount: number; questionCount: number; }
export interface OptionDto { id: string; text: string; isCorrect: boolean; }
export interface QuestionDto { id: string; ask: string; options: OptionDto[]; }
export interface ExamDetail { id: string; subjectId: string; title: string; createdAt: string; updatedAt: string; questions: QuestionDto[]; }

export interface QuestionUpsertReq { ask: string; options: { text: string; isCorrect: boolean; }[]; }
export interface ExamSaveReq { id?: string; subjectId: string; title: string; questions: QuestionUpsertReq[]; }

export interface ValidationIssue { line?: number; field?: string; message: string; }
export interface ParsedExamDto { questions: QuestionUpsertReq[]; issues: ValidationIssue[]; }

export interface QuizQuestionDto { id: string; ask: string; options: OptionDto[]; optionOrder: string[]; }
export interface QuizStartRes { questions: QuizQuestionDto[]; total: number; }

export interface AttemptAnswerReq { questionId: string; selectedOptionIds: string[]; position: number; optionOrder: string[]; }
export interface AttemptSubmitReq { examId: string; startedAt: string; answers: AttemptAnswerReq[]; }
export interface AttemptResultDto { attemptId: string; score: number; correctCount: number; totalQuestions: number; }

export interface AttemptSummary { id: string; examId: string; examTitle: string; subjectId: string; subjectName: string; submittedAt: string; totalQuestions: number; correctCount: number; score: number; durationSec: number; }
export interface GradedQuestionDto { questionId: string; position: number; questionText: string; optionsSnapshot: OptionDto[]; correctOptionIds: string[]; selectedOptionIds: string[]; optionOrder: string[]; isCorrect: boolean; }
export interface AttemptReviewDto { attemptId: string; examTitle: string; score: number; totalQuestions: number; correctCount: number; questions: GradedQuestionDto[]; }

export function settingGet(key: string): Promise<SettingValueDto> { return invoke('setting_get', { req: { key } }); }
export function settingSet(key: string, value: string): Promise<SettingValueDto> { return invoke('setting_set', { req: { key, value } }); }

export function subjectList(): Promise<SubjectSummary[]> { return invoke('subject_list'); }
export function subjectCreate(name: string, color: string): Promise<SubjectSummary> { return invoke('subject_create', { req: { name, color } }); }
export function subjectUpdate(id: string, name: string, color: string): Promise<void> { return invoke('subject_update', { req: { id, name, color } }); }
export function subjectDelete(id: string): Promise<void> { return invoke('subject_delete', { req: { id } }); }

export function examList(subjectId: string): Promise<ExamSummary[]> { return invoke('exam_list', { req: { subjectId } }); }
export function examGet(id: string): Promise<ExamDetail> { return invoke('exam_get', { req: { id } }); }
export function examSave(req: ExamSaveReq): Promise<string> { return invoke('exam_save', { req }); }
export function examDelete(id: string): Promise<void> { return invoke('exam_delete', { req: { id } }); }

export function importParse(format: 'txt' | 'json', raw: string): Promise<ParsedExamDto> { return invoke('import_parse', { req: { format, raw } }); }

export function quizStart(examId: string, count?: number, randomize = true): Promise<QuizStartRes> { return invoke('quiz_start', { req: { examId, count, randomize } }); }
export function attemptSubmit(req: AttemptSubmitReq): Promise<AttemptResultDto> { return invoke('attempt_submit', { req }); }
export function attemptList(examId: string): Promise<AttemptSummary[]> { return invoke('attempt_list', { req: { examId } }); }
export function attemptReview(id: string): Promise<AttemptReviewDto> { return invoke('attempt_review', { req: { id } }); }
EOF

# 2. Hook useQuiz
mkdir -p src/hooks
cat > src/hooks/useQuiz.ts << 'EOF'
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';
import { quizStart, attemptSubmit, type QuizQuestionDto } from '@/lib/tauri/commands';
import { useUiStore } from '@/stores/uiStore';

export function useQuiz(examId?: string) {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const showToast = useUiStore(s => s.showToast);

  const [questions, setQuestions] = useState<QuizQuestionDto[]>([]);
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [elapsedSec, setElapsedSec] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [startTime, setStartTime] = useState<number>(0);

  useEffect(() => {
    if (!examId) return;
    quizStart(examId).then(res => {
      setQuestions(res.questions);
      setStartTime(Date.now());
      setIsLoading(false);
    }).catch(err => {
      showToast(`Lỗi bắt đầu làm bài: ${err.message}`);
      navigate(`/subjects`);
    });
  }, [examId, navigate, showToast]);

  useEffect(() => {
    if (isLoading) return;
    const timer = setInterval(() => setElapsedSec(Math.floor((Date.now() - startTime) / 1000)), 1000);
    return () => clearInterval(timer);
  }, [isLoading, startTime]);

  const toggleAnswer = (qId: string, optId: string, isMulti: boolean) => {
    setAnswers(prev => {
      const current = prev[qId] || [];
      if (isMulti) {
        const next = current.includes(optId) ? current.filter(id => id !== optId) : [...current, optId];
        return { ...prev, [qId]: next };
      } else {
        return { ...prev, [qId]: [optId] };
      }
    });
  };

  const submit = async () => {
    if (!examId) return;
    setIsSubmitting(true);
    try {
      const req = {
        examId,
        startedAt: new Date(startTime).toISOString(),
        answers: questions.map((q, idx) => ({
          questionId: q.id,
          selectedOptionIds: answers[q.id] || [],
          position: idx,
          optionOrder: q.optionOrder,
        }))
      };
      const res = await attemptSubmit(req);
      showToast(`Nộp bài thành công! Điểm: ${res.score}/10`);
      qc.invalidateQueries({ queryKey: ['exams', examId] });
      navigate(`/results/${res.attemptId}`);
    } catch (err: any) {
      showToast(err.message || 'Lỗi nộp bài');
    } finally {
      setIsSubmitting(false);
    }
  };

  return { questions, answers, elapsedSec, isLoading, isSubmitting, toggleAnswer, submit };
}
EOF

# 3. Các Dialog Components
cat > src/features/quiz/SubmitWarningDialog.tsx << 'EOF'
import { Dialog } from '@/components/ui/Dialog';

interface Props {
  open: boolean;
  unansweredIndexes: number[];
  total: number;
  onBack: () => void;
  onConfirm: () => void;
}

export function SubmitWarningDialog({ open, unansweredIndexes, total, onBack, onConfirm }: Props) {
  return (
    <Dialog open={open} title="Cảnh báo nộp bài" onClose={onBack}
      footer={
        <>
          <button onClick={onBack} className="neu-pill px-4 py-2 rounded-xl text-xs font-bold text-slate-600">Quay lại làm tiếp</button>
          <button onClick={onConfirm} className="neu-dark-btn px-5 py-2 rounded-xl text-xs font-bold">Vẫn nộp</button>
        </>
      }>
      <div className="space-y-3">
        <p className="text-sm text-ink">Bạn còn <strong>{unansweredIndexes.length}/{total}</strong> câu chưa trả lời.</p>
        <div className="flex flex-wrap gap-2">
          {unansweredIndexes.map(i => (
            <span key={i} className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded text-xs font-bold text-slate-500">Câu {i + 1}</span>
          ))}
        </div>
        <p className="text-xs text-rose-500 pt-2 font-medium">Nếu nộp bây giờ, các câu trống sẽ được tính là SAI.</p>
      </div>
    </Dialog>
  );
}
EOF

cat > src/features/quiz/QuestionNavigatorDialog.tsx << 'EOF'
import { Dialog } from '@/components/ui/Dialog';
import type { QuizQuestionDto } from '@/lib/tauri/commands';

interface Props {
  open: boolean;
  questions: QuizQuestionDto[];
  answers: Record<string, string[]>;
  onSelect: (idx: number) => void;
  onClose: () => void;
}

export function QuestionNavigatorDialog({ open, questions, answers, onSelect, onClose }: Props) {
  return (
    <Dialog open={open} title={`Danh sách câu hỏi (${questions.length})`} onClose={onClose}>
      <div className="grid grid-cols-5 gap-2 max-h-[60vh] overflow-y-auto pr-2">
        {questions.map((q, idx) => {
          const answered = (answers[q.id] || []).length > 0;
          return (
            <button key={q.id} onClick={() => { onSelect(idx); onClose(); }}
              className={`py-2 rounded-lg text-sm font-bold transition-all ${answered ? 'bg-ink-strong text-white shadow-md' : 'neu-pill text-slate-600 hover:bg-white'}`}>
              {idx + 1}
            </button>
          );
        })}
      </div>
    </Dialog>
  );
}
EOF
