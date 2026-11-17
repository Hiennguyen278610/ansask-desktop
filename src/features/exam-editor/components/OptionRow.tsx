import { Trash2 } from 'lucide-react';
import type { DraftOption } from '@/domain/types';
import { AutoGrowTextarea } from '@/shared/components/form/AutoGrowTextarea';
import { cn } from '@/shared/lib/cn';

const LETTERS = 'ABCDEFGHIJ';

interface OptionRowProps {
  questionUid: string;
  option: DraftOption;
  index: number;
  canRemove: boolean;
  onSelectCorrect: () => void;
  onChangeContent: (v: string) => void;
  onRemove: () => void;
}

export function OptionRow({
  questionUid,
  option,
  index,
  canRemove,
  onSelectCorrect,
  onChangeContent,
  onRemove,
}: OptionRowProps) {
  return (
    <div className="flex items-start gap-2">
      <input
        type="radio"
        name={`correct-${questionUid}`}
        checked={option.isCorrect}
        onChange={onSelectCorrect}
        className="mt-2.5 h-4 w-4 shrink-0 accent-[var(--primary)] cursor-pointer"
        aria-label={`Chọn đáp án ${LETTERS[index] ?? index + 1} là đúng`}
      />
      <span className="mt-2 w-5 shrink-0 text-sm font-semibold text-[var(--text-muted)]">
        {LETTERS[index] ?? index + 1}
      </span>
      <AutoGrowTextarea
        value={option.content}
        onChange={(e) => onChangeContent(e.target.value)}
        placeholder="Nội dung lựa chọn"
        className={cn('flex-1', option.isCorrect && 'border-[var(--success)]')}
      />
      {option.isCorrect && (
        <span className="mt-2 shrink-0 rounded-[var(--radius-sm)] bg-[var(--success-soft)] px-2 py-0.5 text-xs font-semibold text-[var(--success-text)]">
          Đúng
        </span>
      )}
      <button
        type="button"
        disabled={!canRemove}
        onClick={onRemove}
        title="Xóa lựa chọn"
        className="mt-1.5 shrink-0 rounded-[var(--radius-sm)] p-1.5 text-[var(--text-subtle)] transition-colors hover:bg-[var(--destroy-soft)] hover:text-[var(--destroy-text)] disabled:pointer-events-none disabled:opacity-30 cursor-pointer"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}
