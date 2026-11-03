import { DEFAULT_AVATAR_URL, type UserProfile } from './profile.model';

export const PROFILE_SEED: Omit<UserProfile, 'name' | 'email' | 'roleKey'> = {
  username: '@Ahmedddd1',
  phone: '+966 55 298 3389',
  lastLogin: '2026-03-18T10:00:00',
  avatarUrl: DEFAULT_AVATAR_URL,
};
