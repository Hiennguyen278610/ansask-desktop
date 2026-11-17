import { Button } from '@/shared/components/ui/button';
import { cn } from '@/shared/lib/cn';
import { useSessionStore } from '../store/session.store';

const LETTERS = 'ABCDEFGHIJ';

export function FlashcardView({ onFinish }: { onFinish: () => void }) {
  const session = useSessionStore((s) => s.session);
  const answers = useSessionStore((s) => s.answers);
  const index = useSessionStore((s) => s.index);
  const wrongHint = useSessionStore((s) => s.wrongHint);
  const select = useSessionStore((s) => s.select);
  const confirm = useSessionStore((s) => s.confirm);

  if (!session) return null;
  const q = session.questions[index];
  if (!q) return null;

  const selectedId = answers[q.id] ?? null;

  const handleConfirm = () => {
    const res = confirm();
    if (res === 'finished') {
      onFinish();
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-2xl rounded-[var(--radius-lg)] bg-[var(--surface)] p-6 shadow-[var(--shadow-elevated)]">
          <div className="flex items-start gap-2.5">
            <span className="shrink-0 rounded-[var(--radius-sm)] bg-[var(--surface-muted)] px-2 py-0.5 text-xs font-semibold text-[var(--text-muted)]">
              Câu {index + 1}
            </span>
            <p className="whitespace-pre-wrap text-base font-medium text-[var(--text)]">
              {q.content}
            </p>
          </div>

          <div className="mt-5 space-y-2.5">
            {q.options.map((opt, oi) => {
              const checked = selectedId === opt.id;
              return (
                <label
                  key={opt.id}
                  className={cn(
                    'flex items-start gap-3 rounded-[5px] px-4 py-3 text-sm transition-colors cursor-pointer',
                    checked
                      ? 'bg-[var(--primary-soft)]'
                      : 'border bg-transparent hover:border-[var(--primary)]',
                  )}
                >
                  <input
                    type="radio"
                    name={`flashcard-${q.id}`}
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

      <footer className="flex h-16 shrink-0 items-center justify-between bg-[var(--surface)] px-6">
        <p className={cn('text-sm font-medium text-[var(--destroy-text)]', !wrongHint && 'invisible')}>
          Sai rồi, thử lại lần nữa
        </p>
        <Button type="button" disabled={selectedId == null} onClick={handleConfirm}>
          Xác nhận
        </Button>
      </footer>
    </div>
  );
}
