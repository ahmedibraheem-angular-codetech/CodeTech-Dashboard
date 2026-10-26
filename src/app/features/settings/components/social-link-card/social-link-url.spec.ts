import { describe, expect, it } from 'vitest';

import { toSafeHttpUrl } from './social-link-url';

describe('toSafeHttpUrl', () => {
  it('returns null for empty and whitespace-only input', () => {
    expect(toSafeHttpUrl('')).toBeNull();
    expect(toSafeHttpUrl('   ')).toBeNull();
  });

  it('accepts https URLs', () => {
    expect(toSafeHttpUrl('https://example.com/path')).toBe('https://example.com/path');
  });

  it('accepts http URLs', () => {
    expect(toSafeHttpUrl('http://example.com')).toBe('http://example.com/');
  });

  it('prefixes https when no protocol is present', () => {
    expect(toSafeHttpUrl('example.com/page')).toBe('https://example.com/page');
  });

  it('rejects unsupported protocols', () => {
    expect(toSafeHttpUrl('javascript:alert(1)')).toBeNull();
    expect(toSafeHttpUrl('data:text/html,hi')).toBeNull();
    expect(toSafeHttpUrl('file:///etc/passwd')).toBeNull();
  });

  it('rejects malformed URLs', () => {
    expect(toSafeHttpUrl('https://')).toBeNull();
    expect(toSafeHttpUrl('http://')).toBeNull();
  });
});
