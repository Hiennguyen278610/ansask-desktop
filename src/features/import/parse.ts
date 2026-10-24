export interface ParsedOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface ParsedQuestion {
  ask: string;
  options: ParsedOption[];
}

export function parseTxtToQuestions(txt: string): ParsedQuestion[] {
  const lines = txt.split(/\r?\n/);
  const questions: ParsedQuestion[] = [];
  let currentQ: ParsedQuestion | null = null;
  for (const line of lines) {
    const t = line.trim();
    if (!t) continue;
    if (t.startsWith('ask')) {
      if (currentQ) questions.push(currentQ);
      currentQ = { ask: t.split(':')[1]?.trim() || '', options: [] };
    } else if (t.startsWith('ans.*')) {
      if (currentQ) currentQ.options.push({ id: `opt-${currentQ.options.length}`, text: t.replace('ans.*', '').trim(), isCorrect: true });
    } else if (t.startsWith('ans.')) {
      if (currentQ) currentQ.options.push({ id: `opt-${currentQ.options.length}`, text: t.replace('ans.', '').trim(), isCorrect: false });
    }
  }
  if (currentQ) questions.push(currentQ);
  return questions;
}

export function parseJsonToQuestions(json: string): ParsedQuestion[] {
  const parsed = JSON.parse(json) as { ask: string; answer: Record<string, string>[] }[];
  return parsed.map((item) => ({
    ask: item.ask,
    options: item.answer.map((a, idx) => {
      const isCorrect = Object.prototype.hasOwnProperty.call(a, 'true');
      const text = isCorrect ? a['true'] : a['false'];
      return { id: `opt-${idx}`, text, isCorrect };
    })
  }));
}
