import { cn } from './utils';

describe('cn', () => {
  it('merges class names', () => {
    expect(cn('a', 'b')).toBe('a b');
  });
  it('handles falsy values', () => {
    expect(cn('a', false, null, undefined, '', 'b')).toBe('a b');
  });
  it('merges tailwind classes correctly', () => {
    expect(cn('p-2', 'p-4')).toBe('p-4'); // tailwind-merge keeps last
  });
  it('returns empty string for no input', () => {
    expect(cn()).toBe('');
  });
}); 