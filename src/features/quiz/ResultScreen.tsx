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
