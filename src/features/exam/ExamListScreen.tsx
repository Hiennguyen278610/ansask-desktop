import { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router';
import { Plus, BookOpen, ChevronRight, Upload } from 'lucide-react';
import { BreadcrumbHeader } from '@/components/layout/BreadcrumbHeader';
import { ExamCard } from './ExamCard';
import { DeleteConfirmDialog } from '@/components/ui/DeleteConfirmDialog';
import { useSubjects } from '@/hooks/useSubjects';
import { useExams, useDeleteExam } from '@/hooks/useExams';
import type { ExamSummary } from '@/lib/tauri/commands';
import { useUiStore } from '@/stores/uiStore';

export function ExamListScreen() {
  const { subjectId } = useParams();
  const navigate = useNavigate();
  const showToast = useUiStore(s => s.showToast);
  
  const { data: subjects } = useSubjects();
  const { data: exams, isLoading, isError, error } = useExams(subjectId || '');
  const deleteMut = useDeleteExam();
  
  const [deletingExam, setDeletingExam] = useState<ExamSummary | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const subject = subjects?.find(s => s.id === subjectId);
  const subjectColor = subject?.color || 'var(--ink-800)';

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isTxt = file.name.endsWith('.txt');
    const isJson = file.name.endsWith('.json');
    if (!isTxt && !isJson) {
      showToast('Lỗi: Chỉ chấp nhận file .txt hoặc .json!');
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      // Chuyển sang màn tạo đề mới kèm nội dung file
      navigate(`/subjects/${subjectId}/exams/new`, { state: { importText: content } });
      showToast(`Đã tải nội dung từ ${file.name}`);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <BreadcrumbHeader>
        <button onClick={() => navigate('/subjects')} className="text-slate-500 hover:text-ink-strong flex items-center gap-1">
          root <ChevronRight className="w-4 h-4" />
        </button>
        <span className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: subjectColor }} />
          {subject?.name || 'Môn học'}
        </span>
        
        <div className="ml-auto flex items-center gap-2">
          <input type="file" accept=".txt,.json" className="hidden" ref={fileInputRef} onChange={handleImportFile} />
          <button onClick={() => fileInputRef.current?.click()} className="neu-pill px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-white/70 dark:hover:bg-white/10">
            <Upload className="w-4 h-4" /> Nhập bộ đề
          </button>
          <button onClick={() => navigate(`/subjects/${subjectId}/exams/new`)} className="neu-dark-btn px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2">
            <Plus className="w-4 h-4" /> Tạo bộ đề
          </button>
        </div>
      </BreadcrumbHeader>

      {isLoading && <div className="p-8 text-center text-sm text-slate-500">Đang tải...</div>}
      {isError && <div className="p-8 text-center text-sm text-rose-500">Lỗi: {(error as Error)?.message}</div>}
      
      {exams && exams.length === 0 && (
        <div className="neu-card rounded-3xl p-12 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl neu-pill mx-auto flex items-center justify-center text-slate-400"><BookOpen className="w-6 h-6" /></div>
          <h3 className="font-bold text-base text-ink-strong">Môn {subject?.name} chưa có bộ đề nào</h3>
          <button onClick={() => navigate(`/subjects/${subjectId}/exams/new`)} className="neu-dark-btn px-5 py-2.5 rounded-xl text-xs font-bold inline-flex items-center gap-2">
            <Plus className="w-4 h-4" /> Tạo bộ đề đầu tiên
          </button>
        </div>
      )}

      {exams && exams.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {exams.map(ex => (
            <ExamCard
              key={ex.id}
              exam={ex}
              subjectColor={subjectColor}
              onOpen={() => navigate(`/subjects/${subjectId}/exams/${ex.id}`)}
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
