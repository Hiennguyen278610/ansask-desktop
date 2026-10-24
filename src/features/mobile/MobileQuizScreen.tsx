import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { ArrowLeft, CheckCircle2, XCircle } from 'lucide-react';
import { parseTxtToQuestions, parseJsonToQuestions, type ParsedQuestion, type ParsedOption } from '../import/parse';
import { useUiStore } from '@/stores/uiStore';

export function MobileQuizScreen() {
  const location = useLocation();
  const navigate = useNavigate();
  const showToast = useUiStore(s => s.showToast);
  
  const [questions, setQuestions] = useState<ParsedQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOpt, setSelectedOpt] = useState<string | null>(null);
  const [isChecked, setIsChecked] = useState(false);
  const [isAnswerCorrect, setIsAnswerCorrect] = useState(false);

  useEffect(() => {
    const content = location.state?.rawContent;
    const fileName = location.state?.fileName || '';
    
    if (!content) {
      showToast('Không tìm thấy dữ liệu!');
      navigate('/mobile-import');
      return;
    }

    try {
      let parsed: ParsedQuestion[];
      if (fileName.endsWith('.json')) {
        parsed = parseJsonToQuestions(content);
      } else {
        parsed = parseTxtToQuestions(content);
      }
      setQuestions(parsed);
    } catch {
      showToast('File không đúng định dạng!');
      navigate('/mobile-import');
    }
  }, [location.state, navigate, showToast]);

  if (questions.length === 0) return null;

  const q = questions[currentIdx];

  const handleCheck = () => {
    if (!selectedOpt) return;
    const correctOpts = q.options.filter((o: ParsedOption) => o.isCorrect).map((o: ParsedOption) => o.id);
    const correct = correctOpts.includes(selectedOpt);
    setIsAnswerCorrect(correct);
    setIsChecked(true);
    if (!correct) showToast('Sai rồi, thử lại nhé!');
  };

  const handleNext = () => {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx(prev => prev + 1);
      setSelectedOpt(null);
      setIsChecked(false);
    } else {
      showToast('Đã hoàn thành bài!');
      navigate('/');
    }
  };

  return (
    <div className="flex flex-col h-[100dvh] bg-app text-ink">
      <div className="p-4 flex items-center justify-between border-b border-[var(--border-strong)]">
        <button onClick={() => navigate(-1)} className="p-2"><ArrowLeft className="w-6 h-6"/></button>
        <span className="font-bold text-sm">Câu {currentIdx + 1} / {questions.length}</span>
        <div className="w-6" />
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <h2 className="text-lg font-bold text-ink-strong mb-6">{q.ask}</h2>
        <div className="space-y-3">
          {q.options.map((opt: ParsedOption, idx: number) => {
            const isSelected = selectedOpt === opt.id;
            let bg = 'bg-neu border-transparent';
            if (isChecked) {
              if (opt.isCorrect) bg = 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-500';
              else if (isSelected) bg = 'bg-rose-50 dark:bg-rose-900/30 border-rose-500';
            } else if (isSelected) {
              bg = 'bg-blue-50 dark:bg-blue-900/30 border-blue-500';
            }

            return (
              <button key={opt.id} onClick={() => !isChecked && setSelectedOpt(opt.id)}
                className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-center gap-3 ${bg}`}>
                <span className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold ${isSelected ? 'border-blue-500 text-blue-500' : 'border-slate-400 text-slate-400'}`}>
                  {String.fromCharCode(65 + idx)}
                </span>
                <span className="flex-1 text-base">{opt.text}</span>
                {isChecked && opt.isCorrect && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
                {isChecked && isSelected && !opt.isCorrect && <XCircle className="w-5 h-5 text-rose-500" />}
              </button>
            );
          })}
        </div>
      </div>

      <div className="p-4 border-t border-[var(--border-strong)] bg-neu">
        {!isChecked ? (
          <button onClick={handleCheck} disabled={!selectedOpt} className="w-full py-4 rounded-xl bg-emerald-500 text-white font-bold text-lg disabled:opacity-50">
            Xác nhận
          </button>
        ) : (
          <button onClick={handleNext} className={`w-full py-4 rounded-xl text-white font-bold text-lg ${isAnswerCorrect ? 'bg-blue-500' : 'bg-rose-500'}`}>
            {isAnswerCorrect ? (currentIdx < questions.length - 1 ? 'Câu tiếp theo' : 'Hoàn thành') : 'Thử lại'}
          </button>
        )}
      </div>
    </div>
  );
}
