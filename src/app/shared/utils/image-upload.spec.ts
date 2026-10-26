import { IMAGE_UPLOAD_MAX_BYTES, parseUploadedImage } from './image-upload';

function fakeFile(type: string, size: number, name = 'shot.png'): File {
  const blob = new Blob([new Uint8Array(1)], { type });
  const file = new File([blob], name, { type });
  Object.defineProperty(file, 'size', { value: size });
  return file;
}

describe('parseUploadedImage', () => {
  const fixed = () => new Date('2026-03-15T12:00:00.000Z');

  it('returns null when no file is provided', () => {
    expect(parseUploadedImage(undefined)).toBeNull();
  });

  it('rejects non PNG/JPEG types with home.imageType', () => {
    expect(parseUploadedImage(fakeFile('image/gif', 100), fixed)).toEqual({
      ok: false,
      errorKey: 'home.imageType',
    });
  });

  it('rejects files over the shared 5 MB cap with home.imageSize', () => {
    expect(parseUploadedImage(fakeFile('image/png', IMAGE_UPLOAD_MAX_BYTES + 1), fixed)).toEqual({
      ok: false,
      errorKey: 'home.imageSize',
    });
  });

  it('accepts a PNG within the cap and stamps uploadedAt from the clock', () => {
    expect(parseUploadedImage(fakeFile('image/png', 2048, 'logo.png'), fixed)).toEqual({
      ok: true,
      image: { name: 'logo.png', size: 2048, uploadedAt: '2026-03-15' },
    });
  });

  it('accepts JPEG as well as PNG', () => {
    expect(parseUploadedImage(fakeFile('image/jpeg', 512, 'photo.jpg'), fixed)?.ok).toBe(true);
  });
});
