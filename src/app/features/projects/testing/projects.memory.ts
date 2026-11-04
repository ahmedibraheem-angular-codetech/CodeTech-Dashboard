import { Injectable, inject, signal } from '@angular/core';
import { type Observable, of } from 'rxjs';

import type { FileObject } from '../../../core/http/api.model';
import { ObjectUrls } from '../../../shared/components/product-upload/object-urls';
import type { ProjectDetailDto, ProjectListDto, ProjectsPageDto } from '../models/project.api';
import {
  blankProject,
  emptyProjectImage,
  localeText,
  projectGalleryImage,
  projectIdentityButton,
  projectMedia,
  projectPoint,
  type LocalizedMedia,
  type Project,
  type ProjectImage,
} from '../models/project.model';

/** UI/test fixtures — not used by the HTTP ProjectsService. */

const COVER = '/images/project-cover.jpg';
const DESK = '/images/product-cover-desk.jpg';
const FLAT = '/images/product-cover-flat.jpg';
const WOOD = '/images/product-cover-wood.jpg';

function mediaFrom(image: ProjectImage): LocalizedMedia {
  return { ar: image, en: emptyProjectImage() };
}

function iconMedia(icon: string): LocalizedMedia {
  return mediaFrom({ imageName: icon, imageUrl: `icon:${icon}`, imageUuid: null });
}

function urlMedia(url: string, name: string): LocalizedMedia {
  return mediaFrom({ imageName: name, imageUrl: url, imageUuid: null });
}

function tagged(
  ar: string,
  en: string,
  icon: string,
  bodyAr = 'وصف مختصر يمكن استبداله لاحقًا.',
  bodyEn = 'A short description that can be replaced later.',
) {
  return {
    ...projectPoint(localeText(ar, en), localeText(bodyAr, bodyEn)),
    image: iconMedia(icon),
  };
}

function build(
  id: string,
  nameAr: string,
  nameEn: string,
  summaryAr: string,
  summaryEn: string,
  coverUrl: string,
  published: boolean,
): Project {
  const base = blankProject();
  return {
    ...base,
    id,
    published,
    name: localeText(nameAr, nameEn),
    summary: localeText(summaryAr, summaryEn),
    cover: urlMedia(coverUrl, 'cover.jpg'),
    coverTitle: localeText(nameAr, nameEn),
    coverAlt: localeText(`غلاف ${nameAr}`, `Cover for ${nameEn}`),
    thumb: urlMedia(coverUrl, 'thumb.jpg'),
    thumbTitle: localeText(nameAr, nameEn),
    thumbAlt: localeText(`مصغرة ${nameAr}`, `Thumbnail for ${nameEn}`),
    categories: [
      tagged('UI/UX', 'UI/UX', 'pi-desktop'),
      tagged('البرمجة', 'Development', 'pi-code'),
      tagged('Cloud', 'Cloud', 'pi-cloud'),
    ],
    aboutCards: [
      {
        ...projectPoint(
          localeText('لماذا هذا المشروع', 'Why this project'),
          localeText(
            'نبذة تعريفية عن أهداف المشروع والسياق الذي بُني من أجله.',
            'A short overview of the project goals and the context it was built for.',
          ),
        ),
        image: urlMedia(WOOD, 'about.jpg'),
      },
    ],
    challenges: [
      tagged(
        'تعقيد التكامل',
        'Integration complexity',
        'pi-share-alt',
        'الحاجة لربط أنظمة متعددة دون تعطيل العمليات اليومية.',
        'Connecting multiple systems without disrupting daily operations.',
      ),
    ],
    tools: [
      {
        ...projectMedia(),
        title: localeText('أداة التكامل', 'Integration tool'),
        image: urlMedia(FLAT, 'tool.jpg'),
      },
    ],
    solutions: [
      tagged(
        'منصة موحدة',
        'Unified platform',
        'pi-sitemap',
        'حل يجمع الطلبات والتقارير ولوحات التحكم في مكان واحد.',
        'A solution that unifies requests, reports, and dashboards.',
      ),
    ],
    solutionsImage: {
      ...projectMedia(),
      title: localeText('صورة الحلول', 'Solutions image'),
      image: urlMedia(DESK, 'solutions.jpg'),
    },
    gallery: [
      { ...projectGalleryImage(), image: urlMedia(COVER, 'gallery-1.jpg') },
      { ...projectGalleryImage(), image: urlMedia(DESK, 'gallery-2.jpg') },
    ],
    features: [
      tagged(
        'لوحة تحكم حية',
        'Live dashboard',
        'pi-chart-line',
        'متابعة مؤشرات الأداء لحظة بلحظة.',
        'Track performance indicators in real time.',
      ),
    ],
    results: [
      tagged(
        'تقليل زمن الاستجابة',
        'Faster response time',
        'pi-bolt',
        'انخفاض ملحوظ في زمن معالجة الطلبات.',
        'A measurable drop in request handling time.',
      ),
    ],
    identityButtons: [
      {
        ...projectIdentityButton(
          localeText('الهوية البصرية', 'Visual identity'),
          localeText(
            'ألوان وصور تعكس شخصية العلامة للمشروع.',
            'Colors and imagery that reflect the project brand.',
          ),
        ),
        images: [
          { ...projectGalleryImage(), image: urlMedia(COVER, 'id-1.jpg') },
          { ...projectGalleryImage(), image: urlMedia(DESK, 'id-2.jpg') },
          { ...projectGalleryImage(), image: urlMedia(FLAT, 'id-3.jpg') },
          { ...projectGalleryImage(), image: urlMedia(WOOD, 'id-4.jpg') },
        ],
      },
    ],
    seo: {
      slug: localeText(id, id),
      title: localeText(nameAr, nameEn),
      keywords: localeText('مشاريع، كود تك', 'projects, codetech'),
      description: localeText(summaryAr, summaryEn),
    },
  };
}

