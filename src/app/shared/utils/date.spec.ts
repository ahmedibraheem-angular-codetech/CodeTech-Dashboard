import { formatIsoDate, formatIsoTime, fromIsoDate, toIsoDate } from './date';

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

describe('API timestamps', () => {
  it('formats a full ISO timestamp instead of returning Invalid Date', () => {
    const value = '2026-03-05T09:30:00.000000Z';
    expect(formatIsoDate(value, 'en')).toContain('2026');
    expect(formatIsoDate(value, 'en')).not.toContain('Invalid');
    expect(formatIsoTime(value, 'en')).not.toBe('');
  });

  it('keeps plain dates working and returns empty text for unparsable values', () => {
    expect(formatIsoDate('2026-03-05', 'en')).toContain('2026');
    expect(formatIsoTime('2026-03-05', 'en')).toBe('');
    expect(formatIsoDate('not a date', 'en')).toBe('');
  });

  it('returns empty text for a null or missing timestamp instead of throwing', () => {
    expect(formatIsoDate(null, 'en')).toBe('');
    expect(formatIsoDate(undefined, 'ar')).toBe('');
    expect(formatIsoTime(null, 'en')).toBe('');
    expect(formatIsoTime(undefined, 'ar')).toBe('');
  });
});
