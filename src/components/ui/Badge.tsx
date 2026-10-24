import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export function Badge({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span className={cn('neu-pill px-3 py-1 rounded-full text-xs font-bold', className)}>
      {children}
    </span>
  );
}
