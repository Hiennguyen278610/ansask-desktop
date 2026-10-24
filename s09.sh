#!/bin/bash
set -e

# ==========================================
# 1. CẬP NHẬT HOOK (MẶC ĐỊNH TXT, FIX SCROLL)
# ==========================================
python3 - << 'PYEOF'
p = 'src/hooks/useExamEditor.ts'
s = open(p).read()
s = s.replace("useState<'txt' | 'json'>('json')", "useState<'txt' | 'json'>('txt')")
s = s.replace("questionsToJsonString(res.questions)", "questionsToTxtString(res.questions)")
s = s.replace("questionsToJsonString(initial)", "questionsToTxtString(initial)")
open(p, 'w').write(s)
PYEOF

# ==========================================
# 2. SỬA GIAO DIỆN EDITOR (SWITCH BUTTON, SCROLL, BỎ PB-20)
# ==========================================
cat > src/features/exam/ExamEditorScreen.tsx << 'TSX_EOF'
import { useParams, useNavigate } from 'react-router';
import { ArrowLeft, Save, Plus, List } from 'lucide-react';
import { useState, useRef } from 'react';
import { useExamEditor } from '@/hooks/useExamEditor';
import { QuestionCardEditor } from './QuestionCardEditor';
import { SyntaxHighlightedTextarea } from './SyntaxHighlightedTextarea';
import { QuestionNavigatorDialog } from '@/features/quiz/QuestionNavigatorDialog';

