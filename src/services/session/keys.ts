import type { Id } from '@/domain/types';

export const sessionKeys = {
  all: ['session'] as const,
  detail: (examId: Id) => [...sessionKeys.all, examId] as const,
};
