import { useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import type { Question } from '@/domain/types';
import { useScrollContainer } from '@/layouts/AppLayout/MainContent/ScrollContext';
import { EmptyState } from '@/shared/components/feedback/EmptyState';
import { cn } from '@/shared/lib/cn';

const LETTERS = 'ABCDEFGHIJ';

interface ExamQuestionListProps {
  questions: Question[];
  showAnswers: boolean;
}

export function ExamQuestionList({ questions, showAnswers }: ExamQuestionListProps) {
  const scrollEl = useScrollContainer();
  const listRef = useRef<HTMLDivElement>(null);

  const v = useVirtualizer({
    count: questions.length,
    getScrollElement: () => scrollEl,
    estimateSize: () => 180,
    overscan: 5,
    scrollMargin: listRef.current?.offsetTop ?? 0,
  });

  if (questions.length === 0) {
    return <EmptyState title="Bộ đề chưa có câu hỏi" />;
  }

  return (
    <div ref={listRef} style={{ height: v.getTotalSize(), position: 'relative' }}>
      {v.getVirtualItems().map((row) => {
        const q = questions[row.index];
        return (
          <div
            key={q.id}
            data-index={row.index}
            ref={v.measureElement}
            className="absolute left-0 top-0 w-full pb-4"
            style={{ transform: `translateY(${row.start - v.options.scrollMargin}px)` }}
          >
            <div className="rounded-[var(--radius-lg)] bg-[var(--surface)] p-5">
              <div className="flex items-start gap-2">
                <span className="shrink-0 rounded-[var(--radius-sm)] bg-[var(--surface-muted)] px-2 py-0.5 text-xs font-semibold text-[var(--text-muted)]">
                  Câu {row.index + 1}
                </span>
                <p className="whitespace-pre-wrap text-sm font-medium text-[var(--text)]">
                  {q.content}
                </p>
              </div>
              <div className="mt-3 space-y-2">
                {q.options.map((opt, oi) => {
                  const highlight = showAnswers && opt.isCorrect;
                  return (
                    <div
                      key={opt.id}
                      className={cn(
                        'flex items-center justify-between gap-3 rounded-[5px] px-3 py-2 text-sm',
                        highlight
                          ? 'bg-[var(--success-soft)] text-[var(--success-text)] font-medium'
                          : 'border bg-transparent text-[var(--text)]',
                      )}
                    >
                      <div className="flex min-w-0 items-start gap-2.5">
                        <span className="shrink-0 font-semibold">{LETTERS[oi] ?? oi + 1}.</span>
                        <span className="whitespace-pre-wrap">{opt.content}</span>
                      </div>
                      {highlight && (
                        <span className="shrink-0 text-xs font-semibold">Đúng</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
