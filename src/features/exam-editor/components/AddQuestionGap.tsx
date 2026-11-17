import { Plus } from 'lucide-react';
import { cn } from '@/shared/lib/cn';

interface AddQuestionGapProps {
  onAdd: () => void;
  alwaysVisible?: boolean;
}

export function AddQuestionGap({ onAdd, alwaysVisible = false }: AddQuestionGapProps) {
  return (
    <div
      className={cn(
        'group flex items-center justify-center transition-all',
        alwaysVisible ? 'py-2' : 'h-5 hover:h-11',
      )}
    >
      <button
        type="button"
        onClick={onAdd}
        className={cn(
          'flex w-full items-center justify-center gap-1.5 rounded-[var(--radius-md)] border border-dashed py-2 text-xs font-semibold text-[var(--text-muted)] transition-all hover:border-[var(--primary)] hover:text-[var(--primary)] cursor-pointer',
          alwaysVisible ? 'opacity-100' : 'opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto',
        )}
      >
        <Plus className="h-3.5 w-3.5" />
        Thêm câu hỏi
      </button>
    </div>
  );
}
