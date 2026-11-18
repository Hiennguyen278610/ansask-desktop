import type { AnswerRecord, Id, Question } from '@/domain/types';

export type ResultFilter = 'all' | 'correct' | 'wrong' | 'unanswered';

export function getQuestionStatus(
  q: Question,
  answers: Record<Id, AnswerRecord>,
): 'correct' | 'wrong' | 'unanswered' {
  const rec = answers[q.id];
  if (!rec || rec.selectedOptionId == null) return 'unanswered';
  return rec.correct ? 'correct' : 'wrong';
}
