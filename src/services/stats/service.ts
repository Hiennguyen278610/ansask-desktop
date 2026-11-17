import type { AvgBySubjectItem, RecentAttemptItem, StatsTotals } from '@/domain/types';
import { call } from '@/shared/api/client';

export const statsService = {
  totals: () => call<StatsTotals>('stats_totals'),
  recentAttempts: (limit: number) =>
    call<RecentAttemptItem[]>('stats_recent_attempts', { req: { limit } }),
  avgBySubject: () => call<AvgBySubjectItem[]>('stats_avg_by_subject'),
};
