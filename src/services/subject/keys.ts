export const subjectKeys = {
  all: ['subjects'] as const,
  lists: () => [...subjectKeys.all, 'list'] as const,
  list: (query?: string) => [...subjectKeys.lists(), query?.trim() ?? ''] as const,
};
