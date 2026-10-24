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
