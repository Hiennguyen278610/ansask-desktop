import { useState } from 'react';
import { Dialog } from '@/components/ui/Dialog';
import { Input } from '@/components/ui/Input';
import { useCreateSubject } from '@/hooks/useSubjects';
import { useUiStore } from '@/stores/uiStore';
import { AppException } from '@/lib/tauri/invoke';
import { SUBJECT_COLORS } from '@/constants/colors';

export function SubjectFormDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [name, setName] = useState('');
  const [color, setColor] = useState(SUBJECT_COLORS[0].hex);
  const { mutate, isPending } = useCreateSubject();
  const showToast = useUiStore(s => s.showToast);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    mutate({ name, color }, {
      onSuccess: () => {
        showToast('Đã tạo môn học thành công!');
        setName('');
        onClose();
      },
      onError: (err: Error | AppException) => {
        showToast(err.message || 'Lỗi tạo môn học');
      }
    });
  };

  return (
    <Dialog open={open} title="Tạo môn học mới" onClose={onClose}
      footer={
        <>
          <button onClick={onClose} className="neu-pill px-4 py-2 rounded-xl text-xs font-bold text-slate-600">Hủy</button>
          <button onClick={handleSubmit} disabled={isPending || !name.trim()} className="neu-dark-btn px-5 py-2 rounded-xl text-xs font-bold disabled:opacity-50">
            {isPending ? 'Đang lưu...' : 'Lưu môn học'}
          </button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-500 mb-1.5">Tên môn học</label>
          <Input value={name} onChange={e => setName(e.target.value)} placeholder="VD: Lập trình Hướng đối tượng..." autoFocus />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 mb-1.5">Chọn màu nhận diện</label>
          <div className="flex flex-wrap gap-2.5">
            {SUBJECT_COLORS.map(c => (
              <button key={c.hex} type="button" onClick={() => setColor(c.hex)} title={c.name}
                className={`w-8 h-8 rounded-xl transition-transform flex items-center justify-center ${color === c.hex ? 'scale-110 ring-2 ring-offset-2 ring-ink-strong' : 'opacity-80 hover:opacity-100'}`}
                style={{ backgroundColor: c.hex }}
              />
            ))}
          </div>
        </div>
      </form>
    </Dialog>
  );
}
