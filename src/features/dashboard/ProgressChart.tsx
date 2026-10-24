export function ProgressChart({ series }: { series: any[] }) {
  return (
    <section className="lg:col-span-2 neu-card rounded-[26px] p-5 sm:p-6 flex flex-col justify-between">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h3 className="text-base font-bold text-ink-strong">Biểu đồ Tiến độ & Điểm số</h3>
          <p className="text-xs text-slate-400">Kết hợp biểu đồ cột (Số bài) và biểu đồ đường (Điểm TB)</p>
        </div>
      </div>
      <div className="relative pt-4 pb-2">
        <div className="space-y-9 text-[11px] text-slate-400 font-medium">
          {[10, 7.5, 5.0, 2.5, 0].map((mark) => (
            <div key={mark} className="flex items-center gap-3">
              <span className="w-7 text-right">{mark}đ</span>
              <div className="flex-1 border-b border-slate-200/80 dark:border-slate-700/80" />
            </div>
          ))}
        </div>
        <div className="absolute inset-0 left-10 right-2 top-4 bottom-7 flex items-end justify-around">
          <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible" viewBox="0 0 600 180" preserveAspectRatio="none">
            <polyline
              fill="none"
              stroke="var(--chart-line)"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={series.map((item, idx) => {
                const x = ((idx + 0.5) / series.length) * 600;
                const y = 180 - (item.avgScore / 10) * 165;
                return `${x},${y}`;
              }).join(' ')}
            />
          </svg>
          {series.map((item, idx) => {
            const scoreHeightPct = Math.min(100, (item.avgScore / 10) * 100);
            const maxCount = Math.max(...series.map((s) => s.count), 10);
            const countTrackPct = Math.min(100, Math.max(35, (item.count / maxCount) * 100));
            return (
              <div key={idx} className="flex flex-col items-center h-full justify-end group relative z-10">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-9 bg-ink-strong text-white text-[10px] font-bold px-2.5 py-1 rounded-lg whitespace-nowrap shadow-md pointer-events-none">
                  {item.count} đề • TB {item.avgScore}đ
                </div>
                <div style={{ height: `${countTrackPct}%` }} className="w-3.5 sm:w-4 rounded-full bg-[var(--chart-bar-track)] shadow-inner p-0.5 flex items-end transition-all duration-500">
                  <div style={{ height: `${scoreHeightPct}%` }} className="w-full rounded-full bg-gradient-to-t from-ink-strong via-ink to-slate-500 transition-all duration-500" />
                </div>
                <span className="text-[11px] font-semibold text-slate-400 mt-3">{item.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