export const PROJECTS_SEED: Project[] = [
  build(
    'wasly',
    'موقع وتطبيق «وصلني» للخدمات السريعة',
    'Waslny website and app for fast services',
    'منصة تربط العملاء بمزودي الخدمات القريبة بسرعة وشفافية.',
    'A platform that connects customers with nearby service providers quickly and clearly.',
    COVER,
    true,
  ),
  build(
    'ops-suite',
    'نظام إدارة العمليات الميدانية',
    'Field operations management system',
    'أداة لتخطيط الجولات الميدانية ومتابعة فرق العمل على الخريطة.',
    'A tool for planning field routes and tracking teams on the map.',
    DESK,
    true,
  ),
  build(
    'care-hub',
    'بوابة رعاية العملاء',
    'Customer care hub',
    'مركز موحد لتذاكر الدعم والمعرفة وقياس رضا العملاء.',
    'A unified hub for support tickets, knowledge, and satisfaction metrics.',
    FLAT,
    false,
  ),
  build(
    'retail-pulse',
    'لوحة ذكاء التجزئة',
    'Retail intelligence board',
    'تحليل مبيعات الفروع والمخزون والتنبيهات اليومية للمدراء.',
    'Branch sales, inventory analytics, and daily alerts for managers.',
    WOOD,
    true,
  ),
  build(
    'learn-space',
    'منصة التعلم المؤسسي',
    'Corporate learning space',
    'مسارات تدريب داخلية مع تتبع الإنجاز والاختبارات القصيرة.',
    'Internal learning paths with progress tracking and short assessments.',
    COVER,
    true,
  ),
  build(
    'city-sense',
    'حلول المدن الذكية',
    'Smart city solutions',
    'لوحات لمراقبة الخدمات البلدية والتنبيهات البيئية.',
    'Dashboards for municipal services and environmental alerts.',
    DESK,
    false,
  ),
];

export const fileDto = (overrides: Partial<FileObject> = {}): FileObject => ({
  uuid: 'media-1',
  name: 'file',
  file_name: 'file.png',
  mime_type: 'image/png',
  size: 12,
  url: 'https://cdn.test/file.png',
  download_url: 'https://cdn.test/download',
  created_at: '2026-11-01T10:00:00.000000Z',
  ...overrides,
});

