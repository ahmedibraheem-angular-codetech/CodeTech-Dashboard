import { formatIsoDate, fromIsoDate, toIsoDate } from './date';

describe('date utils', () => {
  it('parses a date-only string as local midnight (not UTC)', () => {
    const date = fromIsoDate('2025-01-09');
    expect(date.getFullYear()).toBe(2025);
    expect(date.getMonth()).toBe(0);
    expect(date.getDate()).toBe(9);
    expect(date.getHours()).toBe(0);
  });

  it('round-trips through toIsoDate regardless of the timezone', () => {
    expect(toIsoDate(fromIsoDate('2026-10-12'))).toBe('2026-10-12');
    expect(toIsoDate(new Date(2026, 0, 5))).toBe('2026-01-05');
  });

  it('formats a date for the requested language', () => {
    const english = formatIsoDate('2026-10-12', 'en');
    expect(english).toContain('2026');
    expect(english).toContain('12');
    expect(formatIsoDate('2026-10-12', 'ar')).not.toBe(english);
  });
});
