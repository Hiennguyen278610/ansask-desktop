import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { Id, Subject, TimeCursor } from '@/domain/types';
import { useCursorInfiniteQuery } from '@/shared/hooks/useCursorInfiniteQuery';
import { attemptKeys } from '../attempt/keys';
import { invalidate } from '../invalidate';
import { statsKeys } from '../stats/keys';
import { trashKeys } from '../trash/keys';
import { subjectKeys } from './keys';
import { subjectService } from './service';

export const useSubjectList = (query?: string) => {
  const trimmed = query?.trim() || undefined;
  return useCursorInfiniteQuery<Subject, TimeCursor>({
    queryKey: subjectKeys.list(trimmed),
    fetchPage: (p) => subjectService.list({ ...p, query: trimmed }),
  });
};

export function useCreateSubject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { name: string; icon: string }) => subjectService.create(input),
    onSuccess: () => invalidate(qc, [subjectKeys.lists()]),
  });
}

export function useRenameSubject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p: { id: Id; name: string }) => subjectService.rename(p.id, p.name),
    onSuccess: () => invalidate(qc, [subjectKeys.lists(), attemptKeys.all, statsKeys.all]),
  });
}

export function useDeleteSubject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: Id) => subjectService.softDelete(id),
    onSuccess: () => invalidate(qc, [subjectKeys.lists(), trashKeys.all, statsKeys.all]),
  });
}
