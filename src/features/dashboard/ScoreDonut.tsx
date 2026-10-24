interface Props {
  avgScore: string;
  distribution: { excellentPct: string; goodPct: string; averagePct: string };
}

export function ScoreDonut({ avgScore, distribution }: Props) {
  return (
    <section className="neu-card rounded-[26px] p-5 sm:p-6 flex flex-col justify-between items-center">
      <div className="w-full flex items-center justify-between mb-2">
        <h3 className="text-base font-bold text-ink-strong">Phổ Điểm (Tỉ lệ)</h3>
        <span className="neu-pill px-3 py-1 rounded-full text-[11px] font-bold text-slate-500">All Time</span>
      </div>
      <div className="relative my-3 w-44 h-44 rounded-full neu-pill flex items-center justify-center p-4">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r="46" fill="none" stroke="var(--chart-bar-track)" strokeWidth="12" />
          <circle cx="60" cy="60" r="46" fill="none" stroke="var(--ink-900)" strokeWidth="12"
            strokeDasharray={`${(Number(distribution.excellentPct) / 100) * 289} 289`} strokeLinecap="round" />
          <circle cx="60" cy="60" r="46" fill="none" stroke="var(--ink-700)" strokeWidth="12"
            strokeDasharray={`${(Number(distribution.goodPct) / 100) * 289} 289`} strokeDashoffset={`-${(Number(distribution.excellentPct) / 100) * 289}`} strokeLinecap="round" />
          <circle cx="60" cy="60" r="46" fill="none" stroke="var(--ink-800)" strokeWidth="12" opacity="0.4"
            strokeDasharray={`${(Number(distribution.averagePct) / 100) * 289} 289`} strokeDashoffset={`-${((Number(distribution.excellentPct) + Number(distribution.goodPct)) / 100) * 289}`} strokeLinecap="round" />
        </svg>
        <div className="absolute inset-8 rounded-full neu-card-inset flex flex-col items-center justify-center text-center">
          <span className="text-xl font-bold text-ink-strong">{avgScore}đ</span>
          <span className="text-[11px] text-slate-400 font-medium">Điểm TB</span>
        </div>
      </div>
      <div className="w-full grid grid-cols-3 gap-2 pt-2 text-center">
        <div>
          <div className="flex items-center justify-center gap-1 text-[11px] text-slate-400">
            <span className="w-2 h-2 rounded-sm bg-ink-strong" />
            <span>Xuất sắc</span>
          </div>
          <p className="font-bold text-sm text-ink-strong mt-0.5">{distribution.excellentPct}%</p>
        </div>
        <div>
          <div className="flex items-center justify-center gap-1 text-[11px] text-slate-400">
            <span className="w-2 h-2 rounded-sm bg-ink-700" />
            <span>Khá giỏi</span>
          </div>
          <p className="font-bold text-sm text-ink-strong mt-0.5">{distribution.goodPct}%</p>
        </div>
        <div>
          <div className="flex items-center justify-center gap-1 text-[11px] text-slate-400">
            <span className="w-2 h-2 rounded-sm bg-ink-800 opacity-40" />
            <span>Cần cố gắng</span>
          </div>
          <p className="font-bold text-sm text-ink-strong mt-0.5">{distribution.averagePct}%</p>
        </div>
      </div>
    </section>
  );
}
