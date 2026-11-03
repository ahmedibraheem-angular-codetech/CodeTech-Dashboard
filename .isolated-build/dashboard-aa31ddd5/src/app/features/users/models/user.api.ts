import type { FileObject } from '../../../core/http/api.model';

/** Backend user statuses. `suspended` is not one of them. */
export type UserApiStatus = 'active' | 'inactive' | 'blocked';

export interface UserRoleDto {
  id: number;
  name: string;
  is_protected: boolean;
}

/** List and detail share this user resource. */
export interface UserDto {
  id: number;
  code: string;
  name: string;
  username: string | null;
  email: string;
  phone: string | null;
  status: string;
  role: UserRoleDto | null;
  avatar: FileObject | null;
  blocked_reason: string | null;
  blocked_at: string | null;
  last_login_at: string | null;
  last_activity_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserStatMetricDto {
  value: number;
  previous: number | null;
  change_pct: number | null;
}

export interface UserStatsDto {
  total: UserStatMetricDto;
  active: UserStatMetricDto;
  inactive: UserStatMetricDto;
  blocked: UserStatMetricDto;
}

export interface UserWriteDto {
  name: string;
  email: string;
  phone: string | null;
  status: UserApiStatus;
  role_id: number;
  /** Media UUID. Omit to keep the current photo; `null` removes it. */
  avatar?: string | null;
}

export interface UserStatusWriteDto {
  status: UserApiStatus;
  reason?: string;
}

/** `GET /admin/roles` row used by the user role dropdown. */
export interface RoleListDto {
  id: number;
  name: string;
  is_protected: boolean;
  users_count?: number;
  created_at?: string;
  updated_at?: string;
}
