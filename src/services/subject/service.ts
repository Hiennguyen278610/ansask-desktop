import type { Id, Subject, TimeCursor } from '@/domain/types';
import { call } from '@/shared/api/client';
import type { Page, PageParams } from '@/shared/api/types';

export const subjectService = {
  list: (p: PageParams<TimeCursor> & { query?: string }) =>
    call<Page<Subject, TimeCursor>>('subject_list', { req: p }),
  create: (input: { name: string; icon: string }) => call<Subject>('subject_create', { req: input }),
  rename: (id: Id, name: string, icon?: string) =>
    call<Subject>('subject_rename', { req: { id, name, icon } }),
  softDelete: (id: Id) => call<void>('subject_soft_delete', { req: { id } }),
};
