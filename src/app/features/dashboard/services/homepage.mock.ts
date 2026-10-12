import { HomepageContent } from '../models/homepage.model';

const point = 'نص قصير تعريفي عن كود التقنية يتم كتابته — مصحوبة بفريق العمل لاحقاً';

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
    title: 'عن كود التقنية',
    body: 'نساعد الجهات الحكومية والشركات والعلامات على تطوير الأنظمة والتطبيقات والمنتجات الرقمية التي تعزز التحول الرقمي، وتحقق قيمة مستدامة بشكل دقيق وجذاب للمستخدم والجهة المستهدفة.',
    points: [point, point, point],
  },
  vision: {
    title: 'نواكب رؤية المملكة 2030',
    body: 'نؤمن بدور التقنية في تمكين الطموحات الوطنية، ونسعى إلى تطوير حلول رقمية تساهم في دعم التحول الرقمي ونمو الاقتصاد الرقمي في المملكة.',
    points: [point, point, point],
  },
};
