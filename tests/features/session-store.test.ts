import { describe, expect, it, beforeEach } from 'vitest';
import {
  getSessionElapsedSec,
  useSessionStore,
} from '@/features/exam-taking/store/session.store';
import type { Question } from '@/domain/types';

const sampleQs: Question[] = [
  {
    id: 'q1',
    content: '1+1=?',
    options: [
      { id: 'o1', content: '2', isCorrect: true },
      { id: 'o2', content: '3', isCorrect: false },
    ],
  },
  {
    id: 'q2',
    content: '2+2=?',
    options: [
      { id: 'o3', content: '3', isCorrect: false },
      { id: 'o4', content: '4', isCorrect: true },
    ],
  },
];

describe('session.store', () => {
  beforeEach(() => {
    useSessionStore.getState().reset();
  });

  it('starts and resumes a draft session with saved answers, index, and elapsedSecBase', () => {
    useSessionStore.getState().start(
      {
        examId: 'e1',
        subjectId: 's1',
        examTitle: 'Toán',
        mode: 'flashcard',
        questions: sampleQs,
        startedAt: 1000,
        elapsedSecBase: 45,
      },
      { answers: { q1: 'o1' }, firstTry: { q1: false }, index: 1 },
    );

    const state = useSessionStore.getState();
    expect(state.index).toBe(1);
    expect(state.answers.q1).toBe('o1');
    expect(state.firstTry.q1).toBe(false);
    expect(getSessionElapsedSec(state.session!)).toBeGreaterThanOrEqual(45);

    state.select('q2', 'o4');
    expect(state.confirm()).toBe('finished');
  });
});
