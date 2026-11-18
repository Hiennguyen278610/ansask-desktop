import { describe, expect, it } from 'vitest';
import { toExamInput, validateDraft } from '@/domain/exam-format/validate';

describe('exam-format/validate', () => {
  it('requires non-empty title on validateDraft', () => {
    const errs = validateDraft({
      title: '   ',
      questions: [
        {
          uid: 'q1',
          content: 'Q1',
          options: [{ uid: 'o1', content: 'A', isCorrect: true }],
        },
      ],
    });
    expect(errs).toHaveLength(1);
  });

  it('converts valid DraftExam to ExamInput', () => {
    const input = toExamInput({
      title: '  Đề Sinh học  ',
      questions: [
        {
          uid: 'q1',
          content: '  ATP là gì? ',
          options: [{ uid: 'o1', content: ' Năng lượng ', isCorrect: true }],
        },
      ],
    });
    expect(input).toEqual({
      title: 'Đề Sinh học',
      questions: [
        {
          content: 'ATP là gì?',
          options: [{ content: 'Năng lượng', isCorrect: true }],
        },
      ],
    });
  });
});
