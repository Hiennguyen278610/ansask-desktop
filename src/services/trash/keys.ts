export const trashKeys = {
  all: ['trash'] as const,
  list: (kind: 'subject' | 'exam') => [...trashKeys.all, 'list', kind] as const,
};
