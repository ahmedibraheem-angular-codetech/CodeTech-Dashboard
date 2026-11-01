
export const DEFAULT_AVATAR_URL = 'images/avatar-placeholder.svg';

export interface UserProfile {
  name: string;
  username: string;
  email: string;
  phone: string;

  roleKey: string;

  lastLogin: string | null;

  avatarUrl: string | null;
}

export type ProfileDraft = Pick<UserProfile, 'name' | 'username' | 'email' | 'phone'>;
