import { Trash2, ChevronRight } from 'lucide-react';
import type { SubjectSummary } from '@/lib/tauri/commands';

interface Props {
  subject: SubjectSummary;
  onOpen: () => void;
  onDelete: () => void;
}

export function SubjectCard({ subject, onOpen, onDelete }: Props) {
  return (
    <div onClick={onOpen} className="neu-card rounded-[24px] p-5 cursor-pointer hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between group relative">
      <button
        onClick={(e) => { e.stopPropagation(); onDelete(); }}
        className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity neu-icon-btn w-8 h-8 rounded-lg flex items-center justify-center text-rose-500 hover:text-rose-700"
        title="Xóa môn"
      >
        <Trash2 className="w-4 h-4" />
      </button>
      
      <div>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-white font-bold text-base shadow-md" style={{ backgroundColor: subject.color }}>
            {subject.name.charAt(0).toUpperCase()}
          </div>
        </div>
        <h3 className="text-base font-bold text-ink-strong mb-1">{subject.name}</h3>
        <p className="text-xs text-slate-400">{subject.examCount} bộ đề • {subject.questionCount} câu hỏi</p>
      </div>
      <div className="mt-5 pt-3 border-t border-slate-200/70 flex items-center justify-between text-xs font-bold text-ink">
        <span className="flex items-center gap-1.5">Mở danh sách đề</span>
        <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
      </div>
    </div>
  );
}
