export function GridSkeleton({ columns = 3, count = 6 }: { columns?: number; count?: number }) {
  return (
    <div
      className="grid gap-4"
      style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
    >
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="h-36 animate-pulse rounded-[var(--radius-lg)] bg-[var(--surface)] p-4"
        >
          <div className="h-5 w-2/3 rounded bg-[var(--surface-muted)]" />
          <div className="mt-4 h-4 w-1/2 rounded bg-[var(--surface-muted)]" />
          <div className="mt-8 h-4 w-1/3 rounded bg-[var(--surface-muted)]" />
        </div>
      ))}
    </div>
  );
}
