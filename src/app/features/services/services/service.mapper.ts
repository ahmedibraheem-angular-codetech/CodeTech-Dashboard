import type { FileObject } from '../../../core/http/api.model';
import type {
  ServiceDetailDto,
  ServiceFaqWriteDto,
  ServiceFeatureWriteDto,
  ServiceLinkedProjectDto,
  ServiceListDto,
  ServiceLocaleDto,
  ServiceNeedWriteDto,
  ServiceSectorWriteDto,
  ServiceSolutionWriteDto,
  ServiceStageWriteDto,
  ServiceWriteDto,
} from '../models/service.api';
import {
  localeText,
  type LocaleText,
  type Service,
  type ServiceFaq,
  type ServiceImage,
  type ServiceLinkedProject,
  type ServicePoint,
  type ServiceSector,
  type ServiceWhyItem,
} from '../models/service.model';
import { filledLocale } from '../utils/service-locale';

function locale(value: ServiceLocaleDto | null | undefined): LocaleText {
  return localeText(
    typeof value?.ar === 'string' ? value.ar : '',
    typeof value?.en === 'string' ? value.en : '',
  );
}

function serverId(id: string): number | undefined {
  return /^\d+$/.test(id) ? Number(id) : undefined;
}

export function mapServiceMedia(file: FileObject | null | undefined): ServiceImage {
  if (!file || typeof file.uuid !== 'string' || typeof file.url !== 'string') {
    return { imageName: '', imageUrl: '', imageUuid: null };
  }
  return {
    imageUuid: file.uuid,
    imageUrl: file.url,
    imageName: file.file_name || file.name || 'file',
  };
}

function mapWhyItem(dto: ServiceDetailDto['needs'][number]): ServiceWhyItem {
  const media = mapServiceMedia(dto.icon);
  return {
    id: String(dto.id),
    title: locale(dto.title),
    ...media,
  };
}

function mapPoint(
  dto: {
    id: number;
    title: ServiceLocaleDto;
    short_description: ServiceLocaleDto;
  } & ({ icon: FileObject | null } | { image: FileObject | null }),
): ServicePoint {
  const media = mapServiceMedia('icon' in dto ? dto.icon : dto.image);
  return {
    id: String(dto.id),
    title: locale(dto.title),
    body: locale(dto.short_description),
    ...media,
  };
}

function mapSector(dto: ServiceDetailDto['sectors'][number]): ServiceSector {
  return {
    id: String(dto.id),
    image: {
      ar: mapServiceMedia(dto.image?.ar ?? null),
      en: mapServiceMedia(dto.image?.en ?? null),
    },
  };
}

function sectorHasMedia(item: ServiceSector): boolean {
  return !!(item.image.ar.imageUrl || item.image.en.imageUrl);
}

function mapFaq(dto: ServiceDetailDto['faqs'][number]): ServiceFaq {
  return {
    id: String(dto.id),
    question: locale(dto.question),
    answer: locale(dto.answer),
  };
}

export function mapLinkedProject(dto: ServiceLinkedProjectDto): ServiceLinkedProject {
  const cover = mapServiceMedia(dto.cover);
  return {
    id: String(dto.id),
    title: locale(dto.title),
    description: locale(dto.description),
    coverUrl: cover.imageUrl,
    published: dto.status === 'published',
    visible: !!dto.is_visible,
  };
}

function mapCore(dto: ServiceListDto): Pick<
  Service,
  'id' | 'code' | 'icon' | 'iconUrl' | 'iconUuid' | 'published' | 'name' | 'description'
> {
  const icon = mapServiceMedia(dto.icon);
  return {
    id: String(dto.id),
    code: dto.code || String(dto.id).padStart(5, '0'),
    icon: '',
    iconUrl: icon.imageUrl,
    iconUuid: icon.imageUuid ?? null,
    published: dto.status === 'published',
    name: locale(dto.name),
    description: locale(dto.description),
  };
}

export function mapServiceListItem(dto: ServiceListDto): Service {
  return {
    ...mapCore(dto),
    whyImage: { title: localeText(), imageName: '', imageUrl: '', imageUuid: null },
    whyItems: [],
    solutions: [],
    stages: [],
    features: [],
    projectIds: [],
    linkedProjects: [],
    sectors: [],
    faqs: [],
  };
}

export function mapServiceDetail(dto: ServiceDetailDto): Service {
  const whyMedia = mapServiceMedia(dto.why_image);
  const linked = Array.isArray(dto.projects) ? dto.projects.map(mapLinkedProject) : [];
  return {
    ...mapCore(dto),
    whyImage: {
      title: locale(dto.why_image_text),
      ...whyMedia,
    },
    whyItems: Array.isArray(dto.needs) ? dto.needs.map(mapWhyItem) : [],
    solutions: Array.isArray(dto.solutions) ? dto.solutions.map(mapPoint) : [],
    stages: Array.isArray(dto.stages) ? dto.stages.map(mapPoint) : [],
    features: Array.isArray(dto.features) ? dto.features.map(mapPoint) : [],
    projectIds: linked.map((item) => item.id),
    linkedProjects: linked,
    sectors: Array.isArray(dto.sectors) ? dto.sectors.map(mapSector) : [],
    faqs: Array.isArray(dto.faqs) ? dto.faqs.map(mapFaq) : [],
  };
}

