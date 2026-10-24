import { Sun, Moon, Monitor, Check } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useTheme } from '@/hooks/useTheme';
import type { ThemeMode } from '@/theme/theme';

const OPTIONS: { value: ThemeMode; label: string; Icon: typeof Sun }[] = [
  { value: 'light', label: 'Sáng', Icon: Sun },
  { value: 'dark', label: 'Tối', Icon: Moon },
  { value: 'system', label: 'Theo hệ thống', Icon: Monitor },
];

export function ThemeToggle({ collapsed = false }: { collapsed?: boolean }) {
  const { mode, setMode } = useTheme();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const Current = OPTIONS.find((o) => o.value === mode)?.Icon ?? Monitor;
  const currentLabel = OPTIONS.find((o) => o.value === mode)?.label ?? 'Theo hệ thống';

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Giao diện: ${currentLabel}`}
        title={`Giao diện: ${currentLabel}`}
        className="neu-icon-btn w-10 h-10 rounded-xl flex items-center justify-center"
      >
        <Current className="w-4 h-4" />
      </button>

      {open && (
        <div
          role="menu"
          className={`absolute bottom-full mb-2 ${collapsed ? 'left-0' : 'left-0'} w-48 neu-shell rounded-2xl p-1.5 z-50`}
        >
          {OPTIONS.map((opt) => {
            const Icon = opt.Icon;
            const active = mode === opt.value;
            return (
              <button
                key={opt.value}
                role="menuitemradio"
                aria-checked={active}
                onClick={() => {
                  setMode(opt.value);
                  setOpen(false);
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium ${
                  active ? 'neu-pill-active' : 'hover:bg-white/40'
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span className="flex-1 text-left">{opt.label}</span>
                {active && <Check className="w-3 h-3 shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
