#!/bin/bash
set -e

# 1. Tạo Component hiển thị câu hỏi dạng Preview (chỉ đọc)
cat > src/features/exam/QuestionCardPreview.tsx << 'TSX_EOF'
import type { QuestionDto } from '@/lib/tauri/commands';

interface Props {
  index: number;
  question: QuestionDto;
  showAnswer: boolean;
}

export function QuestionCardPreview({ index, question, showAnswer }: Props) {
  return (
    <div className="neu-card-inset p-5 rounded-2xl transition-all">
      <div className="flex items-start gap-3 mb-4">
        <span className="neu-pill px-3 py-1 rounded-xl text-xs font-bold text-ink-strong shrink-0 mt-0.5">
          Câu {index + 1}
        </span>
        <h4 className="text-ink-strong font-semibold text-sm sm:text-base leading-relaxed flex-1">
          {question.ask || '(Câu hỏi trống)'}
        </h4>
      </div>

      <div className="space-y-2.5">
        {question.options.map((opt, oIdx) => {
          const isCorrectShown = showAnswer && opt.isCorrect;
          let rowStyle = 'bg-[#eef2f6]/70 dark:bg-transparent border-white/70 dark:border-slate-600';
          if (isCorrectShown) {
            rowStyle = 'bg-emerald-50/90 dark:bg-emerald-900/20 border-emerald-400/80 dark:border-emerald-600 text-emerald-950 dark:text-emerald-300 font-semibold';
          }

          return (
            <div key={opt.id || oIdx} className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl border transition-all ${rowStyle}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center border transition-all ${isCorrectShown ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-slate-400 bg-transparent shadow-inner'}`}>
                {isCorrectShown && <span className="w-2 h-2 rounded-full bg-white" />}
              </span>
              <span className="text-xs font-bold text-slate-400 w-5 shrink-0">{String.fromCharCode(65 + oIdx)}.</span>
              <div className="flex-1 text-sm text-ink">{opt.text}</div>
              {isCorrectShown && (
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-lg bg-emerald-600 text-white shrink-0">
                  Đáp án đúng
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
TSX_EOF

# 2. Tạo màn hình ExamOverviewScreen
cat > src/features/exam/ExamOverviewScreen.tsx << 'TSX_EOF'
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { ArrowLeft, Edit3, Eye, EyeOff, Play, BookOpen } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { examGet } from '@/lib/tauri/commands';
import { useSubjects } from '@/hooks/useSubjects';
import { QuestionCardPreview } from './QuestionCardPreview';
import { useUiStore } from '@/stores/uiStore';

export function ExamOverviewScreen() {
  const { subjectId, examId } = useParams();
  const navigate = useNavigate();
  const showToast = useUiStore(s => s.showToast);
  
  const { data: subjects } = useSubjects();
  const { data: exam, isLoading, isError } = useQuery({
    queryKey: ['exam', examId],
    queryFn: () => examGet(examId!),
    enabled: !!examId,
  });

  const [showAnswers, setShowAnswers] = useState(false);

  const subject = subjects?.find(s => s.id === subjectId);
  const subjectColor = subject?.color || 'var(--ink-800)';

  if (isLoading) return <div className="p-8 text-center text-sm text-slate-500">Đang tải tổng quan bộ đề...</div>;
  if (isError || !exam) return <div className="p-8 text-center text-sm text-rose-500">Không tìm thấy bộ đề này.</div>;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="neu-card rounded-[26px] p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        <div className="space-y-2">
          <div className="flex items-center gap-2.5 flex-wrap">
            <button onClick={() => navigate(`/subjects/${subjectId}/exams`)} className="text-slate-500 hover:text-ink-strong flex items-center gap-1 text-xs font-bold">
              <ArrowLeft className="w-4 h-4" /> Quay lại
            </button>
            <span className="px-3 py-1 rounded-full text-xs font-bold text-white" style={{ backgroundColor: subjectColor }}>
              {subject?.name}
            </span>
            <span className="neu-pill px-3 py-1 rounded-full text-xs font-bold text-ink-strong">
              Tổng số: {exam.questions.length} câu
            </span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-ink-strong">{exam.title}</h2>
          <p className="text-xs text-slate-400">Mặc định đáp án được ẩn để bạn tự ôn tập. Bật công tắc "Hiện đáp án" nếu muốn tra cứu nhanh.</p>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setShowAnswers(prev => !prev)}
            className={`neu-pill px-4 py-2.5 rounded-2xl flex items-center gap-3 text-xs font-bold transition-all ${showAnswers ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-400'}`}
          >
            {showAnswers ? <Eye className="w-4 h-4 text-emerald-600" /> : <EyeOff className="w-4 h-4 text-slate-400" />}
            <span>Hiện đáp án</span>
            <div className={`w-10 h-5 rounded-full p-0.5 transition-colors flex items-center ${showAnswers ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'}`}>
              <div className={`w-4 h-4 rounded-full bg-white shadow transform transition-transform ${showAnswers ? 'translate-x-5' : 'translate-x-0'}`} />
            </div>
          </button>

          <button
            onClick={() => navigate(`/subjects/${subjectId}/exams/${examId}/edit`)}
            className="neu-pill px-4 py-2.5 rounded-2xl text-xs font-bold text-ink-strong flex items-center gap-2 hover:bg-white/70 dark:hover:bg-white/10"
          >
            <Edit3 className="w-4 h-4" />
            <span>Sửa đề</span>
          </button>

          <button
            onClick={() => showToast('Tính năng Làm bài kiểm tra sẽ có ở Sprint 03!')}
            className="neu-dark-btn px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Làm bài kiểm tra</span>
          </button>
        </div>
      </div>

      {/* Questions List */}
      <div className="space-y-4">
        {exam.questions.map((q, idx) => (
          <QuestionCardPreview key={q.id || idx} index={idx} question={q} showAnswer={showAnswers} />
        ))}
        {exam.questions.length === 0 && (
          <div className="neu-card rounded-3xl p-12 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl neu-pill mx-auto flex items-center justify-center text-slate-400"><BookOpen className="w-6 h-6" /></div>
            <h3 className="font-bold text-base text-ink-strong">Bộ đề chưa có câu hỏi nào</h3>
            <button onClick={() => navigate(`/subjects/${subjectId}/exams/${examId}/edit`)} className="neu-dark-btn px-5 py-2.5 rounded-xl text-xs font-bold inline-flex items-center gap-2">
              <Edit3 className="w-4 h-4" /> Vào sửa đề
            </button>
          </div>
        )}
      </div>
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
import { GuideScreen } from '@/features/ai-guide/GuideScreen';

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
      { path: 'guide', element: <GuideScreen /> },
      { path: 'trash', element: <div className="p-8 text-center text-slate-500">Thùng rác (Sprint 05)</div> },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
]);
TSX_EOF

# 4. Sửa ExamListScreen: Bấm vào card sẽ ra Tổng quan thay vì Editor
sed -i 's|onOpen={() => navigate(`/subjects/${subjectId}/exams/${ex.id}/edit`)}|onOpen={() => navigate(`/subjects/${subjectId}/exams/${ex.id}`)}|' src/features/exam/ExamListScreen.tsx

