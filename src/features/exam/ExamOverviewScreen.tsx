import { useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { ArrowLeft, Edit3, Eye, EyeOff, Play, Download } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { examGet } from '@/lib/tauri/commands';
import { useSubjects } from '@/hooks/useSubjects';
import { QuestionCardPreview } from './QuestionCardPreview';
import { QuizSetupDialog } from '../quiz/QuizSetupDialog';
import { questionsToTxtString } from '../import/serialize';
import { useUiStore } from '@/stores/uiStore';

// Định nghĩa kiểu cho File System Access API để tránh dùng 'any'
interface SaveFilePickerOptions {
  suggestedName?: string;
  types?: { description: string; accept: Record<string, string[]> }[];
}
interface FileSystemWritableFileStream extends WritableStream {
  write(data: string): Promise<void>;
  close(): Promise<void>;
}
interface FileSystemFileHandle {
  createWritable(): Promise<FileSystemWritableFileStream>;
}
declare global {
  interface Window {
    showSaveFilePicker?: (options?: SaveFilePickerOptions) => Promise<FileSystemFileHandle>;
  }
}

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

    if (window.showSaveFilePicker) {
      try {
        const handle = await window.showSaveFilePicker({
          suggestedName: defaultName,
          types: [{ description: 'Text File', accept: { 'text/plain': ['.txt'] } }],
        });
        const writable = await handle.createWritable();
        await writable.write(txtContent);
        await writable.close();
        showToast('Đã xuất file TXT thành công!');
        return;
      } catch (err: unknown) {
        if (err instanceof Error && err.name !== 'AbortError') {
          showToast('Lỗi khi lưu file, đang dùng cách tải xuống...');
        } else if (err instanceof Error && err.name === 'AbortError') {
          return; // Người dùng bấm Cancel
        }
      }
    }

    // Fallback
    const blob = new Blob([txtContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = defaultName;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Đã xuất file TXT!');
  };

  if (isLoading) return <div className="p-8 text-center text-sm text-slate-500">Đang tải tổng quan bộ đề...</div>;
  if (isError || !exam) return <div className="p-8 text-center text-sm text-rose-500">Không tìm thấy bộ đề này.</div>;

  return (
    <div className="space-y-6 animate-fade-in">
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
        </div>

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
            title="Xuất ra file TXT"
          >
            <Download className="w-4 h-4" /> Xuất TXT
          </button>

          <button
            onClick={() => navigate(`/subjects/${subjectId}/exams/${examId}/edit`)}
            className="neu-pill px-4 py-2.5 rounded-2xl text-xs font-bold text-ink-strong flex items-center gap-2 hover:bg-white/70 dark:hover:bg-white/10"
          >
            <Edit3 className="w-4 h-4" /> Sửa đề
          </button>

          <button
            onClick={() => setShowQuizConfig(true)}
            className="neu-dark-btn px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2"
          >
            <Play className="w-4 h-4 fill-current" /> Làm bài kiểm tra
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {exam.questions.map((q, idx) => (
          <QuestionCardPreview key={q.id || idx} index={idx} question={q} showAnswer={showAnswers} />
        ))}
      </div>

      <QuizSetupDialog 
        open={showQuizConfig} 
        examId={exam.title} 
        maxQuestions={exam.questions.length}
        onClose={() => setShowQuizConfig(false)}
        onStart={(count, randomize) => {
          setShowQuizConfig(false);
          navigate(`/subjects/${subjectId}/exams/${examId}/quiz?count=${count}&randomize=${randomize}`);
        }}
      />
    </div>
  );
}
