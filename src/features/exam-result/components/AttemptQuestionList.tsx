import { useMemo, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { CheckCircle2, MinusCircle, XCircle } from 'lucide-react';
import type { AnswerRecord, AttemptMode, Id, Question } from '@/domain/types';
import { useScrollContainer } from '@/layouts/AppLayout/MainContent/ScrollContext';
import { EmptyState } from '@/shared/components/feedback/EmptyState';
import { cn } from '@/shared/lib/cn';
import { getQuestionStatus, type ResultFilter } from '../utils';

const LETTERS = 'ABCDEFGHIJ';

interface AttemptQuestionListProps {
  questions: Question[];
  answers: Record<Id, AnswerRecord>;
  mode: AttemptMode;
  filter: ResultFilter;
}

export function AttemptQuestionList({
  questions,
  answers,
  mode,
  filter,
}: AttemptQuestionListProps) {
  const scrollEl = useScrollContainer();
  const listRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(
    () =>
      questions
        .map((q, index) => ({ q, index, status: getQuestionStatus(q, answers) }))
        .filter((item) => filter === 'all' || item.status === filter),
    [questions, answers, filter],
  );

  const v = useVirtualizer({
    count: filtered.length,
    getScrollElement: () => scrollEl,
    estimateSize: () => 220,
    overscan: 4,
    scrollMargin: listRef.current?.offsetTop ?? 0,
  });

  if (filtered.length === 0) {
    return (
      <EmptyState
        title="Không có câu hỏi nào trong nhóm này"
        description="Chọn bộ lọc khác để xem các câu hỏi còn lại."
      />
    );
  }

  return (
    <div ref={listRef} style={{ height: v.getTotalSize(), position: 'relative' }}>
      {v.getVirtualItems().map((row) => {
        const entry = filtered[row.index];
        if (!entry) return null;
        const { q, index, status } = entry;
        const selectedId = answers[q.id]?.selectedOptionId ?? null;
        const flashcardWrongFinalMatch =
          mode === 'flashcard' &&
          status === 'wrong' &&
          selectedId != null &&
          q.options.some((o) => o.id === selectedId && o.isCorrect);

        return (
          <div
            key={q.id}
            data-index={row.index}
            ref={v.measureElement}
            className="absolute left-0 top-0 w-full pb-4"
            style={{ transform: `translateY(${row.start - v.options.scrollMargin}px)` }}
          >
            <div className="rounded-[var(--radius-lg)] bg-[var(--surface)] p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex min-w-0 flex-1 items-start gap-2.5">
                  <span className="shrink-0 rounded-[var(--radius-sm)] bg-[var(--surface-muted)] px-2 py-0.5 text-xs font-semibold text-[var(--text-muted)]">
                    Câu {index + 1}
                  </span>
                  <p className="whitespace-pre-wrap text-sm font-medium text-[var(--text)]">
                    {q.content}
                  </p>
                </div>

                {status === 'correct' && (
                  <span className="inline-flex shrink-0 items-center gap-1 rounded-[var(--radius-sm)] bg-[var(--success-soft)] px-2.5 py-1 text-xs font-semibold text-[var(--success-text)]">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Đúng
                  </span>
                )}
                {status === 'wrong' && (
                  <span className="inline-flex shrink-0 items-center gap-1 rounded-[var(--radius-sm)] bg-[var(--destroy-soft)] px-2.5 py-1 text-xs font-semibold text-[var(--destroy-text)]">
                    <XCircle className="h-3.5 w-3.5" />
                    Sai
                  </span>
                )}
                {status === 'unanswered' && (
                  <span className="inline-flex shrink-0 items-center gap-1 rounded-[var(--radius-sm)] bg-[var(--warning-soft)] px-2.5 py-1 text-xs font-semibold text-[var(--warning-text)]">
                    <MinusCircle className="h-3.5 w-3.5" />
                    Bỏ trống
                  </span>
                )}
              </div>

              <div className="mt-3 space-y-2">
                {q.options.map((opt, oi) => {
                  const isSelected = selectedId === opt.id;
                  const isCorrect = opt.isCorrect;

                  let rowClass = 'border bg-transparent text-[var(--text)]';
                  let tag: string | null = null;

                  if (isCorrect && isSelected) {
                    rowClass = 'bg-[var(--success-soft)] text-[var(--success-text)] font-medium';
                    tag =
                      status === 'wrong'
                        ? 'Đáp án cuối cùng • Đáp án đúng'
                        : 'Bạn chọn • Đáp án đúng';
                  } else if (isCorrect) {
                    rowClass = 'bg-[var(--success-soft)] text-[var(--success-text)] font-medium';
                    tag = 'Đáp án đúng';
                  } else if (isSelected) {
                    rowClass = 'bg-[var(--destroy-soft)] text-[var(--destroy-text)] font-medium';
                    tag = 'Bạn chọn';
                  }

                  return (
                    <div
                      key={opt.id}
                      className={cn(
                        'flex items-center justify-between gap-3 rounded-[var(--radius-md)] px-3 py-2 text-sm',
                        rowClass,
                      )}
                    >
                      <div className="flex min-w-0 items-start gap-2.5">
                        <span className="shrink-0 font-semibold">{LETTERS[oi] ?? oi + 1}.</span>
                        <span className="whitespace-pre-wrap">{opt.content}</span>
                      </div>
                      {tag && <span className="shrink-0 text-xs font-semibold">{tag}</span>}
                    </div>
                  );
                })}
              </div>

              {flashcardWrongFinalMatch && (
                <p className="mt-3 text-xs font-medium text-[var(--destroy-text)]">
                  Flash card tính là sai vì lần chọn đầu tiên chưa đúng.
                </p>
              )}

              {status === 'unanswered' && (
                <p className="mt-3 text-xs font-medium text-[var(--warning-text)]">
                  Bạn đã bỏ trống câu này.
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
