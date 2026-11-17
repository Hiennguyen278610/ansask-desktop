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
      <header className="flex h-14 shrink-0 items-center justify-between gap-4 bg-[var(--surface)] px-6">
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
