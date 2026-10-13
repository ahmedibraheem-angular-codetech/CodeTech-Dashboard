import { formatFileSize } from './file-size';

describe('formatFileSize', () => {
  it('uses KB below one megabyte and never shows 0 KB', () => {
    expect(formatFileSize(320512)).toBe('313 KB');
    expect(formatFileSize(10)).toBe('1 KB');
  });

  it('uses MB with one decimal from one megabyte', () => {
    expect(formatFileSize(1.5 * 1024 * 1024)).toBe('1.5 MB');
  });
});
