import { useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { CreateSubjectDialog } from '@/features/subject/components/CreateSubjectDialog';
import { SubjectCard } from '@/features/subject/components/SubjectCard';
import { HeaderActions } from '@/layouts/AppLayout/MainContent/HeaderSlot';
import { useDeleteSubject, useSubjectList } from '@/services/subject/queries';
import { InfiniteGrid } from '@/shared/components/data/InfiniteGrid';
import { EmptyState } from '@/shared/components/feedback/EmptyState';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { useDebouncedValue } from '@/shared/hooks/useDebouncedValue';

export function SubjectListPage() {
  const [createOpen, setCreateOpen] = useState(false);
  const [search, setSearch] = useState('');
  const debouncedQuery = useDebouncedValue(search, 250);
  const q = useSubjectList(debouncedQuery);
  const del = useDeleteSubject();

  return (
    <>
      <HeaderActions>
        <div className="relative w-60">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2 text-[var(--text-subtle)]" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm kiếm môn học..."
            className="pl-8"
          />
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" />
          Tạo môn học
        </Button>
      </HeaderActions>

      <InfiniteGrid
        items={q.items}
        columns={3}
        rowHeight={144}
        getKey={(s) => s.id}
        renderItem={(s) => <SubjectCard subject={s} onDelete={() => del.mutateAsync(s.id)} />}
        hasNextPage={q.hasNextPage}
        isFetchingNextPage={q.isFetchingNextPage}
        isError={q.isFetchNextPageError}
        fetchNextPage={q.fetchNextPage}
        isLoading={q.isLoading}
        empty={
          <EmptyState
            title={debouncedQuery.trim() ? 'Không tìm thấy môn học phù hợp' : 'Chưa có môn học nào'}
            description={
              debouncedQuery.trim()
                ? 'Thử tìm với từ khóa khác.'
                : 'Nhấn “Tạo môn học” ở góc phải để bắt đầu.'
            }
          />
        }
      />

      <CreateSubjectDialog open={createOpen} onOpenChange={setCreateOpen} />
    </>
  );
}
