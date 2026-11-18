import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { AttemptCursor, AttemptListItem, Id } from '@/domain/types';
import { useCursorInfiniteQuery } from '@/shared/hooks/useCursorInfiniteQuery';
import { invalidate } from '../invalidate';
import { sessionKeys } from '../session/keys';
import { statsKeys } from '../stats/keys';
import { attemptKeys } from './keys';
import { attemptService, type AttemptSaveInput } from './service';

export const useAttemptList = (filter?: { subjectId?: Id; examId?: Id }) =>
  useCursorInfiniteQuery<AttemptListItem, AttemptCursor>({
    queryKey: attemptKeys.list(filter),
    fetchPage: (p) => attemptService.list({ ...filter, ...p }),
  });

export const useAttempt = (id: Id) =>
  useQuery({
    queryKey: attemptKeys.detail(id),
    queryFn: () => attemptService.get(id),
  });

export function useSaveAttempt() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: AttemptSaveInput) => attemptService.save(input),
    onSuccess: (_res, vars) =>
      invalidate(qc, [statsKeys.all, attemptKeys.lists(), sessionKeys.detail(vars.examId)]),
  });
}
