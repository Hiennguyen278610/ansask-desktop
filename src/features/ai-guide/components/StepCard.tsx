import type { ReactNode } from 'react';

export function StepCard({ title, content }: { title: string; content: ReactNode }) {
  return (
    <div className="rounded-[var(--radius-lg)] bg-[var(--surface)] p-5">
      <h3 className="text-sm font-bold text-[var(--primary)]">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-[var(--text-muted)]">{content}</p>
    </div>
  );
}
