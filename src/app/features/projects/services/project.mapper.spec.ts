import {
  blankProject,
  localeText,
  projectGalleryImage,
  projectIdentityButton,
  projectPoint,
} from '../models/project.model';
import { fileDto, projectDetailDto, projectListDto } from '../projects.spec-helpers';
import {
  isUploadUrl,
  mapProjectDetail,
  mapProjectListItem,
  toProjectWrite,
} from './project.mapper';

describe('project.mapper', () => {
  it('maps list items without inventing nested detail data', () => {
    const item = mapProjectListItem(
      projectListDto(7, {
        status: 'draft',
        tags: [
          {
            id: 11,
            title: { ar: 'وسم', en: 'Tag' },
            short_description: { ar: 'سطر', en: 'Line' },
            icon: fileDto({ uuid: 'tag-1' }),
          },
        ],
      }),
    );
    expect(item.published).toBe(false);
    expect(item.id).toBe('7');
    expect(item.code).toBe('PRJ-00007');
    expect(item.coverUuid).toBe('cover-7');
    expect(item.categories[0]?.imageUuid).toBe('tag-1');
    expect(item.aboutCards).toEqual([]);
    expect(item.identityButtons).toEqual([]);
  });

  it('maps detail fields, pads identity images to four slots, and joins SEO keywords', () => {
    const detail = mapProjectDetail(
      projectDetailDto(7, {
        overview_cards: [
          {
            id: 21,
            subject: { ar: 'موضوع', en: 'Subject' },
            title: { ar: '', en: '' },
            description: { ar: 'نبذة', en: 'Overview' },
            background: fileDto({ uuid: 'bg-1' }),
          },
        ],
        identity_items: [
          {
            id: 91,
            title: { ar: 'هوية', en: 'Identity' },
            short_description: { ar: 'وصف', en: 'Body' },
            images: [{ id: 911, image: fileDto({ uuid: 'id-1' }) }],
          },
        ],
        meta_keywords: { ar: ['أ', 'ب'], en: ['a', 'b'] },
      }),
    );

    expect(detail.aboutCards[0]?.title).toEqual({ ar: 'موضوع', en: 'Subject' });
    expect(detail.results[0]?.body).toEqual({ ar: '10+', en: '10+' });
    expect(detail.solutionsImage.title).toEqual({ ar: 'صورة الحلول', en: 'Solutions image' });
    expect(detail.solutionsImage.body).toEqual({ ar: 'وصف', en: 'Caption' });
    expect(detail.identityButtons[0]?.images).toHaveLength(4);
    expect(detail.identityButtons[0]?.images[0]?.imageUuid).toBe('id-1');
    expect(detail.seo.keywords).toEqual({ ar: 'أ, ب', en: 'a, b' });
    expect(detail.seo.slug).toEqual({ ar: 'project-7', en: 'project-7' });
  });

  it('writes about cards with subject=title and results value from body', () => {
    const body = toProjectWrite({
      ...blankProject(),
      id: '7',
      name: localeText('مشروع', 'Project'),
      summary: localeText('وصف', 'Desc'),
      aboutCards: [
        {
          ...projectPoint(localeText('عنوان', 'Title'), localeText('نص', 'Body')),
          id: '21',
          imageUuid: 'bg-1',
          imageUrl: 'https://cdn.test/bg.png',
          imageName: 'bg.png',
        },
      ],
      results: [
        {
          ...projectPoint(localeText('نتيجة', 'Result'), localeText('10+', '10+')),
          id: '81',
          imageUuid: null,
          imageUrl: '',
          imageName: '',
        },
      ],
      categories: [],
      challenges: [],
      tools: [],
      solutions: [],
      gallery: [],
      features: [],
      identityButtons: [],
    });

    expect(body.overview_cards?.[0]).toEqual(
      expect.objectContaining({
        id: 21,
        subject: { ar: 'عنوان', en: 'Title' },
        title: { ar: 'عنوان', en: 'Title' },
        description: { ar: 'نص', en: 'Body' },
        background: 'bg-1',
      }),
    );
    expect(body.results?.[0]).toEqual(
      expect.objectContaining({
        id: 81,
        title: { ar: 'نتيجة', en: 'Result' },
        value: { ar: '10+', en: '10+' },
        icon: null,
      }),
    );
  });

  it('omits empty trailing identity image slots without id on write', () => {
    const button = projectIdentityButton(localeText('هوية', 'Identity'), localeText('وصف', 'Body'));
    button.id = '91';
    button.images = [
      {
        ...projectGalleryImage(),
        id: '911',
        imageUuid: 'id-1',
        imageUrl: 'https://cdn/x',
        imageName: 'x',
      },
      projectGalleryImage(),
      projectGalleryImage(),
      projectGalleryImage(),
    ];
    const body = toProjectWrite({
      ...blankProject(),
      id: '7',
      name: localeText('مشروع', 'Project'),
      categories: [],
      aboutCards: [],
      challenges: [],
      tools: [],
      solutions: [],
      gallery: [],
      features: [],
      results: [],
      identityButtons: [button],
    });
    expect(body.identity_items?.[0]?.images).toHaveLength(1);
    expect(body.identity_items?.[0]?.images?.[0]).toEqual(
      expect.objectContaining({ id: 911, image: 'id-1' }),
    );
  });

  it('clears cover with null and omits icon: tickets', () => {
    const body = toProjectWrite({
      ...blankProject(),
      id: '7',
      name: localeText('مشروع', 'Project'),
      coverUrl: '',
      coverUuid: null,
      categories: [
        {
          ...projectPoint(localeText('وسم', 'Tag'), localeText()),
          id: '11',
          imageUrl: 'icon:pi-tag',
          imageName: 'pi-tag',
          imageUuid: null,
        },
      ],
      aboutCards: [],
      challenges: [],
      tools: [],
      solutions: [],
      gallery: [],
      features: [],
      results: [],
      identityButtons: [],
    });
    expect(body.cover).toBeNull();
    expect(body.tags?.[0]).not.toHaveProperty('icon');
  });

  it('detects blob upload urls only', () => {
    expect(isUploadUrl('blob:https://local/x')).toBe(true);
    expect(isUploadUrl('https://cdn.test/x')).toBe(false);
    expect(isUploadUrl('icon:pi-star')).toBe(false);
  });
});
