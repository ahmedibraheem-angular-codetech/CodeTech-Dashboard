import { Injectable, inject, signal } from '@angular/core';
import { type Observable, map, timer } from 'rxjs';

import { API_LATENCY_MS } from '../../core/config/latency';
import type { PaginatedEnvelope } from '../../core/http/api.model';
import { ObjectUrls } from '../../shared/components/product-upload/object-urls';
import type { ProductListDto, ProductListQuery } from './models/product.api';
import {
  emptyProductImage,
  localeText,
  productMedia,
  productPoint,
  productSector,
  productStat,
  productUnit,
  readMedia,
  type LocalizedMedia,
  type Product,
  type ProductSector,
} from './models/product.model';
import {
  productsPageFeature,
  productsPageSector,
  type ProductsPageContent,
  type ProductsPageFeature,
  type ProductsPageSector,
} from './models/products-page.model';


const DESK = '/images/product-cover-desk.jpg';
const WOOD = '/images/product-cover-wood.jpg';
const FLAT = '/images/product-cover-flat.jpg';
const PROJECT = '/images/project-cover.jpg';
const POSTER = '/images/video-poster.jpg';

const brief = localeText(
  'وصف نصي قصير تعريفي عن كود التقنية يتم كتابته — مصدرها فريق العمل لاحقًا.',
  'A short description written by the team later.',
);

function pageSector(arTitle: string, enTitle: string, imageUrl: string): ProductsPageSector {
  const image = { ...emptyProductImage(), imageName: `${enTitle}.jpg`, imageUrl };
  return {
    ...productsPageSector(localeText(arTitle, enTitle)),
    image: { ar: { ...image }, en: { ...image } },
  };
}

export const PRODUCTS_PAGE_SEED: ProductsPageContent = {
  featuresEnabled: true,
  sectorsEnabled: true,
  productsVisible: true,
  features: [
    productsPageFeature(
      localeText('مصمم وفق أفضل الممارسات العالمية', 'Built on global best practice'),
      brief,
      'pi-th-large',
    ),
    productsPageFeature(localeText('مرونة عالية', 'High flexibility'), brief, 'pi-cog'),
    productsPageFeature(localeText('أمان موثوق', 'Trusted security'), brief, 'pi-shield'),
    productsPageFeature(localeText('سهولة الاستخدام', 'Easy to use'), brief, 'pi-user'),
    productsPageFeature(localeText('تكامل مرن', 'Flexible integration'), brief, 'pi-sitemap'),
    productsPageFeature(localeText('قابلية التوسع', 'Room to grow'), brief, 'pi-expand'),
  ],
  sectors: [
    pageSector('حكومي', 'Government', PROJECT),
    pageSector('شركات', 'Companies', DESK),
    pageSector('الصحة', 'Health', WOOD),
    pageSector('تعليم', 'Education', FLAT),
    pageSector('القطاع الخاص', 'Private sector', DESK),
    pageSector('المؤسسات', 'Institutions', PROJECT),
    pageSector('الأفراد', 'Individuals', POSTER),
    pageSector('سياحة', 'Tourism', WOOD),
  ],
};




/**
 * In-memory products page backend for UI/integration specs only.
 * Production uses {@link ProductsPageService} (HTTP).
 */
@Injectable()
export class ProductsPageMemoryService {
  private readonly latency = inject(API_LATENCY_MS, { optional: true }) ?? 0;
  private readonly objectUrls = inject(ObjectUrls);
  private state = structuredClone(PRODUCTS_PAGE_SEED);

  get(): Observable<ProductsPageContent> {
    return timer(this.latency).pipe(map(() => structuredClone(this.state)));
  }

  toggleFeatures(enabled: boolean): Observable<ProductsPageContent> {
    this.state = { ...this.state, featuresEnabled: enabled };
    return this.get();
  }

  toggleSectors(enabled: boolean): Observable<ProductsPageContent> {
    this.state = { ...this.state, sectorsEnabled: enabled };
    return this.get();
  }

