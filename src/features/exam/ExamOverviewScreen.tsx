import { useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { ArrowLeft, Edit3, Eye, EyeOff, Play, Download } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { save } from '@tauri-apps/plugin-dialog';
import { writeTextFile } from '@tauri-apps/plugin-fs';
import { examGet } from '@/lib/tauri/commands';
import { useSubjects } from '@/hooks/useSubjects';
import { QuestionCardPreview } from './QuestionCardPreview';
import { QuizSetupDialog } from '../quiz/QuizSetupDialog';
import { questionsToTxtString } from '../import/serialize';
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
  const [showQuizConfig, setShowQuizConfig] = useState(false);

  const subject = subjects?.find(s => s.id === subjectId);
  const subjectColor = subject?.color || 'var(--ink-800)';

  const handleExportTxt = async () => {
    if (!exam) return;
    const txtContent = questionsToTxtString(exam.questions);
    const defaultName = `${exam.title.replace(/\s+/g, '_')}.txt`;
    try {
      const filePath = await save({ defaultPath: defaultName, filters: [{ name: 'Text File', extensions: ['txt'] }] });
      if (filePath) {
        await writeTextFile(filePath, txtContent);
        showToast('Đã xuất file TXT thành công!');
      }
    } catch { showToast('Lỗi khi lưu file.'); }
  };

  if (isLoading) return <div className="p-8 text-center text-sm text-slate-500">Đang tải...</div>;
  if (isError || !exam) return <div className="p-8 text-center text-sm text-rose-500">Không tìm thấy bộ đề.</div>;

  return (
    // Bọc toàn bộ trong flex-col h-full
    <div className="flex flex-col h-full animate-fade-in">
      {/* Header cố định */}
      <div className="neu-card rounded-[26px] p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-5 shrink-0 mb-6">
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
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button onClick={() => setShowAnswers(prev => !prev)} className={`neu-pill px-4 py-2.5 rounded-2xl flex items-center gap-3 text-xs font-bold transition-all ${showAnswers ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-400'}`}>
            {showAnswers ? <Eye className="w-4 h-4 text-emerald-600" /> : <EyeOff className="w-4 h-4 text-slate-400" />}
            <span>Hiện đáp án</span>
          </button>
          <button onClick={handleExportTxt} className="neu-pill px-4 py-2.5 rounded-2xl text-xs font-bold text-ink-strong flex items-center gap-2 hover:bg-white/70 dark:hover:bg-white/10">
            <Download className="w-4 h-4" /> Xuất TXT
          </button>
          <button onClick={() => navigate(`/subjects/${subjectId}/exams/${examId}/edit`)} className="neu-pill px-4 py-2.5 rounded-2xl text-xs font-bold text-ink-strong flex items-center gap-2 hover:bg-white/70 dark:hover:bg-white/10">
            <Edit3 className="w-4 h-4" /> Sửa đề
          </button>
          <button onClick={() => setShowQuizConfig(true)} className="neu-dark-btn px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2">
            <Play className="w-4 h-4 fill-current" /> Làm bài
          </button>
        </div>
      </div>

      {/* Danh sách câu hỏi (Vùng cuộn) */}
      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar pr-2">
        <div className="space-y-4 pb-4">
          {exam.questions.map((q, idx) => (
            <QuestionCardPreview key={q.id || idx} index={idx} question={q} showAnswer={showAnswers} />
          ))}
        </div>
      </div>

      <QuizSetupDialog 
        open={showQuizConfig} 
        examId={exam.title} 
        maxQuestions={exam.questions.length}
        onClose={() => setShowQuizConfig(false)}
        onStart={(count, randomize, mode) => {
          setShowQuizConfig(false);
          navigate(`/subjects/${subjectId}/exams/${examId}/quiz?count=${count}&randomize=${randomize}&mode=${mode}`);
        }}
      />
    </div>
  );
}
