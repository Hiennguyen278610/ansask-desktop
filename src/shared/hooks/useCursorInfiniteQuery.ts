import { useMemo } from 'react';
import { useInfiniteQuery, type QueryKey } from '@tanstack/react-query';
import type { Page, PageParams } from '@/shared/api/types';

export function useCursorInfiniteQuery<T, C>(opts: {
  queryKey: QueryKey;
  fetchPage: (p: PageParams<NoInfer<C>>) => Promise<Page<T, C>>;
  limit?: number;
  enabled?: boolean;
}) {
  const { queryKey, fetchPage, limit = 30, enabled } = opts;
  const q = useInfiniteQuery({
    queryKey,
    enabled,
    initialPageParam: null as C | null,
    queryFn: ({ pageParam }) => fetchPage({ cursor: pageParam as C | null, limit }),
    getNextPageParam: (last: Page<T, C>) => last.nextCursor,
  });

  const items = useMemo(() => q.data?.pages.flatMap((p) => p.items) ?? [], [q.data]);
  return { ...q, items };
}
