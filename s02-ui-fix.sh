#!/bin/bash
set -e

# 1. Sửa màu sắc trong QuestionCardEditor
cat > src/features/exam/QuestionCardEditor.tsx << 'TSX_EOF'
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
          className="flex-1 p-2 rounded-xl bg-transparent text-ink-strong font-medium text-sm border border-slate-300 dark:border-slate-600 focus:outline-none focus:border-ink-strong resize-none"
          rows={2}
        />
        <button onClick={onDelete} className="neu-icon-btn w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-rose-500 shrink-0">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-2">
        {question.options.map((opt, i) => (
          <div key={i} className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl border transition-all ${opt.isCorrect ? 'bg-emerald-50/80 dark:bg-emerald-900/20 border-emerald-400/70' : 'bg-transparent border-slate-300 dark:border-slate-600'}`}>
            <label className="flex items-center cursor-pointer" onClick={() => handleSetCorrect(i)}>
              <input type="radio" checked={opt.isCorrect} onChange={() => {}} className="sr-only" />
              <span className={`w-5 h-5 rounded-full flex items-center justify-center border transition-all ${opt.isCorrect ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-slate-400 bg-transparent'}`}>
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
            {opt.isCorrect && <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">Đúng</span>}
            {question.options.length > 2 && (
              <button onClick={() => handleRemoveOption(i)} className="text-slate-400 hover:text-rose-500 p-1"><X className="w-3.5 h-3.5" /></button>
            )}
          </div>
        ))}
      </div>
      <button onClick={handleAddOption} className="text-xs font-semibold text-slate-500 hover:text-ink-strong flex items-center gap-1 w-fit px-2 py-1 rounded-lg hover:bg-white/60 dark:hover:bg-white/10">
        <Plus className="w-3.5 h-3.5" /> Thêm lựa chọn
      </button>
    </div>
  );
}
TSX_EOF

# 2. Sửa lỗi tàng hình chữ trong SyntaxHighlightedTextarea
cat > src/features/exam/SyntaxHighlightedTextarea.tsx << 'TSX_EOF'
import { useRef } from 'react';

interface Props {
  value: string;
  onChange: (val: string) => void;
}

export function SyntaxHighlightedTextarea({ value, onChange }: Props) {
  const preRef = useRef<HTMLPreElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);

  const handleScroll = () => {
    if (preRef.current && taRef.current) {
      preRef.current.scrollTop = taRef.current.scrollTop;
      preRef.current.scrollLeft = taRef.current.scrollLeft;
    }
  };

  const highlightText = (text: string) => {
    if (!text) return '';
    return text.split('\n').map(line => {
      const trimmed = line.trimStart();
      if (/^ask\s*:/i.test(trimmed)) {
        const match = line.match(/^(\s*)(ask\s*:)(.*)$/i);
        if (match) return `${match[1]}<span class="text-rose-600 font-bold">${match[2]}</span>${match[3]}`;
      }
      if (/^ans\.\*/i.test(trimmed)) {
        const match = line.match(/^(\s*)(ans\.\*)(.*)$/i);
        if (match) return `${match[1]}<span class="text-blue-600 font-bold">${match[2]}</span>${match[3]}`;
      }
      if (/^ans\./i.test(trimmed)) {
        const match = line.match(/^(\s*)(ans\.)(.*)$/i);
        if (match) return `${match[1]}<span class="text-blue-600 font-bold">${match[2]}</span>${match[3]}`;
      }
      // Escape HTML for normal text
      return line.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }).join('\n');
  };

  return (
    <div className="relative flex-1 w-full rounded-2xl neu-card-inset overflow-hidden flex">
      {/* Lớp dưới: Hiển thị text có màu. Sử dụng text-ink để kế thừa màu chữ chuẩn */}
      <pre
        ref={preRef}
        aria-hidden="true"
        className="absolute inset-0 p-4 font-mono text-xs sm:text-sm leading-relaxed whitespace-pre-wrap break-words text-ink pointer-events-none overflow-hidden"
        dangerouslySetInnerHTML={{ __html: highlightText(value) + '<br/>' }}
      />
      {/* Lớp trên: Textarea trong suốt, chỉ hiện con trỏ và vùng chọn */}
      <textarea
        ref={taRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onScroll={handleScroll}
        spellCheck={false}
        className="relative z-10 w-full h-full p-4 font-mono text-xs sm:text-sm leading-relaxed bg-transparent text-transparent caret-ink focus:outline-none resize-none"
      />
    </div>
  );
}
TSX_EOF

