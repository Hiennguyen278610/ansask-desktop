import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/cn';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
  children: ReactNode;
}

export function Button({ variant = 'primary', className, children, ...rest }: ButtonProps) {
  const cls =
    variant === 'primary'
      ? 'neu-dark-btn px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2'
      : 'neu-pill px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2';
  return (
    <button className={cn(cls, 'disabled:opacity-50 disabled:pointer-events-none', className)} {...rest}>
      {children}
    </button>
  );
}
