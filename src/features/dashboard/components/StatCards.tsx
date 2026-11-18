import { BookOpen, CheckCircle2, FileText, HelpCircle } from 'lucide-react';
import type { StatsTotals } from '@/domain/types';

export function StatCards({ totals }: { totals: StatsTotals }) {
  const cards = [
    { label: 'Môn học', value: totals.subjects, icon: BookOpen },
    { label: 'Bộ đề', value: totals.exams, icon: FileText },
    { label: 'Tổng câu hỏi', value: totals.questions, icon: HelpCircle },
    { label: 'Lượt làm bài', value: totals.attempts, icon: CheckCircle2 },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
      {cards.map((c) => {
        const Icon = c.icon;
        return (
          <div
            key={c.label}
            className="flex items-center justify-between gap-2 rounded-[var(--radius-lg)] bg-[var(--surface)] p-4 sm:p-5"
          >
            <div className="min-w-0">
              <p className="truncate text-xs font-medium text-[var(--text-muted)]">{c.label}</p>
              <p className="mt-1 text-xl font-bold text-[var(--text)] sm:text-2xl">{c.value}</p>
            </div>
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--primary-soft)] text-[var(--primary)] sm:h-10 sm:w-10">
              <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
          </div>
        );
      })}
    </div>
  );
}
