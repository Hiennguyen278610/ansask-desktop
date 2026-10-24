import { X } from 'lucide-react';
import { useEffect, useRef, type ReactNode } from 'react';

interface DialogProps {
  open: boolean;
  title: string;
  onClose: () => void;
  footer?: ReactNode;
  children: ReactNode;
}

export function Dialog({ open, title, onClose, footer, children }: DialogProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const first = panelRef.current?.querySelector<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    first?.focus();
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        className="neu-shell rounded-[28px] max-w-md w-full p-6 space-y-4 animate-fade-in"
      >
        <div className="flex items-center justify-between">
          <h3 id="dialog-title" className="font-bold text-base">
            {title}
          </h3>
          <button
            onClick={onClose}
            aria-label="Đóng"
            className="neu-icon-btn w-8 h-8 rounded-xl flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div>{children}</div>
        {footer && (
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-200/70">{footer}</div>
        )}
      </div>
    </div>
  );
}
