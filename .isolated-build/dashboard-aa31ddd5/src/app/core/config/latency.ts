import { InjectionToken } from '@angular/core';

export const API_LATENCY_MS = new InjectionToken<number>('API_LATENCY_MS', {
  factory: () => 180,
});
