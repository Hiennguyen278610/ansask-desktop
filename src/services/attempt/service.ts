import type {
  AnswerRecord,
  AttemptCursor,
  AttemptDetail,
  AttemptListItem,
  AttemptMode,
  Id,
  Question,
} from '@/domain/types';
import { call } from '@/shared/api/client';
import type { Page, PageParams } from '@/shared/api/types';

export interface AttemptSaveInput {
  examId: Id;
  mode: AttemptMode;
  questions: Question[];
  answers: Record<Id, AnswerRecord>;
  total: number;
  correct: number;
  score: number;
  elapsedSec: number;
  startedAt: number;
}

export const attemptService = {
  list: (p: { subjectId?: Id; examId?: Id } & PageParams<AttemptCursor>) =>
    call<Page<AttemptListItem, AttemptCursor>>('attempt_list', { req: p }),
  save: (input: AttemptSaveInput) => call<{ id: Id }>('attempt_save', { req: input }),
  get: (id: Id) => call<AttemptDetail>('attempt_get', { req: { id } }),
};
