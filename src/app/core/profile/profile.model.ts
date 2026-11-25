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

export interface UpdateProfileRequest {
  name: string;
  email: string;
  username: string | null;
  phone: string | null;
  avatar?: string | null;
}

export interface ChangePasswordRequest {
  current_password: string;
  password: string;
  password_confirmation: string;
}

export function displayUsername(value: string | null | undefined): string {
  const raw = (value ?? '').trim().replace(/^@+/, '');
  return raw ? `@${raw}` : '';
}

export function apiUsername(value: string | null | undefined): string | null {
  const raw = (value ?? '').trim().replace(/^@+/, '');
  return raw || null;
}

export function apiPhone(value: string | null | undefined): string | null {
  const raw = (value ?? '').trim();
  return raw || null;
}
