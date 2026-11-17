import type { DraftQuestion } from '../types';
import { newUid, validateQuestions, type ParseError, type Result } from './validate';

const ASK_RE = /^\s*ask\s*:(.*)$/i;
const ANS_CORRECT_RE = /^\s*ans\.\*(.*)$/i;
const ANS_WRONG_RE = /^\s*ans\.(.*)$/i;

export function parseText(raw: string): Result<DraftQuestion[]> {
  const lines = raw.replace(/\r\n?/g, '\n').split('\n');
  const questions: DraftQuestion[] = [];
  const errors: ParseError[] = [];
  const questionLines: number[] = [];
  const optionLines: number[][] = [];

  let currentQ: DraftQuestion | null = null;
  let lastTarget: 'question' | 'option' | null = null;

  for (let i = 0; i < lines.length; i++) {
    const lineNum = i + 1;
    const line = lines[i];

    if (!line.trim()) {
      continue;
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

  if (validationErrors.length > 0) {
    return { ok: false, errors: validationErrors };
  }

  return { ok: true, value: questions };
}

export function toText(
  qs: { content: string; options: { content: string; isCorrect: boolean }[] }[],
): string {
  return qs
    .map((q) => {
      const lines = [`ask : ${q.content}`];
      for (const opt of q.options) {
        lines.push(`${opt.isCorrect ? 'ans.*' : 'ans.'} ${opt.content}`);
      }
      return lines.join('\n');
    })
    .join('\n\n');
}
