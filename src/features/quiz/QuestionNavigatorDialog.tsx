import { Dialog } from '@/components/ui/Dialog';
import type { QuizQuestionDto } from '@/lib/tauri/commands';

interface Props {
  open: boolean;
  questions: { id: string; ask: string }[] | QuizQuestionDto[];
  answers?: Record<string, string[]>;
  onSelect: (idx: number) => void;
  onClose: () => void;
}

export function QuestionNavigatorDialog({ open, questions, answers = {}, onSelect, onClose }: Props) {
  return (
    <Dialog open={open} title={`Danh sách câu hỏi (${questions.length})`} onClose={onClose}>
      <div className="grid grid-cols-5 gap-2 max-h-[60vh] overflow-y-auto pr-2">
        {questions.map((q, idx) => {
          const answered = (answers[q.id] || []).length > 0;
          return (
            <button key={q.id} onClick={() => { onSelect(idx); onClose(); }}
              className={`py-2 rounded-lg text-sm font-bold transition-all ${answered ? 'bg-emerald-500 text-white shadow-md' : 'neu-pill text-slate-600 hover:bg-white'}`}>
              {idx + 1}
            </button>
          );
        })}
      </div>
    </Dialog>
  );
}
