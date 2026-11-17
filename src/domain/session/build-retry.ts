import type { AttemptDetail, Question } from '../types';

export const buildRetrySession = (a: AttemptDetail): Question[] =>
  a.questions.filter((q) => !a.answers[q.id]?.correct);
