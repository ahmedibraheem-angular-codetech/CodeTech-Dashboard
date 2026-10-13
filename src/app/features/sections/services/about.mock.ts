import { AboutContent, AboutPointGroup } from '../models/about.model';

const POINT_AR = 'نص قصير تعريفي عن كود التقنية يتم كتابته لاحقاً — مصحوبة بفريق العمل لاحقاً';
const POINT_EN = 'A short introductory line about CodeTech will be written later.';

function group(id: string, title: string, highlight: string, point: string): AboutPointGroup {
  return { id, title, highlight, points: [point, point, point, point] };
}

/** The filled About page from the management design. */
export const ABOUT_SEED: AboutContent = {
  story: {
    image: { name: 'ملف صورة عن كود.png', size: 313 * 1024, uploadedAt: '2026-08-31' },
    texts: {
      ar: [
        group('philosophy', 'فلسفة الشركة', '', POINT_AR),
        group('market', 'السوق المستهدف', '', POINT_AR),
      ],
      en: [
        group('philosophy', 'Company philosophy', '', POINT_EN),
        group('market', 'Target market', '', POINT_EN),
      ],
    },
  },
  vision: {
    image: null,
    texts: {
      ar: [
        group(
          'mission',
          'رسالتنا',
          'هدفنا تمكين العملاء من تحقيق نتائج أفضل عبر تجربة رقمية أكثر سرعة وذكاء',
          POINT_AR,
        ),
        group(
          'vision',
          'رؤيتنا',
          'نطمح إلى بناء منظومة رقمية متكاملة تُحدث فرقًا ملموسًا في مختلف القطاعات',
          POINT_AR,
        ),
      ],
      en: [
        group(
          'mission',
          'Our mission',
          'We help clients reach better results through a faster, smarter digital experience.',
          POINT_EN,
        ),
        group(
          'vision',
          'Our vision',
          'We aim to build an integrated digital system that makes a real difference.',
          POINT_EN,
        ),
      ],
    },
  },
  ceo: {
    image: { name: 'ceo.png', size: 180 * 1024, uploadedAt: '2026-08-31' },
    texts: {
      ar: {
        name: 'م. رامي حسن',
        role: 'المدير التنفيذي لكود التقنية',
        body: 'وصف نصي قصير تعريفي عن كود التقنية يتم كتابته لاحقاً، وصف نصي قصير تعريفي عن كود التقنية يتم كتابته لاحقاً، وصف نصي قصير تعريفي عن كود التقنية يتم كتابته لاحقاً.',
        quote: 'نطور حلولاً رقمية تُسهل نمو أعمالك بشكل مميز ومبتكر ومتميز',
      },
      en: {
        name: 'Eng. Rami Hassan',
        role: 'Chief executive of CodeTech',
        body: 'A short biography of CodeTech will be written later.',
        quote: 'We build digital solutions that make growing your business simpler.',
      },
    },
  },
  team: [
    { id: 'member-1', name: 'أحمد عبدالعزيز طمان', role: 'مصمم', image: null },
    { id: 'member-2', name: 'أحمد عبدالعزيز طمان', role: 'مصمم', image: null },
    { id: 'member-3', name: 'أحمد عبدالعزيز طمان', role: 'مصمم', image: null },
    { id: 'member-4', name: 'أحمد عبدالعزيز طمان', role: 'مصمم', image: null },
  ],
};
