

export const TEMPORARY_DEMO_OTP = '1111';

export interface DemoCredentials {

  otp: string;
}

export interface Environment {
  production: boolean;

  apiUrl: string;

  demo?: DemoCredentials;
}
