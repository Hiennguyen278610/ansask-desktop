import { describe, expect, it } from 'vitest';
import { parseText, toText } from '@/domain/exam-format/text';

describe('exam-format/text', () => {
  it('parses the exact AI prompt TXT example', () => {
    const raw = `ask : Thủ đô của Việt Nam là gì?
ans. Huế
ans.* Hà Nội
ans. Đà Nẵng
ans. TP. Hồ Chí Minh`;

    const res = parseText(raw);
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.value).toHaveLength(1);
    expect(res.value[0].content).toBe('Thủ đô của Việt Nam là gì?');
    expect(res.value[0].options).toHaveLength(4);
    expect(res.value[0].options.map((o) => o.isCorrect)).toEqual([false, true, false, false]);
    expect(res.value[0].options[1].content).toBe('Hà Nội');
  });

  it('supports multiline question/options and case-insensitive ask:/ans.', () => {
    const raw = `ASK: Dòng 1
Dòng 2
ans. Sai 1
Dòng 2 sai
ans.* Đúng 1

ask : Câu 2?
ans.* A
ans. B`;

    const res = parseText(raw);
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.value).toHaveLength(2);
    expect(res.value[0].content).toBe('Dòng 1\nDòng 2');
    expect(res.value[0].options[0].content).toBe('Sai 1\nDòng 2 sai');
  });

  it('rejects non-empty text before first ask', () => {
    const res = parseText('Xin chào\nask : Câu 1\nans.* A');
    expect(res.ok).toBe(false);
    if (res.ok) return;
    expect(res.errors[0].line).toBe(1);
  });

  it('rejects questions with 0 or >1 correct answers', () => {
    const res = parseText('ask : Q1\nans. A\nans. B');
    expect(res.ok).toBe(false);
    const res2 = parseText('ask : Q1\nans.* A\nans.* B');
    expect(res2.ok).toBe(false);
  });

  it('round-trips via toText and parseText', () => {
    const formatted = toText([
      {
        content: '1 + 1 = ?',
        options: [
          { content: '1', isCorrect: false },
          { content: '2', isCorrect: true },
        ],
      },
      {
        content: '2 + 2 = ?',
        options: [
          { content: '4', isCorrect: true },
          { content: '5', isCorrect: false },
        ],
      },
    ]);
    const reparsed = parseText(formatted);
    expect(reparsed.ok).toBe(true);
    if (!reparsed.ok) return;
    expect(reparsed.value).toHaveLength(2);
    expect(reparsed.value[1].options[0].isCorrect).toBe(true);
  });
});
