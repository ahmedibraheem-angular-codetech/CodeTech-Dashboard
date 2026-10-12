import { InjectionToken } from '@angular/core';

import { environment } from '../../../environments/environment';
import type { DemoCredentials } from '../../../environments/environment.model';

/**
 * Mock sign-in credentials. `null` in production builds, where the mock auth
 * flow is intentionally unavailable until a real API is connected.
 */
export const DEMO_CREDENTIALS = new InjectionToken<DemoCredentials | null>('DEMO_CREDENTIALS', {
  factory: () => environment.demo ?? null,
});
