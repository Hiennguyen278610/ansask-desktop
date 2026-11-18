import { useState } from 'react';
import { List, Lock, Save } from 'lucide-react';
import { IndexGridDialog } from '@/shared/components/data/IndexGridDialog';
import { Button } from '@/shared/components/ui/button';
import { Progress } from '@/shared/components/ui/progress';
import { useSessionStore } from '../store/session.store';
import { Timer } from './Timer';

interface TakingHeaderProps {
  onSubmit: () => void;
  onSaveAndExit: () => void;
  isSubmitting?: boolean;
  isSavingDraft?: boolean;
  onJumpToQuestion?: (index: number) => void;
}

export function TakingHeader({
  onSubmit,
  onSaveAndExit,
  isSubmitting,
  isSavingDraft,
  onJumpToQuestion,
}: TakingHeaderProps) {
  const session = useSessionStore((s) => s.session);
  const answers = useSessionStore((s) => s.answers);
  const [gridOpen, setGridOpen] = useState(false);

  if (!session) return null;

  const total = session.questions.length;
  const answeredCount = session.questions.filter((q) => answers[q.id] != null).length;
  const pct = total === 0 ? 0 : Math.round((answeredCount / total) * 100);

  return (
    <>
      {/* Mobile Header: progress bar only */}
      <header className="flex shrink-0 items-center gap-3 bg-[var(--surface)] px-4 pt-10 pb-3 md:hidden">
        <Progress value={pct} className="flex-1" />
        <span className="shrink-0 text-xs font-semibold text-[var(--text-muted)]">
          {answeredCount}/{total}
        </span>
      </header>

      {/* Desktop Header */}
      <header className="hidden h-14 shrink-0 items-center justify-between gap-4 bg-[var(--surface)] px-6 md:flex">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 text-[var(--text)]">
            <Lock className="h-4 w-4 text-[var(--primary-text)]" />
            <Timer elapsedSecBase={session.elapsedSecBase} resumedAt={session.resumedAt} />
          </div>

          <div className="w-48 space-y-1">
            <div className="flex justify-between text-xs font-medium text-[var(--text-muted)]">
              <span>
                Đã chọn {answeredCount}/{total}
              </span>
            </div>
            <Progress value={pct} />
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {session.mode === 'quiz' && (
            <Button type="button" variant="outline" size="sm" onClick={() => setGridOpen(true)}>
              <List className="h-4 w-4" />
              <span>{total} câu</span>
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            onClick={onSaveAndExit}
            disabled={isSavingDraft || isSubmitting}
          >
            <Save className="h-4 w-4" />
            Lưu & thoát
          </Button>
          <Button type="button" onClick={onSubmit} disabled={isSubmitting || isSavingDraft}>
            Nộp bài
          </Button>
        </div>
      </header>

      {/* Mobile Floating Bottom Bar */}
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 px-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] md:hidden">
        <div className="pointer-events-auto mx-auto flex max-w-md items-center justify-between gap-2 rounded-2xl bg-[var(--surface)] px-4 py-2.5 shadow-[0_8px_28px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_28px_rgba(0,0,0,0.45)]">
          <div className="flex items-center gap-2 text-[var(--text)]">
            <Lock className="h-4 w-4 text-[var(--primary-text)]" />
            <Timer elapsedSecBase={session.elapsedSecBase} resumedAt={session.resumedAt} />
          </div>

          <div className="flex items-center gap-2">
            {session.mode === 'quiz' && (
              <Button type="button" variant="outline" size="sm" onClick={() => setGridOpen(true)}>
                <List className="h-4 w-4" />
                <span>{total}</span>
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={onSaveAndExit}
              disabled={isSavingDraft || isSubmitting}
              aria-label="Lưu & thoát"
              title="Lưu & thoát"
            >
              <Save className="h-4 w-4" />
            </Button>
            <Button type="button" size="sm" onClick={onSubmit} disabled={isSubmitting || isSavingDraft}>
              Nộp bài
            </Button>
          </div>
        </div>
      </div>

      {session.mode === 'quiz' && (
        <IndexGridDialog
          open={gridOpen}
          onOpenChange={setGridOpen}
          count={total}
          isDone={(i) => answers[session.questions[i]?.id ?? ''] != null}
          onSelect={(i) => onJumpToQuestion?.(i)}
        />
      )}
    </>
  );
}
