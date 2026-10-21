import type { FaqCategory, FaqItem } from '../models/faq.model';

export const FAQ_CATEGORIES_SEED: FaqCategory[] = [
  {
    id: 'general',
    name: { ar: 'عام', en: 'General' },
    order: 1,
    published: true,
  },
  {
    id: 'services',
    name: { ar: 'الخدمات', en: 'Services' },
    order: 2,
    published: true,
  },
  {
    id: 'products',
    name: { ar: 'المنتجات', en: 'Products' },
    order: 3,
    published: true,
  },
  {
    id: 'support',
    name: { ar: 'الدعم الفني', en: 'Technical support' },
    order: 4,
    published: true,
  },
  {
    id: 'billing',
    name: { ar: 'الفواتير والتعاقد', en: 'Billing & contracts' },
    order: 5,
    published: true,
  },
];

const answerAr =
  'نعم، عند تسليم المشروع يتم توفير لوحة تحكم سهلة الاستخدام تتيح لك تعديل النصوص، الصور، الصفحات، والبيانات الأساسية بدون الحاجة لمبرمج. كما نوفر دليل استخدام مبسط، وفي حال احتجت دعم إضافي يمكن طلب تدريب سريع لفريقك.';

const answerEn =
  'Yes. After delivery you get an easy control panel to edit text, images, pages, and core data without a developer. We also provide a short guide, and extra training for your team is available on request.';

export const FAQ_ITEMS_SEED: FaqItem[] = [
  {
    id: 'fq1',
    question: {
      ar: 'هل أقدر أعدل على محتوى الموقع بنفسي بعد التسليم؟',
      en: 'Can I edit the site content myself after delivery?',
    },
    answer: { ar: answerAr, en: answerEn },
    categoryId: 'services',
    order: 1,
    published: true,
    updatedAt: '2026-10-09',
  },
  {
    id: 'fq2',
    question: {
      ar: 'هل في تدريب أو دليل استخدام بعد التسليم؟',
      en: 'Is there training or a user guide after delivery?',
    },
    answer: { ar: answerAr, en: answerEn },
    categoryId: 'services',
    order: 2,
    published: true,
    updatedAt: '2026-10-09',
  },
  {
    id: 'fq3',
    question: {
      ar: 'هل أقدر أعدل على محتوى الموقع بنفسي بعد التسليم؟',
      en: 'Can I update website content on my own later?',
    },
    answer: { ar: answerAr, en: answerEn },
    categoryId: 'services',
    order: 3,
    published: true,
    updatedAt: '2026-10-09',
  },
  {
    id: 'fq4',
    question: {
      ar: 'هل أقدر أعدل على محتوى الموقع بنفسي بعد التسليم؟',
      en: 'Will I be able to manage content without developers?',
    },
    answer: { ar: answerAr, en: answerEn },
    categoryId: 'services',
    order: 4,
    published: true,
    updatedAt: '2026-10-09',
  },
  {
    id: 'fq5',
    question: {
      ar: 'كم تستغرق مدة تنفيذ المشروع تقريباً؟',
      en: 'How long does a typical project take?',
    },
    answer: { ar: answerAr, en: answerEn },
    categoryId: 'general',
    order: 5,
    published: true,
    updatedAt: '2026-10-08',
  },
  {
    id: 'fq6',
    question: {
      ar: 'هل تقدمون دعم فني بعد إطلاق الموقع؟',
      en: 'Do you provide technical support after launch?',
    },
    answer: { ar: answerAr, en: answerEn },
    categoryId: 'support',
    order: 6,
    published: true,
    updatedAt: '2026-10-07',
  },
  {
    id: 'fq7',
    question: {
      ar: 'كيف تتم آلية الدفع والتعاقد؟',
      en: 'How do billing and contracts work?',
    },
    answer: { ar: answerAr, en: answerEn },
    categoryId: 'billing',
    order: 7,
    published: false,
    updatedAt: '2026-10-06',
  },
];
