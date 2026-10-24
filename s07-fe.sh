#!/bin/bash
set -e

# 1. Cập nhật commands.ts
python3 - << 'PYEOF'
p = 'src/lib/tauri/commands.ts'
s = open(p).read()
s = s.replace(
  'export interface TrashItemDto {',
  'export interface SeriesPointDto { label: string; count: number; avgScore: number; }\nexport interface ScoreDistributionDto { excellentPct: number; goodPct: number; averagePct: number; }\nexport interface StatsOverviewDto { totalAttempts: number; avgScore: number; totalQuestions: number; accuracyRate: number; series: SeriesPointDto[]; distribution: ScoreDistributionDto; }\n\nexport interface TrashItemDto {'
)
s = s.replace(
  'export function trashList(): Promise<TrashItemDto[]> { return invoke(\'trash_list\'); }',
  'export function statsOverview(period: "week" | "month" | "year"): Promise<StatsOverviewDto> { return invoke(\'stats_overview\', { req: { period } }); }\n\nexport function trashList(): Promise<TrashItemDto[]> { return invoke(\'trash_list\'); }'
)
open(p, 'w').write(s)
PYEOF

# 2. Cập nhật Hook useDashboard
cat > src/hooks/useDashboard.ts << 'TS_EOF'
import { useQuery } from '@tanstack/react-query';
import { statsOverview } from '@/lib/tauri/commands';

export function useDashboard(period: 'week' | 'month' | 'year') {
  return useQuery({
    queryKey: ['stats', period],
    queryFn: () => statsOverview(period),
  });
}
TS_EOF

# 3. Cập nhật DashboardScreen
cat > src/features/dashboard/DashboardScreen.tsx << 'TSX_EOF'
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
                onClick={() => setPeriod(p.id as any)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                  period === p.id ? 'bg-ink-strong text-white shadow-sm' : 'text-slate-500 hover:text-ink-strong'
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
TSX_EOF

# 4. Sửa ScoreDonut nhận number thay vì string (vì API trả number)
cat > src/features/dashboard/ScoreDonut.tsx << 'TSX_EOF'
interface Props {
  avgScore: string;
  distribution: { excellentPct: number; goodPct: number; averagePct: number };
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
            strokeDasharray={`${(distribution.excellentPct / 100) * 289} 289`} strokeLinecap="round" />
          <circle cx="60" cy="60" r="46" fill="none" stroke="var(--ink-700)" strokeWidth="12"
            strokeDasharray={`${(distribution.goodPct / 100) * 289} 289`} strokeDashoffset={`-${(distribution.excellentPct / 100) * 289}`} strokeLinecap="round" />
          <circle cx="60" cy="60" r="46" fill="none" stroke="var(--ink-800)" strokeWidth="12" opacity="0.4"
            strokeDasharray={`${(distribution.averagePct / 100) * 289} 289`} strokeDashoffset={`-${((distribution.excellentPct + distribution.goodPct) / 100) * 289}`} strokeLinecap="round" />
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

# 5. Fix lỗi "any" trong useDashboard / Dashboard
sed -i 's/setPeriod(p.id as any)/setPeriod(p.id as "week" | "month" | "year")/' src/features/dashboard/DashboardScreen.tsx

