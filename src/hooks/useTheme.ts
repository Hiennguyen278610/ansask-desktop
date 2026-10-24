import { useContext } from 'react';
import { ThemeContext } from '@/theme/theme-context';

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside <ThemeProvider>');
  return ctx;
}
