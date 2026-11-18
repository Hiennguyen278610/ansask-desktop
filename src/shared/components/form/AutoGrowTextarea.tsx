import * as React from 'react';
import { useEffect, useLayoutEffect, useRef } from 'react';
import { cn } from '@/shared/lib/cn';

export interface AutoGrowTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  minRows?: number;
}

export const AutoGrowTextarea = React.forwardRef<HTMLTextAreaElement, AutoGrowTextareaProps>(
  ({ className, value, onChange, minRows = 1, ...props }, ref) => {
    const innerRef = useRef<HTMLTextAreaElement | null>(null);

    const setRefs = (el: HTMLTextAreaElement | null) => {
      innerRef.current = el;
      if (typeof ref === 'function') ref(el);
      else if (ref) ref.current = el;
    };

    const resize = () => {
      const el = innerRef.current;
      if (!el) return;
      el.style.height = 'auto';
      el.style.height = `${el.scrollHeight}px`;
    };

    useLayoutEffect(() => {
      resize();
    }, [value]);

    useEffect(() => {
      resize();
    }, []);

    return (
      <textarea
        ref={setRefs}
        rows={minRows}
        value={value}
        onChange={(e) => {
          onChange?.(e);
          resize();
        }}
        className={cn(
          'w-full resize-none overflow-hidden rounded-[var(--radius-md)] border bg-transparent px-3 py-1.5 text-sm text-[var(--text)] placeholder:text-[var(--text-subtle)] focus-visible:outline-2 focus-visible:outline-[var(--primary)] focus-visible:outline-offset-1',
          className,
        )}
        {...props}
      />
    );
  },
);
AutoGrowTextarea.displayName = 'AutoGrowTextarea';
