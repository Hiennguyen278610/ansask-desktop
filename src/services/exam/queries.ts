import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ExamInput, ExamSummary, Id, TimeCursor } from '@/domain/types';
import { useCursorInfiniteQuery } from '@/shared/hooks/useCursorInfiniteQuery';
import { invalidate } from '../invalidate';
import { attemptKeys } from '../attempt/keys';
import { questionService } from '../question/service';
import { statsKeys } from '../stats/keys';
import { subjectKeys } from '../subject/keys';
import { trashKeys } from '../trash/keys';
import { examKeys } from './keys';
import { examService } from './service';

export const useExamList = (subjectId: Id, query?: string) => {
  const trimmed = query?.trim() || undefined;
  return useCursorInfiniteQuery<ExamSummary, TimeCursor>({
    queryKey: examKeys.list(subjectId, trimmed),
    fetchPage: (p) => examService.list({ subjectId, query: trimmed, ...p }),
  });
};

export const useExam = (id: Id) =>
  useQuery({
    queryKey: examKeys.detail(id),
    queryFn: () => examService.get(id),
  });

export const useExamQuestions = (examId: Id) =>
  useQuery({
    queryKey: examKeys.questions(examId),
    queryFn: () => questionService.listAll(examId),
  });

export function useCreateExam(subjectId: Id) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: ExamInput) => examService.create(subjectId, input),
    onSuccess: () =>
      invalidate(qc, [examKeys.lists(), subjectKeys.lists(), statsKeys.all]),
  });
}

export function useUpdateExam(subjectId: Id, examId: Id) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: ExamInput) => examService.update(examId, input),
    onSuccess: () =>
      invalidate(qc, [
        examKeys.list(subjectId),
        examKeys.lists(),
        examKeys.detail(examId),
        examKeys.questions(examId),
        subjectKeys.lists(),
        statsKeys.all,
      ]),
  });
}

export function useRenameExam() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p: { id: Id; title: string }) => examService.rename(p.id, p.title),
    onSuccess: (updated) =>
      invalidate(qc, [
        examKeys.list(updated.subjectId),
        examKeys.lists(),
        examKeys.detail(updated.id),
        attemptKeys.all,
        statsKeys.all,
      ]),
  });
}

export function useDeleteExam() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: Id) => examService.softDelete(id),
    onSuccess: () =>
      invalidate(qc, [examKeys.lists(), subjectKeys.lists(), trashKeys.all, statsKeys.all]),
  });
}
