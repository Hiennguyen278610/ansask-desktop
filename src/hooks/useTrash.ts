import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { trashList, subjectRestore, examRestore, trashPurgeItem, trashEmpty } from '@/lib/tauri/commands';
import { useUiStore } from '@/stores/uiStore';
import { AppException } from '@/lib/tauri/invoke';

export function useTrash() {
  return useQuery({ queryKey: ['trash'], queryFn: trashList });
}

export function useTrashActions() {
  const qc = useQueryClient();
  const showToast = useUiStore(s => s.showToast);

  const invalidateAll = () => {
    qc.invalidateQueries({ queryKey: ['trash'] });
    qc.invalidateQueries({ queryKey: ['subjects'] });
    qc.invalidateQueries({ queryKey: ['exams'] });
    qc.invalidateQueries({ queryKey: ['attempts_all'] });
  };

  const restore = useMutation({
    mutationFn: ({ kind, id, newName }: { kind: 'subject' | 'exam'; id: string; newName?: string }) => 
      kind === 'subject' ? subjectRestore(id, newName) : examRestore(id, newName),
    onSuccess: () => { invalidateAll(); showToast('Khôi phục thành công!'); },
    onError: (err: Error | AppException) => { throw err; } // Ném lỗi để Dialog bắt
  });

  const purge = useMutation({
    mutationFn: ({ kind, id }: { kind: 'subject' | 'exam'; id: string }) => trashPurgeItem(kind, id),
    onSuccess: () => { invalidateAll(); showToast('Đã xóa vĩnh viễn!'); },
    onError: (err: Error | AppException) => showToast(err.message),
  });

  const empty = useMutation({
    mutationFn: () => trashEmpty(),
    onSuccess: () => { invalidateAll(); showToast('Đã dọn sạch thùng rác!'); },
    onError: (err: Error | AppException) => showToast(err.message),
  });

  return { restore, purge, empty };
}
