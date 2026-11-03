/** Shared Services feature constants (no behavior — values only). */

export const SERVICE_FALLBACK_ICON = 'pi-cog';

/** PrimeIcons class name used by the list/detail icon tile. */
export const SERVICE_ICON_CLASS = /^pi-[a-z0-9-]+$/;

export const SERVICE_UPLOAD_PREFIX = 'service';

export const SERVICE_LIST_PAGE_SIZE = 10;

export type ServiceLoadState = 'loading' | 'ready' | 'error' | 'offline';

export type ServicePageStatus = 'loading' | 'ready' | 'missing' | 'error' | 'offline';

export type ServiceProjectsStatus = 'loading' | 'ready' | 'error' | 'offline';
