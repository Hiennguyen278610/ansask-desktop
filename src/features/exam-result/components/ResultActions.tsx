import { ArrowLeft, RotateCcw, Play } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';

interface ResultActionsProps {
  wrongCount: number;
  onBack: () => void;
  onRetryWrong: () => void;
  onPractice: () => void;
  hideBackOnMobile?: boolean;
}

export function ResultActions({
  wrongCount,
  onBack,
  onRetryWrong,
  onPractice,
  hideBackOnMobile = false,
}: ResultActionsProps) {
  return (
    <div className="flex w-full flex-wrap items-center gap-2 md:w-auto md:gap-3">
      <Button
        type="button"
        variant="outline"
        onClick={onBack}
        className={hideBackOnMobile ? 'hidden md:inline-flex' : undefined}
      >
        <ArrowLeft className="h-4 w-4" />
        Về đề bài
      </Button>
      <div className="grid w-full grid-cols-2 gap-2 md:flex md:w-auto">
        <Button type="button" variant="secondary" disabled={wrongCount === 0} onClick={onRetryWrong}>
          <RotateCcw className="h-4 w-4" />
          <span className="truncate">Làm lại ({wrongCount})</span>
        </Button>
        <Button type="button" onClick={onPractice}>
          <Play className="h-4 w-4" />
          Luyện tập
        </Button>
      </div>
    </div>
  );
}