  toggleProductsVisible(visible: boolean): Observable<ProductsPageContent> {
    this.state = { ...this.state, productsVisible: visible };
    return this.get();
  }

  saveFeature(feature: ProductsPageFeature): Observable<ProductsPageFeature> {
    const next = structuredClone(feature);
    if (!next.id) {
      next.id = this.newId('page-feature');
    }
    const previous =
      this.state.features.find((item) => item.id === next.id) ?? null;
    this.objectUrls.sync(previous, next);
    this.state = {
      ...this.state,
      features: this.upsert(this.state.features, next),
    };
    return timer(this.latency).pipe(map(() => structuredClone(next)));
  }

  removeFeature(id: string): Observable<void> {
    const previous = this.state.features.find((item) => item.id === id) ?? null;
    this.objectUrls.sync(previous, null);
    this.state = {
      ...this.state,
      features: this.state.features.filter((item) => item.id !== id),
    };
    return timer(this.latency).pipe(map(() => undefined));
  }

  saveSector(sector: ProductsPageSector): Observable<ProductsPageSector> {
    const next = structuredClone(sector);
    if (!next.id) {
      next.id = this.newId('page-sector');
    }
    const previous = this.state.sectors.find((item) => item.id === next.id) ?? null;
    this.objectUrls.sync(previous, next);
    this.state = {
      ...this.state,
      sectors: this.upsert(this.state.sectors, next),
    };
    return timer(this.latency).pipe(map(() => structuredClone(next)));
  }

  removeSector(id: string): Observable<void> {
    const previous = this.state.sectors.find((item) => item.id === id) ?? null;
    this.objectUrls.sync(previous, null);
    this.state = {
      ...this.state,
      sectors: this.state.sectors.filter((item) => item.id !== id),
    };
    return timer(this.latency).pipe(map(() => undefined));
  }

  private upsert<T extends { id: string }>(items: readonly T[], next: T): T[] {
    const index = items.findIndex((item) => item.id === next.id);
    if (index === -1) {
      return [...items, next];
    }
    return items.map((item) => (item.id === next.id ? next : item));
  }

  private newId(prefix: string): string {
    let stamp = Date.now();
    while (
      this.state.features.some((item) => item.id === `${prefix}-${stamp}`) ||
      this.state.sectors.some((item) => item.id === `${prefix}-${stamp}`)
    ) {
      stamp += 1;
    }
    return `${prefix}-${stamp}`;
  }
}

const story = brief;

function localeImage(imageUrl: string, imageName = 'image.jpg'): LocalizedMedia {
  const image = { ...emptyProductImage(), imageName, imageUrl };
  return { ar: { ...image }, en: emptyProductImage() };
}

function marked(ar: string, en: string, icon: string, body = story) {
  return {
    ...productPoint(localeText(ar, en), body),
    image: localeImage(`icon:${icon}`, `${icon}.svg`),
  };
}

function seedSector(imageUrl: string, imageName: string): ProductSector {
  const image = { ...emptyProductImage(), imageName, imageUrl };
  return {
    ...productSector(),
    image: { ar: { ...image }, en: { ...image } },
  };
}

