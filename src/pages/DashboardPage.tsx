import { Link } from '@tanstack/react-router';
import { BookOpen } from 'lucide-react';
import { AvgBySubjectChart } from '@/features/dashboard/components/AvgBySubjectChart';
import { RecentAttempts } from '@/features/dashboard/components/RecentAttempts';
import { RecentScoreChart } from '@/features/dashboard/components/RecentScoreChart';
import { StatCards } from '@/features/dashboard/components/StatCards';
import {
  useStatsAvgBySubject,
  useStatsRecentAttempts,
  useStatsTotals,
} from '@/services/stats/queries';
import { EmptyState } from '@/shared/components/feedback/EmptyState';
import { Button } from '@/shared/components/ui/button';

export function DashboardPage() {
  const totalsQ = useStatsTotals();
  const recentQ = useStatsRecentAttempts(10);
  const avgQ = useStatsAvgBySubject();

  const totals = totalsQ.data ?? { subjects: 0, exams: 0, questions: 0, attempts: 0 };
  const recent = recentQ.data ?? [];
  const avgBySubject = avgQ.data ?? [];

  if (totalsQ.isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-[var(--radius-lg)] bg-[var(--surface)]" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <StatCards totals={totals} />

      {totals.attempts === 0 ? (
        <EmptyState
          icon={<BookOpen className="h-6 w-6" />}
          title="Chưa có lượt làm bài nào"
          description="Hãy vào mục Đề bài để tạo môn học, nhập bộ đề và bắt đầu luyện tập."
          action={
            <Button asChild>
              <Link to="/exams">Đi tới Đề bài</Link>
            </Button>
          }
        />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <RecentScoreChart data={recent} />
            <AvgBySubjectChart data={avgBySubject} />
          </div>
          <RecentAttempts items={recent} />
        </>
      )}
    </div>
  );
}
