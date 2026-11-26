import type { FileObject } from '../../../core/http/api.model';
import type { AppLanguage } from '../../../core/i18n/language';
import { toIsoDate } from '../../../shared/utils/date';
import type {
  HomeBlockDto,
  HomeBlockWriteDto,
  HomePageDto,
  HomePartnerDto,
  LocaleString,
  LocaleStringList,
} from '../models/homepage.api';
import type {
  BlockImage,
  ContentBlock,
  ContentBlockText,
  HomepageContent,
  Partner,
} from '../models/homepage.model';

export function mapHomePage(dto: HomePageDto): HomepageContent {
  const video = dto.intro_video?.video ?? null;
  return {
    partners: (dto.partners ?? []).map(mapPartner),
    videoEnabled: dto.intro_video?.is_visible ?? false,
    videoName: video?.file_name ?? video?.name ?? null,
    videoUrl: video?.url ?? null,
    about: mapBlock(dto.about),
    vision: mapBlock(dto.vision_2030),
  };
}

export function mapPartner(dto: HomePartnerDto): Partner {
  const image = mapFile(dto.logo);
  const name = image?.name || dto.logo?.name || `partner-${dto.id}`;
  return {
    id: String(dto.id),
    name,
    monogram: name.charAt(0) || '?',
    image,
  };
}

export function mapBlock(dto: HomeBlockDto | null | undefined): ContentBlock {
  if (!dto) {
    return emptyBlock();
  }
  return {
    texts: {
      ar: mapText(dto, 'ar'),
      en: mapText(dto, 'en'),
    },
    image: mapBlockImages(dto.image),
  };
}

function mapBlockImages(value: HomeBlockDto['image']): Record<AppLanguage, BlockImage | null> {
  if (!value || typeof value === 'string' || typeof value !== 'object') {
    return { ar: null, en: null };
  }
  // A plain file counts as the Arabic picture only.
  if ('uuid' in value) {
    return { ar: mapFile(value), en: null };
  }
  return { ar: mapFile(value.ar), en: mapFile(value.en) };
}

export function toBlockWrite(
  block: ContentBlock,
  image: { ar?: string | null; en?: string | null } | undefined,
): HomeBlockWriteDto {
  const body: HomeBlockWriteDto = {
    title: {
      ar: block.texts.ar.title,
      en: emptyToNull(block.texts.en.title),
    },
    description: {
      ar: emptyToNull(block.texts.ar.body),
      en: emptyToNull(block.texts.en.body),
    },
    points: {
      ar: block.texts.ar.points,
      en: block.texts.en.points,
    },
  };
  if (image && Object.keys(image).length) {
    body.image = image;
  }
  return body;
}

export function emptyBlock(): ContentBlock {
  return {
    texts: { ar: emptyText(), en: emptyText() },
    image: { ar: null, en: null },
  };
}

function mapText(dto: HomeBlockDto, locale: AppLanguage): ContentBlockText {
  return {
    title: readLocale(dto.title, locale),
    body: readLocale(dto.description, locale),
    points: readLocaleList(dto.points, locale),
  };
}

function mapFile(file: FileObject | null | undefined): BlockImage | null {
  if (!file || typeof file.uuid !== 'string') {
    return null;
  }
  return {
    name: file.file_name || file.name || 'image',
    size: file.size ?? 0,
    uploadedAt: toIsoDate(new Date(file.created_at || Date.now())),
    uuid: file.uuid,
    url: file.url,
    downloadUrl: file.download_url,
  };
}

function readLocale(value: LocaleString | null | undefined, locale: AppLanguage): string {
  const raw = value?.[locale];
  return typeof raw === 'string' ? raw : '';
}

function readLocaleList(value: LocaleStringList | null | undefined, locale: AppLanguage): string[] {
  const list = value?.[locale];
  return Array.isArray(list) ? list.filter((item): item is string => typeof item === 'string') : [];
}

function emptyText(): ContentBlockText {
  return { title: '', body: '', points: [] };
}

function emptyToNull(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}
