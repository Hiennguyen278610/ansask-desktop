import { createContext, useCallback, useEffect, useState, type ReactNode } from 'react';
import { settingGet, settingSet } from '@/lib/tauri/commands';
import {
  applyTheme,
  persistThemeCache,
  readStoredTheme,
  resolveTheme,
  type ResolvedTheme,
  type ThemeMode,
} from './theme';

interface ThemeContextValue {
  mode: ThemeMode;
  resolved: ResolvedTheme;
  setMode: (mode: ThemeMode) => void;
}

export const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>(() => readStoredTheme());
  const [resolved, setResolved] = useState<ResolvedTheme>(() => resolveTheme(readStoredTheme()));

  // Đồng bộ từ DB (nguồn sự thật) khi mount — nếu BE chưa sẵn sàng, giữ cache.
  useEffect(() => {
    let cancelled = false;
    settingGet('theme')
      .then((res) => {
        if (cancelled) return;
        const m = res.value as ThemeMode;
        if (m === 'light' || m === 'dark' || m === 'system') {
          setModeState(m);
          persistThemeCache(m);
        }
      })
      .catch(() => {
        /* DB chưa sẵn sàng / không có Tauri runtime */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Apply + lắng nghe prefers-color-scheme khi mode='system'.
  useEffect(() => {
    const r = resolveTheme(mode);
    setResolved(r);
    applyTheme(r);
    persistThemeCache(mode);

    if (mode !== 'system') return;
    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => {
      const next = resolveTheme('system');
      setResolved(next);
      applyTheme(next);
    };
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, [mode]);

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next);
    settingSet('theme', next).catch(() => {
      /* giữ state RAM nếu persist thất bại */
    });
  }, []);

  return (
    <ThemeContext.Provider value={{ mode, resolved, setMode }}>
      {children}
    </ThemeContext.Provider>
  );
}
