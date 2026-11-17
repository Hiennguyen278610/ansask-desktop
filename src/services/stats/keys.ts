export const statsKeys = {
  all: ['stats'] as const,
  totals: () => [...statsKeys.all, 'totals'] as const,
  recent: (limit: number) => [...statsKeys.all, 'recent', limit] as const,
  avgBySubject: () => [...statsKeys.all, 'avgBySubject'] as const,
};