export const projectListDto = (
  id: number,
  overrides: Partial<ProjectListDto> & Record<string, unknown> = {},
): ProjectListDto => ({
  id,
  code: `PRJ-${`${id}`.padStart(5, '0')}`,
  title: { ar: `مشروع ${id}`, en: `Project ${id}` },
  description: { ar: 'وصف', en: 'Desc' },
  cover: fileDto({ uuid: `cover-${id}`, url: `/images/cover-${id}.jpg` }),
  thumbnail: null,
  tags: [
    {
      id: id * 10 + 1,
      title: { ar: 'UI/UX', en: 'UI/UX' },
      short_description: { ar: 'وصف', en: 'Desc' },
      icon: fileDto({ uuid: `tag-${id}`, url: 'icon:pi-desktop' }),
      sort_order: 1,
    },
  ],
  status: 'published',
  slug: `project-${id}`,
  sort_order: id,
  created_at: '2026-11-01T10:00:00.000000Z',
  updated_at: '2026-11-01T10:00:00.000000Z',
  ...overrides,
});

export const projectDetailDto = (
  id: number,
  overrides: Partial<ProjectDetailDto> & Record<string, unknown> = {},
): ProjectDetailDto => ({
  ...projectListDto(id),
  cover_title: { ar: 'غلاف', en: 'Cover' },
  cover_alt: { ar: 'بديل', en: 'Alt' },
  thumbnail_title: { ar: '', en: '' },
  thumbnail_alt: { ar: '', en: '' },
  solutions_image: fileDto({ uuid: 'sol-img', url: '/images/solutions.jpg' }),
  solutions_image_title: { ar: 'صورة الحلول', en: 'Solutions image' },
  solutions_image_alt: { ar: 'وصف', en: 'Caption' },
  overview_cards: [
    {
      id: 21,
      subject: { ar: 'موضوع', en: 'Subject' },
      title: { ar: 'لماذا هذا المشروع', en: 'Why this project' },
      description: { ar: 'نبذة', en: 'Overview' },
      background: fileDto({ uuid: 'about-1', url: '/images/about.jpg' }),
    },
  ],
  challenges: [
    {
      id: 31,
      title: { ar: 'تعقيد التكامل', en: 'Integration complexity' },
      short_description: { ar: 'وصف', en: 'Body' },
      image: fileDto({ uuid: 'chal-1', url: 'icon:pi-share-alt' }),
    },
  ],
  tools: [{ id: 41, image: fileDto({ uuid: 'tool-1', url: '/images/tool.jpg' }) }],
  solutions: [
    {
      id: 51,
      title: { ar: 'منصة موحدة', en: 'Unified platform' },
      short_description: { ar: 'حل', en: 'Solution' },
      icon: fileDto({ uuid: 'sol-1', url: 'icon:pi-sitemap' }),
    },
  ],
  gallery: [{ id: 61, image: fileDto({ uuid: 'gal-1', url: '/images/gallery.jpg' }) }],
  features: [
    {
      id: 71,
      title: { ar: 'لوحة', en: 'Dashboard' },
      short_description: { ar: 'وصف', en: 'Body' },
      image: fileDto({ uuid: 'feat-1', url: 'icon:pi-chart-line' }),
    },
  ],
  results: [
    {
      id: 81,
      title: { ar: 'نتيجة', en: 'Result' },
      value: { ar: '10+', en: '10+' },
      icon: fileDto({ uuid: 'res-1', url: 'icon:pi-bolt' }),
    },
  ],
  identity_items: [
    {
      id: 91,
      title: { ar: 'الهوية البصرية', en: 'Visual identity' },
      short_description: {
        ar: 'ألوان وصور تعكس شخصية العلامة للمشروع.',
        en: 'Colors and imagery that reflect the project brand.',
      },
      images: [
        { id: 911, image: fileDto({ uuid: 'id-1', url: '/images/id-1.jpg' }) },
        { id: 912, image: fileDto({ uuid: 'id-2', url: '/images/id-2.jpg' }) },
        { id: 913, image: fileDto({ uuid: 'id-3', url: '/images/id-3.jpg' }) },
        { id: 914, image: fileDto({ uuid: 'id-4', url: '/images/id-4.jpg' }) },
      ],
    },
  ],
  meta_title: { ar: 'عنوان', en: 'Title' },
  meta_keywords: { ar: ['مشاريع'], en: ['projects'] },
  meta_description: { ar: 'وصف SEO', en: 'SEO desc' },
  ...overrides,
});

