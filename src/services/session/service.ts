import type { AttemptMode, Id, Question, SessionDraft } from '@/domain/types';
import { call } from '@/shared/api/client';

export interface SessionSaveInput {
  examId: Id;
  mode: AttemptMode;
  questions: Question[];
  answers: Record<Id, Id | null>;
  firstTry: Record<Id, boolean>;
  currentIndex: number;
  startedAt: number;
  elapsedSec: number;
}

export const sessionService = {
  save: (input: SessionSaveInput) => call<{ id: Id }>('session_save', { req: input }),
  get: (examId: Id) => call<SessionDraft | null>('session_get', { req: { examId } }),
  delete: (examId: Id) => call<void>('session_delete', { req: { examId } }),
};
