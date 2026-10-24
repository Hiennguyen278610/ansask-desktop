#!/bin/bash
set -e

# 1. Làm gọn lại QuestionNavigatorDialog (Thêm nút X, chỉnh style)
cat > src/features/quiz/QuestionNavigatorDialog.tsx << 'TSX_EOF'
import { Dialog } from '@/components/ui/Dialog';
import type { QuizQuestionDto } from '@/lib/tauri/commands';

interface Props {
  open: boolean;
  questions: { id: string; ask: string }[] | QuizQuestionDto[];
  answers?: Record<string, string[]>;
  onSelect: (idx: number) => void;
  onClose: () => void;
}

export function QuestionNavigatorDialog({ open, questions, answers = {}, onSelect, onClose }: Props) {
  return (
    <Dialog open={open} title={`Danh sách câu hỏi (${questions.length})`} onClose={onClose}>
      <div className="grid grid-cols-5 gap-2 max-h-[60vh] overflow-y-auto pr-2">
        {questions.map((q, idx) => {
          const answered = (answers[q.id] || []).length > 0;
          return (
            <button key={q.id} onClick={() => { onSelect(idx); onClose(); }}
              className={`py-2 rounded-lg text-sm font-bold transition-all ${answered ? 'bg-emerald-500 text-white shadow-md' : 'neu-pill text-slate-600 hover:bg-white'}`}>
              {idx + 1}
            </button>
          );
        })}
      </div>
    </Dialog>
  );
}
TSX_EOF

# 2. Cập nhật QuizScreen (Bỏ nút ở thanh Sticky, thêm Nút nổi)
cat > src/features/quiz/QuizScreen.tsx << 'TSX_EOF'
import { useState, useRef } from 'react';
import { useParams } from 'react-router';
import { Clock, List, CheckCircle2 } from 'lucide-react';
import { useQuiz } from '@/hooks/useQuiz';
import { QuizQuestionCard } from './QuizQuestionCard';
import { SubmitWarningDialog } from './SubmitWarningDialog';
import { QuestionNavigatorDialog } from './QuestionNavigatorDialog';

