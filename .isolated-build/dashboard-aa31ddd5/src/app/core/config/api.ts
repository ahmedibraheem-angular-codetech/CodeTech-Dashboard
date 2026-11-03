import { InjectionToken } from '@angular/core';

import { environment } from '../../../environments/environment';

export const API_BASE_URL = new InjectionToken<string>('API_BASE_URL', {
  factory: () => environment.apiUrl,
});

export function isApiUrl(url: string, base: string): boolean {
  return url === base || url.startsWith(`${base}/`);
}

export function apiUrl(base: string, path: string): string {
  return `${base}/${path.replace(/^\//, '')}`;
}
