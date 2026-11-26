export const SERVICE_FALLBACK_ICON = 'pi-cog';

export const SERVICE_ICON_CLASS = /^pi-[a-z0-9-]+$/;

export const SERVICE_UPLOAD_PREFIX = 'service';

export const SERVICE_LIST_PAGE_SIZE = 10;

export type ServiceLoadState = 'loading' | 'ready' | 'error' | 'offline';

export type ServicePageStatus = 'loading' | 'ready' | 'missing' | 'error' | 'offline';

export type ServiceProjectsStatus = 'loading' | 'ready' | 'error' | 'offline';
