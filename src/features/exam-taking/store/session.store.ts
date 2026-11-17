import { create } from 'zustand';
import type { AttemptMode, Id, Question } from '@/domain/types';

export interface Session {
  examId: Id;
  subjectId: Id;
  examTitle: string;
  mode: AttemptMode;
  questions: Question[];
  startedAt: number;
  elapsedSecBase: number;
  resumedAt: number;
}

export interface StartSessionInput {
  examId: Id;
  subjectId: Id;
  examTitle: string;
  mode: AttemptMode;
  questions: Question[];
  startedAt: number;
  elapsedSecBase?: number;
}

interface SessionState {
  session: Session | null;
  answers: Record<Id, Id | null>;
  firstTry: Record<Id, boolean>;
  index: number;
  wrongHint: boolean;

  start: (s: StartSessionInput, opts?: { answers?: Record<Id, Id | null>; firstTry?: Record<Id, boolean>; index?: number }) => void;
  select: (qId: Id, oId: Id) => void;
  confirm: () => 'correct' | 'wrong' | 'finished';
  reset: () => void;
}

export function getSessionElapsedSec(s: Session): number {
  return s.elapsedSecBase + Math.max(0, Math.floor((Date.now() - s.resumedAt) / 1000));
}

export const useSessionStore = create<SessionState>((set, get) => ({
  session: null,
  answers: {},
  firstTry: {},
  index: 0,
  wrongHint: false,

  start: (s, opts) =>
    set({
      session: {
        ...s,
        elapsedSecBase: s.elapsedSecBase ?? 0,
        resumedAt: Date.now(),
      },
      answers: opts?.answers ?? {},
      firstTry: opts?.firstTry ?? {},
      index: opts?.index ?? 0,
      wrongHint: false,
    }),

  select: (qId, oId) =>
    set((s) => ({
      answers: { ...s.answers, [qId]: oId },
      wrongHint: false,
    })),

  confirm: () => {
    const { session, answers, firstTry, index } = get();
    if (!session) return 'wrong';
    const q = session.questions[index];
    if (!q) return 'finished';

    const selected = answers[q.id] ?? null;
    const isCorrect = q.options.find((o) => o.id === selected)?.isCorrect === true;

    const nextFirstTry =
      firstTry[q.id] === undefined ? { ...firstTry, [q.id]: isCorrect } : firstTry;

    if (isCorrect) {
      if (index >= session.questions.length - 1) {
        set({ firstTry: nextFirstTry, wrongHint: false });
        return 'finished';
      }
      set({ firstTry: nextFirstTry, index: index + 1, wrongHint: false });
      return 'correct';
    }

    set({ firstTry: nextFirstTry, wrongHint: true });
    return 'wrong';
  },

  reset: () =>
    set({
      session: null,
      answers: {},
      firstTry: {},
      index: 0,
      wrongHint: false,
    }),
}));
