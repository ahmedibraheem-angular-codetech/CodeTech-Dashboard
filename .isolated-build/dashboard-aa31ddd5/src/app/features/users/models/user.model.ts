/** Backend statuses. Labels come from existing copy that matches each value. */
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
  /** Null when the role was deleted. The account stays, with no access. */
  role: UserRoleRef | null;
  /** Null when the API status is not `active`, `inactive`, or `blocked`. */
  status: UserStatus | null;
  /** Raw status string, used when `status` is null. */
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

/**
 * Editable user fields.
 * `avatar` omitted keeps the current photo, `null` removes it, a `File` replaces it.
 * Username and join date are not writable here.
 */
export interface UserDraft {
  name: string;
  email: string;
  phone: string;
  roleId: number;
  status: UserStatus;
  avatar?: File | null;
}
