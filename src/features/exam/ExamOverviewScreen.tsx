import { useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { ArrowLeft, Edit3, Eye, EyeOff, Play, BookOpen, Download } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
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

  const handleExportTxt = () => {
    if (!exam) return;
    const txtContent = questionsToTxtString(exam.questions);
    const blob = new Blob([txtContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${exam.title.replace(/\s+/g, '_')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Đã xuất file TXT!');
  };

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
            onClick={handleExportTxt}
            className="neu-pill px-4 py-2.5 rounded-2xl text-xs font-bold text-ink-strong flex items-center gap-2 hover:bg-white/70 dark:hover:bg-white/10"
            title="Tải xuống file TXT"
          >
            <Download className="w-4 h-4" />
            <span>Xuất TXT</span>
          </button>

          <button
            onClick={() => navigate(`/subjects/${subjectId}/exams/${examId}/edit`)}
            className="neu-pill px-4 py-2.5 rounded-2xl text-xs font-bold text-ink-strong flex items-center gap-2 hover:bg-white/70 dark:hover:bg-white/10"
          >
            <Edit3 className="w-4 h-4" />
            <span>Sửa đề</span>
          </button>

          <button
            onClick={() => setShowQuizConfig(true)}
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

      <QuizSetupDialog 
        open={showQuizConfig} 
        examId={exam.title} 
        maxQuestions={exam.questions.length}
        onClose={() => setShowQuizConfig(false)}
        onStart={(count, randomize) => {
          setShowQuizConfig(false);
          // Gắn state tạm thời qua URL params hoặc sessionStorage nếu cần, 
          // nhưng đơn giản nhất là truyền qua query string để Hook useQuiz nhận diện
          navigate(`/subjects/${subjectId}/exams/${examId}/quiz?count=${count}&randomize=${randomize}`);
        }}
      />
    </div>
  );
}
