import type { Environment } from './environment.model';

export const environment: Environment = {
  production: false,
  apiUrl: '/api',
  demo: {
    password: '12345678',
    otp: '1111',
  },
};
