export type UserRole = 'super-admin' | 'editor' | 'viewer';
export type UserStatus = 'active' | 'suspended';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  status: UserStatus;
  joinedAt: string;
}

export type UserDraft = Omit<User, 'id'>;
