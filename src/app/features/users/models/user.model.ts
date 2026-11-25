export type UserStatus = 'active' | 'inactive' | 'blocked';

export interface UserRoleRef {
  id: number;
  name: string;
  isProtected: boolean;
}

export interface AssignableRole {
  id: number;
  name: string;
  isProtected: boolean;
}

export interface UserStatsMetric {
  value: number;
  previous: number | null;
  changePct: number | null;
}

export interface UserStats {
  total: UserStatsMetric;
  active: UserStatsMetric;
  inactive: UserStatsMetric;
  blocked: UserStatsMetric;
}

export interface User {
  id: string;
  code: string;
  name: string;
  username: string | null;
  email: string;
  phone: string;
  role: UserRoleRef | null;
  status: UserStatus | null;
  statusRaw: string;
  avatarUrl: string | null;
  avatarUuid: string | null;
  blockedReason: string | null;
  blockedAt: string | null;
  lastActivityAt: string | null;
  createdAt: string;
}

export interface UserListQuery {
  page: number;
  perPage: number;
  search?: string;
  status?: UserStatus;
  roleId?: number;
}

export interface UserListPage {
  items: User[];
  total: number;
}

export interface UserDraft {
  name: string;
  email: string;
  phone: string;
  roleId: number;
  status: UserStatus;
  avatar?: File | null;
}
