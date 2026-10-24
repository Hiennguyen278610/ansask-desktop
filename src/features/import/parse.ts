// Hàm parse cơ bản cho Mobile
export function parseTxtToQuestions(txt: string) {
  const lines = txt.split(/\r?\n/);
  const questions = [];
  let currentQ: any = null;
  for (const line of lines) {
    const t = line.trim();
    if (!t) continue;
    if (t.startsWith('ask')) {
      if (currentQ) questions.push(currentQ);
      currentQ = { ask: t.split(':')[1]?.trim() || '', options: [] };
    } else if (t.startsWith('ans.*')) {
      if (currentQ) currentQ.options.push({ text: t.replace('ans.*', '').trim(), isCorrect: true });
    } else if (t.startsWith('ans.')) {
      if (currentQ) currentQ.options.push({ text: t.replace('ans.', '').trim(), isCorrect: false });
    }
  }
  if (currentQ) questions.push(currentQ);
  return questions;
}
export function parseJsonToQuestions(json: string) {
  const parsed = JSON.parse(json);
  return parsed.map((item: any) => ({
    ask: item.ask,
    options: item.answer.map((a: any) => ({
      text: a.true !== undefined ? a.true : a.false,
      isCorrect: a.true !== undefined
    }))
  }));
}
