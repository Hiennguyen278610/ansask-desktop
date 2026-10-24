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
