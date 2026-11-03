import { TestBed } from '@angular/core/testing';

import { blobUrlCounts, blobUrls, ObjectUrls } from './object-urls';

describe('ObjectUrls', () => {
  const originalCreate = URL.createObjectURL;
  const originalRevoke = URL.revokeObjectURL;
  let created = 0;
  let revoke: ReturnType<typeof vi.fn<(url: string) => void>>;
  let urls: ObjectUrls;

  beforeEach(() => {
    created = 0;
    revoke = vi.fn<(url: string) => void>();
    URL.createObjectURL = () => `blob:owned/${(created += 1)}`;
    URL.revokeObjectURL = revoke;
    TestBed.configureTestingModule({});
    urls = TestBed.inject(ObjectUrls);
  });

  afterEach(() => {
    URL.createObjectURL = originalCreate;
    URL.revokeObjectURL = originalRevoke;
  });

  it('revokes an unsaved draft URL when the draft is abandoned', () => {
    const url = urls.create(new Blob());
    urls.abandon({ coverUrl: url });
    expect(revoke).toHaveBeenCalledTimes(1);
    expect(revoke).toHaveBeenCalledWith(url);
  });

  it('keeps a saved URL after the draft claim is abandoned', () => {
    const url = urls.create(new Blob());
    urls.sync(null, { coverUrl: url });
    urls.abandon({ coverUrl: url });
    expect(revoke).not.toHaveBeenCalled();

    urls.sync({ coverUrl: url }, null);
    expect(revoke).toHaveBeenCalledTimes(1);
    expect(revoke).toHaveBeenCalledWith(url);
  });

  it('keeps a saved URL when an unsaved edit replaces or clears it', () => {
    const saved = urls.create(new Blob());
    urls.sync(null, { coverUrl: saved });
    urls.release(saved);
    expect(revoke).not.toHaveBeenCalled();

    const next = urls.create(new Blob());
    urls.abandon({ coverUrl: next });
    expect(revoke).toHaveBeenCalledTimes(1);
    expect(revoke).toHaveBeenCalledWith(next);
    expect(revoke).not.toHaveBeenCalledWith(saved);
  });

  it('revokes the previous URL once a save drops the last store reference', () => {
    const first = urls.create(new Blob());
    urls.sync(null, { coverUrl: first });
    urls.release(first);

    const second = urls.create(new Blob());
    urls.sync({ coverUrl: first }, { coverUrl: second });

    expect(revoke).toHaveBeenCalledTimes(1);
    expect(revoke).toHaveBeenCalledWith(first);
  });

  it('balances nested duplicate occurrences within one record', () => {
    const url = urls.create(new Blob());
    urls.sync(null, { coverUrl: url, items: [{ imageUrl: url }] });
    urls.abandon({ coverUrl: url, items: [{ imageUrl: url }] });
    expect(revoke).not.toHaveBeenCalled();

    urls.sync({ coverUrl: url, items: [{ imageUrl: url }] }, { coverUrl: url });
    expect(revoke).not.toHaveBeenCalled();

    urls.sync({ coverUrl: url }, null);
    expect(revoke).toHaveBeenCalledTimes(1);
    expect(revoke).toHaveBeenCalledWith(url);
  });

  it('keeps a URL while any saved record still references it', () => {
    const url = urls.create(new Blob());
    urls.sync(null, { id: 'a', coverUrl: url });
    urls.abandon({ id: 'a', coverUrl: url });
    urls.sync(null, { id: 'b', coverUrl: url });
    expect(revoke).not.toHaveBeenCalled();

    urls.sync({ id: 'a', coverUrl: url }, null);
    expect(revoke).not.toHaveBeenCalled();

    urls.sync({ id: 'b', coverUrl: url }, null);
    expect(revoke).toHaveBeenCalledTimes(1);
    expect(revoke).toHaveBeenCalledWith(url);
  });

  it('releases every URL from a removed record exactly once', () => {
    const url = urls.create(new Blob());
    urls.sync(null, { coverUrl: url, extras: [{ imageUrl: url }] });
    urls.abandon({ coverUrl: url });
    urls.sync({ coverUrl: url, extras: [{ imageUrl: url }] }, null);

    expect(revoke).toHaveBeenCalledTimes(1);
    expect(revoke).toHaveBeenCalledWith(url);
  });

  it('ignores foreign values', () => {
    urls.release('/images/seed.jpg');
    urls.abandon({ coverUrl: 'icon:pi-star', path: '/images/seed.jpg' });
    urls.sync(null, { coverUrl: '/images/seed.jpg' });
    urls.sync({ coverUrl: '/images/seed.jpg' }, null);
    expect(revoke).not.toHaveBeenCalled();
  });

  it('revokes every URL still alive when the application is torn down', () => {
    const first = urls.create(new Blob());
    urls.sync(null, { coverUrl: first });
    const second = urls.create(new Blob());

    TestBed.resetTestingModule();

    expect(revoke).toHaveBeenCalledTimes(2);
    expect(revoke).toHaveBeenCalledWith(first);
    expect(revoke).toHaveBeenCalledWith(second);
  });
});

describe('blobUrls', () => {
  it('collects nested blob strings and skips other values', () => {
    expect(
      blobUrls({
        coverUrl: 'blob:a',
        name: 'cover.png',
        items: [
          { imageUrl: 'blob:b' },
          { imageUrl: 'icon:pi-star' },
          { imageUrl: '/images/c.jpg' },
        ],
      }),
    ).toEqual(new Set(['blob:a', 'blob:b']));
  });
});

describe('blobUrlCounts', () => {
  it('counts repeated nested blob strings', () => {
    expect(
      blobUrlCounts({
        coverUrl: 'blob:a',
        items: [{ imageUrl: 'blob:a' }, { imageUrl: 'blob:b' }],
      }),
    ).toEqual(
      new Map([
        ['blob:a', 2],
        ['blob:b', 1],
      ]),
    );
  });
});
