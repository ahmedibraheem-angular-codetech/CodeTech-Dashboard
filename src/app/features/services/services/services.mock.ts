import {
  blankService,
  localeText,
  serviceFaq,
  servicePoint,
  serviceSector,
  serviceWhyItem,
  type LocaleText,
  type Service,
  type ServiceImage,
  type ServicePoint,
} from '../models/service.model';

type Pair = readonly [ar: string, en: string];

interface PointSeed {
  title: Pair;
  body: Pair;
}

interface ServiceSeed {
  id: string;
  icon: string;
  published: boolean;
  name: Pair;
  description: Pair;
  whyTitle: Pair;
  why: { title: Pair; icon: string }[];
  solutions: (PointSeed & { icon: string })[];
  stages: PointSeed[];
  features: PointSeed[];

  projectIds: string[];
  sectorCount: number;
  faqs: { question: Pair; answer: Pair }[];
}

const PICTURES = [
  '/images/project-cover.jpg',
  '/images/product-cover-desk.jpg',
  '/images/product-cover-flat.jpg',
  '/images/product-cover-wood.jpg',
] as const;

function text([ar, en]: Pair): LocaleText {
  return localeText(ar, en);
}

function picture(index: number): ServiceImage {
  const url = PICTURES[index % PICTURES.length];
  return { imageName: url.slice(url.lastIndexOf('/') + 1), imageUrl: url };
}

function iconImage(icon: string): ServiceImage {
  return { imageName: icon, imageUrl: `icon:${icon}` };
}

function iconPoint(seed: PointSeed, icon: string): ServicePoint {
  return { ...servicePoint(text(seed.title), text(seed.body)), ...iconImage(icon) };
}

function imagePoint(seed: PointSeed, index: number): ServicePoint {
  return { ...servicePoint(text(seed.title), text(seed.body)), ...picture(index) };
}

function build(seed: ServiceSeed): Service {
  return {
    ...blankService(),
    id: seed.id,
    icon: seed.icon,
    published: seed.published,
    name: text(seed.name),
    description: text(seed.description),
    whyImage: { title: text(seed.whyTitle), ...picture(0) },
    whyItems: seed.why.map((item) => ({
      ...serviceWhyItem(text(item.title)),
      ...iconImage(item.icon),
    })),
    solutions: seed.solutions.map((item) => iconPoint(item, item.icon)),
    stages: seed.stages.map((item, index) => imagePoint(item, index + 1)),
    features: seed.features.map((item, index) => imagePoint(item, index + 2)),
    projectIds: [...seed.projectIds],
    sectors: Array.from({ length: seed.sectorCount }, (_, index) => ({
      ...serviceSector(),
      ...picture(index + 1),
    })),
    faqs: seed.faqs.map((item) => ({
      ...serviceFaq(),
      question: text(item.question),
      answer: text(item.answer),
    })),
  };
}

