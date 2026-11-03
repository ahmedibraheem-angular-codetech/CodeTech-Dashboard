import type { FileObject } from '../../../core/http/api.model';
import type {
  ProjectDetailDto,
  ProjectGalleryWriteDto,
  ProjectIdentityItemWriteDto,
  ProjectListDto,
  ProjectLocaleDto,
  ProjectOverviewCardWriteDto,
  ProjectPointWriteDto,
  ProjectResultWriteDto,
  ProjectTagWriteDto,
  ProjectToolWriteDto,
  ProjectWriteDto,
} from '../models/project.api';
import { IDENTITY_IMAGE_SLOTS } from '../constants/project-limits';
import {
  blankProject,
  emptyProjectImage,
  localeText,
  projectGalleryImage,
  type LocaleText,
  type LocalizedMedia,
  type Project,
  type ProjectGalleryImage,
  type ProjectIdentityButton,
  type ProjectImage,
  type ProjectPoint,
} from '../models/project.model';
import { localeFilled } from '../utils/project-field-rules';

function locale(value: ProjectLocaleDto | null | undefined): LocaleText {
  return localeText(
    typeof value?.ar === 'string' ? value.ar : '',
    typeof value?.en === 'string' ? value.en : '',
  );
}

function serverId(id: string): number | undefined {
  return /^\d+$/.test(id) ? Number(id) : undefined;
}

