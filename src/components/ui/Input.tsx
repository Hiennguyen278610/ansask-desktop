import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...rest }, ref) => (
    <input
      ref={ref}
      className={cn(
        'w-full px-4 py-2.5 rounded-xl neu-card-inset text-sm font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ink-800)]',
        className
      )}
      {...rest}
    />
  )
);
Input.displayName = 'Input';
