import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';
import { quizStart, attemptSubmit, type QuizQuestionDto } from '@/lib/tauri/commands';
import { useUiStore } from '@/stores/uiStore';
import { AppException } from '@/lib/tauri/invoke';

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
    }).catch((err: Error | AppException) => {
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
      navigate(`/results/${res.attemptId}`, { replace: true });
    } catch (err: unknown) {
      showToast((err as Error).message || 'Lỗi nộp bài');
    } finally {
      setIsSubmitting(false);
    }
  };

  return { questions, answers, elapsedSec, isLoading, isSubmitting, toggleAnswer, submit };
}
