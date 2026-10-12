import { DEFAULT_AVATAR_URL, UserProfile } from './profile.model';

/**
 * Mock profile details that the auth session does not carry. The session still provides
 * `name`, `email` and `roleKey`. Replace with the `/me` API response once it exists.
 */
export const PROFILE_SEED: Omit<UserProfile, 'name' | 'email' | 'roleKey'> = {
  username: '@Ahmedddd1',
  phone: '+966 55 298 3389',
  lastLogin: '2026-03-18T10:00:00',
  avatarUrl: DEFAULT_AVATAR_URL,
};
