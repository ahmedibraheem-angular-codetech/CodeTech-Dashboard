import type { FileObject } from '../../../core/http/api.model';
import type { AppLanguage } from '../../../core/i18n/language';
import { toIsoDate } from '../../../shared/utils/date';
import type {
  AboutBlockDto,
  AboutBlockWriteDto,
  AboutCeoDto,
  AboutCeoWriteDto,
  AboutLocaleString,
  AboutLocaleStringList,
  AboutPageDto,
  AboutPartnerDto,
  AboutTeamMemberDto,
  AboutTeamMemberWriteDto,
  AboutVisionMissionDto,
  AboutVisionMissionWriteDto,
} from '../models/about.api';
import type {
  AboutCeo,
  AboutCeoText,
  AboutContent,
  AboutGroups,
  AboutImage,
  AboutMember,
  AboutPartner,
  AboutPointGroup,
} from '../models/about.model';

export function mapAboutPage(page: AboutPageDto, partners: AboutPartnerDto[]): AboutContent {
  return {
    story: mapStory(page.about),
    vision: mapVision(page.vision_mission),
    ceo: mapCeo(page.ceo),
    team: (page.team ?? []).map(mapTeamMember),
    partners: (partners ?? []).map(mapPartner),
  };
}

export function mapPartner(dto: AboutPartnerDto): AboutPartner {
  const image = mapFile(dto.logo);
  const name = image?.name || dto.logo?.name || `partner-${dto.id}`;
  return {
    id: String(dto.id),
    name,
    monogram: name.charAt(0) || '?',
    image,
  };
}

export function mapTeamMember(dto: AboutTeamMemberDto): AboutMember {
  return {
    id: String(dto.id),
    texts: {
      ar: mapMemberText(dto, 'ar'),
      en: mapMemberText(dto, 'en'),
    },
    image: mapFile(dto.photo),
  };
}

export function toStoryWrite(
  story: AboutGroups,
  image: string | null | undefined,
): AboutBlockWriteDto {
  const body: AboutBlockWriteDto = {
    philosophy_points: pointsOf(story, 'philosophy'),
    target_market_points: pointsOf(story, 'market'),
  };
  if (image !== undefined) {
    body.image = image;
  }
  return body;
}

export function toVisionWrite(vision: AboutGroups): AboutVisionMissionWriteDto {
  return {
    vision_points: pointsOf(vision, 'vision'),
    vision_quote: quoteOf(vision, 'vision'),
    mission_points: pointsOf(vision, 'mission'),
    mission_quote: quoteOf(vision, 'mission'),
  };
}

export function toCeoWrite(ceo: AboutCeo, image: string | null | undefined): AboutCeoWriteDto {
  const body: AboutCeoWriteDto = {
    name: {
      ar: ceo.texts.ar.name,
      en: emptyToNull(ceo.texts.en.name),
    },
    job_title: {
      ar: emptyToNull(ceo.texts.ar.role),
      en: emptyToNull(ceo.texts.en.role),
    },
    description: {
      ar: emptyToNull(ceo.texts.ar.body),
      en: emptyToNull(ceo.texts.en.body),
    },
    quote: {
      ar: emptyToNull(ceo.texts.ar.quote),
      en: emptyToNull(ceo.texts.en.quote),
    },
  };
  if (image !== undefined) {
    body.image = image;
  }
  return body;
}

export function toTeamWrite(
  member: AboutMember,
  photo: string | null | undefined,
): AboutTeamMemberWriteDto {
  const body: AboutTeamMemberWriteDto = {
    name: {
      ar: member.texts.ar.name.trim(),
      en: emptyToNull(member.texts.en.name),
    },
    job_title: {
      ar: emptyToNull(member.texts.ar.role),
      en: emptyToNull(member.texts.en.role),
    },
  };
  if (photo !== undefined) {
    body.photo = photo;
  }
  return body;
}

export function emptyStory(): AboutGroups {
  return {
    image: null,
    texts: {
      ar: [emptyGroup('philosophy', 'فلسفة الشركة'), emptyGroup('market', 'السوق المستهدف')],
      en: [emptyGroup('philosophy', 'Company philosophy'), emptyGroup('market', 'Target market')],
    },
  };
}

