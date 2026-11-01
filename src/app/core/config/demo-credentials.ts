import { InjectionToken } from '@angular/core';

import { environment } from '../../../environments/environment';
import {
  TEMPORARY_DEMO_OTP,
  type DemoCredentials,
} from '../../../environments/environment.model';

export { TEMPORARY_DEMO_OTP };

export const DEMO_CREDENTIALS = new InjectionToken<DemoCredentials | null>('DEMO_CREDENTIALS', {
  factory: () => environment.demo ?? null,
});
