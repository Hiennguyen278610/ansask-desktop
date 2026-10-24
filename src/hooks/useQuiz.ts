import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';
import { quizStart, attemptSubmit, type QuizQuestionDto } from '@/lib/tauri/commands';
import { useUiStore } from '@/stores/uiStore';
import { AppException } from '@/lib/tauri/invoke';

export function useQuiz(examId?: string) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const showToast = useUiStore(s => s.showToast);

  const [questions, setQuestions] = useState<QuizQuestionDto[]>([]);
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [elapsedSec, setElapsedSec] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [startTime, setStartTime] = useState<number>(0);
  
  // State cho Stream Mode
  const [mode, setMode] = useState<'normal' | 'stream'>('normal');
  const [currentIdx, setCurrentIdx] = useState(0);
  const [checkedAnswers, setCheckedAnswers] = useState<Record<string, boolean>>({});
  const [failedQuestions, setFailedQuestions] = useState<Set<string>>(new Set());

  // Lấy params 1 lần duy nhất để tránh infinite loop
  const initParams = useMemo(() => {
    return {
      count: searchParams.get('count') ? parseInt(searchParams.get('count')!, 10) : undefined,
      randomize: searchParams.get('randomize') !== 'false',
      mode: (searchParams.get('mode') as 'normal' | 'stream') || 'normal',
      ids: searchParams.get('ids') ? searchParams.get('ids')!.split(',') : undefined,
    };
  }, [searchParams]);

  useEffect(() => {
    if (!examId) return;
    setMode(initParams.mode);

    const includeAnswers = initParams.mode === 'stream';

    quizStart(examId, initParams.count, initParams.randomize, initParams.ids, includeAnswers).then(res => {
      setQuestions(res.questions);
      setStartTime(Date.now());
      setIsLoading(false);
    }).catch((err: Error | AppException) => {
      showToast(`Lỗi bắt đầu làm bài: ${err.message}`);
      navigate(`/subjects`);
    });
  }, [examId, initParams, navigate, showToast]);

  useEffect(() => {
    if (isLoading) return;
    const timer = setInterval(() => setElapsedSec(Math.floor((Date.now() - startTime) / 1000)), 1000);
    return () => clearInterval(timer);
  }, [isLoading, startTime]);

  const toggleAnswer = (qId: string, optId: string, isMulti: boolean) => {
    if (mode === 'stream' && checkedAnswers[qId]) return; 
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

  const checkStreamAnswer = (qId: string) => {
    const q = questions.find(x => x.id === qId);
    if (!q) return;
    const selected = answers[qId] || [];
    if (selected.length === 0) return showToast('Vui lòng chọn đáp án!');
    
    // OptionDto trả về từ BE có trường isCorrect (camelCase)
    const correctIds = q.options.filter(o => o.isCorrect).map(o => o.id).sort();
    const selIds = [...selected].sort();
    
    const isCorrect = JSON.stringify(correctIds) === JSON.stringify(selIds);
    if (!isCorrect) {
      setFailedQuestions(prev => new Set(prev).add(qId));
    }
    setCheckedAnswers(prev => ({ ...prev, [qId]: isCorrect }));
  };

  const retryStreamAnswer = (qId: string) => {
    setCheckedAnswers(prev => {
      const next = { ...prev };
      delete next[qId];
      return next;
    });
    setAnswers(prev => {
      const next = { ...prev };
      delete next[qId];
      return next;
    });
  };

  const submit = useCallback(async () => {
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
  }, [examId, questions, answers, startTime, showToast, qc, navigate]);

  return { 
    questions, answers, elapsedSec, isLoading, isSubmitting, toggleAnswer, submit,
    mode, currentIdx, setCurrentIdx, checkedAnswers, failedQuestions, checkStreamAnswer, retryStreamAnswer
  };
}
