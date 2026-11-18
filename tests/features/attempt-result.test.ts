import { describe, expect, it } from 'vitest';
import { getQuestionStatus } from '@/features/exam-result/utils';
import type { Question } from '@/domain/types';

const makeQ = (id: string): Question => ({
  id,
  content: `Câu ${id}`,
  options: [
    { id: `${id}-a`, content: 'A', isCorrect: true },
    { id: `${id}-b`, content: 'B', isCorrect: false },
  ],
});

describe('AttemptQuestionList getQuestionStatus', () => {
  it('classifies correct, wrong, and unanswered (null or missing)', () => {
    const q1 = makeQ('q1');
    const q2 = makeQ('q2');
    const q3 = makeQ('q3');
    const q4 = makeQ('q4');

    const answers = {
      q1: { selectedOptionId: 'q1-a', correct: true },
      q2: { selectedOptionId: 'q2-b', correct: false },
      q3: { selectedOptionId: null, correct: false },
    };

    expect(getQuestionStatus(q1, answers)).toBe('correct');
    expect(getQuestionStatus(q2, answers)).toBe('wrong');
    expect(getQuestionStatus(q3, answers)).toBe('unanswered');
    expect(getQuestionStatus(q4, answers)).toBe('unanswered');
  });
});
