import type { HomePageDto } from '../models/homepage.api';

export const HOME_PAGE_DTO: HomePageDto = {
  about: {
    title: { ar: 'عن كود التقنية', en: 'About CodeTech' },
    description: {
      ar: 'شركة سعودية متخصصة في الحلول الرقمية.',
      en: 'A Saudi company focused on digital solutions.',
    },
    points: {
      ar: ['خبرة تزيد عن 10 سنوات', 'فريق سعودي'],
      en: ['10+ years of experience', 'A Saudi team'],
    },
    image: {
      uuid: 'about-image',
      name: 'about',
      file_name: 'about.png',
      mime_type: 'image/png',
      size: 320512,
      url: 'https://webdash.codetech-sa-dev.com/storage/about.png',
      download_url: 'https://webdash.codetech-sa-dev.com/api/v1/admin/media/about-image/download',
      created_at: '2026-10-29T10:00:00.000000Z',
    },
  },
  vision_2030: {
    title: { ar: '', en: null },
    description: { ar: null, en: null },
    points: { ar: [], en: [] },
    image: null,
  },
  intro_video: {
    video: {
      uuid: 'video-1',
      name: 'intro',
      file_name: 'intro-video.mp4',
      mime_type: 'video/mp4',
      size: 1_024_000,
      url: 'https://webdash.codetech-sa-dev.com/storage/intro-video.mp4',
      download_url: 'https://webdash.codetech-sa-dev.com/api/v1/admin/media/video-1/download',
      created_at: '2026-10-29T10:00:00.000000Z',
    },
    is_visible: true,
  },
  partners: [
    {
      id: 1,
      logo: {
        uuid: 'logo-1',
        name: 'maarej',
        file_name: 'maarej.png',
        mime_type: 'image/png',
        size: 42681,
        url: 'https://webdash.codetech-sa-dev.com/storage/maarej.png',
        download_url: 'https://webdash.codetech-sa-dev.com/api/v1/admin/media/logo-1/download',
        created_at: '2026-10-29T10:00:00.000000Z',
      },
      sort_order: 1,
      created_at: '2026-10-29T10:00:00.000000Z',
      updated_at: '2026-10-29T10:00:00.000000Z',
    },
    {
      id: 2,
      logo: {
        uuid: 'logo-2',
        name: 'partner-two',
        file_name: 'partner-two.png',
        mime_type: 'image/png',
        size: 12000,
        url: 'https://webdash.codetech-sa-dev.com/storage/partner-two.png',
        download_url: 'https://webdash.codetech-sa-dev.com/api/v1/admin/media/logo-2/download',
        created_at: '2026-10-29T10:00:00.000000Z',
      },
      sort_order: 2,
      created_at: '2026-10-29T10:00:00.000000Z',
      updated_at: '2026-10-29T10:00:00.000000Z',
    },
  ],
  updated_by: { id: 1, name: 'المدير العام' },
  updated_at: '2026-10-29T10:00:00.000000Z',
};
