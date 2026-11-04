import { blankArticle, type Article } from '../models/knowledge.model';
import {
  articleImagesFromArticle,
  mediaDraftFromImages,
  mediaIntentFromSlot,
  slotImageFromUrl,
} from './article-editor-images';

describe('article-editor-images', () => {
  it('builds slot images from urls and omits empty ones', () => {
    expect(slotImageFromUrl('', '2026-01-01')).toBeNull();
    expect(slotImageFromUrl('/a/b.png', '2026-01-01', 12)).toEqual({
      url: '/a/b.png',
      name: 'b.png',
      size: 12,
      date: '2026-01-01',
    });
  });

  it('maps media intents from slot state', () => {
    expect(mediaIntentFromSlot(null)).toEqual({ kind: 'omit' });
    expect(mediaIntentFromSlot({ url: 'x', name: 'x', size: 0, date: '', cleared: true })).toEqual({
      kind: 'clear',
    });
    const file = new File([new Uint8Array([1])], 'a.png', { type: 'image/png' });
    expect(
      mediaIntentFromSlot({ url: 'blob:1', name: 'a.png', size: 1, date: '', file }),
    ).toEqual({ kind: 'replace', file });
  });

  it('builds the media draft and article image map', () => {
    const article = {
      ...blankArticle(),
      id: '1',
      code: 'A-1',
      categoryNameAr: '',
      categoryNameEn: '',
      authorPhoto: null,
      thumbnail: null,
      cover: null,
      createdAt: '2026-01-02',
      updatedAt: '2026-01-02',
      coverUrl: '/cover.png',
      thumbnailUrl: '',
      authorAvatarUrl: '/avatar.png',
    } satisfies Article;
    expect(articleImagesFromArticle(article).cover?.name).toBe('cover.png');
    expect(mediaDraftFromImages(articleImagesFromArticle(article))).toEqual({
      cover: { kind: 'omit' },
      thumbnail: { kind: 'omit' },
      authorPhoto: { kind: 'omit' },
    });
  });
});
