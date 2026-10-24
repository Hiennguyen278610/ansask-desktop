import { RotateCcw, Trash2 } from 'lucide-react';
import type { TrashItemDto } from '@/lib/tauri/commands';
import { formatDateTime } from '@/lib/time';

interface Props {
  item: TrashItemDto;
  onRestore: () => void;
  onPurge: () => void;
  isProcessing: boolean;
}

export function TrashItemRow({ item, onRestore, onPurge, isProcessing }: Props) {
  return (
    <div className={`neu-card-inset px-4 py-3 rounded-xl flex items-center justify-between gap-4 transition-opacity ${isProcessing ? 'opacity-50 pointer-events-none' : ''}`}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${item.kind === 'subject' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-200 text-slate-600'}`}>
            {item.kind === 'subject' ? 'Môn học' : 'Bộ đề'}
          </span>
          <h4 className="text-sm font-bold text-ink-strong truncate">{item.name}</h4>
        </div>
        <div className="text-[11px] text-slate-400 flex flex-wrap items-center gap-x-3 gap-y-1">
          {item.subjectName && <span>Môn gốc: {item.subjectName}</span>}
          {item.deletedByParent && <span className="text-rose-500 font-semibold">Xóa cùng môn</span>}
          <span>Xóa lúc: {formatDateTime(item.deletedAt)}</span>
          <span>{item.questionCount} câu hỏi • {item.attemptCount} lượt làm</span>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button onClick={onRestore} className="neu-pill px-3 py-1.5 rounded-lg text-xs font-bold text-emerald-600 flex items-center gap-1 hover:bg-white dark:hover:bg-slate-700">
          <RotateCcw className="w-3.5 h-3.5" /> Khôi phục
        </button>
        <button onClick={onPurge} className="neu-pill px-3 py-1.5 rounded-lg text-xs font-bold text-rose-600 flex items-center gap-1 hover:bg-white dark:hover:bg-slate-700">
          <Trash2 className="w-3.5 h-3.5" /> Xóa vĩnh viễn
        </button>
      </div>
    </div>
  );
}