const SEEDS: ServiceSeed[] = [
  {
    id: 'web-development',
    icon: 'pi-globe',
    published: true,
    name: ['تطوير المواقع الإلكترونية', 'Website development'],
    description: [
      'مواقع سريعة وآمنة تعكس هوية الجهة وتخدم أهدافها الرقمية.',
      'Fast, secure websites that reflect your brand and serve your digital goals.',
    ],
    whyTitle: ['حضور رقمي يبني الثقة', 'A digital presence that builds trust'],
    why: [
      { title: ['زيادة الوصول للعملاء', 'Reach more customers'], icon: 'pi-users' },
      { title: ['تجربة استخدام سلسة', 'A smooth user experience'], icon: 'pi-thumbs-up' },
      { title: ['أداء وأمان عاليان', 'High performance and security'], icon: 'pi-shield' },
    ],
    solutions: [
      {
        title: ['مواقع تعريفية', 'Corporate websites'],
        body: [
          'صفحات احترافية تعرض خدماتك بوضوح.',
          'Professional pages that present your services clearly.',
        ],
        icon: 'pi-desktop',
      },
      {
        title: ['متاجر إلكترونية', 'Online stores'],
        body: [
          'منصات بيع متكاملة مع بوابات الدفع.',
          'Complete selling platforms with payment gateways.',
        ],
        icon: 'pi-shopping-cart',
      },
    ],
    stages: [
      {
        title: ['تحليل المتطلبات', 'Requirements analysis'],
        body: ['نفهم أهدافك وجمهورك قبل البدء.', 'We understand your goals and audience first.'],
      },
      {
        title: ['التصميم والتطوير', 'Design and development'],
        body: [
          'نبني الواجهات ونربطها بالأنظمة.',
          'We build the interfaces and connect them to your systems.',
        ],
      },
      {
        title: ['الإطلاق والدعم', 'Launch and support'],
        body: [
          'نطلق الموقع ونتابع أداءه بعد التسليم.',
          'We launch the site and monitor it after delivery.',
        ],
      },
    ],
    features: [
      {
        title: ['تصميم متجاوب', 'Responsive design'],
        body: ['يعمل بسلاسة على جميع الشاشات.', 'Works smoothly on every screen size.'],
      },
      {
        title: ['جاهز لمحركات البحث', 'Search-engine ready'],
        body: [
          'بنية تدعم ظهور الموقع في نتائج البحث.',
          'A structure that helps the site appear in search results.',
        ],
      },
    ],
    projectIds: ['wasly', 'retail-pulse'],
    sectorCount: 3,
    faqs: [
      {
        question: ['كم تستغرق مدة تنفيذ الموقع؟', 'How long does a website take?'],
        answer: [
          'تتراوح عادة بين ٤ و١٠ أسابيع حسب النطاق.',
          'It usually takes 4 to 10 weeks depending on scope.',
        ],
      },
      {
        question: ['هل يشمل الدعم بعد الإطلاق؟', 'Is post-launch support included?'],
        answer: [
          'نعم، نوفر فترة دعم مجانية بعد التسليم.',
          'Yes, a free support period follows delivery.',
        ],
      },
    ],
  },
  {
    id: 'mobile-apps',
    icon: 'pi-mobile',
    published: true,
    name: ['تطوير تطبيقات الجوال', 'Mobile app development'],
    description: [
      'تطبيقات iOS وأندرويد بتجربة أصيلة وأداء مستقر.',
      'Native-feeling iOS and Android apps with stable performance.',
    ],
    whyTitle: ['عملاؤك على هواتفهم', 'Your customers live on their phones'],
    why: [
      { title: ['وصول مباشر للمستخدمين', 'Direct access to users'], icon: 'pi-send' },
      { title: ['إشعارات فورية', 'Instant notifications'], icon: 'pi-bell' },
    ],
    solutions: [
      {
        title: ['تطبيقات متعددة المنصات', 'Cross-platform apps'],
        body: ['قاعدة شيفرة واحدة لنظامي iOS وأندرويد.', 'One codebase for both iOS and Android.'],
        icon: 'pi-mobile',
      },
      {
        title: ['تطبيقات مؤسسية', 'Enterprise apps'],
        body: [
          'تطبيقات داخلية لإدارة الفرق والعمليات.',
          'Internal apps to manage teams and operations.',
        ],
        icon: 'pi-cog',
      },
    ],
    stages: [
      {
        title: ['نموذج أولي', 'Prototype'],
        body: [
          'نختبر الفكرة بتصميم تفاعلي سريع.',
          'We validate the idea with a quick interactive design.',
        ],
      },
      {
        title: ['البناء والاختبار', 'Build and test'],
        body: [
          'تطوير على مراحل مع اختبارات مستمرة.',
          'Incremental development with continuous testing.',
        ],
      },
      {
        title: ['النشر على المتاجر', 'Store release'],
        body: [
          'نجهز النشر على App Store وGoogle Play.',
          'We prepare the App Store and Google Play release.',
        ],
      },
      {
        title: ['التحسين المستمر', 'Continuous improvement'],
        body: [
          'نحلل الاستخدام ونطور بناءً على الملاحظات.',
          'We analyze usage and improve from feedback.',
        ],
      },
    ],
    features: [
      {
        title: ['عمل دون اتصال', 'Offline support'],
        body: [
          'يستمر التطبيق بالعمل عند ضعف الشبكة.',
          'The app keeps working on a weak connection.',
        ],
      },
      {
        title: ['حماية بيانات المستخدم', 'User data protection'],
        body: ['تشفير وصلاحيات دقيقة للوصول.', 'Encryption and fine-grained access control.'],
      },
    ],
    projectIds: ['wasly', 'care-hub'],
    sectorCount: 2,
    faqs: [
      {
        question: ['هل ننشر التطبيق نيابةً عنكم؟', 'Do you publish the app for us?'],
        answer: [
          'نعم، نتولى إعداد الحسابات والنشر.',
          'Yes, we handle store accounts and publishing.',
        ],
      },
    ],
  },
  {
    id: 'ui-ux-design',
    icon: 'pi-desktop',
    published: true,
    name: ['تصميم تجربة المستخدم', 'UI/UX design'],
    description: [
      'واجهات واضحة مبنية على أبحاث المستخدمين وسلوكهم.',
      'Clear interfaces grounded in user research and behavior.',
    ],
    whyTitle: ['التصميم الجيد يرفع التحويل', 'Good design lifts conversion'],
    why: [
      { title: ['تقليل أخطاء المستخدم', 'Fewer user errors'], icon: 'pi-check-circle' },
      { title: ['رضا أعلى للعملاء', 'Higher customer satisfaction'], icon: 'pi-heart' },
      { title: ['هوية بصرية متسقة', 'A consistent visual identity'], icon: 'pi-star' },
    ],
    solutions: [
      {
        title: ['أبحاث واختبارات المستخدم', 'User research and testing'],
        body: [
          'مقابلات واختبارات قابلية استخدام موثقة.',
          'Documented interviews and usability tests.',
        ],
        icon: 'pi-users',
      },
      {
        title: ['أنظمة تصميم', 'Design systems'],
        body: ['مكتبات مكونات قابلة لإعادة الاستخدام.', 'Reusable component libraries.'],
        icon: 'pi-box',
      },
    ],
    stages: [
      {
        title: ['الاستكشاف', 'Discovery'],
        body: ['نجمع الملاحظات ونحدد المشكلات.', 'We gather insights and define the problems.'],
      },
      {
        title: ['التصميم', 'Design'],
        body: ['نصمم الرحلات والواجهات النهائية.', 'We design the journeys and final interfaces.'],
      },
      {
        title: ['التسليم للتطوير', 'Developer handoff'],
        body: [
          'نسلم ملفات ومواصفات جاهزة للبرمجة.',
          'We deliver files and specs ready for development.',
        ],
      },
    ],
    features: [
      {
        title: ['دعم اللغتين واتجاه الكتابة', 'Bilingual and RTL-ready'],
        body: ['تصاميم تعمل بالعربية والإنجليزية.', 'Designs that work in Arabic and English.'],
      },
      {
        title: ['إتاحة وصول شاملة', 'Accessible by default'],
        body: [
          'تباين ألوان وتنقل لوحة مفاتيح مدروسان.',
          'Considered color contrast and keyboard navigation.',
        ],
      },
    ],
    projectIds: ['ops-suite', 'learn-space'],
    sectorCount: 3,
    faqs: [
      {
        question: ['هل تقدمون تصميمًا دون تطوير؟', 'Do you offer design without development?'],
        answer: [
          'نعم، يمكن طلب التصميم كخدمة مستقلة.',
          'Yes, design can be ordered as a standalone service.',
        ],
      },
      {
        question: ['كم عدد جولات التعديل؟', 'How many revision rounds are included?'],
        answer: ['ثلاث جولات تعديل ضمن كل مرحلة.', 'Three revision rounds are included per phase.'],
      },
    ],
  },
  {
    id: 'cloud-devops',
    icon: 'pi-cloud',
    published: true,
    name: ['الحوسبة السحابية وDevOps', 'Cloud and DevOps'],
    description: [
      'بنية سحابية مرنة وأتمتة للنشر تقلل التكلفة والأعطال.',
      'Flexible cloud infrastructure and delivery automation that cut cost and downtime.',
    ],
    whyTitle: ['بنية تنمو مع أعمالك', 'Infrastructure that grows with you'],
    why: [
      { title: ['تقليل تكاليف التشغيل', 'Lower operating costs'], icon: 'pi-wallet' },
      { title: ['توافر مستمر للخدمة', 'Continuous availability'], icon: 'pi-bolt' },
    ],
    solutions: [
      {
        title: ['ترحيل إلى السحابة', 'Cloud migration'],
        body: [
          'نقل الأنظمة القائمة بأقل انقطاع ممكن.',
          'Moving existing systems with minimal downtime.',
        ],
        icon: 'pi-cloud',
      },
      {
        title: ['أتمتة النشر', 'Delivery automation'],
        body: ['مسارات CI/CD موثوقة ومراقبة.', 'Reliable, monitored CI/CD pipelines.'],
        icon: 'pi-cog',
      },
      {
        title: ['المراقبة والتنبيه', 'Monitoring and alerting'],
        body: ['رؤية واضحة للأداء والأعطال.', 'Clear visibility into performance and failures.'],
        icon: 'pi-bell',
      },
    ],
    stages: [
      {
        title: ['تقييم البنية الحالية', 'Assess the current setup'],
        body: ['نراجع الأنظمة والتكاليف والمخاطر.', 'We review systems, costs, and risks.'],
      },
      {
        title: ['التخطيط والترحيل', 'Plan and migrate'],
        body: ['نضع خطة ترحيل ونطبقها على مراحل.', 'We plan the migration and run it in phases.'],
      },
    ],
    features: [
      {
        title: ['توسع تلقائي', 'Auto scaling'],
        body: ['موارد تتكيف مع الحمل تلقائيًا.', 'Resources adapt to load automatically.'],
      },
      {
        title: ['نسخ احتياطي واستعادة', 'Backup and recovery'],
        body: ['خطط استعادة مختبرة بشكل دوري.', 'Recovery plans that are tested regularly.'],
      },
      {
        title: ['بنية كشيفرة', 'Infrastructure as code'],
        body: ['بيئات قابلة للتكرار والتدقيق.', 'Repeatable, auditable environments.'],
      },
    ],
    projectIds: ['ops-suite', 'city-sense'],
    sectorCount: 2,
    faqs: [
      {
        question: ['أي مزودي سحابة تدعمون؟', 'Which cloud providers do you support?'],
        answer: [
          'نعمل مع أبرز المزودين حسب احتياج المشروع.',
          'We work with the major providers as the project requires.',
        ],
      },
    ],
  },
  {
    id: 'data-analytics',
    icon: 'pi-chart-line',
    published: false,
    name: ['تحليل البيانات والذكاء التجاري', 'Data analytics and BI'],
    description: [
      'لوحات مؤشرات وتقارير تحول بياناتك إلى قرارات.',
      'Dashboards and reports that turn your data into decisions.',
    ],
    whyTitle: ['قرارات مبنية على الأرقام', 'Decisions backed by numbers'],
    why: [
      { title: ['رؤية موحدة للبيانات', 'A single view of your data'], icon: 'pi-database' },
      { title: ['اكتشاف الفرص مبكرًا', 'Spot opportunities early'], icon: 'pi-compass' },
      { title: ['متابعة المؤشرات لحظيًا', 'Track KPIs in real time'], icon: 'pi-chart-line' },
    ],
    solutions: [
      {
        title: ['لوحات مؤشرات تفاعلية', 'Interactive dashboards'],
        body: [
          'عرض المؤشرات الرئيسية بوضوح للإدارة.',
          'Key indicators presented clearly for management.',
        ],
        icon: 'pi-chart-line',
      },
      {
        title: ['مستودعات البيانات', 'Data warehouses'],
        body: ['توحيد المصادر وتنظيفها وتخزينها.', 'Unifying, cleaning, and storing sources.'],
        icon: 'pi-database',
      },
    ],
    stages: [
      {
        title: ['تحديد المؤشرات', 'Define the metrics'],
        body: ['نتفق على مؤشرات النجاح أولًا.', 'We agree on the success metrics first.'],
      },
      {
        title: ['ربط المصادر', 'Connect the sources'],
        body: ['نربط الأنظمة ونوحد صيغ البيانات.', 'We connect systems and align data formats.'],
      },
      {
        title: ['بناء اللوحات', 'Build the dashboards'],
        body: [
          'نصمم التقارير ونختبرها مع الفريق.',
          'We design the reports and test them with your team.',
        ],
      },
    ],
    features: [
      {
        title: ['تقارير مجدولة', 'Scheduled reports'],
        body: [
          'إرسال التقارير تلقائيًا للمعنيين.',
          'Reports are sent automatically to stakeholders.',
        ],
      },
      {
        title: ['صلاحيات حسب الدور', 'Role-based access'],
        body: ['كل مستخدم يرى ما يخصه فقط.', 'Each user sees only what is relevant to them.'],
      },
    ],
    projectIds: ['retail-pulse'],
    sectorCount: 3,
    faqs: [
      {
        question: ['هل نحتاج مستودع بيانات جاهزًا؟', 'Do we need an existing data warehouse?'],
        answer: [
          'لا، يمكننا بناؤه كجزء من الخدمة.',
          'No, we can build one as part of the service.',
        ],
      },
      {
        question: ['هل البيانات محمية؟', 'Is the data protected?'],
        answer: ['نعم، مع تشفير وسجلات وصول.', 'Yes, with encryption and access logs.'],
      },
    ],
  },
  {
    id: 'cyber-security',
    icon: 'pi-shield',
    published: false,
    name: ['الأمن السيبراني', 'Cybersecurity'],
    description: [
      'تقييم وحماية الأنظمة والبيانات من التهديدات الرقمية.',
      'Assessment and protection of systems and data against digital threats.',
    ],
    whyTitle: ['الحماية تبدأ قبل الحادث', 'Protection starts before the incident'],
    why: [
      { title: ['حماية بيانات العملاء', 'Protect customer data'], icon: 'pi-lock' },
      { title: ['الالتزام بالأنظمة واللوائح', 'Meet regulations'], icon: 'pi-flag' },
    ],
    solutions: [
      {
        title: ['اختبار الاختراق', 'Penetration testing'],
        body: [
          'فحص الأنظمة لاكتشاف الثغرات قبل المهاجمين.',
          'Probing systems to find weaknesses before attackers do.',
        ],
        icon: 'pi-shield',
      },
      {
        title: ['مراقبة الأمن', 'Security monitoring'],
        body: ['رصد مستمر للتنبيهات والاستجابة لها.', 'Continuous alert monitoring and response.'],
        icon: 'pi-bell',
      },
    ],
    stages: [
      {
        title: ['تقييم المخاطر', 'Risk assessment'],
        body: ['نحدد الأصول والتهديدات المحتملة.', 'We identify assets and likely threats.'],
      },
      {
        title: ['المعالجة', 'Remediation'],
        body: ['نعالج الثغرات حسب الأولوية.', 'We fix vulnerabilities by priority.'],
      },
      {
        title: ['التوعية والمتابعة', 'Awareness and follow-up'],
        body: ['ندرب الفرق ونراجع الوضع دوريًا.', 'We train teams and review posture regularly.'],
      },
    ],
    features: [
      {
        title: ['تقارير واضحة', 'Clear reports'],
        body: [
          'نتائج مرتبة حسب الخطورة وخطوات الحل.',
          'Findings ranked by severity with fix steps.',
        ],
      },
      {
        title: ['استجابة للحوادث', 'Incident response'],
        body: ['فريق جاهز للتدخل السريع.', 'A team ready to step in quickly.'],
      },
    ],
    projectIds: ['care-hub', 'city-sense'],
    sectorCount: 2,
    faqs: [
      {
        question: ['كم مرة يجب فحص الأنظمة؟', 'How often should systems be tested?'],
        answer: [
          'ننصح بفحص دوري كل ستة أشهر على الأقل.',
          'We recommend testing at least every six months.',
        ],
      },
    ],
  },
];

export const SERVICES_SEED: Service[] = SEEDS.map(build);
