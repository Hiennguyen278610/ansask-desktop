import { Dialog } from '@/components/ui/Dialog';

interface Props {
  open: boolean;
  unansweredIndexes: number[];
  total: number;
  onBack: () => void;
  onConfirm: () => void;
}

export function SubmitWarningDialog({ open, unansweredIndexes, total, onBack, onConfirm }: Props) {
  return (
    <Dialog open={open} title="Cảnh báo nộp bài" onClose={onBack}
      footer={
        <>
          <button onClick={onBack} className="neu-pill px-4 py-2 rounded-xl text-xs font-bold text-slate-600">Quay lại làm tiếp</button>
          <button onClick={onConfirm} className="neu-dark-btn px-5 py-2 rounded-xl text-xs font-bold">Vẫn nộp</button>
        </>
      }>
      <div className="space-y-3">
        <p className="text-sm text-ink">Bạn còn <strong>{unansweredIndexes.length}/{total}</strong> câu chưa trả lời.</p>
        <div className="flex flex-wrap gap-2">
          {unansweredIndexes.map(i => (
            <span key={i} className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded text-xs font-bold text-slate-500">Câu {i + 1}</span>
          ))}
        </div>
        <p className="text-xs text-rose-500 pt-2 font-medium">Nếu nộp bây giờ, các câu trống sẽ được tính là SAI.</p>
      </div>
    </Dialog>
  );
}
