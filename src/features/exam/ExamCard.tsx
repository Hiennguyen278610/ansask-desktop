import { Trash2, ChevronRight } from 'lucide-react';
import type { ExamSummary } from '@/lib/tauri/commands';
import { formatDateTime } from '@/lib/time';

interface Props {
  exam: ExamSummary;
  subjectColor: string;
  onOpen: () => void;
  onDelete: () => void;
}

export function ExamCard({ exam, subjectColor, onOpen, onDelete }: Props) {
  return (
    <div onClick={onOpen} className="neu-card rounded-[24px] p-5 cursor-pointer hover:-translate-y-1 transition-all flex flex-col justify-between group relative">
      <button onClick={(e) => { e.stopPropagation(); onDelete(); }}
        className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity neu-icon-btn w-8 h-8 rounded-lg flex items-center justify-center text-rose-500 hover:text-rose-700"
        title="Xóa bộ đề">
        <Trash2 className="w-4 h-4" />
      </button>
      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="px-3 py-1 rounded-full text-[11px] font-bold text-white" style={{ backgroundColor: subjectColor }}>
            {exam.questionCount} câu hỏi
          </span>
          <span className="text-[11px] text-slate-400 font-medium">{formatDateTime(exam.createdAt)}</span>
        </div>
        <h4 className="font-bold text-base text-ink-strong mb-2">{exam.title}</h4>
        <p className="text-xs text-slate-400">Đã làm {exam.attemptCount} lượt • Nhấn để xem chi tiết</p>
      </div>
      <div className="mt-5 pt-3 border-t border-slate-200/70 flex items-center justify-between text-xs font-bold text-ink">
        <span>Xem tổng quan & Làm đề</span>
        <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
      </div>
    </div>
  );
}
