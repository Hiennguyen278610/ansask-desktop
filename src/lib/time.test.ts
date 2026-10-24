import { describe, it, expect } from 'vitest';
import { formatDateTime, formatDuration } from './time';

describe('formatDateTime — UTC → Asia/Ho_Chi_Minh (Q-06)', () => {
  it('midnight UTC → 07:00 HCM cùng ngày', () => {
    expect(formatDateTime('2026-10-24T00:00:00.000Z')).toBe('2026-10-24 07:00');
  });

  it('wrap sang ngày kế khi UTC ≥ 17:00', () => {
    // 23/10 17:00 UTC → 24/10 00:00 HCM
    expect(formatDateTime('2026-10-23T17:00:00.000Z')).toBe('2026-10-24 00:00');
  });

  it('null/undefined → chuỗi rỗng', () => {
    expect(formatDateTime(null)).toBe('');
    expect(formatDateTime(undefined)).toBe('');
  });

  it('chuỗi không phải ngày → chuỗi rỗng (không throw)', () => {
    expect(formatDateTime('not-a-date')).toBe('');
  });
});

describe('formatDuration', () => {
  it('0 giây → 00:00', () => expect(formatDuration(0)).toBe('00:00'));
  it('410 giây → 06:50', () => expect(formatDuration(410)).toBe('06:50'));
  it('> 1 giờ không cắt về 60 phút', () => expect(formatDuration(3661)).toBe('61:01'));
});
