import type { DraftQuestion } from '../types';
import type { DraftParseResult } from './text';
import { newUid, validateQuestions, type ParseError, type Result } from './validate';

export function parseJsonDraft(raw: string): DraftParseResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    return {
      ok: false,
      errors: [{ message: `JSON không hợp lệ: ${err instanceof Error ? err.message : String(err)}` }],
    };
  }

  let title: string | undefined;
  let items: unknown[];

  if (Array.isArray(parsed)) {
    items = parsed;
  } else if (parsed && typeof parsed === 'object' && Array.isArray((parsed as { questions?: unknown }).questions)) {
    const obj = parsed as { title?: unknown; questions: unknown[] };
    if (typeof obj.title === 'string' && obj.title.trim()) {
      title = obj.title.trim();
    }
    items = obj.questions;
  } else {
    return {
      ok: false,
      errors: [{ path: '$', message: 'Dữ liệu JSON gốc phải là một mảng hoặc object chứa questions.' }],
    };
  }

  const errors: ParseError[] = [];
  const questions: DraftQuestion[] = [];

  items.forEach((item, qi) => {
    const qPath = `[${qi}]`;
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      errors.push({ path: qPath, questionIndex: qi, message: `${qPath}: Phần tử phải là object.` });
      return;
    }

    const obj = item as Record<string, unknown>;
    if (typeof obj.ask !== 'string') {
      errors.push({ path: `${qPath}.ask`, questionIndex: qi, message: `${qPath}.ask: Phải là chuỗi.` });
    }
    if (!Array.isArray(obj.answer)) {
      errors.push({ path: `${qPath}.answer`, questionIndex: qi, message: `${qPath}.answer: Phải là mảng.` });
      return;
    }

    const options: DraftQuestion['options'] = [];
    obj.answer.forEach((ansItem, oi) => {
      const aPath = `${qPath}.answer[${oi}]`;
      if (!ansItem || typeof ansItem !== 'object' || Array.isArray(ansItem)) {
        errors.push({ path: aPath, questionIndex: qi, message: `${aPath}: Phải là object.` });
        return;
      }
      const keys = Object.keys(ansItem);
      if (keys.length !== 1 || (keys[0] !== 'true' && keys[0] !== 'false')) {
        errors.push({
          path: aPath,
          questionIndex: qi,
          message: `${aPath}: Phải có đúng 1 key là "true" hoặc "false".`,
        });
        return;
      }
      const key = keys[0];
      const val = (ansItem as Record<string, unknown>)[key];
      if (typeof val !== 'string') {
        errors.push({
          path: aPath,
          questionIndex: qi,
          message: `${aPath}.${key}: Giá trị phải là chuỗi.`,
        });
        return;
      }
      options.push({
        uid: newUid(),
        content: val.trim(),
        isCorrect: key === 'true',
      });
    });

    questions.push({
      uid: newUid(),
      content: typeof obj.ask === 'string' ? obj.ask.trim() : '',
      options,
    });
  });

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  const validationErrors = validateQuestions(questions, undefined, true);
  return { ok: true, value: questions, errors: validationErrors, title };
}

export function parseJson(raw: string): Result<DraftQuestion[]> & { title?: string } {
  const res = parseJsonDraft(raw);
  if (!res.ok) return res;
  if (res.errors.length > 0) return { ok: false, errors: res.errors };
  return { ok: true, value: res.value, title: res.title };
}

export function toJson(
  qs: { content: string; options: { content: string; isCorrect: boolean }[] }[],
  title?: string,
): string {
  const questions = qs.map((q) => ({
    ask: q.content,
    answer: q.options.map((o) => (o.isCorrect ? { true: o.content } : { false: o.content })),
  }));
  const trimmedTitle = title?.trim();
  const payload = trimmedTitle ? { title: trimmedTitle, questions } : questions;
  return JSON.stringify(payload, null, 2);
}
