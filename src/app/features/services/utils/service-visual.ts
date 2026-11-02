import { SERVICE_FALLBACK_ICON, SERVICE_ICON_CLASS } from '../constants/service.constants';
import type { ServiceImage } from '../models/service.model';

export interface ServiceVisual {
  icon: string;
  image: string;
}

/** CSS class for a PrimeIcon tile (`pi pi-…`), with a safe fallback. */
export function serviceIconClass(icon: string): string {
  return `pi ${SERVICE_ICON_CLASS.test(icon) ? icon : SERVICE_FALLBACK_ICON}`;
}

/**
 * Resolve a service media slot to either a PrimeIcon class (from `icon:pi-*`)
 * or a display image URL.
 */
export function serviceVisual(image: ServiceImage): ServiceVisual {
  const url = image.imageUrl;
  if (url.startsWith('icon:')) {
    const icon = url.slice('icon:'.length);
    return { icon: SERVICE_ICON_CLASS.test(icon) ? icon : '', image: '' };
  }
  return { icon: '', image: url };
}
