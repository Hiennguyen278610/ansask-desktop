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
