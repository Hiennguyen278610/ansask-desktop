#!/bin/bash
set -e

# 1. Component TrashItemRow
cat > src/features/trash/TrashItemRow.tsx << 'TSX_EOF'
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
TSX_EOF

# 2. Màn hình chính TrashScreen
cat > src/features/trash/TrashScreen.tsx << 'TSX_EOF'
import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { BreadcrumbHeader } from '@/components/layout/BreadcrumbHeader';
import { useTrash, useTrashActions } from '@/hooks/useTrash';
import { TrashItemRow } from './TrashItemRow';
import { RestoreDialog } from './RestoreDialog';
import { DeleteConfirmDialog } from '@/components/ui/DeleteConfirmDialog';
import type { TrashItemDto } from '@/lib/tauri/commands';

export function TrashScreen() {
  const { data: items, isLoading } = useTrash();
  const { restore, purge, empty } = useTrashActions();
  
  const [restoreItem, setRestoreItem] = useState<TrashItemDto | null>(null);
  const [purgeItem, setPurgeItem] = useState<TrashItemDto | null>(null);
  const [showEmptyConfirm, setShowEmptyConfirm] = useState(false);

  const subjects = items?.filter(i => i.kind === 'subject') || [];
  const exams = items?.filter(i => i.kind === 'exam') || [];
  const totalItems = subjects.length + exams.length;

  const handleRestoreConfirm = async (newName: string) => {
    if (!restoreItem) return;
    await restore.mutateAsync({ kind: restoreItem.kind, id: restoreItem.id, newName });
  };

  if (isLoading) return <div className="p-8 text-center text-sm text-slate-500">Đang tải thùng rác...</div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <BreadcrumbHeader>
        <span>Thùng rác</span>
        {totalItems > 0 && (
          <button onClick={() => setShowEmptyConfirm(true)} className="ml-auto neu-dark-btn px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2">
            <Trash2 className="w-4 h-4" /> Dọn sạch thùng rác
          </button>
        )}
      </BreadcrumbHeader>

      {totalItems === 0 ? (
        <div className="neu-card rounded-3xl p-12 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl neu-pill mx-auto flex items-center justify-center text-slate-400"><Trash2 className="w-6 h-6" /></div>
          <h3 className="font-bold text-base text-ink-strong">Thùng rác trống</h3>
          <p className="text-xs text-slate-400">Các mục bạn xóa sẽ xuất hiện ở đây.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {subjects.length > 0 && (
            <div className="neu-card rounded-[26px] p-5 space-y-3">
              <h3 className="text-[11px] uppercase font-bold text-slate-400">Môn đã xóa ({subjects.length})</h3>
              {subjects.map(item => (
                <TrashItemRow key={item.id} item={item} onRestore={() => setRestoreItem(item)} onPurge={() => setPurgeItem(item)} isProcessing={restore.isPending || purge.isPending} />
              ))}
            </div>
          )}

          {exams.length > 0 && (
            <div className="neu-card rounded-[26px] p-5 space-y-3">
              <h3 className="text-[11px] uppercase font-bold text-slate-400">Bộ đề đã xóa ({exams.length})</h3>
              {exams.map(item => (
                <TrashItemRow key={item.id} item={item} onRestore={() => setRestoreItem(item)} onPurge={() => setPurgeItem(item)} isProcessing={restore.isPending || purge.isPending} />
              ))}
            </div>
          )}
        </div>
      )}

      <RestoreDialog item={restoreItem} onClose={() => setRestoreItem(null)} onConfirm={handleRestoreConfirm} />
      
      <DeleteConfirmDialog 
        open={!!purgeItem} 
        onClose={() => setPurgeItem(null)} 
        onConfirm={() => purgeItem && purge.mutate({ kind: purgeItem.kind, id: purgeItem.id })}
        title={`Xóa vĩnh viễn "${purgeItem?.name}"?`}
        message="Hành động này KHÔNG THỂ HOÀN TÁC. Toàn bộ dữ liệu liên quan sẽ bị xóa khỏi ổ cứng."
      />

      <DeleteConfirmDialog 
        open={showEmptyConfirm} 
        onClose={() => setShowEmptyConfirm(false)} 
        onConfirm={() => empty.mutate()}
        title="Dọn sạch thùng rác?"
        message={`Tất cả ${totalItems} mục sẽ bị xóa vĩnh viễn và không thể khôi phục.`}
      />
    </div>
  );
}
TSX_EOF

