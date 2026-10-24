import type { QuestionDto, QuestionUpsertReq } from '@/lib/tauri/commands';

export function questionsToJsonString(questions: (QuestionDto | QuestionUpsertReq)[]): string {
  const formatted = questions.map(q => ({
    ask: q.ask || '',
    answer: q.options.map(o => ({
      [o.isCorrect ? 'true' : 'false']: o.text || ''
    }))
  }));
  return JSON.stringify(formatted, null, '\t');
}

export function questionsToTxtString(questions: (QuestionDto | QuestionUpsertReq)[]): string {
  return questions.map(q => {
    const askLine = `ask : ${q.ask || ''}`;
    const ansLines = q.options.map(o => o.isCorrect ? `ans.* ${o.text || ''}` : `ans. ${o.text || ''}`);
    return [askLine, ...ansLines].join('\n');
  }).join('\n\n');
}
