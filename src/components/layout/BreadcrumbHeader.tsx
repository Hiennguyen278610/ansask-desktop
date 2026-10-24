import type { ReactNode } from 'react';

export function BreadcrumbHeader({ children }: { children?: ReactNode }) {
  return (
    <header className="neu-card rounded-2xl px-5 py-4 flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-center flex-wrap gap-1.5 text-sm font-bold">
        {children ?? <span className="text-slate-400">ansask</span>}
      </div>
    </header>
  );
}
