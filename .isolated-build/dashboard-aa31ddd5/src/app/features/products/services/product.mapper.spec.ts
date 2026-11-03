import { blankProduct, localeText } from '../models/product.model';
import { mapProductDetail, mapProductListItem, toProductWrite } from './product.mapper';

const file = (uuid: string, url = `https://cdn.test/${uuid}.png`) => ({
  uuid,
  name: uuid,
  file_name: `${uuid}.png`,
  mime_type: 'image/png',
  size: 10,
  url,
  download_url: 'https://cdn.test/d',
  created_at: '2026-11-01T00:00:00.000000Z',
});

describe('product.mapper', () => {
  it('maps list items without inventing nested step data', () => {
    const item = mapProductListItem({
      id: 7,
      code: 'PRD-00007',
      title: { ar: 'منتج', en: 'Product' },
      description: { ar: 'وصف', en: 'Desc' },
      short_description: { ar: null, en: null },
      cover: file('cover-1'),
      thumbnail: null,
      features: [
        {
          id: 11,
          title: { ar: 'ميزة', en: 'Feature' },
          short_description: { ar: 'سطر', en: 'Line' },
          icon: file('feat-1'),
          sort_order: 1,
        },
      ],
      status: 'draft',
      slug: 'product',
      sort_order: 1,
      created_at: '2026-11-01T00:00:00.000000Z',
      updated_at: '2026-11-01T00:00:00.000000Z',
    });
    expect(item.published).toBe(false);
    expect(item.cover.ar.imageUuid).toBe('cover-1');
    expect(item.cover.en.imageUrl).toBe('');
    expect(item.features[0]?.image.ar.imageUuid).toBe('feat-1');
    expect(item.features[0]?.image.en.imageUrl).toBe('');
    expect(item.units).toEqual([]);
    expect(item.faqs).toEqual([]);
  });

  it('maps detail bilingual fields and coat-check UUIDs separately from URLs', () => {
    const detail = mapProductDetail({
      id: 7,
      code: 'PRD-00007',
      title: { ar: 'منتج', en: 'Product' },
      description: { ar: 'وصف', en: 'Desc' },
      short_description: { ar: 'مختصر', en: 'Short' },
      cover: file('cover-1'),
      thumbnail: file('thumb-1'),
      features: [],
      status: 'published',
      slug: 'itsm',
      sort_order: 1,
      created_at: '2026-11-01T00:00:00.000000Z',
      updated_at: '2026-11-01T00:00:00.000000Z',
      cover_title: { ar: 'غلاف', en: 'Cover' },
      cover_alt: { ar: 'بديل', en: 'Alt' },
      thumbnail_title: { ar: '', en: '' },
      thumbnail_alt: { ar: '', en: '' },
      solution_title: { ar: 'حل', en: 'Solution' },
      solution_description: { ar: 'نص', en: 'Text' },
      solution_image: file('sol-1'),
      stats: [
        {
          id: 21,
          title: { ar: 'شركات', en: 'Companies' },
          value: { ar: '+10', en: '10+' },
          background: file('stat-1'),
        },
      ],
      sectors: [{ id: 31, image: { ar: file('sec-ar'), en: file('sec-en') } }],
      challenges: [],
      offerings: [],
      results: [],
      advantages: [],
      integrations: [{ id: 41, image: file('int-1') }],
      modules: [
        {
          id: 51,
          title: { ar: 'وحدة', en: 'Module' },
          short_description: { ar: 'وصف', en: 'Body' },
          image: file('mod-1'),
          features: [
            {
              id: 52,
              title: { ar: 'نقطة', en: 'Point' },
              short_description: { ar: 'سطر', en: 'Line' },
              icon: null,
            },
          ],
        },
      ],
      workflow_steps: [],
      identity_items: [],
      reasons: [],
      faqs: [
        {
          id: 61,
          question: { ar: 'س؟', en: 'Q?' },
          answer: { ar: 'ج', en: 'A' },
        },
      ],
      meta_title: { ar: 'عنوان', en: 'Title' },
      meta_keywords: { ar: ['إدارة'], en: ['ITSM'] },
      meta_description: { ar: 'وصف SEO', en: 'SEO desc' },
    });

    expect(detail.summary).toEqual({ ar: 'مختصر', en: 'Short' });
    expect(detail.stats[0]?.value).toEqual({ ar: '+10', en: '10+' });
    expect(detail.sectors[0]?.image.ar.imageUuid).toBe('sec-ar');
    expect(detail.sectors[0]?.image.en.imageUuid).toBe('sec-en');
    expect(detail.tools).toEqual([]);
    expect(detail.units[0]?.points[0]?.title.en).toBe('Point');
    expect(detail.seo.slug.en).toBe('itsm');
    expect(detail.seo.keywords.en).toBe('ITSM');
    expect(detail.category).toEqual({ ar: '', en: '' });
  });

  it('writes stats label as title and figure as value, ignoring body', () => {
    const body = toProductWrite({
      ...blankProduct(),
      id: '7',
      name: localeText('منتج', 'Product'),
      summary: localeText('وصف', 'Desc'),
      stats: [
        {
          id: 'stat-1',
          label: localeText('شركات تستخدم النظام', 'Companies using the system'),
          value: localeText('+10', '10+'),
          body: localeText('should-not-be-sent', 'should-not-be-sent'),
          image: {
            ar: { imageName: '', imageUrl: '', imageUuid: null },
            en: { imageName: '', imageUrl: '', imageUuid: null },
          },
        },
      ],
    });

    expect(body.stats?.[0]).toEqual({
      title: { ar: 'شركات تستخدم النظام', en: 'Companies using the system' },
      value: { ar: '+10', en: '10+' },
      background: null,
    });
    expect(JSON.stringify(body.stats)).not.toContain('should-not-be-sent');
  });

  it('writes OpenAPI field names and bilingual sector tickets', () => {
    const body = toProductWrite({
      ...blankProduct(),
      id: '7',
      published: true,
      name: localeText('منتج', 'Product'),
      summary: localeText('وصف', 'Desc'),
      cover: {
        ar: {
          imageName: 'cover.png',
          imageUrl: 'https://cdn.test/cover.png',
          imageUuid: 'cover-1',
        },
        en: { imageName: '', imageUrl: '', imageUuid: null },
      },
      thumb: {
        ar: { imageName: '', imageUrl: '', imageUuid: null },
        en: { imageName: '', imageUrl: '', imageUuid: null },
      },
      solution: {
        id: 'solution',
        title: localeText('حل', 'Solution'),
        body: localeText('نص', 'Text'),
        image: {
          ar: {
            imageName: 's.png',
            imageUrl: 'https://cdn.test/s.png',
            imageUuid: 'sol-1',
          },
          en: { imageName: '', imageUrl: '', imageUuid: null },
        },
      },
      features: [
        {
          id: '11',
          title: localeText('ميزة', 'Feature'),
          body: localeText('سطر', 'Line'),
          image: {
            ar: {
              imageName: 'f.png',
              imageUrl: 'https://cdn.test/f.png',
              imageUuid: 'feat-1',
            },
            en: { imageName: '', imageUrl: '', imageUuid: null },
          },
        },
      ],
      stats: [],
      sectors: [
        {
          id: '31',
          image: {
            ar: {
              imageName: 'a.png',
              imageUrl: 'https://cdn.test/a.png',
              imageUuid: 'sec-ar',
            },
            en: { imageName: '', imageUrl: '', imageUuid: null },
          },
        },
      ],
      challenges: [],
      offer: [],
      results: [],
      tools: [
        {
          id: 'new-tool',
          title: localeText('أداة', 'Tool'),
          body: localeText('وصف', 'Body'),
          image: {
            ar: {
              imageName: 't.png',
              imageUrl: 'https://cdn.test/t.png',
              imageUuid: 'tool-1',
            },
            en: { imageName: '', imageUrl: '', imageUuid: null },
          },
        },
      ],
      integrations: [],
      units: [],
      steps: [],
      identity: [],
      highlights: [],
      faqs: [
        {
          id: '61',
          question: localeText('س؟', 'Q?'),
          answer: localeText('ج', 'A'),
        },
      ],
      seo: {
        slug: localeText('itsm', 'itsm'),
        title: localeText('عنوان', 'Title'),
        keywords: localeText('إدارة, ITSM', 'service, ITSM'),
        description: localeText('وصف', 'Desc'),
      },
    });

    expect(body.status).toBe('published');
    expect(body.title).toEqual({ ar: 'منتج', en: 'Product' });
    expect(body.cover).toBe('cover-1');
    expect(body.solution_image).toBe('sol-1');
    expect(body.features?.[0]).toEqual(
      expect.objectContaining({ id: 11, icon: 'feat-1' }),
    );
    expect(body.advantages?.[0]).toEqual(
      expect.objectContaining({ icon: 'tool-1' }),
    );
    expect(body.advantages?.[0]?.id).toBeUndefined();
    expect(body.sectors).toEqual([{ id: 31, image: { ar: 'sec-ar', en: null } }]);
    expect(body.slug).toBe('itsm');
    expect(body.meta_keywords).toEqual({
      ar: ['إدارة', 'ITSM'],
      en: ['service', 'ITSM'],
    });
    expect(body).not.toHaveProperty('category');
  });

  it('excludes empty sectors from the write payload and keeps English-only sectors included', () => {
    const body = toProductWrite({
      ...blankProduct(),
      sectors: [
        {
          id: 'sector-empty',
          image: {
            ar: { imageName: '', imageUrl: '', imageUuid: null },
            en: { imageName: '', imageUrl: '', imageUuid: null },
          },
        },
        {
          id: 'sector-en',
          image: {
            ar: { imageName: '', imageUrl: '', imageUuid: null },
            en: {
              imageName: 'en.png',
              imageUrl: 'https://cdn.test/en.png',
              imageUuid: 'sec-en',
            },
          },
        },
        {
          id: '42',
          image: {
            ar: {
              imageName: 'ar.png',
              imageUrl: 'https://cdn.test/ar.png',
              imageUuid: 'sec-ar',
            },
            en: { imageName: '', imageUrl: '', imageUuid: null },
          },
        },
      ],
    });

    expect(body.sectors).toEqual([
      { image: { ar: null, en: 'sec-en' } },
      { id: 42, image: { ar: 'sec-ar', en: null } },
    ]);
  });

  it('excludes empty workflow steps and keeps partial rows in the payload', () => {
    const body = toProductWrite({
      ...blankProduct(),
      steps: [
        {
          id: 'step-empty',
          title: localeText(),
          body: localeText(),
          image: {
            ar: { imageName: '', imageUrl: '', imageUuid: null },
            en: { imageName: '', imageUrl: '', imageUuid: null },
          },
        },
        {
          id: 'step-en',
          title: localeText('', 'Only English'),
          body: localeText('', 'English body'),
          image: {
            ar: { imageName: '', imageUrl: '', imageUuid: null },
            en: { imageName: '', imageUrl: '', imageUuid: null },
          },
        },
      ],
    });

    expect(body.workflow_steps).toEqual([
      {
        title: { ar: '', en: 'Only English' },
        short_description: { ar: '', en: 'English body' },
        icon: null,
      },
    ]);
  });
});