export function emptyVision(): AboutGroups {
  return {
    image: null,
    texts: {
      ar: [emptyGroup('mission', 'رسالتنا'), emptyGroup('vision', 'رؤيتنا')],
      en: [emptyGroup('mission', 'Our mission'), emptyGroup('vision', 'Our vision')],
    },
  };
}

export function emptyCeo(): AboutCeo {
  return {
    image: null,
    texts: { ar: emptyCeoText(), en: emptyCeoText() },
  };
}

export function mapStory(dto: AboutBlockDto | null | undefined): AboutGroups {
  if (!dto) {
    return emptyStory();
  }
  return {
    image: mapFile(dto.image),
    texts: {
      ar: [
        group('philosophy', 'فلسفة الشركة', '', readList(dto.philosophy_points, 'ar')),
        group('market', 'السوق المستهدف', '', readList(dto.target_market_points, 'ar')),
      ],
      en: [
        group('philosophy', 'Company philosophy', '', readList(dto.philosophy_points, 'en')),
        group('market', 'Target market', '', readList(dto.target_market_points, 'en')),
      ],
    },
  };
}

export function mapVision(dto: AboutVisionMissionDto | null | undefined): AboutGroups {
  if (!dto) {
    return emptyVision();
  }
  return {
    image: null,
    texts: {
      ar: [
        group('mission', 'رسالتنا', readLocale(dto.mission_quote, 'ar'), readList(dto.mission_points, 'ar')),
        group('vision', 'رؤيتنا', readLocale(dto.vision_quote, 'ar'), readList(dto.vision_points, 'ar')),
      ],
      en: [
        group(
          'mission',
          'Our mission',
          readLocale(dto.mission_quote, 'en'),
          readList(dto.mission_points, 'en'),
        ),
        group(
          'vision',
          'Our vision',
          readLocale(dto.vision_quote, 'en'),
          readList(dto.vision_points, 'en'),
        ),
      ],
    },
  };
}

export function mapCeo(dto: AboutCeoDto | null | undefined): AboutCeo {
  if (!dto) {
    return emptyCeo();
  }
  return {
    image: mapFile(dto.image),
    texts: {
      ar: mapCeoText(dto, 'ar'),
      en: mapCeoText(dto, 'en'),
    },
  };
}

function mapCeoText(dto: AboutCeoDto, locale: AppLanguage): AboutCeoText {
  return {
    name: readLocale(dto.name, locale),
    role: readLocale(dto.job_title, locale),
    body: readLocale(dto.description, locale),
    quote: readLocale(dto.quote, locale),
  };
}

function mapMemberText(
  dto: AboutTeamMemberDto,
  locale: AppLanguage,
): { name: string; role: string } {
  return {
    name: readLocale(dto.name, locale),
    role: readLocale(dto.job_title, locale),
  };
}

function mapFile(file: FileObject | null | undefined): AboutImage | null {
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

function pointsOf(groups: AboutGroups, id: string): AboutLocaleStringList {
  return {
    ar: findGroup(groups, 'ar', id)?.points ?? [],
    en: findGroup(groups, 'en', id)?.points ?? [],
  };
}

function quoteOf(groups: AboutGroups, id: string): AboutLocaleString {
  return {
    ar: emptyToNull(findGroup(groups, 'ar', id)?.highlight ?? ''),
    en: emptyToNull(findGroup(groups, 'en', id)?.highlight ?? ''),
  };
}

function findGroup(
  groups: AboutGroups,
  locale: AppLanguage,
  id: string,
): AboutPointGroup | undefined {
  return groups.texts[locale].find((group) => group.id === id);
}

function group(id: string, title: string, highlight: string, points: string[]): AboutPointGroup {
  return { id, title, highlight, points };
}

function emptyGroup(id: string, title: string): AboutPointGroup {
  return { id, title, highlight: '', points: [] };
}

function emptyCeoText(): AboutCeoText {
  return { name: '', role: '', body: '', quote: '' };
}

function readLocale(value: AboutLocaleString | null | undefined, locale: AppLanguage): string {
  const raw = value?.[locale];
  return typeof raw === 'string' ? raw : '';
}

function readList(value: AboutLocaleStringList | null | undefined, locale: AppLanguage): string[] {
  const list = value?.[locale];
  return Array.isArray(list) ? list.filter((item): item is string => typeof item === 'string') : [];
}

function emptyToNull(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}
