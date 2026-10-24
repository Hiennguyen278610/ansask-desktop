import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Plus, BookOpen } from 'lucide-react';
import { BreadcrumbHeader } from '@/components/layout/BreadcrumbHeader';
import { SubjectCard } from './SubjectCard';
import { SubjectFormDialog } from './SubjectFormDialog';
import { DeleteConfirmDialog } from '@/components/ui/DeleteConfirmDialog';
import { useSubjects, useDeleteSubject } from '@/hooks/useSubjects';
import type { SubjectSummary } from '@/lib/tauri/commands';

export function SubjectListScreen() {
  const navigate = useNavigate();
  const { data: subjects, isLoading, error } = useSubjects();
  const deleteMut = useDeleteSubject();
  
  const [showCreate, setShowCreate] = useState(false);
  const [deletingSub, setDeletingSub] = useState<SubjectSummary | null>(null);

  return (
    <div className="space-y-6 animate-fade-in">
      <BreadcrumbHeader>
        <span>root</span>
        <button onClick={() => setShowCreate(true)} className="ml-auto neu-dark-btn px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2">
          <Plus className="w-4 h-4" /> Tạo môn học
        </button>
      </BreadcrumbHeader>

      {isLoading && <div className="p-8 text-center text-sm text-slate-500">Đang tải dữ liệu...</div>}
      {error && <div className="p-8 text-center text-sm text-rose-500">Lỗi tải dữ liệu: {(error as Error).message}</div>}
      
      {subjects && subjects.length === 0 && (
        <div className="neu-card rounded-3xl p-12 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl neu-pill mx-auto flex items-center justify-center text-slate-400"><BookOpen className="w-6 h-6" /></div>
          <h3 className="font-bold text-base text-ink-strong">Chưa có môn học nào</h3>
          <button onClick={() => setShowCreate(true)} className="neu-dark-btn px-5 py-2.5 rounded-xl text-xs font-bold inline-flex items-center gap-2">
            <Plus className="w-4 h-4" /> Tạo môn học đầu tiên
          </button>
        </div>
      )}

      {subjects && subjects.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {subjects.map(sub => (
            <SubjectCard
              key={sub.id}
              subject={sub}
              onOpen={() => navigate(`/subjects/${sub.id}/exams`)}
              onDelete={() => setDeletingSub(sub)}
            />
          ))}
        </div>
      )}

      <SubjectFormDialog open={showCreate} onClose={() => setShowCreate(false)} />
      
      <DeleteConfirmDialog
        open={!!deletingSub}
        onClose={() => setDeletingSub(null)}
        onConfirm={() => deletingSub && deleteMut.mutate(deletingSub.id)}
        title={`Xóa môn "${deletingSub?.name}"?`}
        message={`Môn này có ${deletingSub?.examCount} bộ đề và ${deletingSub?.questionCount} câu hỏi. Các bộ đề bên trong cũng sẽ bị ẩn.`}
      />
    </div>
  );
}
