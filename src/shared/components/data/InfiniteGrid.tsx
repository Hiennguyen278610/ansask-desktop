import { useEffect, useRef, type ReactNode } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useScrollContainer } from '@/layouts/AppLayout/MainContent/ScrollContext';
import { GridSkeleton } from '@/shared/components/feedback/GridSkeleton';

interface InfiniteGridProps<T> {
  items: T[];
  columns?: number;
  rowHeight: number;
  gap?: number;
  getKey: (item: T) => string;
  renderItem: (item: T) => ReactNode;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  isError?: boolean;
  fetchNextPage: () => void;
  isLoading?: boolean;
  empty?: ReactNode;
}

export function InfiniteGrid<T>({
  items,
  columns = 3,
  rowHeight,
  gap = 16,
  getKey,
  renderItem,
  hasNextPage,
  isFetchingNextPage,
  isError,
  fetchNextPage,
  isLoading,
  empty,
}: InfiniteGridProps<T>) {
  const scrollEl = useScrollContainer();
  const listRef = useRef<HTMLDivElement>(null);
  const rowCount = Math.ceil(items.length / columns);

  const v = useVirtualizer({
    count: rowCount,
    getScrollElement: () => scrollEl,
    estimateSize: () => rowHeight + gap,
    overscan: 3,
    scrollMargin: listRef.current?.offsetTop ?? 0,
  });

  const vRows = v.getVirtualItems();
  const lastIndex = vRows.at(-1)?.index ?? -1;

  useEffect(() => {
    if (lastIndex >= rowCount - 2 && hasNextPage && !isFetchingNextPage && !isError) {
      fetchNextPage();
    }
  }, [lastIndex, rowCount, hasNextPage, isFetchingNextPage, isError, fetchNextPage]);

  if (isLoading) return <GridSkeleton columns={columns} />;
  if (!items.length) return <>{empty}</>;

  return (
    <div ref={listRef} style={{ height: v.getTotalSize(), position: 'relative' }}>
      {vRows.map((row) => (
        <div
          key={row.key}
          data-index={row.index}
          ref={v.measureElement}
          className="absolute left-0 top-0 grid w-full"
          style={{
            gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
            columnGap: gap,
            paddingBottom: gap,
            transform: `translateY(${row.start - v.options.scrollMargin}px)`,
          }}
        >
          {items.slice(row.index * columns, row.index * columns + columns).map((it) => (
            <div key={getKey(it)}>{renderItem(it)}</div>
          ))}
        </div>
      ))}
    </div>
  );
}
