import { useEffect } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ThemeMode = 'light' | 'dark' | 'system';
export type FontScale = 100 | 110 | 120;

interface SettingsState {
  theme: ThemeMode;
  fontScale: FontScale;
  setTheme: (theme: ThemeMode) => void;
  setFontScale: (fontScale: FontScale) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      theme: 'system',
      fontScale: 100,
      setTheme: (theme) => set({ theme }),
      setFontScale: (fontScale) => set({ fontScale }),
    }),
    { name: 'ansask-settings' },
  ),
);

export function useApplySettings() {
  const theme = useSettingsStore((s) => s.theme);
  const fontScale = useSettingsStore((s) => s.fontScale);

  useEffect(() => {
    document.documentElement.style.fontSize = `${(18 * fontScale) / 100}px`;
  }, [fontScale]);

  useEffect(() => {
    const root = document.documentElement;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');

    const apply = () => {
      const isDark = theme === 'dark' || (theme === 'system' && mq.matches);
      root.classList.toggle('dark', isDark);
    };

    apply();
    if (theme === 'system') {
      mq.addEventListener('change', apply);
      return () => mq.removeEventListener('change', apply);
    }
  }, [theme]);
}
