import { useEffect, useId, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from '@/shared/lib/cn';

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  value: string;
  onValueChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  ariaLabel?: string;
  className?: string;
}

/**
 * Custom accessible Select dropdown styled with project CSS tokens.
 * Replaces native `<select>` so desktop WebViews do not fall back to OS white widgets.
 */
export function Select({
  value,
  onValueChange,
  options,
  placeholder = 'Chọn...',
  ariaLabel,
  className,
}: SelectProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const listboxId = useId();

  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  return (
    <div ref={containerRef} className={cn('relative inline-block', className)}>
      <button
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          'inline-flex h-9 min-w-[180px] items-center justify-between gap-2 rounded-[var(--radius-md)] bg-[var(--surface)] px-3 text-sm font-medium text-[var(--text)] transition-colors hover:bg-[var(--surface-hover)] focus-visible:outline-2 focus-visible:outline-[var(--primary)] focus-visible:outline-offset-1 cursor-pointer',
        )}
      >
        <span className="truncate">{selectedOption ? selectedOption.label : placeholder}</span>
        <ChevronDown
          className={cn(
            'h-4 w-4 shrink-0 text-[var(--text-muted)] transition-transform duration-150',
            open && 'rotate-180',
          )}
        />
      </button>

      {open && (
        <ul
          id={listboxId}
          role="listbox"
          aria-label={ariaLabel}
          className="absolute right-0 z-50 mt-1.5 max-h-64 min-w-full w-max max-w-xs overflow-y-auto rounded-[var(--radius-md)] bg-[var(--surface)] p-1 shadow-[var(--shadow-elevated)]"
        >
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <li
                key={opt.value}
                role="option"
                aria-selected={isSelected}
                tabIndex={0}
                onClick={() => {
                  onValueChange(opt.value);
                  setOpen(false);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onValueChange(opt.value);
                    setOpen(false);
                  }
                }}
                className={cn(
                  'flex items-center justify-between gap-3 rounded-[var(--radius-sm)] px-3 py-2 text-sm transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-[var(--primary)]',
                  isSelected
                    ? 'bg-[var(--primary-soft)] font-semibold text-[var(--primary-text)]'
                    : 'text-[var(--text)] hover:bg-[var(--surface-hover)]',
                )}
              >
                <span className="truncate">{opt.label}</span>
                {isSelected && <Check className="h-3.5 w-3.5 shrink-0" />}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
