import { describe, expect, it } from 'vitest';
import type { AttemptDetail, Question } from '@/domain/types';
import { buildRetrySession } from '@/domain/session/build-retry';
import { buildSession } from '@/domain/session/build-session';

const sampleQuestions: Question[] = [
  {
    id: 'q1',
    content: 'Q1',
    options: [
      { id: 'o1', content: 'A', isCorrect: true },
      { id: 'o2', content: 'B', isCorrect: false },
    ],
  },
  {
    id: 'q2',
    content: 'Q2',
    options: [
      { id: 'o3', content: 'C', isCorrect: false },
      { id: 'o4', content: 'D', isCorrect: true },
    ],
  },
  {
    id: 'q3',
    content: 'Q3',
    options: [
      { id: 'o5', content: 'E', isCorrect: true },
      { id: 'o6', content: 'F', isCorrect: false },
    ],
  },
];

describe('session/buildSession & buildRetrySession', () => {
  it('takes first N questions in order when shuffle is false', () => {
    const res = buildSession(sampleQuestions, { count: 2, shuffle: false });
    expect(res.map((q) => q.id)).toEqual(['q1', 'q2']);
  });

  it('shuffles questions and options deterministically with rng', () => {
    let seed = 0.2;
    const rng = () => {
      seed = (seed + 0.37) % 1;
      return seed;
    };
    const res = buildSession(sampleQuestions, { count: 3, shuffle: true, rng });
    expect(res).toHaveLength(3);
    expect(new Set(res.map((q) => q.id))).toEqual(new Set(['q1', 'q2', 'q3']));
  });

  it('filters wrong and unanswered questions in original order for retry', () => {
    const attempt: AttemptDetail = {
      id: 'a1',
      examId: 'e1',
      subjectId: 's1',
      examTitle: 'Test',
      mode: 'quiz',
      total: 3,
      correct: 1,
      score: 3.33,
      elapsedSec: 10,
      submittedAt: 1000,
      questions: sampleQuestions,
      answers: {
        q1: { selectedOptionId: 'o1', correct: true },
        q2: { selectedOptionId: 'o3', correct: false },
        q3: { selectedOptionId: null, correct: false },
      },
    };
    const retry = buildRetrySession(attempt);
    expect(retry.map((q) => q.id)).toEqual(['q2', 'q3']);
  });
});