# 3. Cập nhật Router
cat > src/routes/index.tsx << 'TSX_EOF'
import { createHashRouter, Navigate } from 'react-router';
import { AppShell } from '@/components/layout/AppShell';
import { DashboardScreen } from '@/features/dashboard/DashboardScreen';
import { SubjectListScreen } from '@/features/subject/SubjectListScreen';
import { ExamListScreen } from '@/features/exam/ExamListScreen';
import { ExamOverviewScreen } from '@/features/exam/ExamOverviewScreen';
import { ExamEditorScreen } from '@/features/exam/ExamEditorScreen';
import { QuizScreen } from '@/features/quiz/QuizScreen';
import { ResultScreen } from '@/features/quiz/ResultScreen';
import { GuideScreen } from '@/features/ai-guide/GuideScreen';
import { TrashScreen } from '@/features/trash/TrashScreen';

export const router = createHashRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <DashboardScreen /> },
      { path: 'subjects', element: <SubjectListScreen /> },
      { path: 'subjects/:subjectId/exams', element: <ExamListScreen /> },
      { path: 'subjects/:subjectId/exams/new', element: <ExamEditorScreen /> },
      { path: 'subjects/:subjectId/exams/:examId', element: <ExamOverviewScreen /> },
      { path: 'subjects/:subjectId/exams/:examId/edit', element: <ExamEditorScreen /> },
      { path: 'subjects/:subjectId/exams/:examId/quiz', element: <QuizScreen /> },
      { path: 'results/:attemptId', element: <ResultScreen /> },
      { path: 'guide', element: <GuideScreen /> },
      { path: 'trash', element: <TrashScreen /> },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
]);
TSX_EOF

# 4. Cập nhật Sidebar (Hiển thị số lượng mục trong thùng rác)
cat > src/components/layout/Sidebar.tsx << 'TSX_EOF'
import { LayoutDashboard, BookOpen, Sparkles, Trash2, PanelLeft } from 'lucide-react';
import { NavLink } from 'react-router';
import { useUiStore } from '@/stores/uiStore';
import { ThemeToggle } from '@/features/theme/ThemeToggle';
import { useTrash } from '@/hooks/useTrash';

export function Sidebar() {
  const sidebarOpen = useUiStore((s) => s.sidebarOpen);
  const toggleSidebar = useUiStore((s) => s.toggleSidebar);
  const { data: trashItems } = useTrash();
  const trashCount = trashItems?.length || 0;

  const NAV_ITEMS = [
    { to: '/', label: 'OVERVIEW', icon: LayoutDashboard, end: true },
    { to: '/subjects', label: 'ĐỀ KIỂM TRA', icon: BookOpen, end: false },
    { to: '/guide', label: 'AI GUIDE', icon: Sparkles, end: false },
    { to: '/trash', label: 'THÙNG RÁC', icon: Trash2, end: false, badge: trashCount },
  ];

  return (
    <aside
      className={`neu-shell rounded-[30px] shrink-0 flex flex-col justify-between transition-all duration-300 ease-in-out ${
        sidebarOpen ? 'w-full md:w-64 p-6' : 'w-full md:w-20 p-4 items-center'
      }`}
    >
      <div className="w-full">
        <div className={`flex items-center mb-6 ${sidebarOpen ? 'justify-between' : 'justify-center'}`}>
          <button
            onClick={toggleSidebar}
            className="neu-icon-btn w-11 h-11 rounded-2xl flex items-center justify-center relative"
            title={sidebarOpen ? 'Thu gọn Sidebar' : 'Mở rộng Sidebar'}
            aria-label={sidebarOpen ? 'Thu gọn Sidebar' : 'Mở rộng Sidebar'}
          >
            <PanelLeft className="w-5 h-5" />
          </button>
          {sidebarOpen && (
            <div>
              <h1 className="font-bold text-base tracking-tight">ansask</h1>
              <p className="text-[11px] text-slate-400 font-medium">Smart Exam Studio</p>
            </div>
          )}
        </div>

        <nav className="space-y-2">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                title={item.label}
                className={({ isActive }) =>
                  `flex items-center rounded-full transition-colors relative ${
                    sidebarOpen ? 'px-4 py-3 gap-3' : 'p-3 justify-center'
                  } ${isActive ? 'neu-pill-active font-bold' : 'hover:bg-white/40 dark:hover:bg-white/10'}`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                {sidebarOpen && (
                  <span className="text-xs tracking-wider flex-1">{item.label}</span>
                )}
                {item.badge !== undefined && item.badge > 0 && (
                  <span className={`bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center ${sidebarOpen ? 'px-2 py-0.5' : 'absolute -top-1 -right-1 w-5 h-5'}`}>
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      <div className="pt-6 mt-6 border-t border-slate-200/70 dark:border-slate-700/70 w-full flex justify-center">
        <ThemeToggle collapsed={!sidebarOpen} />
      </div>
    </aside>
  );
}
TSX_EOF
