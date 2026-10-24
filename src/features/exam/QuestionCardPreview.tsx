import type { QuestionDto } from '@/lib/tauri/commands';

interface Props {
  index: number;
  question: QuestionDto;
  showAnswer: boolean;
}

export function QuestionCardPreview({ index, question, showAnswer }: Props) {
  return (
    <div className="neu-card-inset p-5 rounded-2xl transition-all">
      <div className="flex items-start gap-3 mb-4">
        <span className="neu-pill px-3 py-1 rounded-xl text-xs font-bold text-ink-strong shrink-0 mt-0.5">
          Câu {index + 1}
        </span>
        <h4 className="text-ink-strong font-semibold text-sm sm:text-base leading-relaxed flex-1">
          {question.ask || '(Câu hỏi trống)'}
        </h4>
      </div>

      <div className="space-y-2.5">
        {question.options.map((opt, oIdx) => {
          const isCorrectShown = showAnswer && opt.isCorrect;
          let rowStyle = 'bg-[#eef2f6]/70 dark:bg-transparent border-white/70 dark:border-slate-600';
          if (isCorrectShown) {
            rowStyle = 'bg-emerald-50/90 dark:bg-emerald-900/20 border-emerald-400/80 dark:border-emerald-600 text-emerald-950 dark:text-emerald-300 font-semibold';
          }

          return (
            <div key={opt.id || oIdx} className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl border transition-all ${rowStyle}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center border transition-all ${isCorrectShown ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-slate-400 bg-transparent shadow-inner'}`}>
                {isCorrectShown && <span className="w-2 h-2 rounded-full bg-white" />}
              </span>
              <span className="text-xs font-bold text-slate-400 w-5 shrink-0">{String.fromCharCode(65 + oIdx)}.</span>
              <div className="flex-1 text-sm text-ink">{opt.text}</div>
              {isCorrectShown && (
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-lg bg-emerald-600 text-white shrink-0">
                  Đáp án đúng
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
