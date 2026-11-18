import * as React from 'react';
import { cn } from '@/shared/lib/cn';

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => (
    <input
      ref={ref}
      type={type}
      className={cn(
        'flex h-9 w-full rounded-[var(--radius-md)] border bg-transparent px-3 py-1.5 text-sm text-[var(--text)] placeholder:text-[var(--text-subtle)] focus-visible:outline-2 focus-visible:outline-[var(--primary)] focus-visible:outline-offset-1 disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = 'Input';
