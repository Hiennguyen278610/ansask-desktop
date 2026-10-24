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