# 3. Sửa lỗi màn hình trắng ExamListScreen (thêm hiển thị lỗi và kiểm tra undefined)
cat > src/features/exam/ExamListScreen.tsx << 'TSX_EOF'
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { Plus, BookOpen, ChevronRight } from 'lucide-react';
import { BreadcrumbHeader } from '@/components/layout/BreadcrumbHeader';
import { ExamCard } from './ExamCard';
import { DeleteConfirmDialog } from '@/components/ui/DeleteConfirmDialog';
import { useSubjects } from '@/hooks/useSubjects';
import { useExams, useDeleteExam } from '@/hooks/useExams';
import type { ExamSummary } from '@/lib/tauri/commands';

export function ExamListScreen() {
  const { subjectId } = useParams();
  const navigate = useNavigate();
  const { data: subjects } = useSubjects();
  const { data: exams, isLoading, isError, error } = useExams(subjectId || '');
  const deleteMut = useDeleteExam();
  
  const [deletingExam, setDeletingExam] = useState<ExamSummary | null>(null);
  
  const subject = subjects?.find(s => s.id === subjectId);
  const subjectColor = subject?.color || 'var(--ink-800)';

  if (!subjectId) {
    return <div className="p-8 text-center text-rose-500">Lỗi: Không tìm thấy ID môn học trên URL.</div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <BreadcrumbHeader>
        <button onClick={() => navigate('/subjects')} className="text-slate-500 hover:text-ink-strong flex items-center gap-1">
          root <ChevronRight className="w-4 h-4" />
        </button>
        <span className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: subjectColor }} />
          {subject?.name || 'Đang tải...'}
        </span>
        <button onClick={() => navigate(`/subjects/${subjectId}/exams/new`)} className="ml-auto neu-dark-btn px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2">
          <Plus className="w-4 h-4" /> Tạo bộ đề
        </button>
      </BreadcrumbHeader>

      {isLoading && (
        <div className="p-8 text-center text-sm text-slate-500">Đang tải danh sách bộ đề...</div>
      )}

      {isError && (
        <div className="p-8 text-center text-sm text-rose-500">
          Lỗi tải dữ liệu: {(error as Error)?.message || 'Lỗi không xác định'}
        </div>
      )}
      
      {!isLoading && !isError && exams && exams.length === 0 && (
        <div className="neu-card rounded-3xl p-12 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl neu-pill mx-auto flex items-center justify-center text-slate-400"><BookOpen className="w-6 h-6" /></div>
          <h3 className="font-bold text-base text-ink-strong">Môn {subject?.name || ''} chưa có bộ đề nào</h3>
          <button onClick={() => navigate(`/subjects/${subjectId}/exams/new`)} className="neu-dark-btn px-5 py-2.5 rounded-xl text-xs font-bold inline-flex items-center gap-2">
            <Plus className="w-4 h-4" /> Tạo bộ đề đầu tiên
          </button>
        </div>
      )}

      {!isLoading && !isError && exams && exams.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {exams.map(ex => (
            <ExamCard
              key={ex.id}
              exam={ex}
              subjectColor={subjectColor}
              onOpen={() => navigate(`/subjects/${subjectId}/exams/${ex.id}/edit`)}
              onDelete={() => setDeletingExam(ex)}
            />
          ))}
        </div>
      )}

      <DeleteConfirmDialog
        open={!!deletingExam}
        onClose={() => setDeletingExam(null)}
        onConfirm={() => deletingExam && deleteMut.mutate(deletingExam.id)}
        title={`Xóa bộ đề "${deletingExam?.title}"?`}
        message="Các câu hỏi và lượt làm bài liên quan cũng sẽ bị ẩn khỏi thống kê."
      />
    </div>
  );
}
TSX_EOF
