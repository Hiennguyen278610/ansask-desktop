import { useState } from 'react';
import { useDashboard } from '@/hooks/useDashboard';
import { MetricCards } from './MetricCards';
import { ProgressChart } from './ProgressChart';
import { ScoreDonut } from './ScoreDonut';
import { RecentAttempts } from './RecentAttempts';
import { useQuery } from '@tanstack/react-query';
import { attemptListAll } from '@/lib/tauri/commands';

export function DashboardScreen() {
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('week');
  
  const { data: stats, isLoading: statsLoading } = useDashboard(period);
  const { data: attempts, isLoading: attemptsLoading } = useQuery({
    queryKey: ['attempts_all'],
    queryFn: attemptListAll,
  });

  if (statsLoading || attemptsLoading) return <div className="p-8 text-center text-sm text-slate-500">Đang tải dữ liệu thống kê...</div>;
  if (!stats) return null;

  return (
    <div className="space-y-6 animate-fade-in">
      <section className="neu-card rounded-[26px] p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-ink-strong">Overall Data • Tổng quan Học tập</h2>
            <p className="text-xs text-slate-400">Thống kê số bài kiểm tra đã hoàn thành và kết quả điểm số theo thời gian thực</p>
          </div>
          
          {/* Period Filter */}
          <div className="neu-card-inset p-1 rounded-full flex items-center gap-1">
            {[
              { id: 'week', label: 'Theo Tuần' },
              { id: 'month', label: 'Theo Tháng' },
              { id: 'year', label: 'Theo Năm' }
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => setPeriod(p.id as "week" | "month" | "year")}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                  period === p.id ? 'bg-ink-strong text-app shadow-sm' : 'text-slate-500 hover:text-ink-strong'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <MetricCards stats={{
          totalAttempts: stats.totalAttempts,
          avgScore: stats.avgScore.toFixed(1),
          totalQuestions: stats.totalQuestions,
          accuracyRate: stats.accuracyRate.toFixed(1),
        }} />
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ProgressChart series={stats.series} />
        <ScoreDonut avgScore={stats.avgScore.toFixed(1)} distribution={stats.distribution} />
      </div>

      <RecentAttempts attempts={attempts || []} />
    </div>
  );
}
