import type { AnswerRecord, AttemptMode, Id, Question } from './types';

export const toScore10 = (correct: number, total: number): number =>
  total === 0 ? 0 : Math.round((correct / total) * 1000) / 100;

export function evaluate(
  qs: Question[],
  answers: Record<Id, Id | null>,
  firstTry: Record<Id, boolean>,
  mode: AttemptMode,
) {
  const record: Record<Id, AnswerRecord> = {};
  let correct = 0;

  for (const q of qs) {
    const selected = answers[q.id] ?? null;
    const ok =
      mode === 'quiz'
        ? q.options.find((o) => o.id === selected)?.isCorrect === true
        : firstTry[q.id] === true;
    record[q.id] = { selectedOptionId: selected, correct: ok };
    if (ok) correct++;
  }

  return {
    answers: record,
    total: qs.length,
    correct,
    score: toScore10(correct, qs.length),
  };
}
