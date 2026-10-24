import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  applyTheme,
  persistThemeCache,
  readStoredTheme,
  resolveTheme,
  THEME_STORAGE_KEY,
} from './theme';

describe('theme (R2, NFR-16)', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark');
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('mặc định "system" khi chưa có gì trong storage', () => {
    expect(readStoredTheme()).toBe('system');
  });

  it('đọc giá trị đã lưu', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'dark');
    expect(readStoredTheme()).toBe('dark');
  });

  it('giá trị không hợp lệ → "system"', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'garbage');
    expect(readStoredTheme()).toBe('system');
  });

  it('resolveTheme identity cho light/dark', () => {
    expect(resolveTheme('light')).toBe('light');
    expect(resolveTheme('dark')).toBe('dark');
  });

  it('resolveTheme("system") → matchMedia(prefers-color-scheme)', () => {
    vi.stubGlobal('matchMedia', (q: string) => ({
      matches: q.includes('dark'),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));
    expect(resolveTheme('system')).toBe('dark');
  });

  it('applyTheme toggle class .dark trên <html>', () => {
    applyTheme('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    applyTheme('light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('persistThemeCache ghi localStorage', () => {
    persistThemeCache('dark');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');
  });
});
