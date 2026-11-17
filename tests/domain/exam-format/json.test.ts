import { describe, expect, it } from 'vitest';
import { parseJson, toJson } from '@/domain/exam-format/json';

describe('exam-format/json', () => {
  it('parses the exact AI prompt JSON example', () => {
    const raw = `[
\t{
\t\t"ask": "Nội dung câu hỏi thứ nhất?",
\t\t"answer": [
\t\t\t{"false": "Nội dung lựa chọn sai 1"},
\t\t\t{"false": "Nội dung lựa chọn sai 2"},
\t\t\t{"false": "Nội dung lựa chọn sai 3"},
\t\t\t{"true": "Nội dung lựa chọn ĐÚNG"}
\t\t]
\t}
]`;
    const res = parseJson(raw);
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.value).toHaveLength(1);
    expect(res.value[0].content).toBe('Nội dung câu hỏi thứ nhất?');
    expect(res.value[0].options[3].isCorrect).toBe(true);
  });

  it('reports path on invalid answer item', () => {
    const raw = JSON.stringify([
      {
        ask: 'Q1',
        answer: [{ false: 'A' }, { invalid: 'B' }],
      },
    ]);
    const res = parseJson(raw);
    expect(res.ok).toBe(false);
    if (res.ok) return;
    expect(res.errors[0].path).toBe('[0].answer[1]');
  });

  it('round-trips via toJson and parseJson', () => {
    const json = toJson([
      {
        content: 'Câu 1',
        options: [
          { content: 'Đúng', isCorrect: true },
          { content: 'Sai', isCorrect: false },
        ],
      },
    ]);
    const res = parseJson(json);
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.value[0].content).toBe('Câu 1');
  });
});
