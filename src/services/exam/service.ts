import type { ExamInput, ExamSummary, Id, TimeCursor } from '@/domain/types';
import { call } from '@/shared/api/client';
import type { Page, PageParams } from '@/shared/api/types';

export const examService = {
  list: (p: { subjectId: Id; query?: string } & PageParams<TimeCursor>) =>
    call<Page<ExamSummary, TimeCursor>>('exam_list', { req: p }),
  get: (id: Id) => call<ExamSummary>('exam_get', { req: { id } }),
  create: (subjectId: Id, input: ExamInput) =>
    call<ExamSummary>('exam_create', { req: { subjectId, input } }),
  update: (id: Id, input: ExamInput) =>
    call<ExamSummary>('exam_update', { req: { id, input } }),
  rename: (id: Id, title: string) =>
    call<ExamSummary>('exam_rename', { req: { id, title } }),
  softDelete: (id: Id) => call<void>('exam_soft_delete', { req: { id } }),
};