export const projectsPageDto = (
  overrides: Partial<ProjectsPageDto> & Record<string, unknown> = {},
): ProjectsPageDto => ({
  sections: {
    stats_visible: false,
    projects_visible: true,
  },
  stats: [
    {
      id: 1,
      title: { ar: 'رضا العملاء', en: 'Customer satisfaction' },
      value: { ar: '4.8', en: '4.8' },
    },
    {
      id: 2,
      title: { ar: 'متواجد في 8 دول', en: 'Present in 8 countries' },
      value: { ar: '8', en: '8' },
    },
    {
      id: 3,
      title: { ar: 'مشروع ناجح', en: 'Successful project' },
      value: { ar: '150', en: '150' },
    },
    {
      id: 4,
      title: { ar: 'قطاعًا مختلفًا', en: 'Different sectors' },
      value: { ar: '15', en: '15' },
    },
  ],
  ...overrides,
});

export function paginated<T>(data: T[], path: string, page = 1, perPage = 100) {
  return {
    data,
    links: { first: null, last: null, prev: null, next: null },
    meta: {
      current_page: page,
      from: data.length ? 1 : null,
      last_page: 1,
      path,
      per_page: perPage,
      to: data.length || null,
      total: data.length,
    },
  };
}

/**
 * In-memory ProjectsService stand-in for component specs that need persistence
 * (editor upload lifecycle, list mutations) without HTTP.
 */
@Injectable()
export class ProjectsMemoryService {
  private readonly objectUrls = inject(ObjectUrls);
  private readonly state = signal<Project[]>(structuredClone(PROJECTS_SEED));
  readonly catalogVisible = signal(true);

  list(): Observable<Project[]> {
    return of(structuredClone(this.state()));
  }

  listAll(): Observable<Project[]> {
    return this.list();
  }

  get(id: string): Observable<Project | null> {
    const match = this.state().find((item) => item.id === id);
    return of(match ? structuredClone(match) : null);
  }

  save(project: Project): Observable<Project> {
    const next: Project = {
      ...structuredClone(project),
      id: project.id || `prj-${Date.now()}`,
      code: project.code || String(Date.now()).slice(-5),
    };
    const previous = this.state().find((item) => item.id === next.id) ?? null;
    this.objectUrls.sync(previous, next);
    this.state.update((items) => {
      const index = items.findIndex((item) => item.id === next.id);
      if (index === -1) {
        return [next, ...items];
      }
      return items.map((item) => (item.id === next.id ? next : item));
    });
    return of(structuredClone(next));
  }

  setPublished(id: string, published: boolean): Observable<Project> {
    let saved: Project | null = null;
    this.state.update((items) =>
      items.map((item) => {
        if (item.id !== id) {
          return item;
        }
        saved = { ...item, published };
        return saved;
      }),
    );
    return of(structuredClone(saved ?? ({ id, published } as Project)));
  }

  remove(id: string): Observable<void> {
    const previous = this.state().find((item) => item.id === id) ?? null;
    this.objectUrls.sync(previous, null);
    this.state.update((items) => items.filter((item) => item.id !== id));
    return of(undefined);
  }

  loadCatalogVisibility(): Observable<boolean> {
    return of(this.catalogVisible());
  }

  toggleCatalog(): void {
    this.catalogVisible.update((visible) => !visible);
  }
}
