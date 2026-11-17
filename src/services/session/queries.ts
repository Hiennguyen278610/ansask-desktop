import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Id } from '@/domain/types';
import { invalidate } from '../invalidate';
import { sessionKeys } from './keys';
import { sessionService, type SessionSaveInput } from './service';

export const useSessionDraft = (examId: Id) =>
  useQuery({
    queryKey: sessionKeys.detail(examId),
    queryFn: () => sessionService.get(examId),
    enabled: Boolean(examId),
  });

export function useSaveSessionDraft() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: SessionSaveInput) => sessionService.save(input),
    onSuccess: (_res, vars) => invalidate(qc, [sessionKeys.detail(vars.examId)]),
  });
}

export function useDeleteSessionDraft() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (examId: Id) => sessionService.delete(examId),
    onSuccess: (_res, examId) => invalidate(qc, [sessionKeys.detail(examId)]),
  });
}
