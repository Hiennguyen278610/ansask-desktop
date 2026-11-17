import type { DraftExam, DraftQuestion, ExamInput } from '../types';

export interface ParseError {
  line?: number;
  path?: string;
  message: string;
  questionIndex?: number;
}

export type Result<T> = { ok: true; value: T } | { ok: false; errors: ParseError[] };

export function newUid(): string {
  if (typeof globalThis.crypto !== 'undefined' && typeof globalThis.crypto.randomUUID === 'function') {
    return globalThis.crypto.randomUUID();
  }
  return `uid_${Math.random().toString(36).slice(2, 11)}`;
}

export function validateQuestions(
  questions: DraftQuestion[],
  lineLookup?: (questionIndex: number, optionIndex?: number) => number | undefined,
  usePath = false,
): ParseError[] {
  const errors: ParseError[] = [];

  if (questions.length === 0) {
    errors.push({ message: 'Bộ đề phải có ít nhất 1 câu hỏi.' });
    return errors;
  }

  questions.forEach((q, qi) => {
    const qNum = qi + 1;
    const qLine = lineLookup?.(qi);
    const qPath = usePath ? `[${qi}]` : undefined;

    if (!q.content.trim()) {
      errors.push({
        line: qLine,
        path: qPath ? `${qPath}.ask` : undefined,
        questionIndex: qi,
        message: `Câu ${qNum}: Nội dung câu hỏi không được để trống.`,
      });
    }

    if (q.options.length < 1 || q.options.length > 10) {
      errors.push({
        line: qLine,
        path: qPath ? `${qPath}.answer` : undefined,
        questionIndex: qi,
        message: `Câu ${qNum}: Phải có từ 1 đến 10 lựa chọn (hiện có ${q.options.length}).`,
      });
    }

    let correctCount = 0;
    q.options.forEach((opt, oi) => {
      if (opt.isCorrect) correctCount++;
      if (!opt.content.trim()) {
        errors.push({
          line: lineLookup?.(qi, oi),
          path: qPath ? `${qPath}.answer[${oi}]` : undefined,
          questionIndex: qi,
          message: `Câu ${qNum}, lựa chọn ${oi + 1}: Nội dung lựa chọn không được để trống.`,
        });
      }
    });

    if (correctCount !== 1) {
      errors.push({
        line: qLine,
        path: qPath ? `${qPath}.answer` : undefined,
        questionIndex: qi,
        message: `Câu ${qNum}: Phải có đúng 1 đáp án đúng (hiện có ${correctCount}).`,
      });
    }
  });

  return errors;
}

export function validateDraft(d: DraftExam): ParseError[] {
  const errors: ParseError[] = [];
  if (!d.title.trim()) {
    errors.push({ message: 'Tên bộ đề không được để trống.' });
  }
  errors.push(...validateQuestions(d.questions));
  return errors;
}

export function toExamInput(d: DraftExam): ExamInput {
  return {
    title: d.title.trim(),
    questions: d.questions.map((q) => ({
      content: q.content.trim(),
      options: q.options.map((o) => ({
        content: o.content.trim(),
        isCorrect: o.isCorrect,
      })),
    })),
  };
}
