import { createElement } from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { act, render } from '@testing-library/react';
import { useApplySettings, useSettingsStore } from '@/features/settings/store/settings.store';

function Harness() {
  useApplySettings();
  return null;
}

describe('settings.store fontScale', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(() => ({
        matches: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    });
    useSettingsStore.setState({ theme: 'light', fontScale: 100 });
  });

  it('applies 18px base font size and scales 100/110/120 from 18px', () => {
    render(createElement(Harness));
    expect(document.documentElement.style.fontSize).toBe('18px');

    act(() => useSettingsStore.getState().setFontScale(110));
    expect(document.documentElement.style.fontSize).toBe('19.8px');

    act(() => useSettingsStore.getState().setFontScale(120));
    expect(document.documentElement.style.fontSize).toBe('21.6px');
  });
});
