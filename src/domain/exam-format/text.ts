import type { DraftQuestion } from '../types';
import { newUid, validateQuestions, type ParseError, type Result } from './validate';

const TITLE_RE = /^\s*title\s*:(.*)$/i;
const ASK_RE = /^\s*ask\s*:(.*)$/i;
const ANS_CORRECT_RE = /^\s*ans\.\*(.*)$/i;
const ANS_WRONG_RE = /^\s*ans\.(.*)$/i;

export type DraftParseResult =
  | { ok: true; value: DraftQuestion[]; errors: ParseError[]; title?: string }
  | { ok: false; errors: ParseError[]; title?: string };

export function parseTextDraft(raw: string): DraftParseResult {
  const lines = raw.replace(/\r\n?/g, '\n').split('\n');
  const questions: DraftQuestion[] = [];
  const errors: ParseError[] = [];
  const questionLines: number[] = [];
  const optionLines: number[][] = [];

  let title: string | undefined;
  let currentQ: DraftQuestion | null = null;
  let lastTarget: 'question' | 'option' | null = null;

  for (let i = 0; i < lines.length; i++) {
    const lineNum = i + 1;
    const line = lines[i];

    if (!line.trim()) {
      continue;
    }

    if (!currentQ) {
      const titleMatch = TITLE_RE.exec(line);
      if (titleMatch) {
        const parsedTitle = titleMatch[1].trim();
        if (parsedTitle) title = parsedTitle;
        continue;
      }
    }

    const askMatch = ASK_RE.exec(line);
    if (askMatch) {
      currentQ = {
        uid: newUid(),
        content: askMatch[1].trim(),
        options: [],
      };
      questions.push(currentQ);
      questionLines.push(lineNum);
      optionLines.push([]);
      lastTarget = 'question';
      continue;
    }

    const correctMatch = ANS_CORRECT_RE.exec(line);
    if (correctMatch) {
      if (!currentQ) {
        errors.push({ line: lineNum, message: 'Lựa chọn xuất hiện trước câu hỏi "ask :" đầu tiên.' });
        continue;
      }
      currentQ.options.push({
        uid: newUid(),
        content: correctMatch[1].trim(),
        isCorrect: true,
      });
      optionLines[questions.length - 1].push(lineNum);
      lastTarget = 'option';
      continue;
    }

    const wrongMatch = ANS_WRONG_RE.exec(line);
    if (wrongMatch) {
      if (!currentQ) {
        errors.push({ line: lineNum, message: 'Lựa chọn xuất hiện trước câu hỏi "ask :" đầu tiên.' });
        continue;
      }
      currentQ.options.push({
        uid: newUid(),
        content: wrongMatch[1].trim(),
        isCorrect: false,
      });
      optionLines[questions.length - 1].push(lineNum);
      lastTarget = 'option';
      continue;
    }

    if (!currentQ || !lastTarget) {
      errors.push({ line: lineNum, message: 'Văn bản không hợp lệ trước câu hỏi "ask :" đầu tiên.' });
      continue;
    }

    const extra = line.trim();
    if (lastTarget === 'question') {
      currentQ.content = currentQ.content ? `${currentQ.content}\n${extra}` : extra;
    } else {
      const lastOpt = currentQ.options[currentQ.options.length - 1];
      if (lastOpt) {
        lastOpt.content = lastOpt.content ? `${lastOpt.content}\n${extra}` : extra;
      }
    }
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  const validationErrors = validateQuestions(
    questions,
    (qi, oi) => (oi === undefined ? questionLines[qi] : optionLines[qi]?.[oi]),
    false,
  );

  return { ok: true, value: questions, errors: validationErrors, title };
}

export function parseText(raw: string): Result<DraftQuestion[]> & { title?: string } {
  const res = parseTextDraft(raw);
  if (!res.ok) return res;
  if (res.errors.length > 0) return { ok: false, errors: res.errors };
  return { ok: true, value: res.value, title: res.title };
}

export function toText(
  qs: { content: string; options: { content: string; isCorrect: boolean }[] }[],
  title?: string,
): string {
  const body = qs
    .map((q) => {
      const lines = [`ask : ${q.content}`];
      for (const opt of q.options) {
        lines.push(`${opt.isCorrect ? 'ans.*' : 'ans.'} ${opt.content}`);
      }
      return lines.join('\n');
    })
    .join('\n\n');
  const trimmedTitle = title?.trim();
  return trimmedTitle ? `title : ${trimmedTitle}\n\n${body}` : body;
}
