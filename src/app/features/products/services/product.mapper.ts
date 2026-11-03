import type { FileObject } from '../../../core/http/api.model';
import type {
  ProductDetailDto,
  ProductFaqWriteDto,
  ProductIntegrationWriteDto,
  ProductListDto,
  ProductLocaleDto,
  ProductModuleWriteDto,
  ProductPointDto,
  ProductPointWriteDto,
  ProductSectorWriteDto,
  ProductStatWriteDto,
  ProductWriteDto,
} from '../models/product.api';
import {
  emptyLocalizedMedia,
  emptyProductImage,
  localeText,
  type LocaleText,
  type LocalizedMedia,
  type Product,
  type ProductFaq,
  type ProductImage,
  type ProductMedia,
  type ProductPoint,
  type ProductSector,
  type ProductStat,
  type ProductUnit,
} from '../models/product.model';

function locale(value: ProductLocaleDto | null | undefined): LocaleText {
  return localeText(
    typeof value?.ar === 'string' ? value.ar : '',
    typeof value?.en === 'string' ? value.en : '',
  );
}

function filled(value: LocaleText): boolean {
  return !!(value.ar.trim() || value.en.trim());
}

function serverId(id: string): number | undefined {
  return /^\d+$/.test(id) ? Number(id) : undefined;
}

export function mapProductMedia(file: FileObject | null | undefined): ProductImage {
  if (!file || typeof file.uuid !== 'string' || typeof file.url !== 'string') {
    return emptyProductImage();
  }
  return {
    imageUuid: file.uuid,
    imageUrl: file.url,
    imageName: file.file_name || file.name || 'file',
  };
}

/**
 * Shared API file → editor slots. Only Arabic is seeded so the English tab
 * starts empty and can hold an independent preview while editing.
 */
function sharedMedia(file: FileObject | null | undefined): LocalizedMedia {
  return { ar: mapProductMedia(file), en: emptyProductImage() };
}

function mapPoint(dto: ProductPointDto, mediaKey: 'icon' | 'image' = 'icon'): ProductPoint {
  return {
    id: String(dto.id),
    title: locale(dto.title),
    body: locale(dto.short_description),
    image: sharedMedia(mediaKey === 'icon' ? dto.icon : dto.image),
  };
}

function mapMediaCard(dto: ProductPointDto, mediaKey: 'icon' | 'image' = 'icon'): ProductMedia {
  const point = mapPoint(dto, mediaKey);
  return {
    id: point.id,
    title: point.title,
    body: point.body,
    image: point.image,
  };
}

function mapStat(dto: ProductDetailDto['stats'][number]): ProductStat {
  return {
    id: String(dto.id),
    label: locale(dto.title),
    value: locale(dto.value),
    body: localeText(),
    image: sharedMedia(dto.background),
  };
}

function mapSector(dto: ProductDetailDto['sectors'][number]): ProductSector {
  return {
    id: String(dto.id),
    image: {
      ar: mapProductMedia(dto.image?.ar ?? null),
      en: mapProductMedia(dto.image?.en ?? null),
    },
  };
}

function mapUnit(dto: ProductDetailDto['modules'][number]): ProductUnit {
  return {
    id: String(dto.id),
    title: locale(dto.title),
    body: locale(dto.short_description),
    image: sharedMedia(dto.image),
    points: (dto.features ?? []).map((item) => mapPoint(item, 'icon')),
  };
}

function mapFaq(dto: ProductDetailDto['faqs'][number]): ProductFaq {
  return {
    id: String(dto.id),
    question: locale(dto.question),
    answer: locale(dto.answer),
  };
}

