import { useEffect, useState } from 'react';

function formatDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function Timer({
  elapsedSecBase = 0,
  resumedAt,
}: {
  elapsedSecBase?: number;
  resumedAt: number;
}) {
  const calc = () => elapsedSecBase + Math.max(0, Math.floor((Date.now() - resumedAt) / 1000));
  const [elapsed, setElapsed] = useState(calc);

  useEffect(() => {
    setElapsed(elapsedSecBase + Math.max(0, Math.floor((Date.now() - resumedAt) / 1000)));
    const id = window.setInterval(() => {
      setElapsed(elapsedSecBase + Math.max(0, Math.floor((Date.now() - resumedAt) / 1000)));
    }, 1000);
    return () => window.clearInterval(id);
  }, [elapsedSecBase, resumedAt]);

  return <span className="font-mono text-sm font-semibold tabular-nums">{formatDuration(elapsed)}</span>;
}
