import type { Id } from '@/domain/types';

export const attemptKeys = {
  all: ['attempts'] as const,
  lists: () => [...attemptKeys.all, 'list'] as const,
  list: (filter?: { subjectId?: Id; examId?: Id }) =>
    [...attemptKeys.lists(), filter?.subjectId ?? '', filter?.examId ?? ''] as const,
  detail: (id: Id) => [...attemptKeys.all, 'detail', id] as const,
};