export function mapProjectMedia(file: FileObject | null | undefined): ProjectImage {
  if (!file || typeof file.uuid !== 'string' || typeof file.url !== 'string') {
    return emptyProjectImage();
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
  return { ar: mapProjectMedia(file), en: emptyProjectImage() };
}

function mapPoint(
  dto: {
    id: number;
    title: ProjectLocaleDto;
    short_description: ProjectLocaleDto;
  } & ({ icon?: FileObject | null } | { image?: FileObject | null }),
  mediaKey: 'icon' | 'image',
): ProjectPoint {
  const file =
    mediaKey === 'icon' ? ('icon' in dto ? dto.icon : null) : 'image' in dto ? dto.image : null;
  return {
    id: String(dto.id),
    title: locale(dto.title),
    body: locale(dto.short_description),
    image: sharedMedia(file),
  };
}

function mapGallery(dto: { id: number; image: FileObject | null }): ProjectGalleryImage {
  return {
    id: String(dto.id),
    image: sharedMedia(dto.image),
  };
}

function padIdentityImages(images: ProjectGalleryImage[]): ProjectGalleryImage[] {
  const next = images.slice(0, IDENTITY_IMAGE_SLOTS);
  while (next.length < IDENTITY_IMAGE_SLOTS) {
    next.push(projectGalleryImage());
  }
  return next;
}

function mapIdentity(dto: ProjectDetailDto['identity_items'][number]): ProjectIdentityButton {
  return {
    id: String(dto.id),
    title: locale(dto.title),
    body: locale(dto.short_description),
    images: padIdentityImages((dto.images ?? []).map(mapGallery)),
  };
}

function mapAboutCard(dto: ProjectDetailDto['overview_cards'][number]): ProjectPoint {
  const title = locale(dto.title);
  const subject = locale(dto.subject);
  return {
    id: String(dto.id),
    title: localeFilled(title) ? title : subject,
    body: locale(dto.description),
    image: sharedMedia(dto.background),
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
  dto: ProjectListDto,
): Pick<
  Project,
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
  | 'categories'
  | 'seo'
> {
  return {
    id: String(dto.id),
    code: dto.code || String(dto.id).padStart(5, '0'),
    published: dto.status === 'published',
    name: locale(dto.title),
    summary: locale(dto.description),
    cover: sharedMedia(dto.cover),
    coverTitle: localeText(),
    coverAlt: localeText(),
    thumb: sharedMedia(dto.thumbnail),
    thumbTitle: localeText(),
    thumbAlt: localeText(),
    categories: (dto.tags ?? []).map((item) => mapPoint(item, 'icon')),
    seo: {
      slug: localeText(dto.slug ?? '', dto.slug ?? ''),
      title: localeText(),
      keywords: localeText(),
      description: localeText(),
    },
  };
}

function blankNested(): Pick<
  Project,
  | 'aboutCards'
  | 'challenges'
  | 'tools'
  | 'solutions'
  | 'solutionsImage'
  | 'gallery'
  | 'features'
  | 'results'
  | 'identityButtons'
> {
  const blank = blankProject();
  return {
    aboutCards: [],
    challenges: [],
    tools: [],
    solutions: [],
    solutionsImage: blank.solutionsImage,
    gallery: [],
    features: [],
    results: [],
    identityButtons: [],
  };
}

export function mapProjectListItem(dto: ProjectListDto): Project {
  return {
    ...blankNested(),
    ...mapCore(dto),
  };
}

export function mapProjectDetail(dto: ProjectDetailDto): Project {
  return {
    id: String(dto.id),
    code: dto.code || String(dto.id).padStart(5, '0'),
    published: dto.status === 'published',
    name: locale(dto.title),
    summary: locale(dto.description),
    cover: sharedMedia(dto.cover),
    coverTitle: locale(dto.cover_title),
    coverAlt: locale(dto.cover_alt),
    thumb: sharedMedia(dto.thumbnail),
    thumbTitle: locale(dto.thumbnail_title),
    thumbAlt: locale(dto.thumbnail_alt),
    categories: (dto.tags ?? []).map((item) => mapPoint(item, 'icon')),
    aboutCards: (dto.overview_cards ?? []).map(mapAboutCard),
    challenges: (dto.challenges ?? []).map((item) => mapPoint(item, 'image')),
    tools: (dto.tools ?? []).map((item) => ({
      id: String(item.id),
      title: localeText(),
      body: localeText(),
      image: sharedMedia(item.image),
    })),
    solutions: (dto.solutions ?? []).map((item) => mapPoint(item, 'icon')),
    solutionsImage: {
      id: 'solutions-image',
      title: locale(dto.solutions_image_title),
      body: locale(dto.solutions_image_alt),
      image: sharedMedia(dto.solutions_image),
    },
    gallery: (dto.gallery ?? []).map(mapGallery),
    features: (dto.features ?? []).map((item) => mapPoint(item, 'image')),
    results: (dto.results ?? []).map((item) => ({
      id: String(item.id),
      title: locale(item.title),
      body: locale(item.value),
      image: sharedMedia(item.icon),
    })),
    identityButtons: (dto.identity_items ?? []).map(mapIdentity),
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

function withOptionalId<T extends object>(id: string, body: T): T & { id?: number } {
  const numeric = serverId(id);
  return numeric === undefined ? body : { ...body, id: numeric };
}

/**
 * Media write ticket after blobs have been uploaded onto the domain model:
 * - no url → null (clear) when `clearEmpty` else omit
 * - icon:pi-* → omit
 * - uuid present → send uuid
 */
function ticket(
  image: { imageUrl?: string; imageUuid?: string | null },
  clearEmpty: boolean,
): string | null | undefined {
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

function pointWrite(item: ProjectPoint, mediaKey: 'icon' | 'image'): ProjectPointWriteDto {
  const row: ProjectPointWriteDto = withOptionalId(item.id, {
    title: { ar: item.title.ar.trim(), en: item.title.en.trim() },
    short_description: { ar: item.body.ar.trim(), en: item.body.en.trim() },
  });
  applyTicket(row as unknown as Record<string, unknown>, mediaKey, sharedTicket(item.image, true));
  return row;
}

export function toProjectWrite(project: Project): ProjectWriteDto {
  const body: ProjectWriteDto = {
    status: project.published ? 'published' : 'draft',
    title: { ar: project.name.ar.trim(), en: project.name.en.trim() },
    description: { ar: project.summary.ar.trim(), en: project.summary.en.trim() },
    cover_title: { ar: project.coverTitle.ar.trim(), en: project.coverTitle.en.trim() },
    cover_alt: { ar: project.coverAlt.ar.trim(), en: project.coverAlt.en.trim() },
    thumbnail_title: { ar: project.thumbTitle.ar.trim(), en: project.thumbTitle.en.trim() },
    thumbnail_alt: { ar: project.thumbAlt.ar.trim(), en: project.thumbAlt.en.trim() },
    solutions_image_title: {
      ar: project.solutionsImage.title.ar.trim(),
      en: project.solutionsImage.title.en.trim(),
    },
    solutions_image_alt: {
      ar: project.solutionsImage.body.ar.trim(),
      en: project.solutionsImage.body.en.trim(),
    },
    meta_title: { ar: project.seo.title.ar.trim(), en: project.seo.title.en.trim() },
    meta_description: {
      ar: project.seo.description.ar.trim(),
      en: project.seo.description.en.trim(),
    },
    meta_keywords: {
      ar: splitKeywords(project.seo.keywords.ar),
      en: splitKeywords(project.seo.keywords.en),
    },
  };

  const slug = (project.seo.slug.en || project.seo.slug.ar).trim();
  body.slug = slug || null;

  applyTicket(
    body as unknown as Record<string, unknown>,
    'cover',
    sharedTicket(project.cover, true),
  );
  applyTicket(
    body as unknown as Record<string, unknown>,
    'thumbnail',
    sharedTicket(project.thumb, true),
  );
  applyTicket(
    body as unknown as Record<string, unknown>,
    'solutions_image',
    sharedTicket(project.solutionsImage.image, true),
  );

  body.tags = project.categories
    .filter((item) => localeFilled(item.title) || localeFilled(item.body) || hasMedia(item.image))
    .map((item): ProjectTagWriteDto => pointWrite(item, 'icon'));

  body.overview_cards = project.aboutCards
    .filter((item) => localeFilled(item.title) || localeFilled(item.body) || hasMedia(item.image))
    .map((item): ProjectOverviewCardWriteDto => {
      const title = { ar: item.title.ar.trim(), en: item.title.en.trim() };
      const row: ProjectOverviewCardWriteDto = withOptionalId(item.id, {
        subject: title,
        title,
        description: { ar: item.body.ar.trim(), en: item.body.en.trim() },
      });
      applyTicket(
        row as unknown as Record<string, unknown>,
        'background',
        sharedTicket(item.image, true),
      );
      return row;
    });

  body.challenges = project.challenges
    .filter((item) => localeFilled(item.title) || localeFilled(item.body) || hasMedia(item.image))
    .map((item) => pointWrite(item, 'image'));

  body.tools = project.tools
    .filter((item) => hasMedia(item.image))
    .map((item): ProjectToolWriteDto => {
      const row: ProjectToolWriteDto = withOptionalId(item.id, {});
      applyTicket(
        row as unknown as Record<string, unknown>,
        'image',
        sharedTicket(item.image, true),
      );
      return row;
    });

  body.solutions = project.solutions
    .filter((item) => localeFilled(item.title) || localeFilled(item.body) || hasMedia(item.image))
    .map((item) => pointWrite(item, 'icon'));

  body.gallery = project.gallery
    .filter((item) => hasMedia(item.image))
    .map((item): ProjectGalleryWriteDto => {
      const row: ProjectGalleryWriteDto = withOptionalId(item.id, {});
      applyTicket(
        row as unknown as Record<string, unknown>,
        'image',
        sharedTicket(item.image, true),
      );
      return row;
    });

  body.features = project.features
    .filter((item) => localeFilled(item.title) || localeFilled(item.body) || hasMedia(item.image))
    .map((item) => pointWrite(item, 'image'));

  body.results = project.results
    .filter((item) => localeFilled(item.title) || localeFilled(item.body) || hasMedia(item.image))
    .map((item): ProjectResultWriteDto => {
      const row: ProjectResultWriteDto = withOptionalId(item.id, {
        title: { ar: item.title.ar.trim(), en: item.title.en.trim() },
        value: { ar: item.body.ar.trim(), en: item.body.en.trim() },
      });
      applyTicket(
        row as unknown as Record<string, unknown>,
        'icon',
        sharedTicket(item.image, true),
      );
      return row;
    });

  body.identity_items = project.identityButtons
    .filter(
      (item) =>
        localeFilled(item.title) ||
        localeFilled(item.body) ||
        item.images.some((image) => hasMedia(image.image) || !!serverId(image.id)),
    )
    .map((item): ProjectIdentityItemWriteDto => {
      const images = item.images
        .filter(
          (image) =>
            !!serverId(image.id) ||
            !!image.image.ar.imageUuid ||
            !!image.image.en.imageUuid ||
            hasMedia(image.image),
        )
        .map((image) => {
          const row = withOptionalId(image.id, {} as { image?: string | null });
          applyTicket(
            row as unknown as Record<string, unknown>,
            'image',
            sharedTicket(image.image, true),
          );
          return row;
        });
      return withOptionalId(item.id, {
        title: { ar: item.title.ar.trim(), en: item.title.en.trim() },
        short_description: { ar: item.body.ar.trim(), en: item.body.en.trim() },
        images,
      });
    });

  return body;
}

export function isUploadUrl(url: string): boolean {
  return url.startsWith('blob:');
}
