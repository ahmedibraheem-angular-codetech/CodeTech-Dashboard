import { blankService, localeText } from '../models/service.model';
import {
  mapServiceDetail,
  mapServiceListItem,
  toServiceWrite,
} from './service.mapper';

describe('service.mapper', () => {
  it('maps list items without inventing nested step data', () => {
    const item = mapServiceListItem({
      id: 4,
      code: 'SRV-00004',
      name: { ar: 'خدمة', en: 'Service' },
      description: { ar: 'وصف', en: 'Desc' },
      icon: null,
      status: 'draft',
      slug: 'service',
      sort_order: 1,
      created_at: '2026-11-01T00:00:00.000000Z',
      updated_at: '2026-11-01T00:00:00.000000Z',
    });
    expect(item.published).toBe(false);
    expect(item.whyItems).toEqual([]);
    expect(item.faqs).toEqual([]);
    expect(item.projectIds).toEqual([]);
  });

  it('maps detail bilingual HTML-free fields and preserves media UUIDs separately from URLs', () => {
    const detail = mapServiceDetail({
      id: 4,
      code: 'SRV-00004',
      name: { ar: 'خدمة', en: 'Service' },
      description: { ar: 'وصف', en: 'Desc' },
      icon: {
        uuid: 'icon-1',
        name: 'i',
        file_name: 'i.png',
        mime_type: 'image/png',
        size: 1,
        url: 'https://cdn.test/i.png',
        download_url: 'https://cdn.test/d',
        created_at: '2026-11-01T00:00:00.000000Z',
      },
      status: 'published',
      slug: 'service',
      sort_order: 1,
      created_at: '2026-11-01T00:00:00.000000Z',
      updated_at: '2026-11-01T00:00:00.000000Z',
      why_image: {
        uuid: 'why-1',
        name: 'w',
        file_name: 'w.png',
        mime_type: 'image/png',
        size: 1,
        url: 'https://cdn.test/w.png',
        download_url: 'https://cdn.test/d',
        created_at: '2026-11-01T00:00:00.000000Z',
      },
      why_image_text: { ar: 'نص', en: 'Caption' },
      needs: [
        {
          id: 11,
          title: { ar: 'حاجة', en: 'Need' },
          icon: null,
          sort_order: 1,
        },
      ],
      solutions: [],
      stages: [],
      features: [],
      sectors: [],
      faqs: [
        {
          id: 61,
          question: { ar: 'س؟', en: 'Q?' },
          answer: { ar: 'ج', en: 'A' },
          sort_order: 1,
        },
      ],
      projects: [
        {
          id: 3,
          title: { ar: 'مشروع', en: 'Project' },
          description: { ar: 'وصف', en: 'Desc' },
          cover: null,
          status: 'published',
          is_visible: false,
          sort_order: 1,
        },
      ],
    });

    expect(detail.iconUuid).toBe('icon-1');
    expect(detail.iconUrl).toBe('https://cdn.test/i.png');
    expect(detail.whyImage.image.ar.imageUuid).toBe('why-1');
    expect(detail.whyImage.image.en.imageUrl).toBe('');
    expect(detail.whyImage.title.ar).toBe('نص');
    expect(detail.faqs[0].id).toBe('61');
    expect(detail.projectIds).toEqual(['3']);
    expect(detail.linkedProjects[0].visible).toBe(false);
  });

  it('writes nested lists with server ids and omits client-only placeholder rows', () => {
    const body = toServiceWrite({
      ...blankService(),
      id: '4',
      published: true,
      name: localeText('خدمة', 'Service'),
      description: localeText('وصف', 'Desc'),
      whyImage: {
        title: localeText('نص', 'Caption'),
        image: {
          ar: {
            imageName: 'w.png',
            imageUrl: 'https://cdn.test/w.png',
            imageUuid: 'why-1',
          },
          en: { imageName: '', imageUrl: '', imageUuid: null },
        },
      },
      whyItems: [
        {
          id: '11',
          title: localeText('حاجة', 'Need'),
          image: {
            ar: { imageName: '', imageUrl: '', imageUuid: null },
            en: { imageName: '', imageUrl: '', imageUuid: null },
          },
        },
        {
          id: 'why-empty',
          title: localeText(),
          image: {
            ar: { imageName: '', imageUrl: '', imageUuid: null },
            en: { imageName: '', imageUrl: '', imageUuid: null },
          },
        },
      ],
      solutions: [
        {
          id: 'sol-new',
          title: localeText('حل', 'Solution'),
          body: localeText('سطر', 'Line'),
          image: {
            ar: {
              imageName: 's.png',
              imageUrl: 'https://cdn.test/s.png',
              imageUuid: 'sol-1',
            },
            en: { imageName: '', imageUrl: '', imageUuid: null },
          },
        },
      ],
      stages: [],
      features: [],
      sectors: [
        {
          id: '51',
          image: {
            ar: {
              imageName: 'sec.png',
              imageUrl: 'https://cdn.test/sec.png',
              imageUuid: 'sector-1',
            },
            en: { imageName: '', imageUrl: '', imageUuid: null },
          },
        },
      ],
      faqs: [
        {
          id: '61',
          question: localeText('س؟', 'Q?'),
          answer: localeText('ج', 'A'),
        },
      ],
      projectIds: ['3'],
      linkedProjects: [],
    });

    expect(body.status).toBe('published');
    expect(body.why_image).toBe('why-1');
    expect(body.needs).toEqual([
      expect.objectContaining({ id: 11, title: { ar: 'حاجة', en: 'Need' } }),
    ]);
    expect(body.solutions?.[0]).toEqual(
      expect.objectContaining({
        short_description: { ar: 'سطر', en: 'Line' },
        icon: 'sol-1',
      }),
    );
    expect(body.solutions?.[0].id).toBeUndefined();
    expect(body.sectors).toEqual([{ id: 51, image: { ar: 'sector-1', en: null } }]);
    expect(body.faqs).toEqual([
      expect.objectContaining({ id: 61, question: { ar: 'س؟', en: 'Q?' } }),
    ]);
    expect(body.projects).toEqual([{ id: 3, is_visible: true }]);
  });

  it('maps and writes bilingual sector images independently', () => {
    const mapped = mapServiceDetail({
      id: 9,
      code: 'SRV-00009',
      name: { ar: 'خدمة', en: 'Service' },
      description: { ar: 'وصف', en: 'Desc' },
      icon: null,
      status: 'published',
      slug: 'service',
      sort_order: 1,
      created_at: '2026-11-01T00:00:00.000000Z',
      updated_at: '2026-11-01T00:00:00.000000Z',
      why_image: null,
      why_image_text: { ar: '', en: '' },
      needs: [],
      solutions: [],
      stages: [],
      features: [],
      sectors: [
        {
          id: 51,
          image: {
            ar: {
              uuid: 'sector-ar',
              name: 'ar',
              file_name: 'ar.png',
              mime_type: 'image/png',
              size: 1,
              url: 'https://cdn.test/ar.png',
              download_url: 'https://cdn.test/d',
              created_at: '2026-11-01T00:00:00.000000Z',
            },
            en: {
              uuid: 'sector-en',
              name: 'en',
              file_name: 'en.png',
              mime_type: 'image/png',
              size: 1,
              url: 'https://cdn.test/en.png',
              download_url: 'https://cdn.test/d',
              created_at: '2026-11-01T00:00:00.000000Z',
            },
          },
          sort_order: 1,
        },
      ],
      faqs: [],
      projects: [],
    });

    expect(mapped.sectors[0]?.image.ar.imageUuid).toBe('sector-ar');
    expect(mapped.sectors[0]?.image.en.imageUuid).toBe('sector-en');
    expect(toServiceWrite(mapped).sectors).toEqual([
      { id: 51, image: { ar: 'sector-ar', en: 'sector-en' } },
    ]);
  });

  it('omits PrimeIcon pseudo-URLs from media tickets', () => {
    const body = toServiceWrite({
      ...blankService(),
      name: localeText('خدمة', 'Service'),
      whyItems: [
        {
          id: 'why-1',
          title: localeText('حاجة', 'Need'),
          image: {
            ar: {
              imageName: 'pi-cog',
              imageUrl: 'icon:pi-cog',
              imageUuid: null,
            },
            en: { imageName: '', imageUrl: '', imageUuid: null },
          },
        },
      ],
      solutions: [],
      stages: [],
      features: [],
      sectors: [],
      faqs: [],
      projectIds: [],
      linkedProjects: [],
    });
    expect(body.needs?.[0].icon).toBeUndefined();
  });
});
