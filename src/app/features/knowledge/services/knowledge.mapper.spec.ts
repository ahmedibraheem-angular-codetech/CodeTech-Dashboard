import type { FileObject } from '../../../core/http/api.model';
import { blankArticle } from '../models/knowledge.model';
import {
  mapArticleCategory,
  mapArticleDetail,
  mapArticleListItem,
  mapArticleStats,
  mapArticleStatus,
  toArticleCategoryWrite,
  toArticleWrite,
} from './knowledge.mapper';

const file = (overrides: Partial<FileObject> = {}): FileObject => ({
  uuid: 'u1',
  name: 'n',
  file_name: 'n.png',
  mime_type: 'image/png',
  size: 1,
  url: 'https://cdn.test/n.png',
  download_url: 'https://cdn.test/d',
  created_at: '2026-11-01T00:00:00.000000Z',
  ...overrides,
});

describe('knowledge.mapper', () => {
  it('maps category CRUD bilingual fields', () => {
    expect(
      mapArticleCategory({
        id: 3,
        name: { ar: 'عربي', en: 'English' },
        is_published: true,
        sort_order: 7,
        articles_count: 4,
        created_at: '2026-01-01',
        updated_at: '2026-01-02',
      }),
    ).toEqual({
      id: '3',
      nameAr: 'عربي',
      nameEn: 'English',
      published: true,
      order: 7,
      articleCount: 4,
      createdAt: '2026-01-01',
    });

    expect(toArticleCategoryWrite({ nameAr: ' أ ', nameEn: ' B ', published: false })).toEqual({
      name: { ar: 'أ', en: 'B' },
      is_published: false,
    });
  });

  it('maps article statuses without confusing scheduled with published', () => {
    expect(mapArticleStatus('published')).toBe('published');
    expect(mapArticleStatus('unpublished')).toBe('unpublished');
    expect(mapArticleStatus('draft')).toBe('draft');
    expect(mapArticleStatus('scheduled')).toBe('draft');
  });

  it('preserves bilingual HTML and SEO on detail mapping', () => {
    const article = mapArticleDetail({
      id: 15,
      code: 'ART-0015',
      title: { ar: 'عنوان', en: 'Title' },
      excerpt: { ar: 'م', en: 'E' },
      category: { id: 9, name: { ar: 'تصنيف', en: 'Cat' } },
      thumbnail: file({ uuid: 't1', url: 'https://cdn.test/t.png' }),
      reading_time_minutes: 8,
      status: 'published',
      is_scheduled: false,
      is_featured: true,
      published_at: '2026-11-01T12:00:00.000000Z',
      created_at: '2026-11-01T10:00:00.000000Z',
      updated_at: '2026-11-01T11:00:00.000000Z',
      content: { ar: '<p>عربي <img src="https://cdn.test/editor.png" /></p>', en: '<p>En</p>' },
      author_name: { ar: 'مؤلف', en: 'Author' },
      author_photo: file({ uuid: 'a1', url: 'https://cdn.test/a.png' }),
      thumbnail_title: { ar: 'ط', en: 'T' },
      thumbnail_alt: { ar: 'و', en: 'A' },
      cover: file({ uuid: 'c1', url: 'https://cdn.test/c.png' }),
      cover_title: { ar: 'غ', en: 'C' },
      cover_alt: { ar: 'غ و', en: 'C A' },
      meta_title: { ar: 'سيو', en: 'SEO' },
      slug: 'my-slug',
      meta_keywords: { ar: ['أ', 'ب'], en: ['a', 'b'] },
      meta_description: { ar: 'وصف', en: 'Desc' },
    });

    expect(article.contentAr).toContain('https://cdn.test/editor.png');
    expect(article.contentEn).toBe('<p>En</p>');
    expect(article.slug).toBe('my-slug');
    expect(article.seoKeywordsAr).toBe('أ, ب');
    expect(article.cover?.uuid).toBe('c1');
    expect(article.coverUrl).toBe('https://cdn.test/c.png');
    expect(article.categoryId).toBe('9');
  });

  it('maps list items without inventing detail HTML', () => {
    const item = mapArticleListItem({
      id: 1,
      code: 'ART-0001',
      title: { ar: 'أ', en: 'A' },
      excerpt: { ar: 'م', en: 'E' },
      category: { id: 2, name: { ar: 'ت', en: 'C' } },
      thumbnail: null,
      reading_time_minutes: 3,
      status: 'draft',
      is_scheduled: false,
      is_featured: false,
      published_at: null,
      created_at: '2026-11-01T00:00:00.000000Z',
      updated_at: '2026-11-01T00:00:00.000000Z',
    });
    expect(item.contentAr).toBe('');
    expect(item.contentEn).toBe('');
    expect(item.id).toBe('1');
  });

  it('writes SEO fields and media intents without confusing editor URLs with UUIDs', () => {
    const body = toArticleWrite(
      {
        ...blankArticle(),
        titleAr: 'عنوان',
        titleEn: 'Title',
        excerptAr: 'م',
        excerptEn: 'E',
        contentAr: '<p><img src="https://cdn.test/editor.png" /></p>',
        contentEn: '<p>En</p>',
        categoryId: '9',
        status: 'published',
        featured: true,
        readingMinutes: 6,
        slug: 'my-slug',
        seoTitleAr: 'سيو',
        seoTitleEn: 'SEO',
        seoKeywordsAr: 'أ، ب',
        seoKeywordsEn: 'a, b',
        seoDescriptionAr: 'وصف',
        seoDescriptionEn: 'Desc',
        publishedAt: '2026-11-01T12:00:00.000000Z',
      },
      {
        cover: { kind: 'replace', file: new File(['x'], 'c.png') },
        thumbnail: { kind: 'clear' },
        authorPhoto: { kind: 'omit' },
      },
      { cover: 'uuid-cover', thumbnail: null },
    );

    expect(body.content.ar).toContain('https://cdn.test/editor.png');
    expect(body.slug).toBe('my-slug');
    expect(body.meta_keywords).toEqual({ ar: ['أ', 'ب'], en: ['a', 'b'] });
    expect(body.cover).toBe('uuid-cover');
    expect(body.thumbnail).toBeNull();
    expect(body.author_photo).toBeUndefined();
  });

  it('maps stats envelope values', () => {
    expect(
      mapArticleStats({
        total: { value: 10, previous: null, change_pct: 1 },
        published: { value: 4, previous: null, change_pct: null },
        featured: { value: 2, previous: null, change_pct: 3 },
        unpublished: { value: 1, previous: null, change_pct: -1 },
      }),
    ).toEqual({
      total: 10,
      published: 4,
      featured: 2,
      unpublished: 1,
      totalChangePct: 1,
      publishedChangePct: null,
      featuredChangePct: 3,
      unpublishedChangePct: -1,
    });
  });
});
