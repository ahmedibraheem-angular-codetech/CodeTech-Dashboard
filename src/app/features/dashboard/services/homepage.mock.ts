import { HomepageContent } from '../models/homepage.model';

const point = 'نص قصير تعريفي عن كود التقنية يتم كتابته — مصحوبة بفريق العمل لاحقاً';
const pointEn = 'A short introduction to CodeTech, written later — accompanied by the team';

export const HOMEPAGE_SEED: HomepageContent = {
  videoEnabled: true,
  videoName: 'intro-video.mp4',
  contactRequests: 12,
  partners: [
    { id: 'p1', name: 'شريك التقنية', monogram: 'ك' },
    { id: 'p2', name: 'شريك التحول', monogram: 'ت' },
    { id: 'p3', name: 'شريك الابتكار', monogram: 'ق' },
    { id: 'p4', name: 'شريك النمو', monogram: 'ن' },
    { id: 'p5', name: 'شريك المعرفة', monogram: 'م' },
    { id: 'p6', name: 'شريك الجودة', monogram: 'ج' },
    { id: 'p7', name: 'شريك الرؤية', monogram: 'ر' },
    { id: 'p8', name: 'شريك التمكين', monogram: 'س' },
  ],
  about: {
    texts: {
      ar: {
        title: 'عن كود التقنية',
        body: 'نساعد الجهات الحكومية والشركات والعلامات على تطوير الأنظمة والتطبيقات والمنتجات الرقمية التي تعزز التحول الرقمي، وتحقق قيمة مستدامة بشكل دقيق وجذاب للمستخدم والجهة المستهدفة.',
        points: [point, point, point],
      },
      en: {
        title: 'About CodeTech',
        body: 'We help government entities, companies and brands build the digital systems, applications and products that drive digital transformation and deliver lasting value, with precision and appeal for the user and the target audience.',
        points: [pointEn, pointEn, pointEn],
      },
    },
    image: { name: 'ملف صورة عن كود.png', size: 320512, uploadedAt: '2026-08-31' },
  },
  vision: {
    texts: {
      ar: {
        title: 'نواكب رؤية المملكة 2030',
        body: 'نؤمن بدور التقنية في تمكين الطموحات الوطنية، ونسعى إلى تطوير حلول رقمية تساهم في دعم التحول الرقمي ونمو الاقتصاد الرقمي في المملكة.',
        points: [point, point, point],
      },
      en: {
        title: 'Aligned with Saudi Vision 2030',
        body: 'We believe in the role of technology in enabling national ambitions, and we build digital solutions that support digital transformation and the growth of the digital economy in the Kingdom.',
        points: [pointEn, pointEn, pointEn],
      },
    },
    image: { name: 'vision-2030.png', size: 204800, uploadedAt: '2026-08-31' },
  },
};