export function ExamEditorScreen() {
  const { subjectId, examId } = useParams();
  const navigate = useNavigate();
  const ed = useExamEditor(examId, subjectId);
  const [showNav, setShowNav] = useState(false);
  const questionRefs = useRef<Record<string, HTMLDivElement>>({});

  if (ed.isLoading) return <div className="p-8 text-center text-sm text-slate-500">Đang tải đề...</div>;

  const handleJump = (idx: number) => {
    const qId = `q-idx-${idx}`;
    questionRefs.current[qId]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const navQuestions = ed.questions.map((q, i) => ({ id: `q-idx-${i}`, ask: q.ask }));

  return (
    <div className="flex-1 flex flex-col animate-fade-in relative min-h-0 h-full">
      {/* Header (cố định) */}
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
          <span className="neu-pill px-3 py-2 rounded-xl text-xs font-bold text-slate-500">{ed.questions.length} câu</span>
          <button onClick={ed.save} className="neu-dark-btn px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2">
            <Save className="w-4 h-4" /> Lưu bộ đề
          </button>
        </div>
      </div>

      {/* Split Pane (chiếm toàn bộ không gian còn lại) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-0">
        {/* Cột trái: Render */}
        <div className="neu-card rounded-[26px] p-5 flex flex-col h-full min-h-0">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200/80 dark:border-slate-700/80 shrink-0">
            <h3 className="font-bold text-sm text-ink-strong">Render • Trực quan</h3>
            <span className="text-[11px] text-slate-400">Cuộn để xem thêm</span>
          </div>
          {/* Vùng cuộn độc lập */}
          <div className="flex-1 overflow-y-auto pr-2 space-y-1 custom-scrollbar">
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
                      ? 'bg-[#262b33] text-white dark:bg-white dark:text-[#262b33] shadow-md' 
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

          {/* Vùng textarea tự co giãn bên trong */}
          <div className="flex-1 min-h-0 relative">
            {ed.format === 'txt' ? (
               <SyntaxHighlightedTextarea value={ed.rawText} onChange={ed.handleRawChange} />
            ) : (
              <textarea
                value={ed.rawText}
                onChange={(e) => ed.handleRawChange(e.target.value)}
                spellCheck={false}
                className="absolute inset-0 w-full h-full p-4 rounded-2xl neu-card-inset font-mono text-xs sm:text-sm leading-relaxed text-ink focus:outline-none resize-none custom-scrollbar"
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
        <span className="bg-ink-strong text-white text-[10px] px-2 py-0.5 rounded-full ml-1">{ed.questions.length}</span>
      </button>

      <QuestionNavigatorDialog open={showNav} questions={navQuestions} onSelect={handleJump} onClose={() => setShowNav(false)} />
    </div>
  );
}
TSX_EOF

# ==========================================
# 3. TẠO QUIZ SETUP DIALOG
# ==========================================
cat > src/features/quiz/QuizSetupDialog.tsx << 'TSX_EOF'
import { useState } from 'react';
import { Dialog } from '@/components/ui/Dialog';
import { Play } from 'lucide-react';

interface Props {
  open: boolean;
  examId: string;
  maxQuestions: number;
  onClose: () => void;
  onStart: (count: number, randomize: boolean) => void;
}

export function QuizSetupDialog({ open, examId, maxQuestions, onClose, onStart }: Props) {
  const [count, setCount] = useState(Math.min(25, maxQuestions));
  const [randomize, setRandomize] = useState(true);

  const handleStart = () => {
    const finalCount = Math.max(1, Math.min(count, 200, maxQuestions));
    onStart(finalCount, randomize);
  };

  return (
    <Dialog open={open} title="Cấu hình Bài kiểm tra" onClose={onClose}
      footer={
        <>
          <button onClick={onClose} className="neu-pill px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600">Đóng</button>
          <button onClick={handleStart} className="neu-dark-btn px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2">
            <Play className="w-4 h-4 fill-current" /> Làm bài ngay
          </button>
        </>
      }>
      <div className="space-y-4">
        <p className="text-xs text-slate-500">Bộ đề: <strong className="text-ink-strong">{examId}</strong> (Có {maxQuestions} câu gốc)</p>
        
        <div>
          <label className="block text-xs font-bold text-ink-strong mb-1.5">Số câu muốn lấy:</label>
          <input
            type="number"
            min="1"
            max="200"
            value={count}
            onChange={(e) => setCount(Number(e.target.value) || 1)}
            className="w-full px-4 py-3 rounded-xl neu-card-inset text-base font-bold text-ink-strong focus:outline-none"
          />
        </div>

        <div>
          <span className="text-xs font-semibold text-slate-400 mb-1.5 block">Chọn nhanh:</span>
          <div className="grid grid-cols-4 gap-2">
            {[25, 32, 40].map(num => (
              <button key={num} onClick={() => setCount(num)}
                className={`py-2 rounded-xl text-xs font-bold transition-all ${count === num ? 'bg-ink-strong text-white shadow-md' : 'neu-pill text-ink hover:bg-white/70 dark:hover:bg-white/10'}`}>
                {num} câu
              </button>
            ))}
            <button onClick={() => setCount(maxQuestions)}
              className={`py-2 rounded-xl text-xs font-bold transition-all ${count === maxQuestions ? 'bg-ink-strong text-white shadow-md' : 'neu-pill text-ink hover:bg-white/70 dark:hover:bg-white/10'}`}>
              Tất cả
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <span className="text-xs font-bold text-ink-strong">Xáo trộn câu hỏi & đáp án</span>
          <button onClick={() => setRandomize(!randomize)} className={`w-10 h-5 rounded-full p-0.5 transition-colors flex items-center ${randomize ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'}`}>
            <div className={`w-4 h-4 rounded-full bg-white shadow transform transition-transform ${randomize ? 'translate-x-5' : 'translate-x-0'}`} />
          </button>
        </div>
      </div>
    </Dialog>
  );
}
TSX_EOF

# ==========================================
# 4. CẬP NHẬT EXAM OVERVIEW (NÚT XUẤT TXT & TÍCH HỢP DIALOG)
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
TSX_EOF

# Cập nhật useQuiz để đọc query params
python3 - << 'PYEOF'
p = 'src/hooks/useQuiz.ts'
s = open(p).read()
s = s.replace(
    'import { quizStart, attemptSubmit, type QuizQuestionDto } from \'@/lib/tauri/commands\';',
    'import { useSearchParams } from \'react-router\';\nimport { quizStart, attemptSubmit, type QuizQuestionDto } from \'@/lib/tauri/commands\';'
)
s = s.replace(
    'export function useQuiz(examId?: string) {\n  const navigate = useNavigate();',
    'export function useQuiz(examId?: string) {\n  const [searchParams] = useSearchParams();\n  const navigate = useNavigate();'
)
s = s.replace(
    'quizStart(examId).then(res => {',
    'const countStr = searchParams.get(\'count\');\n    const randomizeStr = searchParams.get(\'randomize\');\n    const count = countStr ? parseInt(countStr, 10) : undefined;\n    const randomize = randomizeStr ? randomizeStr === \'true\' : undefined;\n    quizStart(examId, count, randomize).then(res => {'
)
open(p, 'w').write(s)
PYEOF

# ==========================================
# 5. CẬP NHẬT EXAM LIST (THÊM NÚT NHẬP BỘ ĐỀ)
# ==========================================
python3 - << 'PYEOF'
p = 'src/features/exam/ExamListScreen.tsx'
s = open(p).read()
s = s.replace(
    'import { Plus, BookOpen, ChevronRight } from \'lucide-react\';',
    'import { Plus, BookOpen, ChevronRight, Upload } from \'lucide-react\';'
)
s = s.replace(
    '''<button onClick={() => navigate(`/subjects/${subjectId}/exams/new`)} className="ml-auto neu-dark-btn px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2">
          <Plus className="w-4 h-4" /> Tạo bộ đề
        </button>''',
    '''<div className="ml-auto flex items-center gap-2">
          <button onClick={() => navigate(`/subjects/${subjectId}/exams/new`)} className="neu-pill px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-white/70 dark:hover:bg-white/10">
            <Upload className="w-4 h-4" /> Nhập bộ đề
          </button>
          <button onClick={() => navigate(`/subjects/${subjectId}/exams/new`)} className="neu-dark-btn px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2">
            <Plus className="w-4 h-4" /> Tạo bộ đề
          </button>
        </div>'''
)
open(p, 'w').write(s)
PYEOF

cd src-tauri && cargo fmt && cd ..
