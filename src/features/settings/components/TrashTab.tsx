import { useState } from 'react';
import { RotateCcw, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import type { TrashItem } from '@/domain/types';
import { ScrollContext } from '@/layouts/AppLayout/MainContent/ScrollContext';
import { usePurgeTrash, useRestoreTrash, useTrashList } from '@/services/trash/queries';
import { InfiniteGrid } from '@/shared/components/data/InfiniteGrid';
import { ConfirmDialog } from '@/shared/components/feedback/ConfirmDialog';
import { EmptyState } from '@/shared/components/feedback/EmptyState';
import { Button } from '@/shared/components/ui/button';
import { cn } from '@/shared/lib/cn';

export function TrashTab() {
  const [kind, setKind] = useState<'subject' | 'exam'>('subject');
  const [scrollEl, setScrollEl] = useState<HTMLDivElement | null>(null);
  const [purgeTarget, setPurgeTarget] = useState<TrashItem | null>(null);

  const q = useTrashList(kind);
  const restore = useRestoreTrash();
  const purge = usePurgeTrash();

  return (
    <div className="flex h-full flex-col">
      <div className="mb-3 flex items-center gap-2">
        <button
          type="button"
          onClick={() => setKind('subject')}
          className={cn(
            'rounded-[var(--radius-md)] px-3 py-1.5 text-sm font-medium transition-colors cursor-pointer',
            kind === 'subject'
              ? 'bg-[var(--primary-soft)] text-[var(--primary-text)]'
              : 'bg-[var(--surface)] text-[var(--text-muted)] hover:bg-[var(--surface-hover)]',
          )}
        >
          Môn học
        </button>
        <button
          type="button"
          onClick={() => setKind('exam')}
          className={cn(
            'rounded-[var(--radius-md)] px-3 py-1.5 text-sm font-medium transition-colors cursor-pointer',
            kind === 'exam'
              ? 'bg-[var(--primary-soft)] text-[var(--primary-text)]'
              : 'bg-[var(--surface)] text-[var(--text-muted)] hover:bg-[var(--surface-hover)]',
          )}
        >
          Bộ đề
        </button>
      </div>

      <ScrollContext.Provider value={scrollEl}>
        <div ref={setScrollEl} className="min-h-0 flex-1 overflow-y-auto pr-1">
          <InfiniteGrid
            items={q.items}
            columns={1}
            rowHeight={68}
            gap={10}
            getKey={(item) => item.id}
            hasNextPage={q.hasNextPage}
            isFetchingNextPage={q.isFetchingNextPage}
            isError={q.isFetchNextPageError}
            fetchNextPage={q.fetchNextPage}
            isLoading={q.isLoading}
            empty={<EmptyState title="Thùng rác trống" description="Chưa có mục nào bị xóa." />}
            renderItem={(item) => (
              <div className="flex items-center justify-between gap-3 rounded-[var(--radius-md)] bg-[var(--surface)] px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-[var(--text)]">{item.name}</p>
                  <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                    {item.parentName ? `${item.parentName} • ` : ''}
                    Xóa lúc {new Date(item.deletedAt).toLocaleString('vi-VN')}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={restore.isPending}
                    onClick={() =>
                      restore.mutate(
                        { kind: item.kind, id: item.id },
                        { onSuccess: () => toast.success('Đã khôi phục') },
                      )
                    }
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Khôi phục
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => setPurgeTarget(item)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Xóa vĩnh viễn
                  </Button>
                </div>
              </div>
            )}
          />
        </div>
      </ScrollContext.Provider>

      <ConfirmDialog
        open={purgeTarget !== null}
        onOpenChange={(open) => {
          if (!open) setPurgeTarget(null);
        }}
        title="Xóa vĩnh viễn?"
        description={
          purgeTarget
            ? `Hành động này sẽ xóa vĩnh viễn "${purgeTarget.name}" và không thể hoàn tác.`
            : undefined
        }
        confirmLabel="Xóa vĩnh viễn"
        destructive
        loading={purge.isPending}
        onConfirm={() => {
          if (!purgeTarget) return;
          purge.mutate(
            { kind: purgeTarget.kind, id: purgeTarget.id },
            {
              onSuccess: () => {
                toast.success('Đã xóa vĩnh viễn');
                setPurgeTarget(null);
              },
            },
          );
        }}
      />
    </div>
  );
}
