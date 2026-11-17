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
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((c) => {
        const Icon = c.icon;
        return (
          <div
            key={c.label}
            className="flex items-center justify-between rounded-[var(--radius-lg)] bg-[var(--surface)] p-5"
          >
            <div>
              <p className="text-xs font-medium text-[var(--text-muted)]">{c.label}</p>
              <p className="mt-1 text-2xl font-bold text-[var(--text)]">{c.value}</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] bg-[var(--primary-soft)] text-[var(--primary)]">
              <Icon className="h-5 w-5" />
            </div>
          </div>
        );
      })}
    </div>
  );
}
