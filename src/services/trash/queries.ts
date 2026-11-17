import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { Id, TrashCursor, TrashItem } from '@/domain/types';
import { useCursorInfiniteQuery } from '@/shared/hooks/useCursorInfiniteQuery';
import { examKeys } from '../exam/keys';
import { invalidate } from '../invalidate';
import { statsKeys } from '../stats/keys';
import { subjectKeys } from '../subject/keys';
import { trashKeys } from './keys';
import { trashService } from './service';

export const useTrashList = (kind: 'subject' | 'exam') =>
  useCursorInfiniteQuery<TrashItem, TrashCursor>({
    queryKey: trashKeys.list(kind),
    fetchPage: (p) => trashService.list({ kind, ...p }),
  });

export function useRestoreTrash() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p: { kind: 'subject' | 'exam'; id: Id }) => trashService.restore(p.kind, p.id),
    onSuccess: () =>
      invalidate(qc, [trashKeys.all, subjectKeys.list(), examKeys.lists(), statsKeys.all]),
  });
}

export function usePurgeTrash() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p: { kind: 'subject' | 'exam'; id: Id }) => trashService.purge(p.kind, p.id),
    onSuccess: () => invalidate(qc, [trashKeys.all, statsKeys.all]),
  });
}
