import type { QueryClient, QueryKey } from '@tanstack/react-query';

export function invalidate(qc: QueryClient, keys: readonly QueryKey[]) {
  return Promise.all(keys.map((queryKey) => qc.invalidateQueries({ queryKey })));
}
