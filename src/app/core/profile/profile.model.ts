/** Placeholder shown until the user uploads their own picture (served from `public/images`). */
export const DEFAULT_AVATAR_URL = 'images/avatar-placeholder.svg';

export interface UserProfile {
  name: string;
  username: string;
  email: string;
  phone: string;
  /** Translation key of the user's role, e.g. `roles.superAdmin`. */
  roleKey: string;
  /** Local ISO date-time of the last sign in, e.g. `2026-03-18T10:00:00`. */
  lastLogin: string;
  /** `null` once the picture is removed; the UI then falls back to the user's initial. */
  avatarUrl: string | null;
}

/** Fields the user can edit from the personal data form. */
export type ProfileDraft = Pick<UserProfile, 'name' | 'username' | 'email' | 'phone'>;