export function QuizScreen() {
  const { examId } = useParams();
  const quiz = useQuiz(examId);
  const [showNav, setShowNav] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const questionRefs = useRef<Record<string, HTMLDivElement>>({});

  if (quiz.isLoading) return <div className="p-8 text-center text-sm text-slate-500">Đang chuẩn bị đề thi...</div>;

  const total = quiz.questions.length;
  const answeredCount = Object.values(quiz.answers).filter(a => a.length > 0).length;
  const unansweredIndexes = quiz.questions.map((q, i) => ({ q, i })).filter(({ q }) => !(quiz.answers[q.id]?.length > 0)).map(({ i }) => i);

  const handleJump = (idx: number) => {
    const qId = quiz.questions[idx].id;
    questionRefs.current[qId]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const handleSubmit = () => {
    if (unansweredIndexes.length > 0) setShowWarning(true);
    else quiz.submit();
  };

  return (
    <div className="space-y-6 animate-fade-in relative pb-20">
      {/* Sticky Bar (Đã bỏ nút Danh sách câu) */}
      <div className="neu-card rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 sticky top-2 z-20">
        <div className="flex items-center gap-4">
          <div className="neu-pill px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-bold text-ink-strong">
            <Clock className="w-4 h-4 text-slate-500" />
            <span>{String(Math.floor(quiz.elapsedSec / 60)).padStart(2, '0')}:{String(quiz.elapsedSec % 60).padStart(2, '0')}</span>
          </div>
          <div>
            <p className="text-xs font-bold text-ink-strong">Đã chọn: {answeredCount} / {total} câu</p>
            <div className="w-36 sm:w-48 h-2 rounded-full bg-slate-200 dark:bg-slate-700 mt-1 overflow-hidden">
              <div className="h-full bg-ink-strong transition-all" style={{ width: `${(answeredCount / Math.max(1, total)) * 100}%` }} />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={handleSubmit} disabled={quiz.isSubmitting} className="neu-dark-btn px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" /> {quiz.isSubmitting ? 'Đang nộp...' : 'Nộp bài'}
          </button>
        </div>
      </div>

      {/* Questions */}
      <div className="space-y-4 max-w-4xl mx-auto">
        {quiz.questions.map((q, i) => (
          <div key={q.id} ref={el => { if (el) questionRefs.current[q.id] = el; }}>
            <QuizQuestionCard
              index={i}
              question={q}
              selectedOptionIds={quiz.answers[q.id] || []}
              onToggle={(optId, isMulti) => quiz.toggleAnswer(q.id, optId, isMulti)}
            />
          </div>
        ))}
      </div>

      {/* Nút nổi (FAB) */}
      <button
        onClick={() => setShowNav(true)}
        className="fixed bottom-8 right-8 z-40 neu-shell rounded-full h-14 px-5 flex items-center justify-center gap-2 text-ink-strong font-bold hover:scale-105 transition-transform shadow-[8px_8px_20px_rgba(0,0,0,0.15)] dark:shadow-[8px_8px_20px_rgba(0,0,0,0.5)]"
      >
        <List className="w-5 h-5" />
        <span className="hidden sm:inline">Danh sách câu</span>
        <span className="bg-emerald-500 text-white text-[10px] px-2 py-0.5 rounded-full ml-1">{answeredCount}/{total}</span>
      </button>

      <QuestionNavigatorDialog open={showNav} questions={quiz.questions} answers={quiz.answers} onSelect={handleJump} onClose={() => setShowNav(false)} />
      <SubmitWarningDialog open={showWarning} unansweredIndexes={unansweredIndexes} total={total} onBack={() => setShowWarning(false)} onConfirm={quiz.submit} />
    </div>
  );
}
TSX_EOF

# 3. Cập nhật ExamEditorScreen (Bỏ popover cũ, thêm nút nổi, thêm logic scroll)
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
    const qId = ed.questions[idx].id || `q-idx-${idx}`;
    questionRefs.current[qId]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  return (
    <div className="space-y-5 flex-1 flex flex-col animate-fade-in relative pb-20">
      {/* Header */}
      <div className="neu-card rounded-2xl p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex-1 flex items-center gap-3">
          <button onClick={() => navigate(`/subjects/${subjectId}/exams`)} className="neu-icon-btn w-8 h-8 rounded-xl flex items-center justify-center shrink-0">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <input
            type="text"
            value={ed.title}
            onChange={(e) => ed.setTitle(e.target.value)}
            placeholder="Nhập tên bộ đề (Mặc định: Chưa có tiêu đề)..."
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

      {/* Split Pane */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1">
        {/* Cột trái: Render */}
        <div className="neu-card rounded-[26px] p-5 flex flex-col h-[640px]">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200/80">
            <h3 className="font-bold text-sm text-ink-strong">Render • Trực quan</h3>
            <span className="text-[11px] text-slate-400">Nhấn để sửa trực tiếp</span>
          </div>
          <div className="flex-1 overflow-y-auto pr-1 space-y-1">
            {ed.questions.map((q, i) => (
              <div key={q.id || i} className="py-1" ref={el => { if (el) questionRefs.current[q.id || `q-idx-${i}`] = el; }}>
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
              <div className="h-full flex items-center justify-center text-slate-400 text-sm">Chưa có câu hỏi. Hãy nhấn nút bên dưới.</div>
            )}
            <button onClick={() => ed.insertQuestion(0)} className="w-full py-2 mt-2 border-2 border-dashed border-slate-300 rounded-xl text-xs font-bold text-slate-500 hover:text-ink-strong hover:border-ink-strong transition-colors flex items-center justify-center gap-1">
              <Plus className="w-4 h-4" /> Thêm câu hỏi mới
            </button>
          </div>
        </div>

        {/* Cột phải: Code */}
        <div className="neu-card rounded-[26px] p-5 flex flex-col h-[640px]">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200/80">
            <h3 className="font-bold text-sm text-ink-strong">Editor • Đồng bộ</h3>
            <div className="neu-card-inset p-1 rounded-xl flex items-center gap-1">
              {['txt', 'json'].map(f => (
                <button key={f} onClick={() => ed.handleSwitchFormat(f as 'txt'|'json')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold uppercase transition-all ${ed.format === f ? 'bg-ink-strong text-white shadow' : 'text-slate-500 hover:text-ink-strong'}`}>
                  {f}
                </button>
              ))}
            </div>
          </div>
          
          {ed.parseError && (
            <div className="mb-2 px-3 py-2 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-600 font-medium">
              {ed.parseError}
            </div>
          )}

          {ed.format === 'txt' ? (
             <SyntaxHighlightedTextarea value={ed.rawText} onChange={ed.handleRawChange} />
          ) : (
            <textarea
              value={ed.rawText}
              onChange={(e) => ed.handleRawChange(e.target.value)}
              spellCheck={false}
              className="flex-1 w-full p-4 rounded-2xl neu-card-inset font-mono text-xs sm:text-sm leading-relaxed text-ink focus:outline-none resize-none"
            />
          )}
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

      <QuestionNavigatorDialog 
        open={showNav} 
        questions={ed.questions} 
        onSelect={handleJump} 
        onClose={() => setShowNav(false)} 
      />
    </div>
  );
}
TSX_EOF

# 4. Cập nhật ResultScreen (Thêm nút nổi)
cat > src/features/quiz/ResultScreen.tsx << 'TSX_EOF'
import { useParams, useNavigate } from 'react-router';
import { ArrowLeft, CheckCircle2, XCircle, List } from 'lucide-react';
import { useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { attemptReview } from '@/lib/tauri/commands';
import { QuestionNavigatorDialog } from './QuestionNavigatorDialog';

export function ResultScreen() {
  const { attemptId } = useParams();
  const navigate = useNavigate();
  const [showNav, setShowNav] = useState(false);
  const questionRefs = useRef<Record<string, HTMLDivElement>>({});

  const { data: review, isLoading } = useQuery({
    queryKey: ['attempt', attemptId],
    queryFn: () => attemptReview(attemptId!),
    enabled: !!attemptId,
  });

  if (isLoading) return <div className="p-8 text-center text-sm text-slate-500">Đang tải kết quả...</div>;
  if (!review) return <div className="p-8 text-center text-rose-500">Không tìm thấy kết quả.</div>;

  const handleJump = (idx: number) => {
    const qId = review.questions[idx].questionId;
    questionRefs.current[qId]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  // Convert questions to format cho Navigator
  const navQuestions = review.questions.map(q => ({ id: q.questionId, ask: q.questionText }));

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-fade-in pb-20 relative">
      <div className="neu-card rounded-[28px] p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="w-24 h-24 rounded-full neu-pill flex flex-col items-center justify-center border-4 border-ink-strong shrink-0">
            <span className="text-2xl font-bold text-ink-strong">{review.score}</span>
            <span className="text-[10px] font-bold text-slate-400 uppercase">Điểm / 10</span>
          </div>
          <div>
            <span className="neu-pill px-3 py-1 rounded-full text-xs font-bold text-emerald-700">Hoàn thành bài kiểm tra</span>
            <h2 className="text-xl font-bold text-ink-strong mt-2">{review.examTitle}</h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Đúng <strong className="text-ink-strong">{review.correctCount}/{review.totalQuestions}</strong> câu
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={() => navigate(`/subjects/${review.subjectId}/exams/${review.examId}`)} className="neu-pill px-4 py-2.5 rounded-xl text-xs font-bold text-ink-strong flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" /> Về tổng quan đề
          </button>
        </div>
      </div>

      <h3 className="font-bold text-base text-ink-strong mt-8 mb-4">Chi tiết đáp án bài làm</h3>
      <div className="space-y-4">
        {review.questions.map((q, idx) => (
          <div key={q.questionId} className="neu-card-inset p-5 rounded-2xl" ref={el => { if (el) questionRefs.current[q.questionId] = el; }}>
            <div className="flex items-start gap-3 mb-4">
              <span className={`px-3 py-1 rounded-xl text-xs font-bold shrink-0 mt-0.5 ${q.isCorrect ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>Câu {idx + 1}</span>
              <h4 className="text-ink-strong font-semibold text-sm flex-1">{q.questionText}</h4>
            </div>
            <div className="space-y-2">
              {q.optionOrder.map((optId, oIdx) => {
                const opt = q.optionsSnapshot.find(o => o.id === optId);
                if (!opt) return null;
                const isCorrect = q.correctOptionIds.includes(optId);
                const isSelected = q.selectedOptionIds.includes(optId);
                
                let rowStyle = 'bg-transparent border-slate-200 dark:border-slate-600';
                if (isCorrect) rowStyle = 'bg-emerald-50/90 dark:bg-emerald-900/20 border-emerald-400';
                else if (isSelected) rowStyle = 'bg-rose-50/90 dark:bg-rose-900/20 border-rose-400';

                return (
                  <div key={optId} className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl border ${rowStyle}`}>
                    <span className="text-xs font-bold text-slate-400 w-5">{String.fromCharCode(65 + oIdx)}.</span>
                    <div className="flex-1 text-sm text-ink">{opt.text}</div>
                    {isCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                    {isSelected && !isCorrect && <XCircle className="w-4 h-4 text-rose-600" />}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Nút nổi (FAB) */}
      <button
        onClick={() => setShowNav(true)}
        className="fixed bottom-8 right-8 z-40 neu-shell rounded-full h-14 px-5 flex items-center justify-center gap-2 text-ink-strong font-bold hover:scale-105 transition-transform shadow-[8px_8px_20px_rgba(0,0,0,0.15)] dark:shadow-[8px_8px_20px_rgba(0,0,0,0.5)]"
      >
        <List className="w-5 h-5" />
        <span className="hidden sm:inline">Danh sách câu</span>
        <span className="bg-ink-strong text-white text-[10px] px-2 py-0.5 rounded-full ml-1">{review.totalQuestions}</span>
      </button>

      <QuestionNavigatorDialog 
        open={showNav} 
        questions={navQuestions} 
        onSelect={handleJump} 
        onClose={() => setShowNav(false)} 
      />
    </div>
  );
}
TSX_EOF
