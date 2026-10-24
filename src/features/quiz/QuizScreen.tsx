import { useState, useRef } from 'react';
import { useParams } from 'react-router';
import { Clock, List, CheckCircle2, ChevronRight, XCircle, Send } from 'lucide-react';
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
  if (quiz.questions.length === 0) return <div className="p-8 text-center text-rose-500">Không có câu hỏi nào!</div>;

  const total = quiz.questions.length;
  const answeredCount = Object.values(quiz.answers).filter(a => a.length > 0).length;
  const unansweredIndexes = quiz.questions.map((q, i) => ({ q, i })).filter(({ q }) => !(quiz.answers[q.id]?.length > 0)).map(({ i }) => i);

  const handleJump = (idx: number) => {
    if (quiz.mode === 'stream') {
      quiz.setCurrentIdx(idx);
    } else {
      const qId = quiz.questions[idx].id;
      questionRefs.current[qId]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const handleSubmit = () => {
    if (unansweredIndexes.length > 0) setShowWarning(true);
    else quiz.submit();
  };

  // ==========================================
  // GIAO DIỆN STREAM MODE (FLASHCARD)
  // ==========================================
  if (quiz.mode === 'stream') {
    const q = quiz.questions[quiz.currentIdx];
    const isChecked = quiz.checkedAnswers[q.id];
    const isCorrect = isChecked === true;
    const hasSelected = (quiz.answers[q.id] || []).length > 0;

    return (
      <div className="flex flex-col h-full min-h-0 animate-fade-in relative max-w-3xl mx-auto w-full">
        <div className="neu-card rounded-2xl p-4 flex items-center justify-between gap-4 shrink-0 mb-4">
          <div className="flex items-center gap-4">
            <div className="neu-pill px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-bold text-ink-strong">
              <Clock className="w-4 h-4 text-slate-500" />
              <span>{String(Math.floor(quiz.elapsedSec / 60)).padStart(2, '0')}:{String(quiz.elapsedSec % 60).padStart(2, '0')}</span>
            </div>
            <p className="text-xs font-bold text-ink-strong">Câu {quiz.currentIdx + 1} / {total}</p>
          </div>
          <button onClick={() => setShowNav(true)} className="neu-pill px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5">
            <List className="w-4 h-4" /> Danh sách
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar pb-4 min-h-0">
          <QuizQuestionCard
            index={quiz.currentIdx}
            question={q}
            selectedOptionIds={quiz.answers[q.id] || []}
            onToggle={(optId, isMulti) => quiz.toggleAnswer(q.id, optId, isMulti)}
          />
        </div>

        <div className="neu-card rounded-2xl p-4 flex justify-between items-center shrink-0">
          <div>
            {isChecked && isCorrect && <span className="text-emerald-500 font-bold flex items-center gap-1"><CheckCircle2 className="w-4 h-4"/> Chính xác!</span>}
            {isChecked && !isCorrect && <span className="text-rose-500 font-bold flex items-center gap-1"><XCircle className="w-4 h-4"/> Sai rồi, thử lại lần nữa nhé!</span>}
          </div>
          <div className="flex gap-2">
            {!isChecked ? (
              <button onClick={() => quiz.checkStreamAnswer(q.id)} disabled={!hasSelected} className="neu-dark-btn px-6 py-2.5 rounded-xl text-sm font-bold disabled:opacity-50">
                Xác nhận
              </button>
            ) : isCorrect ? (
              <button 
                onClick={() => {
                  if (quiz.currentIdx < total - 1) quiz.setCurrentIdx(prev => prev + 1);
                  else quiz.submit();
                }} 
                className="neu-dark-btn px-6 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2"
              >
                {quiz.currentIdx < total - 1 ? 'Câu tiếp theo' : 'Hoàn thành'} <ChevronRight className="w-4 h-4"/>
              </button>
            ) : (
              <>
                <button onClick={() => quiz.submit()} className="neu-pill px-4 py-2.5 rounded-xl text-xs font-bold text-rose-600 flex items-center gap-2">
                  <Send className="w-4 h-4" /> Nộp bài
                </button>
                <button onClick={() => quiz.retryStreamAnswer(q.id)} className="neu-dark-btn px-6 py-2.5 rounded-xl text-sm font-bold">
                  Thử lại
                </button>
              </>
            )}
          </div>
        </div>

        <QuestionNavigatorDialog open={showNav} questions={quiz.questions} answers={quiz.answers} onSelect={handleJump} onClose={() => setShowNav(false)} />
      </div>
    );
  }

  // ==========================================
  // GIAO DIỆN THI THƯỜNG (NORMAL MODE)
  // ==========================================
  return (
    <div className="flex flex-col h-full min-h-0 animate-fade-in relative">
      <div className="neu-card rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 shrink-0 mb-4">
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

      <div className="flex-1 overflow-y-auto custom-scrollbar pb-20 min-h-0">
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
      </div>

      <button onClick={() => setShowNav(true)} className="fixed bottom-8 right-8 z-40 neu-shell rounded-full h-14 px-5 flex items-center justify-center gap-2 text-ink-strong font-bold hover:scale-105 transition-transform shadow-[8px_8px_20px_rgba(0,0,0,0.15)] dark:shadow-[8px_8px_20px_rgba(0,0,0,0.5)]">
        <List className="w-5 h-5" /><span className="hidden sm:inline">Danh sách</span><span className="bg-emerald-500 text-white text-[10px] px-2 py-0.5 rounded-full ml-1">{answeredCount}/{total}</span>
      </button>

      <QuestionNavigatorDialog open={showNav} questions={quiz.questions} answers={quiz.answers} onSelect={handleJump} onClose={() => setShowNav(false)} />
      <SubmitWarningDialog open={showWarning} unansweredIndexes={unansweredIndexes} total={total} onBack={() => setShowWarning(false)} onConfirm={() => quiz.submit()} />
    </div>
  );
}
