import {
  blankProject,
  localeText,
  projectGalleryImage,
  projectIdentityButton,
  projectMedia,
  projectPoint,
  type Project,
} from '../models/project.model';

const COVER = '/images/project-cover.jpg';
const DESK = '/images/product-cover-desk.jpg';
const FLAT = '/images/product-cover-flat.jpg';
const WOOD = '/images/product-cover-wood.jpg';

function tagged(
  ar: string,
  en: string,
  icon: string,
  bodyAr = 'وصف مختصر يمكن استبداله لاحقًا.',
  bodyEn = 'A short description that can be replaced later.',
) {
  return {
    ...projectPoint(localeText(ar, en), localeText(bodyAr, bodyEn)),
    imageUrl: `icon:${icon}`,
    imageName: icon,
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
    coverName: 'cover.jpg',
    coverUrl,
    coverTitle: localeText(nameAr, nameEn),
    coverAlt: localeText(`غلاف ${nameAr}`, `Cover for ${nameEn}`),
    thumbName: 'thumb.jpg',
    thumbUrl: coverUrl,
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
        imageUrl: WOOD,
        imageName: 'about.jpg',
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
        imageUrl: FLAT,
        imageName: 'tool.jpg',
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
      imageUrl: DESK,
      imageName: 'solutions.jpg',
    },
    gallery: [
      { ...projectGalleryImage(), imageUrl: COVER, imageName: 'gallery-1.jpg' },
      { ...projectGalleryImage(), imageUrl: DESK, imageName: 'gallery-2.jpg' },
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
          { ...projectGalleryImage(), imageUrl: COVER, imageName: 'id-1.jpg' },
          { ...projectGalleryImage(), imageUrl: DESK, imageName: 'id-2.jpg' },
          { ...projectGalleryImage(), imageUrl: FLAT, imageName: 'id-3.jpg' },
          { ...projectGalleryImage(), imageUrl: WOOD, imageName: 'id-4.jpg' },
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

/** Distinct catalog seeds for the projects board and editor. */
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
