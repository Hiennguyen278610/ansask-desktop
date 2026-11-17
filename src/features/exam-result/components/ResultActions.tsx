import { ArrowLeft, RotateCcw, Play } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';

interface ResultActionsProps {
  wrongCount: number;
  onBack: () => void;
  onRetryWrong: () => void;
  onPractice: () => void;
}

export function ResultActions({
  wrongCount,
  onBack,
  onRetryWrong,
  onPractice,
}: ResultActionsProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button type="button" variant="outline" onClick={onBack}>
        <ArrowLeft className="h-4 w-4" />
        Về đề bài
      </Button>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button type="button" variant="secondary" disabled={wrongCount === 0} onClick={onRetryWrong}>
          <RotateCcw className="h-4 w-4" />
          Làm lại ({wrongCount}) câu sai / bỏ trống
        </Button>
        <Button type="button" onClick={onPractice}>
          <Play className="h-4 w-4" />
          Luyện tập
        </Button>
      </div>
    </div>
  );
}
