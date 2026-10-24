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