function featured(): Product {
  return {
    id: 'info-system',
    code: 'info-system',
    published: true,
    name: localeText('نظام إدارة خدمات تقنية المعلومات', 'IT services management system'),
    summary: localeText(
      'منصة متكاملة لإدارة خدمات تقنية المعلومات، والطلبات، والأصول، والتغييرات، مع تقارير ولوحات تحكم تساعد على رفع كفاءة فرق العمل.',
      'A platform for IT services, requests, assets, changes, reports, and dashboards.',
    ),
    cover: localeImage(DESK, 'cover.jpg'),
    coverTitle: localeText(),
    coverAlt: localeText(),
    thumb: localeImage(DESK, 'thumb.jpg'),
    thumbTitle: localeText(),
    thumbAlt: localeText(),
    features: [
      marked('إدارة الأصول', 'Asset management', 'pi-cog'),
      marked('إدارة الطلبات', 'Request management', 'pi-th-large'),
      marked('Workflow', 'Workflow', 'pi-sitemap'),
      marked('التقارير', 'Reports', 'pi-clock'),
    ],
    stats: [
      {
        ...productStat(),
        value: localeText('+10', '+10'),
        label: localeText('شركات تستخدم النظام', 'Companies using the system'),
        body: localeText('جهات تستخدم النظام يومياً.', 'Organizations using the system daily.'),
        image: localeImage(WOOD, 'stat.jpg'),
      },
      {
        ...productStat(),
        value: localeText('+24', '+24'),
        label: localeText('طلب يومي', 'Daily requests'),
        body: localeText('طلبات تُغلق في نفس اليوم.', 'Requests closed the same day.'),
        image: localeImage(DESK, 'stat-2.jpg'),
      },
      {
        ...productStat(),
        value: localeText('+8', '+8'),
        label: localeText('فرق عمل', 'Teams'),
        body: localeText('فرق تتابع الأصول والطلبات.', 'Teams following assets and requests.'),
        image: localeImage(FLAT, 'stat-3.jpg'),
      },
      {
        ...productStat(),
        value: localeText('+3', '+3'),
        label: localeText('لوحات متابعة', 'Dashboards'),
        body: localeText('لوحات تعرض حالة العمل.', 'Boards that show the work status.'),
        image: localeImage(DESK, 'stat-4.jpg'),
      },
    ],
    sectors: [
      ['Government', PROJECT],
      ['Companies', DESK],
      ['Health', WOOD],
      ['Education', FLAT],
      ['Private sector', DESK],
      ['Institutions', PROJECT],
      ['Individuals', POSTER],
      ['Tourism', WOOD],
    ].map(([en, imageUrl]) => seedSector(imageUrl, `${en}.jpg`)),
    challenges: [
      ['تعدد الأنظمة', 'Many systems', 'pi-server'],
      ['العمليات تتم يدويًا', 'Work is still manual', 'pi-cog'],
      ['ضعف التقارير', 'Weak reports', 'pi-clock'],
      ['تأخر تنفيذ الطلبات', 'Slow request delivery', 'pi-sitemap'],
      ['كثرة الأخطاء البشرية', 'Too many manual errors', 'pi-exclamation-circle'],
      ['صعوبة متابعة الأداء', 'Hard to follow performance', 'pi-chart-line'],
    ].map(([ar, en, icon]) => marked(ar, en, icon)),
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
      image: localeImage(POSTER, 'solution.jpg'),
    },
    offer: [
      ['ما هو؟', 'What is it?', 'pi-list'],
      ['أين يستخدم؟', 'Where is it used?', 'pi-cog'],
      ['لمن صُمم؟', 'Who is it for?', 'pi-clock'],
      ['ما القيمة؟', 'What is the value?', 'pi-sitemap'],
    ].map(([ar, en, icon]) => marked(ar, en, icon)),
    results: [
      ['تقليل الوقت', 'Less time', 'pi-list'],
      ['تقليل الأخطاء', 'Fewer errors', 'pi-cog'],
      ['رفع الإنتاجية', 'Higher output', 'pi-clock'],
      ['تحسين اتخاذ القرار', 'Better decisions', 'pi-sitemap'],
      ['زيادة الكفاءة', 'More efficiency', 'pi-clock'],
      ['سهولة التوسع', 'Easier growth', 'pi-chart-line'],
    ].map(([ar, en, icon]) => marked(ar, en, icon)),
    tools: [
      {
        ...productMedia(),
        title: localeText('لوحة المتابعة', 'Tracking board'),
        body: localeText('عرض حالة الطلبات والأصول.', 'See the state of requests and assets.'),
        image: localeImage(DESK, 'tool.jpg'),
      },
    ],
    integrations: ['pi-prime', 'pi-mobile', 'pi-box', 'pi-code', 'pi-hashtag', 'pi-cog'].map(
      (icon) => ({
        ...productMedia(),
        image: localeImage(`icon:${icon}`, `${icon}.svg`),
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
        image: localeImage(DESK, 'unit.jpg'),
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
        image: localeImage(POSTER, 'board.jpg'),
        points: [
          marked('المؤشرات', 'Indicators', 'pi-chart-bar', brief),
          marked('التنبيهات', 'Alerts', 'pi-bell', brief),
        ],
      },
      {
        ...productUnit(),
        title: localeText('إدارة التقارير', 'Report management'),
        body: localeText('تقارير جاهزة لحالة العمل.', 'Ready reports for the work status.'),
        image: localeImage(WOOD, 'reports.jpg'),
        points: [
          marked('تقرير يومي', 'Daily report', 'pi-file', brief),
          marked('تقرير الأداء', 'Performance report', 'pi-chart-line', brief),
        ],
      },
      {
        ...productUnit(),
        title: localeText('إدارة الخدمات', 'Service management'),
        body: localeText('تنظيم الخدمات ومساراتها.', 'Organize services and their paths.'),
        image: localeImage(PROJECT, 'services.jpg'),
        points: [
          marked('كتالوج الخدمات', 'Service catalog', 'pi-list', brief),
          marked('مسار الخدمة', 'Service path', 'pi-share-alt', brief),
        ],
      },
    ],
    steps: [DESK, WOOD, FLAT, PROJECT, POSTER, DESK].map((imageUrl) => ({
      ...productPoint(localeText('إعداد النظام', 'System setup'), story),
      image: localeImage(imageUrl, 'step.jpg'),
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
      image: localeImage(imageUrl, `${en}.jpg`),
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
  product.code = id;
  product.cover = localeImage(cover, 'cover.jpg');
  product.thumb = localeImage(cover, 'thumb.jpg');
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




/**
 * In-memory products backend for UI/integration specs only.
 * Production uses {@link ProductsService} (HTTP).
 */
@Injectable()
export class ProductsMemoryService {
  private readonly latency = inject(API_LATENCY_MS, { optional: true }) ?? 0;
  private readonly objectUrls = inject(ObjectUrls);
  private readonly state = signal<Product[]>(structuredClone(PRODUCTS_SEED));

  /** Whether product cards show on the public products page. */
  private catalogVisibleState = PRODUCTS_PAGE_SEED.productsVisible;
  readonly catalogVisible = signal(this.catalogVisibleState);

  list(query: ProductListQuery = {}): Observable<Product[]> {
    return timer(this.latency).pipe(map(() => this.filterList(query)));
  }

  listPage(query: ProductListQuery = {}): Observable<PaginatedEnvelope<ProductListDto>> {
    return timer(this.latency).pipe(
      map(() => {
        const items = this.filterList(query);
        const page = query.page ?? 1;
        const perPage = query.perPage ?? (items.length || 100);
        const start = (page - 1) * perPage;
        const slice = items.slice(start, start + perPage);
        const lastPage = Math.max(1, Math.ceil(items.length / perPage));
        return {
          data: slice.map((item, index) => this.toListDto(item, start + index + 1)),
          links: { first: null, last: null, prev: null, next: null },
          meta: {
            current_page: page,
            from: items.length === 0 ? null : start + 1,
            last_page: lastPage,
            path: '',
            per_page: perPage,
            to: items.length === 0 ? null : Math.min(start + slice.length, items.length),
            total: items.length,
          },
        };
      }),
    );
  }

  listAll(query: Omit<ProductListQuery, 'page'> = {}): Observable<Product[]> {
    return this.list(query);
  }

  get(id: string): Observable<Product | null> {
    return timer(this.latency).pipe(
      map(() => {
        const match = this.state().find((item) => item.id === id);
        return match ? structuredClone(match) : null;
      }),
    );
  }

  save(product: Product): Observable<Product> {
    const next: Product = {
      ...structuredClone(product),
      id: product.id || this.newId(),
      code: product.code || product.id || '',
    };
    const previous = this.state().find((item) => item.id === next.id) ?? null;
    this.objectUrls.sync(previous, next);
    this.state.update((items) => {
      const index = items.findIndex((item) => item.id === next.id);
      if (index === -1) {
        return [next, ...items];
      }
      return items.map((item) => (item.id === next.id ? next : item));
    });
    return timer(this.latency).pipe(map(() => structuredClone(next)));
  }

  setPublished(id: string, published: boolean): Observable<Product> {
    let saved: Product | null = null;
    this.state.update((items) =>
      items.map((item) => {
        if (item.id !== id) {
          return item;
        }
        saved = { ...item, published };
        return saved;
      }),
    );
    return timer(this.latency).pipe(
      map(() => structuredClone(saved ?? this.state().find((item) => item.id === id)!)),
    );
  }

  remove(id: string): Observable<void> {
    const previous = this.state().find((item) => item.id === id) ?? null;
    this.objectUrls.sync(previous, null);
    this.state.update((items) => items.filter((item) => item.id !== id));
    return timer(this.latency).pipe(map(() => undefined));
  }

  loadCatalogVisibility(): Observable<boolean> {
    return timer(this.latency).pipe(
      map(() => {
        this.catalogVisible.set(this.catalogVisibleState);
        return this.catalogVisibleState;
      }),
    );
  }

  toggleCatalog(): void {
    this.catalogVisibleState = !this.catalogVisibleState;
    this.catalogVisible.set(this.catalogVisibleState);
  }

  private filterList(query: ProductListQuery): Product[] {
    let items = structuredClone(this.state());
    const search = query.search?.trim().toLowerCase();
    if (search) {
      items = items.filter(
        (item) =>
          item.name.ar.toLowerCase().includes(search) ||
          item.name.en.toLowerCase().includes(search) ||
          item.code.toLowerCase().includes(search),
      );
    }
    if (query.status === 'published') {
      items = items.filter((item) => item.published);
    } else if (query.status === 'draft') {
      items = items.filter((item) => !item.published);
    }
    return items;
  }

  private newId(): string {
    let stamp = Date.now();
    while (this.state().some((item) => item.id === `product-${stamp}`)) {
      stamp += 1;
    }
    return `product-${stamp}`;
  }

  private toListDto(item: Product, fallbackId: number): ProductListDto {
    const numericId = /^\d+$/.test(item.id) ? Number(item.id) : fallbackId;
    const coverUrl = readMedia(item.cover, 'ar').imageUrl;
    const thumbUrl = readMedia(item.thumb, 'ar').imageUrl;
    return {
      id: numericId,
      code: item.code,
      title: { ar: item.name.ar, en: item.name.en },
      description: { ar: item.summary.ar, en: item.summary.en },
      short_description: { ar: item.summary.ar, en: item.summary.en },
      cover: coverUrl ? ({ url: coverUrl } as ProductListDto['cover']) : null,
      thumbnail: thumbUrl ? ({ url: thumbUrl } as ProductListDto['thumbnail']) : null,
      features: item.features.map((feature, sort) => {
        const iconUrl = readMedia(feature.image, 'ar').imageUrl;
        return {
          id: sort + 1,
          title: { ar: feature.title.ar, en: feature.title.en },
          short_description: { ar: feature.body.ar, en: feature.body.en },
          icon: iconUrl ? ({ url: iconUrl } as ProductListDto['features'][0]['icon']) : null,
          sort_order: sort,
        };
      }),
      status: item.published ? 'published' : 'draft',
      slug: item.seo.slug.en || item.seo.slug.ar || null,
      sort_order: fallbackId,
      created_at: '',
      updated_at: '',
    };
  }
}
