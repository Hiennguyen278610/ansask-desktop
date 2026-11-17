import type { Id, TrashCursor, TrashItem } from '@/domain/types';
import { call } from '@/shared/api/client';
import type { Page, PageParams } from '@/shared/api/types';

export const trashService = {
  list: (p: { kind: 'subject' | 'exam' } & PageParams<TrashCursor>) =>
    call<Page<TrashItem, TrashCursor>>('trash_list', { req: p }),
  restore: (kind: 'subject' | 'exam', id: Id) =>
    call<void>('trash_restore', { req: { kind, id } }),
  purge: (kind: 'subject' | 'exam', id: Id) =>
    call<void>('trash_purge', { req: { kind, id } }),
};
