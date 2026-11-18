import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { buildSession } from '@/domain/session/build-session';
import type { AttemptMode, Id } from '@/domain/types';
import { examKeys } from '@/services/exam/keys';
import { questionService } from '@/services/question/service';
import { useSessionStore } from '../store/session.store';

export function useStartSession() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const start = useSessionStore((s) => s.start);
  const [isStarting, setIsStarting] = useState(false);

  const startSession = async (cfg: {
    examId: Id;
    subjectId: Id;
    examTitle: string;
    mode: AttemptMode;
    count: number;
    shuffle: boolean;
  }) => {
    setIsStarting(true);
    try {
      const allQuestions = await qc.query({
        queryKey: examKeys.questions(cfg.examId),
        queryFn: () => questionService.listAll(cfg.examId),
      });
      const questions = buildSession(allQuestions, {
        count: cfg.count,
        shuffle: cfg.shuffle,
      });
      start({
        examId: cfg.examId,
        subjectId: cfg.subjectId,
        examTitle: cfg.examTitle,
        mode: cfg.mode,
        questions,
        startedAt: Date.now(),
      });
      await navigate({ to: '/take' });
    } finally {
      setIsStarting(false);
    }
  };

  return { startSession, isStarting };
}
