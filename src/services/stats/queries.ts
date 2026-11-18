import { useQuery } from '@tanstack/react-query';
import { statsKeys } from './keys';
import { statsService } from './service';

export const useStatsTotals = () =>
  useQuery({
    queryKey: statsKeys.totals(),
    queryFn: () => statsService.totals(),
  });

export const useStatsRecentAttempts = (limit = 10) =>
  useQuery({
    queryKey: statsKeys.recent(limit),
    queryFn: () => statsService.recentAttempts(limit),
  });

export const useStatsAvgBySubject = () =>
  useQuery({
    queryKey: statsKeys.avgBySubject(),
    queryFn: () => statsService.avgBySubject(),
  });
