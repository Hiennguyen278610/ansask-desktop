import type { Id } from '@/domain/types';

export const examKeys = {
  all: ['exams'] as const,
  lists: () => [...examKeys.all, 'list'] as const,
  list: (subjectId: Id, query?: string) =>
    [...examKeys.lists(), subjectId, query?.trim() ?? ''] as const,
  detail: (id: Id) => [...examKeys.all, 'detail', id] as const,
  questions: (id: Id) => [...examKeys.detail(id), 'questions'] as const,
};
