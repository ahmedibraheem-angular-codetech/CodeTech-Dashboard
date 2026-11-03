import { Injectable, signal } from '@angular/core';

/**
 * App-wide online/offline mirror of the browser connection events.
 * HTTP failures still need `ApiError.kind === 'network'` — `navigator.onLine`
 * alone can be wrong when the LAN is up but the WAN is dead.
 */
@Injectable({ providedIn: 'root' })
export class NetworkStatusService {
  readonly online = signal(typeof navigator === 'undefined' ? true : navigator.onLine);

  constructor() {
    if (typeof window === 'undefined') {
      return;
    }
    window.addEventListener('online', this.markOnline);
    window.addEventListener('offline', this.markOffline);
  }

  private readonly markOnline = (): void => {
    this.online.set(true);
  };

  private readonly markOffline = (): void => {
    this.online.set(false);
  };
}
