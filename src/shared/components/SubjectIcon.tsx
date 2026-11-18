import { cn } from '@/shared/lib/cn';

interface SubjectIconProps {
  url: string;
  label?: string;
  className?: string;
}

export function SubjectIcon({ url, label, className }: SubjectIconProps) {
  return (
    <span
      role={label ? 'img' : undefined}
      aria-label={label || undefined}
      aria-hidden={label ? undefined : true}
      className={cn('inline-block shrink-0 bg-current text-[var(--text)]', className)}
      style={{
        maskImage: `url("${url}")`,
        WebkitMaskImage: `url("${url}")`,
        maskRepeat: 'no-repeat',
        WebkitMaskRepeat: 'no-repeat',
        maskPosition: 'center',
        WebkitMaskPosition: 'center',
        maskSize: 'contain',
        WebkitMaskSize: 'contain',
      }}
    />
  );
}
