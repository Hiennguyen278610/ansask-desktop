import { useState } from 'react';
import { useNavigate, useParams } from '@tanstack/react-router';
import { Plus, Search, Upload } from 'lucide-react';
import { ExamCard } from '@/features/exam/components/ExamCard';
import { ImportErrorDialog } from '@/features/exam/components/ImportErrorDialog';
import { useExamIO } from '@/features/exam/hooks/useExamIO';
import { HeaderActions } from '@/layouts/AppLayout/MainContent/HeaderSlot';
import { useDeleteExam, useExamList } from '@/services/exam/queries';
import { InfiniteGrid } from '@/shared/components/data/InfiniteGrid';
import { EmptyState } from '@/shared/components/feedback/EmptyState';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { useDebouncedValue } from '@/shared/hooks/useDebouncedValue';
import { useGridColumns, useIsMobile } from '@/shared/hooks/useMobile';

export function ExamListPage() {
  const { subjectId } = useParams({ from: '/_app/exams/$subjectId' });
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const debouncedQuery = useDebouncedValue(search, 250);
  const q = useExamList(subjectId, debouncedQuery);
  const del = useDeleteExam();
  const { importExam, isImporting, importErrors, clearImportErrors } = useExamIO(subjectId);
  const isMobile = useIsMobile();
  const gridCols = useGridColumns();

  return (
    <>
      <HeaderActions>
        <div className="relative min-w-0 flex-1 md:w-60 md:flex-none">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2 text-[var(--text-subtle)]" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm kiếm bộ đề..."
            className="pl-8"
          />
        </div>
        <Button
          variant={isMobile ? 'default' : 'outline'}
          onClick={importExam}
          disabled={isImporting}
        >
          <Upload className="h-4 w-4" />
          Nhập bộ đề
        </Button>
        {!isMobile && (
          <Button onClick={() => navigate({ to: '/exams/$subjectId/new', params: { subjectId } })}>
            <Plus className="h-4 w-4" />
            Tạo đề
          </Button>
        )}
      </HeaderActions>

      <InfiniteGrid
        items={q.items}
        columns={gridCols}
        rowHeight={144}
        getKey={(e) => e.id}
        renderItem={(e) => <ExamCard exam={e} onDelete={() => del.mutateAsync(e.id)} />}
        hasNextPage={q.hasNextPage}
        isFetchingNextPage={q.isFetchingNextPage}
        isError={q.isFetchNextPageError}
        fetchNextPage={q.fetchNextPage}
        isLoading={q.isLoading}
        empty={
          <EmptyState
            title={debouncedQuery.trim() ? 'Không tìm thấy bộ đề phù hợp' : 'Chưa có bộ đề nào'}
            description={
              debouncedQuery.trim()
                ? 'Thử tìm với từ khóa khác.'
                : isMobile
                  ? 'Nhấn “Nhập bộ đề” để nhập bộ đề TXT hoặc JSON từ máy tính.'
                  : 'Bạn có thể nhập nhiều bộ đề từ file TXT/JSON hoặc tạo đề mới.'
            }
          />
        }
      />

      <ImportErrorDialog errors={importErrors} onClose={clearImportErrors} />
    </>
  );
}
