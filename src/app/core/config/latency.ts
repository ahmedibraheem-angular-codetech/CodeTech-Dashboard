import { InjectionToken } from '@angular/core';

/** Simulated latency for mock services. Tests override this with 0. */
export const API_LATENCY_MS = new InjectionToken<number>('API_LATENCY_MS', {
  factory: () => 180,
});
