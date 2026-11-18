import { forwardRef, useImperativeHandle, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { cn } from '@/shared/lib/cn';
import { useSessionStore } from '../store/session.store';

const LETTERS = 'ABCDEFGHIJ';

export interface QuizViewHandle {
  scrollToIndex: (index: number) => void;
}

export const QuizView = forwardRef<QuizViewHandle>((_, ref) => {
  const session = useSessionStore((s) => s.session);
  const answers = useSessionStore((s) => s.answers);
  const select = useSessionStore((s) => s.select);
  const scrollRef = useRef<HTMLDivElement>(null);

  const questions = session?.questions ?? [];

  const v = useVirtualizer({
    count: questions.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => 220,
    overscan: 4,
    getItemKey: (i) => questions[i]?.id ?? i,
  });

  useImperativeHandle(ref, () => ({
    scrollToIndex: (index: number) => {
      v.scrollToIndex(index, { align: 'start' });
    },
  }));

  if (!session) return null;

  return (
    <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto p-4 pb-24 md:p-6 md:pb-6">
      <div className="mx-auto max-w-3xl" style={{ height: v.getTotalSize(), position: 'relative' }}>
        {v.getVirtualItems().map((row) => {
          const q = questions[row.index];
          if (!q) return null;
          const selectedId = answers[q.id] ?? null;

          return (
            <div
              key={row.key}
              data-index={row.index}
              ref={v.measureElement}
              className="absolute left-0 top-0 w-full pb-4"
              style={{ transform: `translateY(${row.start}px)` }}
            >
              <div className="rounded-[var(--radius-lg)] bg-[var(--surface)] p-5 shadow-[var(--shadow-elevated)]">
                <div className="flex items-start gap-2.5">
                  <span className="shrink-0 rounded-[var(--radius-sm)] bg-[var(--surface-muted)] px-2 py-0.5 text-xs font-semibold text-[var(--text-muted)]">
                    Câu {row.index + 1}
                  </span>
                  <p className="whitespace-pre-wrap text-sm font-medium text-[var(--text)]">
                    {q.content}
                  </p>
                </div>

                <div className="mt-4 space-y-2">
                  {q.options.map((opt, oi) => {
                    const checked = selectedId === opt.id;
                    return (
                      <label
                        key={opt.id}
                        className={cn(
                          'flex items-start gap-3 rounded-[5px] px-3.5 py-2.5 text-sm transition-colors cursor-pointer',
                          checked
                            ? 'bg-[var(--primary-soft)]'
                            : 'border bg-transparent hover:border-[var(--primary)]',
                        )}
                      >
                        <input
                          type="radio"
                          name={`quiz-${q.id}`}
                          checked={checked}
                          onChange={() => select(q.id, opt.id)}
                          className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--primary)]"
                        />
                        <span className="shrink-0 font-semibold text-[var(--text-muted)]">
                          {LETTERS[oi] ?? oi + 1}.
                        </span>
                        <span className="whitespace-pre-wrap text-[var(--text)]">{opt.content}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});
QuizView.displayName = 'QuizView';
