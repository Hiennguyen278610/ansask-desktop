import { useNavigate } from 'react-router';
import type { AttemptSummary } from '@/lib/tauri/commands';
import { formatDateTime } from '@/lib/time';

export function RecentAttempts({ attempts }: { attempts: AttemptSummary[] }) {
  const navigate = useNavigate();
  return (
    <section className="neu-card rounded-[26px] p-5 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-bold text-ink-strong">Overview of Works • Lịch sử Làm bài Gần đây</h3>
        <button onClick={() => navigate('/subjects')} className="neu-pill px-3.5 py-1.5 rounded-full text-xs font-bold text-ink hover:underline">
          Làm đề mới →
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="text-[11px] text-slate-400 uppercase border-b border-slate-200/80 dark:border-slate-700/80">
              <th className="py-3 px-3">STT</th>
              <th className="py-3 px-3">Tên bộ đề</th>
              <th className="py-3 px-3">Môn học</th>
              <th className="py-3 px-3">Thời gian nộp</th>
              <th className="py-3 px-3 text-center">Kết quả câu</th>
              <th className="py-3 px-3 text-right">Điểm số</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200/60 dark:divide-slate-700/60 text-xs sm:text-sm">
            {attempts.slice(0, 6).map((att, idx) => (
              <tr key={att.id} onClick={() => navigate(`/results/${att.id}`)} className="hover:bg-white/40 dark:hover:bg-slate-700/40 transition-colors cursor-pointer">
                <td className="py-3.5 px-3 font-semibold text-slate-400">{idx + 1}</td>
                <td className="py-3.5 px-3 font-bold text-ink-strong">{att.examTitle}</td>
                <td className="py-3.5 px-3 text-slate-500 font-medium">{att.subjectName}</td>
                <td className="py-3.5 px-3 text-slate-400">{formatDateTime(att.submittedAt)}</td>
                <td className="py-3.5 px-3 text-center font-semibold text-slate-600 dark:text-slate-400">{att.correctCount}/{att.totalQuestions} câu</td>
                <td className="py-3.5 px-3 text-right">
                  <span className="neu-pill px-3 py-1 rounded-full font-bold text-ink-strong">{att.score} đ</span>
                </td>
              </tr>
            ))}
            {attempts.length === 0 && (
              <tr><td colSpan={6} className="py-8 text-center text-slate-400">Chưa có lượt làm bài nào.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
