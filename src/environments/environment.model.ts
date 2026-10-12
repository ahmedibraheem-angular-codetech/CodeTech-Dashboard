export interface DemoCredentials {
  password: string;
  otp: string;
}

export interface Environment {
  production: boolean;
  apiUrl: string;
  /** Mock sign-in credentials. Present in development only; never ship them in production. */
  demo?: DemoCredentials;
}
