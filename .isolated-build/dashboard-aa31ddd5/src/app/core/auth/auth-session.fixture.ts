import type { AuthSession } from './auth.model';

export function authSession(
  partial: Partial<AuthSession> & Pick<AuthSession, 'token' | 'email' | 'name'>,
): AuthSession {
  return {
    roleKey: 'roles.superAdmin',
    remember: false,
    profileLoaded: false,
    avatarUrl: null,
    permissions: [],
    lastLoginAt: null,
    username: null,
    phone: null,
    ...partial,
  };
}
