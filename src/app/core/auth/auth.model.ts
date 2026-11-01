import type { FileObject } from '../http/api.model';

export interface AuthSession {
  token: string;
  email: string;
  name: string;
  roleKey: string;
  remember: boolean;
  profileLoaded: boolean;
  avatarUrl: string | null;
  permissions: readonly PermissionName[];
  lastLoginAt: string | null;
  username: string | null;
  phone: string | null;
}

export type StoredAuthSession = Pick<
  AuthSession,
  'token' | 'email' | 'name' | 'roleKey' | 'remember'
>;

export interface LoginRequest {
  email: string;
  password: string;
  remember: boolean;
}

export interface AuthRoleDto {
  id: number;
  name: string;
  is_protected: boolean;
}

export interface LoginUserDto {
  id: number;
  code: string;
  name: string;
  username: string | null;
  email: string;
  phone: string | null;
  status: string;
  role: AuthRoleDto;
  avatar_url: string | null;
}

export interface LoginPayload {
  token: string;
  user: LoginUserDto;
}

export interface ProfileUserDto {
  id: number;
  code: string;
  name: string;
  username: string | null;
  email: string;
  phone: string | null;
  status: string;
  role: AuthRoleDto;
  avatar: FileObject | null;
  blocked_reason: string | null;
  blocked_at: string | null;
  last_login_at: string | null;
  last_activity_at: string | null;
  created_at: string;
  updated_at: string;
  birth_date: string | null;
  about: string | null;
  permissions: PermissionName[];
}

export type PermissionAction = 'view' | 'create' | 'update' | 'delete';

export type PermissionName = string;

export interface PendingAuth {
  token: string;
  email: string;
  name: string;
  roleKey: string;
  remember: boolean;
}
