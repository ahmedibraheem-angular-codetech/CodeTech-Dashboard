import { fieldsFromArticleForm } from './article-form-map';

describe('article-form-map', () => {
  it('maps form values into an article draft with publish stamp', () => {
    const draft = fieldsFromArticleForm(
      {
        titleAr: ' عنوان ',
        titleEn: ' Title ',
        excerptAr: '',
        excerptEn: '',
        categoryId: '1',
        readingMinutes: 3.6,
        publishedDate: '2026-02-01',
        authorNameAr: 'أ',
        authorNameEn: 'A',
        slug: ' slug ',
        seoTitleAr: '',
        seoTitleEn: '',
        seoDescriptionAr: '',
        seoDescriptionEn: '',
        seoKeywordsAr: 'a',
        seoKeywordsEn: 'b',
        thumbnailTitleAr: '',
        thumbnailTitleEn: '',
        thumbnailAltAr: '',
        thumbnailAltEn: '',
        coverTitleAr: '',
        coverTitleEn: '',
        coverAltAr: '',
        coverAltEn: '',
        contentAr: '<p>ع</p>',
        contentEn: '<p>e</p>',
      },
      'published',
      {
        previousPublishedAt: '2025-01-01T15:30:00',
        featured: true,
        clock: () => new Date('2026-03-01T12:00:00'),
      },
    );

    expect(draft).toMatchObject({
      titleAr: 'عنوان',
      titleEn: 'Title',
      readingMinutes: 4,
      status: 'published',
      featured: true,
      publishedAt: '2026-02-01T15:30',
      slug: 'slug',
    });
  });
});
