import { TEMPORARY_DEMO_OTP, type Environment } from './environment.model';

export const environment: Environment = {
  production: false,
  apiUrl: 'https://webdash.codetech-sa-dev.com/api/v1',
  demo: {
    otp: TEMPORARY_DEMO_OTP,
  },
};
