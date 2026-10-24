import { FileText, Award, Layers, TrendingUp } from 'lucide-react';

interface Props {
  stats: {
    totalAttempts: number;
    avgScore: string;
    totalQuestions: number;
    accuracyRate: string;
  };
}

export function MetricCards({ stats }: Props) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      <div className="neu-card rounded-2xl p-4 flex items-center justify-between">
        <div>
          <p className="text-xs text-slate-400 font-medium mb-1">Đã làm (Bài KT)</p>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-ink-strong">{stats.totalAttempts}</span>
          </div>
        </div>
        <div className="w-11 h-11 rounded-full neu-pill flex items-center justify-center text-ink-strong">
          <FileText className="w-5 h-5" />
        </div>
      </div>

      <div className="neu-card rounded-2xl p-4 flex items-center justify-between">
        <div>
          <p className="text-xs text-slate-400 font-medium mb-1">Điểm trung bình</p>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-ink-strong">{stats.avgScore}</span>
            <span className="text-xs text-slate-400 font-semibold">/ 10</span>
          </div>
        </div>
        <div className="w-11 h-11 rounded-full neu-pill flex items-center justify-center text-ink-strong">
          <Award className="w-5 h-5" />
        </div>
      </div>

      <div className="neu-card rounded-2xl p-4 flex items-center justify-between">
        <div>
          <p className="text-xs text-slate-400 font-medium mb-1">Câu đã giải</p>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-ink-strong">{stats.totalQuestions}</span>
          </div>
        </div>
        <div className="w-11 h-11 rounded-full neu-pill flex items-center justify-center text-ink-strong">
          <Layers className="w-5 h-5" />
        </div>
      </div>

      <div className="neu-card rounded-2xl p-4 flex items-center justify-between">
        <div>
          <p className="text-xs text-slate-400 font-medium mb-1">Tỉ lệ chính xác</p>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-ink-strong">{stats.accuracyRate}%</span>
          </div>
        </div>
        <div className="w-11 h-11 rounded-full neu-pill flex items-center justify-center text-ink-strong">
          <TrendingUp className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}
