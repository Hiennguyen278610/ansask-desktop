import { Plus, Trash2, X } from 'lucide-react';
import type { QuestionUpsertReq } from '@/lib/tauri/commands';

interface Props {
  index: number;
  question: QuestionUpsertReq;
  onUpdate: (q: QuestionUpsertReq) => void;
  onDelete: () => void;
}

export function QuestionCardEditor({ index, question, onUpdate, onDelete }: Props) {
  const handleAskChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onUpdate({ ...question, ask: e.target.value });
  };

  const handleOptTextChange = (idx: number, val: string) => {
    const nextOpts = [...question.options];
    nextOpts[idx].text = val;
    onUpdate({ ...question, options: nextOpts });
  };

  const handleSetCorrect = (idx: number) => {
    const nextOpts = question.options.map((o, i) => ({ ...o, isCorrect: i === idx }));
    onUpdate({ ...question, options: nextOpts });
  };

  const handleAddOption = () => {
    onUpdate({ ...question, options: [...question.options, { text: '', isCorrect: false }] });
  };

  const handleRemoveOption = (idx: number) => {
    if (question.options.length <= 2) return;
    const nextOpts = question.options.filter((_, i) => i !== idx);
    if (!nextOpts.some(o => o.isCorrect) && nextOpts.length > 0) {
      nextOpts[0].isCorrect = true;
    }
    onUpdate({ ...question, options: nextOpts });
  };

  return (
    <div className="neu-card-inset p-5 rounded-2xl flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <span className="neu-pill px-3 py-1 rounded-xl text-xs font-bold text-ink-strong shrink-0 mt-0.5">Câu {index + 1}</span>
        <textarea
          value={question.ask}
          onChange={handleAskChange}
          placeholder="Nhập nội dung câu hỏi..."
          className="flex-1 p-2 rounded-xl bg-white/70 text-ink-strong font-medium text-sm border border-slate-300 focus:outline-none focus:border-ink-strong resize-none"
          rows={2}
        />
        <button onClick={onDelete} className="neu-icon-btn w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-rose-500 shrink-0">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-2">
        {question.options.map((opt, i) => (
          <div key={i} className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl border transition-all ${opt.isCorrect ? 'bg-emerald-50/80 border-emerald-400/70' : 'bg-white/40 border-slate-200'}`}>
            <label className="flex items-center cursor-pointer" onClick={() => handleSetCorrect(i)}>
              <input type="radio" checked={opt.isCorrect} onChange={() => {}} className="sr-only" />
              <span className={`w-5 h-5 rounded-full flex items-center justify-center border transition-all ${opt.isCorrect ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-slate-400 bg-slate-100'}`}>
                {opt.isCorrect && <span className="w-2 h-2 rounded-full bg-white" />}
              </span>
            </label>
            <span className="text-xs font-bold text-slate-400 w-5">{String.fromCharCode(65 + i)}.</span>
            <input
              value={opt.text}
              onChange={(e) => handleOptTextChange(i, e.target.value)}
              className="flex-1 bg-transparent border-none focus:outline-none text-sm text-ink"
              placeholder="Nhập lựa chọn..."
            />
            {opt.isCorrect && <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-700">Đúng</span>}
            {question.options.length > 2 && (
              <button onClick={() => handleRemoveOption(i)} className="text-slate-400 hover:text-rose-500 p-1"><X className="w-3.5 h-3.5" /></button>
            )}
          </div>
        ))}
      </div>
      <button onClick={handleAddOption} className="text-xs font-semibold text-slate-500 hover:text-ink-strong flex items-center gap-1 w-fit px-2 py-1 rounded-lg hover:bg-white/60">
        <Plus className="w-3.5 h-3.5" /> Thêm lựa chọn
      </button>
    </div>
  );
}
