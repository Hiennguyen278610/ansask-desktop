import { useParams, useNavigate } from 'react-router';
import { ArrowLeft, Save, Plus } from 'lucide-react';
import { useExamEditor } from '@/hooks/useExamEditor';
import { QuestionCardEditor } from './QuestionCardEditor';
import { SyntaxHighlightedTextarea } from './SyntaxHighlightedTextarea';

export function ExamEditorScreen() {
  const { subjectId, examId } = useParams();
  const navigate = useNavigate();
  const ed = useExamEditor(examId, subjectId);

  if (ed.isLoading) return <div className="p-8 text-center text-sm text-slate-500">Đang tải đề...</div>;

  return (
    <div className="space-y-5 flex-1 flex flex-col animate-fade-in">
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
              <div key={i} className="py-1">
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
    </div>
  );
}