function splitKeywords(value: string): string[] {
  return value
    .split(/[,،]/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function joinKeywords(value: readonly string[] | null | undefined): string {
  return (value ?? [])
    .map((part) => part.trim())
    .filter(Boolean)
    .join(', ');
}

function mapCore(
  dto: ProductListDto,
): Pick<
  Product,
  | 'id'
  | 'code'
  | 'published'
  | 'name'
  | 'summary'
  | 'cover'
  | 'coverTitle'
  | 'coverAlt'
  | 'thumb'
  | 'thumbTitle'
  | 'thumbAlt'
  | 'features'
  | 'seo'
> {
  const summary = locale(dto.short_description);
  const description = locale(dto.description);
  return {
    id: String(dto.id),
    code: dto.code || String(dto.id).padStart(5, '0'),
    published: dto.status === 'published',
    name: locale(dto.title),
    summary: filled(summary) ? summary : description,
    cover: sharedMedia(dto.cover),
    coverTitle: localeText(),
    coverAlt: localeText(),
    thumb: sharedMedia(dto.thumbnail),
    thumbTitle: localeText(),
    thumbAlt: localeText(),
    features: (dto.features ?? []).map((item) => mapPoint(item, 'icon')),
    seo: {
      slug: localeText(dto.slug ?? '', dto.slug ?? ''),
      title: localeText(),
      keywords: localeText(),
      description: localeText(),
    },
  };
}

export function mapProductListItem(dto: ProductListDto): Product {
  return {
    ...blankNested(),
    ...mapCore(dto),
  };
}

export function mapProductDetail(dto: ProductDetailDto): Product {
  const summary = locale(dto.short_description);
  const description = locale(dto.description);
  return {
    id: String(dto.id),
    code: dto.code || String(dto.id).padStart(5, '0'),
    published: dto.status === 'published',
    name: locale(dto.title),
    summary: filled(summary) ? summary : description,
    cover: sharedMedia(dto.cover),
    coverTitle: locale(dto.cover_title),
    coverAlt: locale(dto.cover_alt),
    thumb: sharedMedia(dto.thumbnail),
    thumbTitle: locale(dto.thumbnail_title),
    thumbAlt: locale(dto.thumbnail_alt),
    features: (dto.features ?? []).map((item) => mapPoint(item, 'icon')),
    stats: (dto.stats ?? []).map(mapStat),
    sectors: (dto.sectors ?? []).map(mapSector),
    challenges: (dto.challenges ?? []).map((item) => mapPoint(item, 'icon')),
    solution: {
      id: 'solution',
      title: locale(dto.solution_title),
      body: locale(dto.solution_description),
      image: sharedMedia(dto.solution_image),
    },
    offer: (dto.offerings ?? []).map((item) => mapPoint(item, 'icon')),
    results: (dto.results ?? []).map((item) => mapPoint(item, 'icon')),
    tools: (dto.advantages ?? []).map((item) => mapMediaCard(item, 'icon')),
    integrations: (dto.integrations ?? []).map((item) => ({
      id: String(item.id),
      title: localeText(),
      body: localeText(),
      image: sharedMedia(item.image),
    })),
    units: (dto.modules ?? []).map(mapUnit),
    steps: (dto.workflow_steps ?? []).map((item) => mapPoint(item, 'icon')),
    identity: (dto.identity_items ?? []).map((item) => mapMediaCard(item, 'image')),
    highlights: (dto.reasons ?? []).map((item) => mapPoint(item, 'icon')),
    faqs: (dto.faqs ?? []).map(mapFaq),
    seo: {
      slug: localeText(dto.slug ?? '', dto.slug ?? ''),
      title: locale(dto.meta_title),
      keywords: localeText(
        joinKeywords(dto.meta_keywords?.ar),
        joinKeywords(dto.meta_keywords?.en),
      ),
      description: locale(dto.meta_description),
    },
  };
}

function blankNested(): Omit<
  Product,
  | 'id'
  | 'code'
  | 'published'
  | 'name'
  | 'summary'
  | 'cover'
  | 'coverTitle'
  | 'coverAlt'
  | 'thumb'
  | 'thumbTitle'
  | 'thumbAlt'
  | 'features'
  | 'seo'
> {
  return {
    stats: [],
    sectors: [],
    challenges: [],
    solution: {
      id: 'solution',
      title: localeText(),
      body: localeText(),
      image: emptyLocalizedMedia(),
    },
    offer: [],
    results: [],
    tools: [],
    integrations: [],
    units: [],
    steps: [],
    identity: [],
    faqs: [],
    highlights: [],
  };
}

function withOptionalId<T extends object>(id: string, body: T): T & { id?: number } {
  const numeric = serverId(id);
  return numeric === undefined ? body : { ...body, id: numeric };
}

function ticket(image: ProductImage, clearEmpty: boolean): string | null | undefined {
  const url = image.imageUrl ?? '';
  if (!url) {
    return clearEmpty ? null : undefined;
  }
  if (url.startsWith('icon:')) {
    return undefined;
  }
  if (image.imageUuid) {
    return image.imageUuid;
  }
  return undefined;
}

/** API still accepts one UUID for shared media — prefer Arabic, then English. */
function sharedTicket(image: LocalizedMedia, clearEmpty: boolean): string | null | undefined {
  if (image.ar.imageUrl) {
    return ticket(image.ar, clearEmpty);
  }
  if (image.en.imageUrl) {
    return ticket(image.en, clearEmpty);
  }
  return clearEmpty ? null : undefined;
}

function applyTicket(
  target: Record<string, unknown>,
  key: string,
  value: string | null | undefined,
): void {
  if (value !== undefined) {
    target[key] = value;
  }
}

function hasMedia(image: LocalizedMedia): boolean {
  return !!(image.ar.imageUrl || image.en.imageUrl);
}

function pointWrite(
  item: ProductPoint | ProductMedia,
  mediaKey: 'icon' | 'image',
): ProductPointWriteDto {
  const row: ProductPointWriteDto = withOptionalId(item.id, {
    title: { ar: item.title.ar.trim(), en: item.title.en.trim() },
    short_description: { ar: item.body.ar.trim(), en: item.body.en.trim() },
  });
  applyTicket(row as unknown as Record<string, unknown>, mediaKey, sharedTicket(item.image, true));
  return row;
}

function sectorHasMedia(item: ProductSector): boolean {
  return hasMedia(item.image);
}

export function toProductWrite(product: Product): ProductWriteDto {
  const body: ProductWriteDto = {
    status: product.published ? 'published' : 'draft',
    title: { ar: product.name.ar.trim(), en: product.name.en.trim() },
    description: { ar: product.summary.ar.trim(), en: product.summary.en.trim() },
    short_description: { ar: product.summary.ar.trim(), en: product.summary.en.trim() },
    cover_title: { ar: product.coverTitle.ar.trim(), en: product.coverTitle.en.trim() },
    cover_alt: { ar: product.coverAlt.ar.trim(), en: product.coverAlt.en.trim() },
    thumbnail_title: { ar: product.thumbTitle.ar.trim(), en: product.thumbTitle.en.trim() },
    thumbnail_alt: { ar: product.thumbAlt.ar.trim(), en: product.thumbAlt.en.trim() },
    solution_title: { ar: product.solution.title.ar.trim(), en: product.solution.title.en.trim() },
    solution_description: {
      ar: product.solution.body.ar.trim(),
      en: product.solution.body.en.trim(),
    },
    meta_title: { ar: product.seo.title.ar.trim(), en: product.seo.title.en.trim() },
    meta_description: {
      ar: product.seo.description.ar.trim(),
      en: product.seo.description.en.trim(),
    },
    meta_keywords: {
      ar: splitKeywords(product.seo.keywords.ar),
      en: splitKeywords(product.seo.keywords.en),
    },
  };

  const slug = (product.seo.slug.en || product.seo.slug.ar).trim();
  body.slug = slug || null;

  applyTicket(
    body as unknown as Record<string, unknown>,
    'cover',
    sharedTicket(product.cover, true),
  );
  applyTicket(
    body as unknown as Record<string, unknown>,
    'thumbnail',
    sharedTicket(product.thumb, true),
  );
  applyTicket(
    body as unknown as Record<string, unknown>,
    'solution_image',
    sharedTicket(product.solution.image, true),
  );

  body.features = product.features
    .filter((item) => filled(item.title) || filled(item.body))
    .map((item) => pointWrite(item, 'icon'));

  body.stats = product.stats
    .filter((item) => filled(item.label) || filled(item.value))
    .map((item): ProductStatWriteDto => {
      const row: ProductStatWriteDto = withOptionalId(item.id, {
        title: { ar: item.label.ar.trim(), en: item.label.en.trim() },
        value: { ar: item.value.ar.trim(), en: item.value.en.trim() },
      });
      applyTicket(
        row as unknown as Record<string, unknown>,
        'background',
        sharedTicket(item.image, true),
      );
      return row;
    });

  body.sectors = product.sectors.filter(sectorHasMedia).map((item): ProductSectorWriteDto => {
    const ar = ticket(item.image.ar, true);
    const en = ticket(item.image.en, true);
    return withOptionalId(item.id, {
      image: {
        ar: ar === undefined ? null : ar,
        en: en === undefined ? null : en,
      },
    });
  });

  body.challenges = product.challenges
    .filter((item) => filled(item.title) || filled(item.body))
    .map((item) => pointWrite(item, 'icon'));

  body.offerings = product.offer
    .filter((item) => filled(item.title) || filled(item.body))
    .map((item) => pointWrite(item, 'icon'));

  body.results = product.results
    .filter((item) => filled(item.title) || filled(item.body))
    .map((item) => pointWrite(item, 'icon'));

  body.advantages = product.tools
    .filter((item) => filled(item.title) || filled(item.body))
    .map((item) => pointWrite(item, 'icon'));

  body.integrations = product.integrations
    .filter((item) => hasMedia(item.image))
    .map((item): ProductIntegrationWriteDto => {
      const row: ProductIntegrationWriteDto = withOptionalId(item.id, {});
      applyTicket(
        row as unknown as Record<string, unknown>,
        'image',
        sharedTicket(item.image, true),
      );
      return row;
    });

  body.modules = product.units
    .filter((item) => filled(item.title) || filled(item.body))
    .map((item): ProductModuleWriteDto => {
      const row: ProductModuleWriteDto = withOptionalId(item.id, {
        title: { ar: item.title.ar.trim(), en: item.title.en.trim() },
        short_description: { ar: item.body.ar.trim(), en: item.body.en.trim() },
        features: item.points
          .filter((point) => filled(point.title) || filled(point.body))
          .map((point) => pointWrite(point, 'icon')),
      });
      applyTicket(
        row as unknown as Record<string, unknown>,
        'image',
        sharedTicket(item.image, true),
      );
      return row;
    });

  body.workflow_steps = product.steps
    .filter((item) => filled(item.title) || filled(item.body))
    .map((item) => pointWrite(item, 'icon'));

  body.identity_items = product.identity
    .filter((item) => filled(item.title) || filled(item.body) || hasMedia(item.image))
    .map((item) => pointWrite(item, 'image'));

  body.reasons = product.highlights
    .filter((item) => filled(item.title) || filled(item.body))
    .map((item) => pointWrite(item, 'icon'));

  body.faqs = product.faqs
    .filter((item) => filled(item.question) || filled(item.answer))
    .map((item): ProductFaqWriteDto =>
      withOptionalId(item.id, {
        question: { ar: item.question.ar.trim(), en: item.question.en.trim() },
        answer: { ar: item.answer.ar.trim(), en: item.answer.en.trim() },
      }),
    );

  return body;
}

export function isUploadUrl(url: string): boolean {
  return url.startsWith('blob:');
}
