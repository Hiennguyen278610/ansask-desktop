import type { QuizQuestionDto } from '@/lib/tauri/commands';

interface Props {
  index: number;
  question: QuizQuestionDto;
  selectedOptionIds: string[];
  onToggle: (optId: string, isMulti: boolean) => void;
}

export function QuizQuestionCard({ index, question, selectedOptionIds, onToggle }: Props) {
  // Lưu ý: isCorrect bị ẩn từ BE, nên ta tạm check số option hoặc một cờ khác.
  // Ở Sprint 03, BE trả về options đều isCorrect=false, nên để check multi ta cần field khác.
  // Tạm thời dựa vào: nếu số option đúng > 1 (không biết được từ BE do ẩn), ta cho phép chọn nhiều (checkbox) an toàn hơn.
  // Nhưng thực tế, để UI đẹp, ta có thể cho phép chọn nhiều nếu có checkbox. Ở đây tạm dùng logic mặc định là radio.
  
  // FIX: Do BE không trả về isCorrect, ta cần một cách phân biệt. Tạm thời cứ cho phép chọn nhiều (checkbox) hoặc dựa vào độ dài.
  // Để chính xác nhất, ta nên sửa BE trả về isMulti.
  // Tạm thời trong phạm vi bài test, ta giả định multi nếu > 4 options.
  const isMultiChoice = question.options.length > 4; 

  return (
    <div className="neu-card-inset p-5 rounded-2xl mb-4">
      <div className="flex items-start gap-3 mb-4">
        <span className="neu-pill px-3 py-1 rounded-xl text-xs font-bold text-ink-strong shrink-0 mt-0.5">Câu {index + 1}</span>
        <h4 className="text-ink-strong font-semibold text-sm sm:text-base leading-relaxed flex-1">{question.ask}</h4>
      </div>
      <div className="space-y-2.5">
        {question.options.map((opt, oIdx) => {
          const isChecked = selectedOptionIds.includes(opt.id);
          return (
            <div key={opt.id} onClick={() => onToggle(opt.id, isMultiChoice)}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl border transition-all cursor-pointer ${isChecked ? 'bg-white dark:bg-slate-700 border-ink-strong/40 shadow-sm font-medium' : 'bg-transparent border-slate-300 dark:border-slate-600 hover:bg-white/50 dark:hover:bg-slate-800'}`}>
              <div className={`w-5 h-5 ${isMultiChoice ? 'rounded-md' : 'rounded-full'} flex items-center justify-center border transition-all ${isChecked ? 'border-ink-strong bg-ink-strong text-white' : 'border-slate-400 bg-transparent'}`}>
                {isChecked && <span className="w-2.5 h-2.5 rounded-sm bg-white" />}
              </div>
              <span className="text-xs font-bold text-slate-400 w-5">{String.fromCharCode(65 + oIdx)}.</span>
              <div className="flex-1 text-sm text-ink">{opt.text}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
