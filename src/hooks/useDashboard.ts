import { useQuery } from '@tanstack/react-query';
import { statsOverview } from '@/lib/tauri/commands';

export function useDashboard(period: 'week' | 'month' | 'year') {
  return useQuery({
    queryKey: ['stats', period],
    queryFn: () => statsOverview(period),
  });
}
