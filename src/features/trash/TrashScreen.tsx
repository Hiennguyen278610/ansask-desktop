import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { BreadcrumbHeader } from '@/components/layout/BreadcrumbHeader';
import { useTrash, useTrashActions } from '@/hooks/useTrash';
import { TrashItemRow } from './TrashItemRow';
import { RestoreDialog } from './RestoreDialog';
import { DeleteConfirmDialog } from '@/components/ui/DeleteConfirmDialog';
import type { TrashItemDto } from '@/lib/tauri/commands';

export function TrashScreen() {
  const { data: items, isLoading } = useTrash();
  const { restore, purge, empty } = useTrashActions();
  
  const [restoreItem, setRestoreItem] = useState<TrashItemDto | null>(null);
  const [purgeItem, setPurgeItem] = useState<TrashItemDto | null>(null);
  const [showEmptyConfirm, setShowEmptyConfirm] = useState(false);

  const subjects = items?.filter(i => i.kind === 'subject') || [];
  const exams = items?.filter(i => i.kind === 'exam') || [];
  const totalItems = subjects.length + exams.length;

  const handleRestoreConfirm = async (newName: string) => {
    if (!restoreItem) return;
    await restore.mutateAsync({ kind: restoreItem.kind, id: restoreItem.id, newName });
  };

  if (isLoading) return <div className="p-8 text-center text-sm text-slate-500">Đang tải thùng rác...</div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <BreadcrumbHeader>
        <span>Thùng rác</span>
        {totalItems > 0 && (
          <button onClick={() => setShowEmptyConfirm(true)} className="ml-auto neu-dark-btn px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2">
            <Trash2 className="w-4 h-4" /> Dọn sạch thùng rác
          </button>
        )}
      </BreadcrumbHeader>

      {totalItems === 0 ? (
        <div className="neu-card rounded-3xl p-12 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl neu-pill mx-auto flex items-center justify-center text-slate-400"><Trash2 className="w-6 h-6" /></div>
          <h3 className="font-bold text-base text-ink-strong">Thùng rác trống</h3>
          <p className="text-xs text-slate-400">Các mục bạn xóa sẽ xuất hiện ở đây.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {subjects.length > 0 && (
            <div className="neu-card rounded-[26px] p-5 space-y-3">
              <h3 className="text-[11px] uppercase font-bold text-slate-400">Môn đã xóa ({subjects.length})</h3>
              {subjects.map(item => (
                <TrashItemRow key={item.id} item={item} onRestore={() => setRestoreItem(item)} onPurge={() => setPurgeItem(item)} isProcessing={restore.isPending || purge.isPending} />
              ))}
            </div>
          )}

          {exams.length > 0 && (
            <div className="neu-card rounded-[26px] p-5 space-y-3">
              <h3 className="text-[11px] uppercase font-bold text-slate-400">Bộ đề đã xóa ({exams.length})</h3>
              {exams.map(item => (
                <TrashItemRow key={item.id} item={item} onRestore={() => setRestoreItem(item)} onPurge={() => setPurgeItem(item)} isProcessing={restore.isPending || purge.isPending} />
              ))}
            </div>
          )}
        </div>
      )}

      <RestoreDialog item={restoreItem} onClose={() => setRestoreItem(null)} onConfirm={handleRestoreConfirm} />
      
      <DeleteConfirmDialog 
        open={!!purgeItem} 
        onClose={() => setPurgeItem(null)} 
        onConfirm={() => purgeItem && purge.mutate({ kind: purgeItem.kind, id: purgeItem.id })}
        title={`Xóa vĩnh viễn "${purgeItem?.name}"?`}
        message="Hành động này KHÔNG THỂ HOÀN TÁC. Toàn bộ dữ liệu liên quan sẽ bị xóa khỏi ổ cứng."
      />

      <DeleteConfirmDialog 
        open={showEmptyConfirm} 
        onClose={() => setShowEmptyConfirm(false)} 
        onConfirm={() => empty.mutate()}
        title="Dọn sạch thùng rác?"
        message={`Tất cả ${totalItems} mục sẽ bị xóa vĩnh viễn và không thể khôi phục.`}
      />
    </div>
  );
}
