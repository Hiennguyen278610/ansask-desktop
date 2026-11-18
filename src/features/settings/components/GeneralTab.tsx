import { Monitor, Moon, Sun } from 'lucide-react';
import { cn } from '@/shared/lib/cn';
import { useSettingsStore, type FontScale, type ThemeMode } from '../store/settings.store';

const THEME_OPTIONS: { value: ThemeMode; label: string; icon: typeof Sun }[] = [
  { value: 'light', label: 'Sáng', icon: Sun },
  { value: 'dark', label: 'Tối', icon: Moon },
  { value: 'system', label: 'Hệ thống', icon: Monitor },
];

const SCALE_OPTIONS: { value: FontScale; label: string }[] = [
  { value: 100, label: '100% (Mặc định)' },
  { value: 110, label: '110%' },
  { value: 120, label: '120%' },
];

export function GeneralTab() {
  const { theme, fontScale, setTheme, setFontScale } = useSettingsStore();

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-[var(--text)]">Chủ đề</h3>
        <p className="mt-0.5 text-xs text-[var(--text-muted)]">Chọn giao diện hiển thị cho ứng dụng.</p>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {THEME_OPTIONS.map((opt) => {
            const Icon = opt.icon;
            const active = theme === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setTheme(opt.value)}
                className={cn(
                  'flex items-center justify-center gap-1.5 rounded-[var(--radius-md)] px-2 py-2 text-xs font-medium transition-colors cursor-pointer sm:gap-2 sm:px-3 sm:text-sm',
                  active
                    ? 'bg-[var(--primary-soft)] text-[var(--primary-text)]'
                    : 'bg-[var(--surface)] text-[var(--text)] hover:bg-[var(--surface-hover)]',
                )}
              >
                <Icon className="h-4 w-4" />
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-[var(--text)]">Cỡ chữ</h3>
        <p className="mt-0.5 text-xs text-[var(--text-muted)]">Điều chỉnh tỷ lệ kích thước chữ toàn ứng dụng.</p>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {SCALE_OPTIONS.map((opt) => {
            const active = fontScale === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setFontScale(opt.value)}
                className={cn(
                  'rounded-[var(--radius-md)] px-2 py-2 text-xs font-medium transition-colors cursor-pointer sm:px-3 sm:text-sm',
                  active
                    ? 'bg-[var(--primary-soft)] text-[var(--primary-text)]'
                    : 'bg-[var(--surface)] text-[var(--text)] hover:bg-[var(--surface-hover)]',
                )}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
