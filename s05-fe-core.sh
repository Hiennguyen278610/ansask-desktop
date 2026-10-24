#!/bin/bash
set -e

# 1. Cập nhật Commands
python3 - << 'PYEOF'
p = 'src/lib/tauri/commands.ts'
s = open(p).read()
s = s.replace(
  'export interface AttemptReviewDto { attemptId: string; examId: string; subjectId: string; examTitle: string; score: number; totalQuestions: number; correctCount: number; questions: GradedQuestionDto[]; }',
  'export interface AttemptReviewDto { attemptId: string; examId: string; subjectId: string; examTitle: string; score: number; totalQuestions: number; correctCount: number; questions: GradedQuestionDto[]; }\n\nexport interface TrashItemDto {\n  id: string;\n  kind: "subject" | "exam";\n  name: string;\n  subjectId?: string;\n  subjectName?: string;\n  deletedAt: string;\n  questionCount: number;\n  attemptCount: number;\n  deletedByParent: boolean;\n}'
)
s = s.replace(
  'export function attemptReview(id: string): Promise<AttemptReviewDto> { return invoke(\'attempt_review\', { req: { id } }); }',
  'export function attemptReview(id: string): Promise<AttemptReviewDto> { return invoke(\'attempt_review\', { req: { id } }); }\n\nexport function trashList(): Promise<TrashItemDto[]> { return invoke(\'trash_list\'); }\nexport function subjectRestore(id: string, newName?: string): Promise<void> { return invoke(\'subject_restore\', { req: { id, newName } }); }\nexport function examRestore(id: string, newName?: string): Promise<void> { return invoke(\'exam_restore\', { req: { id, newName } }); }\nexport function trashPurgeItem(kind: "subject" | "exam", id: string): Promise<void> { return invoke(\'trash_purge_item\', { req: { kind, id } }); }\nexport function trashEmpty(): Promise<void> { return invoke(\'trash_empty\'); }'
)
open(p, 'w').write(s)
PYEOF

# 2. Tạo Hook useTrash
cat > src/hooks/useTrash.ts << 'TS_EOF'
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
TS_EOF

# 3. Dialog Khôi phục
cat > src/features/trash/RestoreDialog.tsx << 'TSX_EOF'
import { useState, useEffect } from 'react';
import { Dialog } from '@/components/ui/Dialog';
import { Input } from '@/components/ui/Input';
import type { TrashItemDto } from '@/lib/tauri/commands';
import { AppException } from '@/lib/tauri/invoke';

interface Props {
  item: TrashItemDto | null;
  onClose: () => void;
  onConfirm: (newName: string) => Promise<void>;
}

export function RestoreDialog({ item, onClose, onConfirm }: Props) {
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [isPending, setIsPending] = useState(false);

  useEffect(() => {
    if (item) { setName(item.name); setError(''); }
  }, [item]);

  if (!item) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setIsPending(true);
    try {
      await onConfirm(name.trim());
      onClose();
    } catch (err: unknown) {
      if (err instanceof AppException && err.code === 'DUPLICATE_NAME') {
        setError('Tên này đã tồn tại, vui lòng nhập tên khác.');
      } else {
        setError((err as Error).message || 'Lỗi khôi phục');
      }
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Dialog open={!!item} title={`Khôi phục ${item.kind === 'subject' ? 'môn học' : 'bộ đề'}`} onClose={onClose}
      footer={
        <>
          <button onClick={onClose} className="neu-pill px-4 py-2 rounded-xl text-xs font-bold text-slate-600">Hủy</button>
          <button onClick={handleSubmit} disabled={isPending || !name.trim()} className="neu-dark-btn px-5 py-2 rounded-xl text-xs font-bold disabled:opacity-50">
            {isPending ? 'Đang xử lý...' : 'Khôi phục'}
          </button>
        </>
      }>
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-sm text-slate-600">Mục này sẽ được đưa trở lại danh sách hoạt động.</p>
        <div>
          <label className="block text-xs font-bold text-slate-500 mb-1.5">Tên hiển thị</label>
          <Input value={name} onChange={e => setName(e.target.value)} autoFocus />
          {error && <p className="text-xs text-rose-500 mt-1.5">{error}</p>}
        </div>
      </form>
    </Dialog>
  );
}
TSX_EOF
