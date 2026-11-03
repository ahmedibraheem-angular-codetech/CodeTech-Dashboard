import type { FileObject } from '../../../core/http/api.model';
import type { ProjectDetailDto, ProjectListDto, ProjectsPageDto } from '../models/project.api';

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
