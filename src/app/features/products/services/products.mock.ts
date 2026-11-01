import {
  localeText,
  productMedia,
  productPoint,
  productStat,
  productUnit,
  type Product,
} from '../models/product.model';

const FLAT = '/images/product-cover-flat.jpg';
const DESK = '/images/product-cover-desk.jpg';
const WOOD = '/images/product-cover-wood.jpg';
const PROJECT = '/images/project-cover.jpg';
const POSTER = '/images/video-poster.jpg';
const brief = localeText('وصف يمكن استبدالة لاحقاً', 'Description can be replaced later.');
const story = localeText(
  'وصف نصي قصير تعريفي عن كود التقنية يتم كتابته — مصدرها فريق العمل لاحقًا.',
  'A short description written by the team later.',
);

function marked(ar: string, en: string, icon: string, body = story) {
  return { ...productPoint(localeText(ar, en), body), imageUrl: `icon:${icon}` };
}

function featured(): Product {
  return {
    id: 'info-system',
    published: true,
    name: localeText('نظام إدارة خدمات تقنية المعلومات', 'IT services management system'),
    summary: localeText(
      'منصة متكاملة لإدارة خدمات تقنية المعلومات، والطلبات، والأصول، والتغييرات، مع تقارير ولوحات تحكم تساعد على رفع كفاءة فرق العمل.',
      'A platform for IT services, requests, assets, changes, reports, and dashboards.',
    ),
    category: localeText('أنظمة تشغيلية', 'Operations systems'),
    coverName: 'cover.jpg',
    coverUrl: DESK,
    coverTitle: localeText(),
    coverAlt: localeText(),
    thumbName: 'thumb.jpg',
    thumbUrl: DESK,
    thumbTitle: localeText(),
    thumbAlt: localeText(),
    features: [
      {
        ...productPoint(
          localeText('إدارة الأصول', 'Asset management'),
          localeText('وصف يمكن استبدالة لاحقاً', 'Description can be replaced later.'),
        ),
        imageUrl: 'icon:pi-cog',
      },
      {
        ...productPoint(
          localeText('إدارة الطلبات', 'Request management'),
          localeText('وصف يمكن استبدالة لاحقاً', 'Description can be replaced later.'),
        ),
        imageUrl: 'icon:pi-th-large',
      },
      {
        ...productPoint(
          localeText('Workflow', 'Workflow'),
          localeText('وصف يمكن استبدالة لاحقاً', 'Description can be replaced later.'),
        ),
        imageUrl: 'icon:pi-sitemap',
      },
      {
        ...productPoint(
          localeText('التقارير', 'Reports'),
          localeText('وصف يمكن استبدالة لاحقاً', 'Description can be replaced later.'),
        ),
        imageUrl: 'icon:pi-clock',
      },
    ],
    stats: [
      {
        ...productStat(),
        value: '+10',
        label: localeText('شركات تستخدم النظام', 'Companies using the system'),
        body: localeText('جهات تستخدم النظام يومياً.', 'Organizations using the system daily.'),
        imageName: 'stat.jpg',
        imageUrl: WOOD,
      },
      {
        ...productStat(),
        value: '+24',
        label: localeText('طلب يومي', 'Daily requests'),
        body: localeText('طلبات تُغلق في نفس اليوم.', 'Requests closed the same day.'),
        imageName: 'stat-2.jpg',
        imageUrl: DESK,
      },
      {
        ...productStat(),
        value: '+8',
        label: localeText('فرق عمل', 'Teams'),
        body: localeText('فرق تتابع الأصول والطلبات.', 'Teams following assets and requests.'),
        imageName: 'stat-3.jpg',
        imageUrl: FLAT,
      },
      {
        ...productStat(),
        value: '+3',
        label: localeText('لوحات متابعة', 'Dashboards'),
        body: localeText('لوحات تعرض حالة العمل.', 'Boards that show the work status.'),
        imageName: 'stat-4.jpg',
        imageUrl: DESK,
      },
    ],
    sectors: [
      ['حكومي', 'Government', PROJECT],
      ['شركات', 'Companies', DESK],
      ['الصحة', 'Health', WOOD],
      ['تعليم', 'Education', FLAT],
      ['القطاع الخاص', 'Private sector', DESK],
      ['المؤسسات', 'Institutions', PROJECT],
      ['الأفراد', 'Individuals', POSTER],
      ['سياحة', 'Tourism', WOOD],
    ].map(([ar, en, imageUrl]) => ({
      ...productMedia(),
      title: localeText(ar, en),
      imageName: `${en}.jpg`,
      imageUrl,
    })),
    challenges: [
      ['تعدد الأنظمة', 'Many systems', 'pi-server'],
      ['العمليات تتم يدويًا', 'Work is still manual', 'pi-cog'],
      ['ضعف التقارير', 'Weak reports', 'pi-clock'],
      ['تأخر تنفيذ الطلبات', 'Slow request delivery', 'pi-sitemap'],
      ['كثرة الأخطاء البشرية', 'Too many manual errors', 'pi-exclamation-circle'],
      ['صعوبة متابعة الأداء', 'Hard to follow performance', 'pi-chart-line'],
    ].map(([ar, en, icon]) => ({
      ...productPoint(
        localeText(ar, en),
        localeText(
          'وصف نصي قصير تعريفي عن كود التقنية يتم كتابته — مصدرها فريق العمل لاحقًا.',
          'A short description written by the team later.',
        ),
      ),
      imageUrl: `icon:${icon}`,
    })),
    solution: {
      ...productMedia(),
      title: localeText(
        'نظام إدارة خدمات تقنية المعلومات (ITSM)',
        'IT service management system (ITSM)',
      ),
      body: localeText(
        'أتمتة شاملة بنسبة 100%. ربط كامل لجميع الأنظمة بشكل منسق ومتكامل. تقارير وتحليلات بضغطة زر فورية.',
        'Full automation. Every system connected in one flow, with reports in one click.',
      ),
      imageName: 'solution.jpg',
      imageUrl: POSTER,
    },
    offer: [
      ['ما هو؟', 'What is it?', 'pi-list'],
      ['أين يستخدم؟', 'Where is it used?', 'pi-cog'],
      ['لمن صُمم؟', 'Who is it for?', 'pi-clock'],
      ['ما القيمة؟', 'What is the value?', 'pi-sitemap'],
    ].map(([ar, en, icon]) => ({
      ...productPoint(
        localeText(ar, en),
        localeText(
          'وصف نصي قصير تعريفي عن كود التقنية يتم كتابته — مصدرها فريق العمل لاحقًا.',
          'A short description written by the team later.',
        ),
      ),
      imageUrl: `icon:${icon}`,
    })),
    results: [
      ['تقليل الوقت', 'Less time', 'pi-list'],
      ['تقليل الأخطاء', 'Fewer errors', 'pi-cog'],
      ['رفع الإنتاجية', 'Higher output', 'pi-clock'],
      ['تحسين اتخاذ القرار', 'Better decisions', 'pi-sitemap'],
      ['زيادة الكفاءة', 'More efficiency', 'pi-clock'],
      ['سهولة التوسع', 'Easier growth', 'pi-chart-line'],
    ].map(([ar, en, icon]) => ({
      ...productPoint(
        localeText(ar, en),
        localeText(
          'وصف نصي قصير تعريفي عن كود التقنية يتم كتابته — مصدرها فريق العمل لاحقًا.',
          'A short description written by the team later.',
        ),
      ),
      imageUrl: `icon:${icon}`,
    })),
    tools: [
      {
        ...productMedia(),
        title: localeText('لوحة المتابعة', 'Tracking board'),
        body: localeText('عرض حالة الطلبات والأصول.', 'See the state of requests and assets.'),
        imageName: 'tool.jpg',
        imageUrl: DESK,
      },
    ],
    integrations: ['pi-prime', 'pi-mobile', 'pi-box', 'pi-code', 'pi-hashtag', 'pi-cog'].map(
      (icon) => ({
        ...productMedia(),
        imageName: `${icon}.svg`,
        imageUrl: `icon:${icon}`,
      }),
    ),
    units: [
      {
        ...productUnit(),
        title: localeText('إدارة الطلبات', 'Request management'),
        body: localeText(
          'حل متكامل يساعد شركات السفر والسياحة على إدارة الحجوزات، والرحلات، والعملاء، والعمليات اليومية من منصة واحدة.',
          'One platform for bookings, trips, customers, and daily operations.',
        ),
        imageName: 'unit.jpg',
        imageUrl: DESK,
        points: [
          marked('إدارة الحجوزات', 'Booking management', 'pi-clock', brief),
          marked('الرحلات', 'Trips', 'pi-clock', brief),
          marked('التقارير', 'Reports', 'pi-clock', brief),
          marked('العملاء', 'Customers', 'pi-clock', brief),
        ],
      },
      {
        ...productUnit(),
        title: localeText('لوحة التحكم', 'Control board'),
        body: localeText(
          'متابعة الحالة والأرقام من لوحة واحدة.',
          'Follow status and numbers from one board.',
        ),
        imageName: 'board.jpg',
        imageUrl: POSTER,
        points: [
          marked('المؤشرات', 'Indicators', 'pi-chart-bar', brief),
          marked('التنبيهات', 'Alerts', 'pi-bell', brief),
        ],
      },
      {
        ...productUnit(),
        title: localeText('إدارة التقارير', 'Report management'),
        body: localeText('تقارير جاهزة لحالة العمل.', 'Ready reports for the work status.'),
        imageName: 'reports.jpg',
        imageUrl: WOOD,
        points: [
          marked('تقرير يومي', 'Daily report', 'pi-file', brief),
          marked('تقرير الأداء', 'Performance report', 'pi-chart-line', brief),
        ],
      },
      {
        ...productUnit(),
        title: localeText('إدارة الخدمات', 'Service management'),
        body: localeText('تنظيم الخدمات ومساراتها.', 'Organize services and their paths.'),
        imageName: 'services.jpg',
        imageUrl: PROJECT,
        points: [
          marked('كتالوج الخدمات', 'Service catalog', 'pi-list', brief),
          marked('مسار الخدمة', 'Service path', 'pi-share-alt', brief),
        ],
      },
    ],
    steps: [DESK, WOOD, FLAT, PROJECT, POSTER, DESK].map((imageUrl) => ({
      ...productPoint(localeText('إعداد النظام', 'System setup'), story),
      imageName: 'step.jpg',
      imageUrl,
    })),
    identity: [
      ['الواجهة الرئيسية', 'Main interface', DESK],
      ['لوحة التحكم', 'Control board', POSTER],
      ['نسخة الجوال', 'Mobile version', WOOD],
      ['التقارير', 'Reports', PROJECT],
    ].map(([ar, en, imageUrl]) => ({
      ...productMedia(),
      title: localeText(ar, en),
      body: story,
      imageName: `${en}.jpg`,
      imageUrl,
    })),
    faqs: [1, 2, 3, 4].map((number) => ({
      id: `faq-${number}`,
      question: localeText(
        'هل أقدر أعدل على محتوى الموقع بنفسي بعد التسليم؟',
        'Can I edit the site content myself after delivery?',
      ),
      answer: localeText(
        'نعم، نصمم لك الموقع بلوحة تحكم سهلة جداً بالعربي، وبنعلمك فيديو قصير كيف تضيف منتجاتك، تعدل النصوص، أو تنزل صور جديدة بنفسك وبدون ما تحتاج مبرمج.',
        'Yes. The site comes with a simple Arabic control panel, and a short video shows you how to add products, edit text, and upload images yourself.',
      ),
    })),
    highlights: [
      marked(
        'مرونة عالية',
        'High flexibility',
        'pi-th-large',
        localeText(
          'قابلة للتخصيص بما يتناسب مع احتياجات كل جهة.',
          'Customized to what each organization needs.',
        ),
      ),
      marked(
        'أمان متقدم',
        'Advanced security',
        'pi-shield',
        localeText('حماية البيانات وفق أفضل الممارسات.', 'Data protected with sound practice.'),
      ),
      marked(
        'قابلية التوسع',
        'Room to grow',
        'pi-expand',
        localeText('تطوير النظام مع نمو أعمالك.', 'The system grows with the business.'),
      ),
      marked(
        'سهولة الاستخدام',
        'Easy to use',
        'pi-user',
        localeText(
          'واجهة استخدام بسيطة تساعد على سرعة التعلم.',
          'A simple interface that is quick to learn.',
        ),
      ),
      marked(
        'دعم فني مستمر',
        'Ongoing support',
        'pi-headphones',
        localeText('فريق متخصص لتقديم الدعم الفني والتحديثات.', 'A team for support and updates.'),
      ),
      marked(
        'سرعة التنفيذ',
        'Fast delivery',
        'pi-bolt',
        localeText(
          'إمكانية الربط مع الأنظمة والخدمات المختلفة.',
          'Connects with the other systems and services.',
        ),
      ),
    ],
    seo: {
      slug: localeText('it-services', 'it-services'),
      title: localeText('نظام إدارة خدمات تقنية المعلومات', 'IT services management system'),
      keywords: localeText('خدمات، أصول، طلبات', 'services, assets, requests'),
      description: localeText(
        'نظام لإدارة خدمات تقنية المعلومات وتتبع الطلبات والأصول.',
        'A system for IT services, requests, and assets.',
      ),
    },
  };
}

function card(id: string, cover: string): Product {
  const product = structuredClone(featured());
  product.id = id;
  product.coverUrl = cover;
  product.thumbUrl = cover;
  product.seo.slug = localeText(id, id);
  return product;
}

export const PRODUCTS_SEED: Product[] = [
  featured(),
  card('info-system-2', FLAT),
  card('info-system-3', WOOD),
  card('info-system-4', DESK),
  card('info-system-5', WOOD),
  card('info-system-6', DESK),
];
