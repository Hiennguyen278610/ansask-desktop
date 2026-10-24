import { describe, it, expect } from 'vitest';
import { cn } from './cn';

describe('cn', () => {
  it('lọc falsy', () => expect(cn('a', false, null, undefined, 0, 'b')).toBe('a b'));
  it('join truthy strings', () => expect(cn('a', 'b', 'c')).toBe('a b c'));
  it('tất cả falsy → chuỗi rỗng', () => expect(cn(false, null, undefined)).toBe(''));
});