function withOptionalId<T extends object>(id: string, body: T): T & { id?: number } {
  const numeric = serverId(id);
  return numeric === undefined ? body : { ...body, id: numeric };
}

/**
 * Media write ticket after blobs have been uploaded onto the domain model:
 * - no url → null (clear) when `clear` else omit
 * - icon:pi-* → omit
 * - uuid present → send uuid
 */
function ticket(
  image: ServiceImage,
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

function applyTicket(target: Record<string, unknown>, key: string, value: string | null | undefined): void {
  if (value !== undefined) {
    target[key] = value;
  }
}

export function toServiceWrite(service: Service): ServiceWriteDto {
  const body: ServiceWriteDto = {
    status: service.published ? 'published' : 'draft',
    name: {
      ar: service.name.ar.trim(),
      en: service.name.en.trim(),
    },
    description: {
      ar: service.description.ar.trim(),
      en: service.description.en.trim(),
    },
    why_image_text: {
      ar: service.whyImage.title.ar.trim(),
      en: service.whyImage.title.en.trim(),
    },
  };

  applyTicket(body as unknown as Record<string, unknown>, 'icon', ticket({
    imageUrl: service.iconUrl,
    imageName: '',
    imageUuid: service.iconUuid,
  }, !!service.iconUuid));
  applyTicket(body as unknown as Record<string, unknown>, 'why_image', ticket(service.whyImage, true));

  body.needs = service.whyItems
    .filter((item) => filledLocale(item.title))
    .map((item): ServiceNeedWriteDto => {
      const row: ServiceNeedWriteDto = withOptionalId(item.id, {
        title: { ar: item.title.ar.trim(), en: item.title.en.trim() },
      });
      applyTicket(row as unknown as Record<string, unknown>, 'icon', ticket(item, true));
      return row;
    });

  body.solutions = service.solutions
    .filter((item) => filledLocale(item.title) || filledLocale(item.body))
    .map((item): ServiceSolutionWriteDto => {
      const row: ServiceSolutionWriteDto = withOptionalId(item.id, {
        title: { ar: item.title.ar.trim(), en: item.title.en.trim() },
        short_description: { ar: item.body.ar.trim(), en: item.body.en.trim() },
      });
      applyTicket(row as unknown as Record<string, unknown>, 'icon', ticket(item, true));
      return row;
    });

  body.stages = service.stages
    .filter((item) => filledLocale(item.title) || filledLocale(item.body))
    .map((item): ServiceStageWriteDto => {
      const row: ServiceStageWriteDto = withOptionalId(item.id, {
        title: { ar: item.title.ar.trim(), en: item.title.en.trim() },
        short_description: { ar: item.body.ar.trim(), en: item.body.en.trim() },
      });
      applyTicket(row as unknown as Record<string, unknown>, 'image', ticket(item, true));
      return row;
    });

  body.features = service.features
    .filter((item) => filledLocale(item.title) || filledLocale(item.body))
    .map((item): ServiceFeatureWriteDto => {
      const row: ServiceFeatureWriteDto = withOptionalId(item.id, {
        title: { ar: item.title.ar.trim(), en: item.title.en.trim() },
        short_description: { ar: item.body.ar.trim(), en: item.body.en.trim() },
      });
      applyTicket(row as unknown as Record<string, unknown>, 'image', ticket(item, true));
      return row;
    });

  body.sectors = service.sectors
    .filter(sectorHasMedia)
    .map((item): ServiceSectorWriteDto => {
      const ar = ticket(item.image.ar, true);
      const en = ticket(item.image.en, true);
      return withOptionalId(item.id, {
        image: {
          ar: ar === undefined ? null : ar,
          en: en === undefined ? null : en,
        },
      });
    });

  body.faqs = service.faqs
    .filter((item) => filledLocale(item.question) || filledLocale(item.answer))
    .map(
      (item): ServiceFaqWriteDto =>
        withOptionalId(item.id, {
          question: { ar: item.question.ar.trim(), en: item.question.en.trim() },
          answer: { ar: item.answer.ar.trim(), en: item.answer.en.trim() },
        }),
    );

  body.projects = service.projectIds
    .map((id) => serverId(id))
    .filter((id): id is number => id !== undefined)
    .map((id) => ({ id, is_visible: true }));

  return body;
}

export function isUploadUrl(url: string): boolean {
  return url.startsWith('blob:');
}
