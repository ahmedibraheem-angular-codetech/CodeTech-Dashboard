import type { FileObject } from '../../../core/http/api.model';
import type { SiteLocaleDto, SiteSettingsDto, SiteSettingsWriteDto } from '../models/site-settings.api';
import type {
  SiteLogo,
  SiteLogoIntent,
  SiteSettings,
  SiteSettingsDraft,
} from '../models/site-settings.model';
import type { LocaleText } from '../models/social-links.model';

function locale(value: SiteLocaleDto | null | undefined): LocaleText {
  return {
    ar: typeof value?.ar === 'string' ? value.ar : '',
    en: typeof value?.en === 'string' ? value.en : '',
  };
}

function toLocaleDto(value: LocaleText): SiteLocaleDto {
  return {
    ar: value.ar.trim() || null,
    en: value.en.trim() || null,
  };
}

function mapLogo(file: FileObject | null | undefined): SiteLogo {
  if (!file || typeof file.uuid !== 'string') {
    return { uuid: null, name: null, url: null };
  }
  return {
    uuid: file.uuid,
    name: file.file_name || file.name || null,
    url: file.url || null,
  };
}

export function mapSiteSettings(dto: SiteSettingsDto): SiteSettings {
  return {
    description: locale(dto.site_description),
    companyName: locale(dto.company_name),
    websiteUrl: typeof dto.website_url === 'string' ? dto.website_url : '',
    phone: typeof dto.phone === 'string' ? dto.phone : '',
    email: typeof dto.email === 'string' ? dto.email : '',
    locationName: locale(dto.location_name),
    mapUrl: typeof dto.google_maps_url === 'string' ? dto.google_maps_url : '',
    logo: mapLogo(dto.logo),
    updatedAt: typeof dto.updated_at === 'string' ? dto.updated_at : '',
  };
}

export function toSiteSettingsWrite(
  draft: SiteSettingsDraft,
  logoUuid: string | null | undefined,
): SiteSettingsWriteDto {
  const body: SiteSettingsWriteDto = {
    site_description: toLocaleDto(draft.description),
    company_name: toLocaleDto(draft.companyName),
    location_name: toLocaleDto(draft.locationName),
    phone: draft.phone.trim() || null,
    email: draft.email.trim() || null,
    website_url: draft.websiteUrl.trim() || null,
    google_maps_url: draft.mapUrl.trim() || null,
  };
  // Coat-check: omit keeps current logo; null clears; UUID replaces.
  if (logoUuid !== undefined) {
    body.logo = logoUuid;
  }
  return body;
}

export function resolveLogoUuid(
  intent: SiteLogoIntent,
  uploadedUuid: string | undefined,
): string | null | undefined {
  if (intent.kind === 'omit') {
    return undefined;
  }
  if (intent.kind === 'clear') {
    return null;
  }
  return uploadedUuid ?? null;
}
