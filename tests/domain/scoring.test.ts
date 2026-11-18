import { describe, expect, it } from 'vitest';
import { evaluate, toScore10 } from '@/domain/scoring';
import type { Question } from '@/domain/types';

const qs: Question[] = [
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
];

describe('scoring', () => {
  it('rounds score to 2 decimals on scale of 10', () => {
    expect(toScore10(7, 9)).toBe(7.78);
    expect(toScore10(0, 0)).toBe(0);
    expect(toScore10(9, 9)).toBe(10);
  });

  it('evaluates quiz mode correctly', () => {
    const res = evaluate(qs, { q1: 'o1', q2: null }, {}, 'quiz');
    expect(res.correct).toBe(1);
    expect(res.total).toBe(2);
    expect(res.score).toBe(5);
    expect(res.answers.q1.correct).toBe(true);
    expect(res.answers.q2.correct).toBe(false);
  });

  it('evaluates flashcard mode using firstTry', () => {
    const res = evaluate(qs, { q1: 'o1', q2: 'o4' }, { q1: true, q2: false }, 'flashcard');
    expect(res.correct).toBe(1);
    expect(res.score).toBe(5);
    expect(res.answers.q1.correct).toBe(true);
    expect(res.answers.q2.correct).toBe(false);
  });
});
