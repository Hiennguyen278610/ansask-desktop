import { Link } from '@tanstack/react-router';
import type { RecentAttemptItem } from '@/domain/types';

export function RecentAttempts({ items }: { items: RecentAttemptItem[] }) {
  return (
    <div className="rounded-[var(--radius-lg)] bg-[var(--surface)] p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[var(--text)]">Lượt làm bài gần đây</h3>
        <Link
          to="/history"
          className="text-xs font-semibold text-[var(--primary-text)] hover:underline"
        >
          Xem tất cả
        </Link>
      </div>
      <div className="mt-3 divide-y">
        {items.map((item) => (
          <div key={item.id} className="flex items-center justify-between gap-4 py-3 text-sm">
            <div className="min-w-0">
              <p className="truncate font-semibold text-[var(--text)]">{item.examTitle}</p>
              <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                {item.subjectName} • {item.mode === 'quiz' ? 'Trắc nghiệm' : 'Flash card'} •{' '}
                {new Date(item.submittedAt).toLocaleString('vi-VN')}
              </p>
            </div>
            <span className="shrink-0 rounded-[var(--radius-md)] bg-[var(--primary-soft)] px-2.5 py-1 text-xs font-bold text-[var(--primary-text)]">
              {Number(item.score.toFixed(2))}/10
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
