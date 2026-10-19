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
      productPoint(
        localeText('إدارة الأصول', 'Asset management'),
        localeText('وصف يمكن استبدالة لاحقاً', 'Description can be replaced later.'),
      ),
      productPoint(
        localeText('إدارة الطلبات', 'Request management'),
        localeText('وصف يمكن استبدالة لاحقاً', 'Description can be replaced later.'),
      ),
      productPoint(
        localeText('Workflow', 'Workflow'),
        localeText('وصف يمكن استبدالة لاحقاً', 'Description can be replaced later.'),
      ),
      productPoint(
        localeText('التقارير', 'Reports'),
        localeText('وصف يمكن استبدالة لاحقاً', 'Description can be replaced later.'),
      ),
    ],
    stats: [
      {
        ...productStat(),
        value: '120+',
        label: localeText('جهة مستفيدة', 'Organizations'),
        body: localeText('جهات تستخدم النظام يومياً.', 'Organizations using the system daily.'),
        imageName: 'stat.jpg',
        imageUrl: DESK,
      },
    ],
    sectors: [
      {
        ...productMedia(),
        title: localeText('التعليم', 'Education'),
        imageName: 'education.jpg',
        imageUrl: DESK,
      },
      {
        ...productMedia(),
        title: localeText('الصحة', 'Health'),
        imageName: 'health.jpg',
        imageUrl: DESK,
      },
      {
        ...productMedia(),
        title: localeText('الشركات', 'Companies'),
        imageName: 'companies.jpg',
        imageUrl: DESK,
      },
    ],
    challenges: [
      productPoint(
        localeText('تشتت الطلبات', 'Scattered requests'),
        localeText(
          'الطلبات تصل من قنوات متفرقة ويصعب تتبعها.',
          'Requests arrive from many channels and are hard to track.',
        ),
      ),
    ],
    solution: {
      ...productMedia(),
      title: localeText('منصة موحدة للطلب', 'One platform for every request'),
      body: localeText(
        'كل الطلبات والأصول والتقارير في مسار واحد.',
        'Requests, assets, and reports in one flow.',
      ),
      imageName: 'solution.jpg',
      imageUrl: DESK,
    },
    offer: [
      productPoint(
        localeText('بوابة موحدة', 'Unified portal'),
        localeText('مدخل واحد للخدمات.', 'One entry for every service.'),
      ),
    ],
    results: [
      productPoint(
        localeText('سرعة الاستجابة', 'Faster response'),
        localeText('متابعة أوضح لزمن الإغلاق.', 'Clearer closure times.'),
      ),
    ],
    tools: [
      {
        ...productMedia(),
        title: localeText('لوحة المتابعة', 'Tracking board'),
        body: localeText('عرض حالة الطلبات والأصول.', 'See the state of requests and assets.'),
        imageName: 'tool.jpg',
        imageUrl: DESK,
      },
    ],
    integrations: [productMedia()],
    units: [
      {
        ...productUnit(),
        title: localeText('وحدة الطلبات', 'Requests unit'),
        body: localeText('تسجيل الطلب وتعيينه وإغلاقه.', 'Log, assign, and close a request.'),
        imageName: 'unit.jpg',
        imageUrl: DESK,
        points: [
          productPoint(
            localeText('التسجيل', 'Logging'),
            localeText('فتح الطلب ببياناته.', 'Open the request with its data.'),
          ),
          productPoint(
            localeText('الإسناد', 'Assignment'),
            localeText('توجيه الطلب للفريق.', 'Route the request to a team.'),
          ),
        ],
      },
    ],
    steps: [
      productPoint(
        localeText('استقبال الطلب', 'Receive the request'),
        localeText('تصل البيانات من القناة المعتمدة.', 'Data arrives from the approved channel.'),
      ),
      productPoint(
        localeText('المعالجة', 'Processing'),
        localeText('الفريق ينفذ ويحدّث الحالة.', 'The team delivers and updates the status.'),
      ),
    ],
    identity: [
      {
        ...productMedia(),
        title: localeText('الهوية الرقمية', 'Digital identity'),
        body: localeText(
          'ألوان وخطوط وشعارات النظام كما تظهر للمستخدم.',
          'Colors, type, and logos as the user sees them.',
        ),
        imageName: 'identity.jpg',
        imageUrl: DESK,
      },
    ],
    faqs: [
      {
        id: 'faq-channels',
        question: localeText(
          'هل الطلبات من كل القنوات في مكان واحد؟',
          'Are requests from every channel in one place?',
        ),
        answer: localeText(
          'نعم، القنوات المعتمدة تصب في نفس سجل الطلبات.',
          'Yes. Approved channels land in the same request log.',
        ),
      },
    ],
    highlights: [
      productPoint(
        localeText('تكامل', 'Integration'),
        localeText('يربط القنوات الداخلية.', 'Connects internal channels.'),
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

/** Local catalog until a products API exists. */
export const PRODUCTS_SEED: Product[] = [
  featured(),
  card('info-system-2', FLAT),
  card('info-system-3', WOOD),
  card('info-system-4', DESK),
  card('info-system-5', WOOD),
  card('info-system-6', DESK),
];
