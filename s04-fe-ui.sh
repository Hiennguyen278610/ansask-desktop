#!/bin/bash
set -e

# 1. Component MetricCards
cat > src/features/dashboard/MetricCards.tsx << 'TSX_EOF'
import { FileText, Award, Layers, TrendingUp } from 'lucide-react';

interface Props {
  stats: {
    totalAttempts: number;
    avgScore: string;
    totalQuestions: number;
    accuracyRate: string;
  };
}

export function MetricCards({ stats }: Props) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      <div className="neu-card rounded-2xl p-4 flex items-center justify-between">
        <div>
          <p className="text-xs text-slate-400 font-medium mb-1">Đã làm (Bài KT)</p>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-ink-strong">{stats.totalAttempts}</span>
          </div>
        </div>
        <div className="w-11 h-11 rounded-full neu-pill flex items-center justify-center text-ink-strong">
          <FileText className="w-5 h-5" />
        </div>
      </div>

      <div className="neu-card rounded-2xl p-4 flex items-center justify-between">
        <div>
          <p className="text-xs text-slate-400 font-medium mb-1">Điểm trung bình</p>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-ink-strong">{stats.avgScore}</span>
            <span className="text-xs text-slate-400 font-semibold">/ 10</span>
          </div>
        </div>
        <div className="w-11 h-11 rounded-full neu-pill flex items-center justify-center text-ink-strong">
          <Award className="w-5 h-5" />
        </div>
      </div>

      <div className="neu-card rounded-2xl p-4 flex items-center justify-between">
        <div>
          <p className="text-xs text-slate-400 font-medium mb-1">Câu đã giải</p>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-ink-strong">{stats.totalQuestions}</span>
          </div>
        </div>
        <div className="w-11 h-11 rounded-full neu-pill flex items-center justify-center text-ink-strong">
          <Layers className="w-5 h-5" />
        </div>
      </div>

      <div className="neu-card rounded-2xl p-4 flex items-center justify-between">
        <div>
          <p className="text-xs text-slate-400 font-medium mb-1">Tỉ lệ chính xác</p>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-ink-strong">{stats.accuracyRate}%</span>
          </div>
        </div>
        <div className="w-11 h-11 rounded-full neu-pill flex items-center justify-center text-ink-strong">
          <TrendingUp className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}
TSX_EOF

