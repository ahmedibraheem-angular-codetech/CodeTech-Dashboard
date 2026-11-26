import { Injectable, signal } from '@angular/core';

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
