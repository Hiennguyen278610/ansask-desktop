#!/bin/bash
set -e

# ==========================================
# 1. SỬA LAYOUT EXAM EDITOR (KHUNG KHÔNG BỊ MẤT)
# ==========================================
cat > src/features/exam/ExamEditorScreen.tsx << 'TSX_EOF'
import { useParams, useNavigate, useLocation } from 'react-router';
import { ArrowLeft, Save, Plus, List, Upload } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useExamEditor } from '@/hooks/useExamEditor';
import { QuestionCardEditor } from './QuestionCardEditor';
import { SyntaxHighlightedTextarea } from './SyntaxHighlightedTextarea';
import { QuestionNavigatorDialog } from '@/features/quiz/QuestionNavigatorDialog';
import { useUiStore } from '@/stores/uiStore';

export function ExamEditorScreen() {
  const { subjectId, examId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const showToast = useUiStore(s => s.showToast);

  const ed = useExamEditor(examId, subjectId);
  const [showNav, setShowNav] = useState(false);
  const questionRefs = useRef<Record<string, HTMLDivElement>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Xử lý nếu có file được truyền từ màn hình danh sách
  useEffect(() => {
    if (location.state?.importText) {
      ed.handleRawChange(location.state.importText);
      // Xoá state để tránh load lại khi F5
      window.history.replaceState({}, document.title);
    }
  }, [location.state, ed]);

  if (ed.isLoading) return <div className="p-8 text-center text-sm text-slate-500">Đang tải đề...</div>;

  const handleJump = (idx: number) => {
    const qId = `q-idx-${idx}`;
    questionRefs.current[qId]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const navQuestions = ed.questions.map((q, i) => ({ id: `q-idx-${i}`, ask: q.ask }));

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      ed.handleRawChange(content);
      // Tự động chuyển tab dựa vào đuôi file
      const isJson = file.name.endsWith('.json');
      ed.handleSwitchFormat(isJson ? 'json' : 'txt');
      showToast(`Đã tải nội dung từ ${file.name}`);
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset input
  };

  return (
    // Cấu trúc Flexbox chuẩn: h-full và min-h-0 để không bị tràn
    <div className="flex flex-col flex-1 h-full min-h-0 animate-fade-in relative">
      {/* Header */}
      <div className="neu-card rounded-2xl p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0 mb-5">
        <div className="flex-1 flex items-center gap-3">
          <button onClick={() => navigate(`/subjects/${subjectId}/exams`)} className="neu-icon-btn w-8 h-8 rounded-xl flex items-center justify-center shrink-0">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <input
            type="text"
            value={ed.title}
            onChange={(e) => ed.setTitle(e.target.value)}
            placeholder="Nhập tên bộ đề..."
            className="w-full px-4 py-2 rounded-xl neu-card-inset text-sm font-bold text-ink focus:outline-none"
          />
        </div>
        <div className="flex items-center gap-2.5 justify-end">
          {/* Nút Import File */}
          <input type="file" accept=".txt,.json" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
          <button onClick={() => fileInputRef.current?.click()} className="neu-pill px-3 py-2 rounded-xl text-xs font-bold text-ink flex items-center gap-2 hover:bg-white/70 dark:hover:bg-white/10" title="Nhập từ file">
            <Upload className="w-4 h-4" /> Nhập File
          </button>
          
          <span className="neu-pill px-3 py-2 rounded-xl text-xs font-bold text-slate-500">{ed.questions.length} câu</span>
          <button onClick={ed.save} className="neu-dark-btn px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2">
            <Save className="w-4 h-4" /> Lưu bộ đề
          </button>
        </div>
      </div>

      {/* Split Pane */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-0">
        {/* Cột trái: Render */}
        <div className="neu-card rounded-[26px] p-5 flex flex-col h-full min-h-0">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200/80 dark:border-slate-700/80 shrink-0">
            <h3 className="font-bold text-sm text-ink-strong">Render • Trực quan</h3>
            <span className="text-[11px] text-slate-400">Cuộn để xem thêm</span>
          </div>
          <div className="flex-1 overflow-y-auto pr-2 space-y-1 custom-scrollbar min-h-0">
            {ed.questions.map((q, i) => (
              <div key={i} className="py-1" ref={el => { if (el) questionRefs.current[`q-idx-${i}`] = el; }}>
                <QuestionCardEditor
                  index={i}
                  question={q}
                  onUpdate={(updated) => ed.updateQuestion(i, updated)}
                  onDelete={() => ed.deleteQuestion(i)}
                />
                <div className="group py-2 flex items-center justify-center relative cursor-pointer" onClick={() => ed.insertQuestion(i + 1)}>
                  <div className="w-full border-t border-dashed border-transparent group-hover:border-slate-300 transition-colors" />
                  <button className="opacity-0 group-hover:opacity-100 absolute bg-ink-strong text-white text-[11px] font-bold px-3 py-1 rounded-full flex items-center gap-1 shadow-md">
                    <Plus className="w-3 h-3" /> Chèn câu mới
                  </button>
                </div>
              </div>
            ))}
            {ed.questions.length === 0 && (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm">Chưa có câu hỏi.</div>
            )}
            <button onClick={() => ed.insertQuestion(0)} className="w-full py-2 mt-2 border-2 border-dashed border-slate-300 rounded-xl text-xs font-bold text-slate-500 hover:text-ink-strong hover:border-ink-strong transition-colors flex items-center justify-center gap-1 shrink-0">
              <Plus className="w-4 h-4" /> Thêm câu hỏi
            </button>
          </div>
        </div>

        {/* Cột phải: Code */}
        <div className="neu-card rounded-[26px] p-5 flex flex-col h-full min-h-0">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200/80 dark:border-slate-700/80 shrink-0">
            <h3 className="font-bold text-sm text-ink-strong">Editor • Đồng bộ</h3>
            <div className="neu-card-inset p-1 rounded-xl flex items-center gap-1">
              {['txt', 'json'].map(f => (
                <button key={f} onClick={() => ed.handleSwitchFormat(f as 'txt'|'json')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold uppercase transition-all ${
                    ed.format === f 
                      ? 'bg-ink-strong text-app shadow-md' 
                      : 'text-slate-500 hover:text-ink-strong'
                  }`}>
                  {f}
                </button>
              ))}
            </div>
          </div>
          
          {ed.parseError && (
            <div className="mb-2 px-3 py-2 bg-rose-50 dark:bg-rose-900/30 border border-rose-200 dark:border-rose-800 rounded-xl text-xs text-rose-600 dark:text-rose-400 font-medium shrink-0">
              {ed.parseError}
            </div>
          )}

          {/* Vùng Textarea chiếm toàn bộ không gian còn lại */}
          <div className="flex-1 min-h-0 relative flex flex-col">
            {ed.format === 'txt' ? (
               <SyntaxHighlightedTextarea value={ed.rawText} onChange={ed.handleRawChange} />
            ) : (
              <textarea
                value={ed.rawText}
                onChange={(e) => ed.handleRawChange(e.target.value)}
                spellCheck={false}
                className="w-full h-full p-4 rounded-2xl neu-card-inset font-mono text-xs sm:text-sm leading-relaxed text-ink focus:outline-none resize-none custom-scrollbar"
              />
            )}
          </div>
        </div>
      </div>

      {/* Nút nổi (FAB) */}
      <button
        onClick={() => setShowNav(true)}
        className="fixed bottom-8 right-8 z-40 neu-shell rounded-full h-14 px-5 flex items-center justify-center gap-2 text-ink-strong font-bold hover:scale-105 transition-transform shadow-[8px_8px_20px_rgba(0,0,0,0.15)] dark:shadow-[8px_8px_20px_rgba(0,0,0,0.5)]"
      >
        <List className="w-5 h-5" />
        <span className="hidden sm:inline">Danh sách câu</span>
        <span className="bg-ink-strong text-app text-[10px] px-2 py-0.5 rounded-full ml-1">{ed.questions.length}</span>
      </button>

      <QuestionNavigatorDialog open={showNav} questions={navQuestions} onSelect={handleJump} onClose={() => setShowNav(false)} />
    </div>
  );
}
TSX_EOF

# ==========================================
# 2. CẬP NHẬT EXPORT FILE (EXAM OVERVIEW)
# ==========================================
cat > src/features/exam/ExamOverviewScreen.tsx << 'TSX_EOF'
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

  const handleExportTxt = async () => {
    if (!exam) return;
    const txtContent = questionsToTxtString(exam.questions);
    const defaultName = `${exam.title.replace(/\s+/g, '_')}.txt`;

    // Thử dùng File System Access API (Native Save Dialog)
    if ('showSaveFilePicker' in window) {
      try {
        const handle = await (window as any).showSaveFilePicker({
          suggestedName: defaultName,
          types: [{ description: 'Text File', accept: { 'text/plain': ['.txt'] } }],
        });
        const writable = await handle.createWritable();
        await writable.write(txtContent);
        await writable.close();
        showToast('Đã xuất file TXT thành công!');
        return;
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          showToast('Lỗi khi lưu file, đang dùng cách tải xuống...');
        } else {
          return; // Người dùng bấm Cancel
        }
      }
    }

    // Fallback cho Webview không hỗ trợ
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

      {/* Questions List */}
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
TSX_EOF

# ==========================================
# 3. CẬP NHẬT NÚT IMPORT Ở EXAM LIST (ĐỌC FILE)
# ==========================================
cat > src/features/exam/ExamListScreen.tsx << 'TSX_EOF'
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
TSX_EOF

cd src-tauri && cargo fmt && cd ..
