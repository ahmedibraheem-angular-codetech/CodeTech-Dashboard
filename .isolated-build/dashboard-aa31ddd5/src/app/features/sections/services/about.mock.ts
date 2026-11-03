import type { AboutPageDto, AboutPartnerDto } from '../models/about.api';

const file = (
  uuid: string,
  fileName: string,
  url: string,
): AboutPageDto['about']['image'] => ({
  uuid,
  name: fileName.replace(/\.[^.]+$/, ''),
  file_name: fileName,
  mime_type: 'image/png',
  size: 320512,
  url,
  download_url: `https://example.test/download/${uuid}`,
  created_at: '2026-10-29T10:00:00.000000Z',
});

export const ABOUT_PAGE_DTO: AboutPageDto = {
  about: {
    philosophy_points: {
      ar: ['الجودة أولاً', 'فريق سعودي'],
      en: ['Quality first', 'A Saudi team'],
    },
    target_market_points: {
      ar: ['الجهات الحكومية'],
      en: ['Government entities'],
    },
    image: file(
      'about-image',
      'about.png',
      'https://webdash.codetech-sa-dev.com/storage/about.png',
    ),
  },
  vision_mission: {
    vision_points: {
      ar: ['ريادة التحول الرقمي'],
      en: ['Leading digital transformation'],
    },
    vision_quote: {
      ar: 'نحو مستقبل رقمي',
      en: 'Towards a digital future',
    },
    mission_points: {
      ar: ['حلول موثوقة'],
      en: ['Reliable solutions'],
    },
    mission_quote: {
      ar: 'نبني ما يدوم',
      en: 'We build what lasts',
    },
  },
  ceo: {
    name: { ar: 'م. رامي حسن', en: 'Eng. Rami Hassan' },
    job_title: { ar: 'المدير التنفيذي لكود التقنية', en: 'Chief executive of CodeTech' },
    description: {
      ar: 'يقود كود التقنية منذ تأسيسها.',
      en: 'Has led CodeTech since its founding.',
    },
    quote: {
      ar: 'التقنية وسيلة لخدمة الإنسان',
      en: 'Technology serves people',
    },
    image: file('ceo-image', 'ceo.png', 'https://webdash.codetech-sa-dev.com/storage/ceo.png'),
  },
  team: [
    {
      id: 1,
      name: { ar: 'سارة محمد', en: 'Sara Mohamed' },
      job_title: { ar: 'مصممة واجهات', en: 'UI designer' },
      photo: file('team-1', 'sara.png', 'https://webdash.codetech-sa-dev.com/storage/sara.png'),
      sort_order: 1,
      created_at: '2026-10-29T10:00:00.000000Z',
      updated_at: '2026-10-29T10:00:00.000000Z',
    },
    {
      id: 2,
      name: { ar: 'أحمد طمان', en: 'Ahmed Taman' },
      job_title: { ar: 'مصمم', en: 'Designer' },
      photo: null,
      sort_order: 2,
      created_at: '2026-10-29T10:00:00.000000Z',
      updated_at: '2026-10-29T10:00:00.000000Z',
    },
  ],
  updated_by: { id: 1, name: 'المدير العام' },
  updated_at: '2026-10-29T10:00:00.000000Z',
};

export const ABOUT_PARTNERS_DTO: AboutPartnerDto[] = [
  {
    id: 10,
    logo: file('logo-1', 'partner-one.png', 'https://webdash.codetech-sa-dev.com/storage/p1.png')!,
    sort_order: 1,
    created_at: '2026-10-29T10:00:00.000000Z',
    updated_at: '2026-10-29T10:00:00.000000Z',
  },
  {
    id: 11,
    logo: file('logo-2', 'partner-two.png', 'https://webdash.codetech-sa-dev.com/storage/p2.png')!,
    sort_order: 2,
    created_at: '2026-10-29T10:00:00.000000Z',
    updated_at: '2026-10-29T10:00:00.000000Z',
  },
];
