import { useState } from 'react';
import { Dialog } from '@/components/ui/Dialog';
import { Play } from 'lucide-react';

interface Props {
  open: boolean;
  examId: string;
  maxQuestions: number;
  onClose: () => void;
  onStart: (count: number, randomize: boolean) => void;
}

export function QuizSetupDialog({ open, examId, maxQuestions, onClose, onStart }: Props) {
  const [count, setCount] = useState(Math.min(25, maxQuestions));
  const [randomize, setRandomize] = useState(true);

  const handleStart = () => {
    const finalCount = Math.max(1, Math.min(count, 200, maxQuestions));
    onStart(finalCount, randomize);
  };

  return (
    <Dialog open={open} title="Cấu hình Bài kiểm tra" onClose={onClose}
      footer={
        <>
          <button onClick={onClose} className="neu-pill px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600">Đóng</button>
          <button onClick={handleStart} className="neu-dark-btn px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2">
            <Play className="w-4 h-4 fill-current" /> Làm bài ngay
          </button>
        </>
      }>
      <div className="space-y-4">
        <p className="text-xs text-slate-500">Bộ đề: <strong className="text-ink-strong">{examId}</strong> (Có {maxQuestions} câu gốc)</p>
        
        <div>
          <label className="block text-xs font-bold text-ink-strong mb-1.5">Số câu muốn lấy:</label>
          <input
            type="number"
            min="1"
            max="200"
            value={count}
            onChange={(e) => setCount(Number(e.target.value) || 1)}
            className="w-full px-4 py-3 rounded-xl neu-card-inset text-base font-bold text-ink-strong focus:outline-none"
          />
        </div>

        <div>
          <span className="text-xs font-semibold text-slate-400 mb-1.5 block">Chọn nhanh:</span>
          <div className="grid grid-cols-4 gap-2">
            {[25, 32, 40].map(num => (
              <button key={num} onClick={() => setCount(num)}
                className={`py-2 rounded-xl text-xs font-bold transition-all ${count === num ? 'bg-ink-strong text-app shadow-md' : 'neu-pill text-ink hover:bg-white/70 dark:hover:bg-white/10'}`}>
                {num} câu
              </button>
            ))}
            <button onClick={() => setCount(maxQuestions)}
              className={`py-2 rounded-xl text-xs font-bold transition-all ${count === maxQuestions ? 'bg-ink-strong text-app shadow-md' : 'neu-pill text-ink hover:bg-white/70 dark:hover:bg-white/10'}`}>
              Tất cả
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <span className="text-xs font-bold text-ink-strong">Xáo trộn câu hỏi & đáp án</span>
          <button onClick={() => setRandomize(!randomize)} className={`w-10 h-5 rounded-full p-0.5 transition-colors flex items-center ${randomize ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'}`}>
            <div className={`w-4 h-4 rounded-full bg-white shadow transform transition-transform ${randomize ? 'translate-x-5' : 'translate-x-0'}`} />
          </button>
        </div>
      </div>
    </Dialog>
  );
}
