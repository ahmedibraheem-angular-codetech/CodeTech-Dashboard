import { environment } from '../../../environments/environment';
import { apiUrl, isApiUrl } from './api';

describe('API helpers', () => {
  it('exposes the environment base URL with /api/v1', () => {
    expect(environment.apiUrl).toBe('https://webdash.codetech-sa-dev.com/api/v1');
  });

  it('joins paths onto the base without a double slash', () => {
    expect(apiUrl(environment.apiUrl, '/admin/auth/login')).toBe(
      `${environment.apiUrl}/admin/auth/login`,
    );
    expect(apiUrl(environment.apiUrl, 'admin/profile')).toBe(`${environment.apiUrl}/admin/profile`);
  });

  it('treats only the configured API origin as an API URL', () => {
    const base = environment.apiUrl;
    expect(isApiUrl(base, base)).toBe(true);
    expect(isApiUrl(`${base}/admin/profile`, base)).toBe(true);
    expect(isApiUrl(`${base}-other/admin`, base)).toBe(false);
    expect(isApiUrl('https://third-party.example/api/v1/admin', base)).toBe(false);
  });
});