# 2. Component ProgressChart
cat > src/features/dashboard/ProgressChart.tsx << 'TSX_EOF'
export function ProgressChart({ series }: { series: any[] }) {
  return (
    <section className="lg:col-span-2 neu-card rounded-[26px] p-5 sm:p-6 flex flex-col justify-between">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h3 className="text-base font-bold text-ink-strong">Biểu đồ Tiến độ & Điểm số</h3>
          <p className="text-xs text-slate-400">Kết hợp biểu đồ cột (Số bài) và biểu đồ đường (Điểm TB)</p>
        </div>
      </div>
      <div className="relative pt-4 pb-2">
        <div className="space-y-9 text-[11px] text-slate-400 font-medium">
          {[10, 7.5, 5.0, 2.5, 0].map((mark) => (
            <div key={mark} className="flex items-center gap-3">
              <span className="w-7 text-right">{mark}đ</span>
              <div className="flex-1 border-b border-slate-200/80 dark:border-slate-700/80" />
            </div>
          ))}
        </div>
        <div className="absolute inset-0 left-10 right-2 top-4 bottom-7 flex items-end justify-around">
          <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible" viewBox="0 0 600 180" preserveAspectRatio="none">
            <polyline
              fill="none"
              stroke="var(--chart-line)"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={series.map((item, idx) => {
                const x = ((idx + 0.5) / series.length) * 600;
                const y = 180 - (item.avgScore / 10) * 165;
                return `${x},${y}`;
              }).join(' ')}
            />
          </svg>
          {series.map((item, idx) => {
            const scoreHeightPct = Math.min(100, (item.avgScore / 10) * 100);
            const maxCount = Math.max(...series.map((s) => s.count), 10);
            const countTrackPct = Math.min(100, Math.max(35, (item.count / maxCount) * 100));
            return (
              <div key={idx} className="flex flex-col items-center h-full justify-end group relative z-10">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-9 bg-ink-strong text-white text-[10px] font-bold px-2.5 py-1 rounded-lg whitespace-nowrap shadow-md pointer-events-none">
                  {item.count} đề • TB {item.avgScore}đ
                </div>
                <div style={{ height: `${countTrackPct}%` }} className="w-3.5 sm:w-4 rounded-full bg-[var(--chart-bar-track)] shadow-inner p-0.5 flex items-end transition-all duration-500">
                  <div style={{ height: `${scoreHeightPct}%` }} className="w-full rounded-full bg-gradient-to-t from-ink-strong via-ink to-slate-500 transition-all duration-500" />
                </div>
                <span className="text-[11px] font-semibold text-slate-400 mt-3">{item.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
TSX_EOF

# 3. Component ScoreDonut
cat > src/features/dashboard/ScoreDonut.tsx << 'TSX_EOF'
interface Props {
  avgScore: string;
  distribution: { excellentPct: string; goodPct: string; averagePct: string };
}

export function ScoreDonut({ avgScore, distribution }: Props) {
  return (
    <section className="neu-card rounded-[26px] p-5 sm:p-6 flex flex-col justify-between items-center">
      <div className="w-full flex items-center justify-between mb-2">
        <h3 className="text-base font-bold text-ink-strong">Phổ Điểm (Tỉ lệ)</h3>
        <span className="neu-pill px-3 py-1 rounded-full text-[11px] font-bold text-slate-500">All Time</span>
      </div>
      <div className="relative my-3 w-44 h-44 rounded-full neu-pill flex items-center justify-center p-4">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r="46" fill="none" stroke="var(--chart-bar-track)" strokeWidth="12" />
          <circle cx="60" cy="60" r="46" fill="none" stroke="var(--ink-900)" strokeWidth="12"
            strokeDasharray={`${(Number(distribution.excellentPct) / 100) * 289} 289`} strokeLinecap="round" />
          <circle cx="60" cy="60" r="46" fill="none" stroke="var(--ink-700)" strokeWidth="12"
            strokeDasharray={`${(Number(distribution.goodPct) / 100) * 289} 289`} strokeDashoffset={`-${(Number(distribution.excellentPct) / 100) * 289}`} strokeLinecap="round" />
          <circle cx="60" cy="60" r="46" fill="none" stroke="var(--ink-800)" strokeWidth="12" opacity="0.4"
            strokeDasharray={`${(Number(distribution.averagePct) / 100) * 289} 289`} strokeDashoffset={`-${((Number(distribution.excellentPct) + Number(distribution.goodPct)) / 100) * 289}`} strokeLinecap="round" />
        </svg>
        <div className="absolute inset-8 rounded-full neu-card-inset flex flex-col items-center justify-center text-center">
          <span className="text-xl font-bold text-ink-strong">{avgScore}đ</span>
          <span className="text-[11px] text-slate-400 font-medium">Điểm TB</span>
        </div>
      </div>
      <div className="w-full grid grid-cols-3 gap-2 pt-2 text-center">
        <div>
          <div className="flex items-center justify-center gap-1 text-[11px] text-slate-400">
            <span className="w-2 h-2 rounded-sm bg-ink-strong" />
            <span>Xuất sắc</span>
          </div>
          <p className="font-bold text-sm text-ink-strong mt-0.5">{distribution.excellentPct}%</p>
        </div>
        <div>
          <div className="flex items-center justify-center gap-1 text-[11px] text-slate-400">
            <span className="w-2 h-2 rounded-sm bg-ink-700" />
            <span>Khá giỏi</span>
          </div>
          <p className="font-bold text-sm text-ink-strong mt-0.5">{distribution.goodPct}%</p>
        </div>
        <div>
          <div className="flex items-center justify-center gap-1 text-[11px] text-slate-400">
            <span className="w-2 h-2 rounded-sm bg-ink-800 opacity-40" />
            <span>Cần cố gắng</span>
          </div>
          <p className="font-bold text-sm text-ink-strong mt-0.5">{distribution.averagePct}%</p>
        </div>
      </div>
    </section>
  );
}
TSX_EOF

# 4. Component RecentAttempts
cat > src/features/dashboard/RecentAttempts.tsx << 'TSX_EOF'
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
TSX_EOF

# 5. Màn hình Dashboard tổng hợp
cat > src/features/dashboard/DashboardScreen.tsx << 'TSX_EOF'
import { useDashboard } from '@/hooks/useDashboard';
import { MetricCards } from './MetricCards';
import { ProgressChart } from './ProgressChart';
import { ScoreDonut } from './ScoreDonut';
import { RecentAttempts } from './RecentAttempts';

export function DashboardScreen() {
  const { data: attempts, isLoading, stats } = useDashboard();

  if (isLoading) return <div className="p-8 text-center text-sm text-slate-500">Đang tải dữ liệu thống kê...</div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <section className="neu-card rounded-[26px] p-5 sm:p-6">
        <div className="mb-5">
          <h2 className="text-base sm:text-lg font-bold text-ink-strong">Overall Data • Tổng quan Học tập</h2>
          <p className="text-xs text-slate-400">Thống kê số bài kiểm tra đã hoàn thành và kết quả điểm số</p>
        </div>
        <MetricCards stats={stats} />
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ProgressChart series={stats.series} />
        <ScoreDonut avgScore={stats.avgScore} distribution={stats.distribution} />
      </div>

      <RecentAttempts attempts={attempts || []} />
    </div>
  );
}
TSX_EOF
