import type {
  RoleListDto,
  UserApiStatus,
  UserDto,
  UserRoleDto,
  UserStatMetricDto,
  UserStatsDto,
  UserWriteDto,
} from '../models/user.api';
import type {
  AssignableRole,
  User,
  UserDraft,
  UserRoleRef,
  UserStats,
  UserStatsMetric,
  UserStatus,
} from '../models/user.model';

const USER_STATUSES: readonly UserStatus[] = ['active', 'inactive', 'blocked'];

export function isUserStatus(value: string): value is UserStatus {
  return (USER_STATUSES as readonly string[]).includes(value);
}

/** Existing copy whose meaning matches the backend status. Unknown statuses have no label key. */
export function userStatusLabelKey(status: UserStatus | null): string | null {
  if (status === 'active') {
    return 'status.active';
  }
  if (status === 'inactive') {
    return 'users.statusInactive';
  }
  if (status === 'blocked') {
    return 'users.statusBlocked';
  }
  return null;
}

export function formatUserStamp(
  iso: string | null,
  language: string,
): { date: string; time: string } {
  if (!iso) {
    return { date: '', time: '' };
  }
  const value = new Date(iso);
  if (Number.isNaN(value.getTime())) {
    return { date: '', time: '' };
  }
  const locale = language === 'ar' ? 'ar' : 'en';
  return {
    date: value.toLocaleDateString(locale, { year: 'numeric', month: 'short', day: 'numeric' }),
    time: value.toLocaleTimeString(locale, { hour: 'numeric', minute: '2-digit' }),
  };
}

export function isAssignableRoleId(roleId: number, roles: readonly { id: number }[]): boolean {
  return Number.isInteger(roleId) && roleId > 0 && roles.some((role) => role.id === roleId);
}

export function mapAssignableRole(dto: RoleListDto): AssignableRole | null {
  if (!Number.isInteger(dto.id) || dto.id <= 0 || typeof dto.name !== 'string' || !dto.name.trim()) {
    return null;
  }
  return {
    id: dto.id,
    name: dto.name,
    isProtected: dto.is_protected === true,
  };
}

export function mapUser(dto: UserDto): User {
  const status = isUserStatus(dto.status) ? dto.status : null;
  return {
    id: String(dto.id),
    code: dto.code,
    name: dto.name,
    username: dto.username,
    email: dto.email,
    phone: dto.phone ?? '',
    role: mapRole(dto.role),
    status,
    statusRaw: dto.status,
    avatarUrl: dto.avatar?.url ?? null,
    avatarUuid: dto.avatar?.uuid ?? null,
    blockedReason: dto.blocked_reason,
    blockedAt: dto.blocked_at,
    lastActivityAt: dto.last_activity_at,
    createdAt: dto.created_at,
  };
}

export function mapUserStats(dto: UserStatsDto): UserStats {
  return {
    total: mapMetric(dto.total),
    active: mapMetric(dto.active),
    inactive: mapMetric(dto.inactive),
    blocked: mapMetric(dto.blocked),
  };
}

/** Writable body. Avatar is included only when the caller resolved a new UUID or a removal. */
export function toUserWriteDto(
  draft: UserDraft,
  avatar: string | null | undefined,
): UserWriteDto {
  if (!isUserStatus(draft.status)) {
    throw new Error('invalid-user-status');
  }
  const body: UserWriteDto = {
    name: draft.name.trim(),
    email: draft.email.trim(),
    phone: draft.phone.trim() ? draft.phone.trim() : null,
    status: draft.status satisfies UserApiStatus,
    role_id: draft.roleId,
  };
  if (avatar !== undefined) {
    body.avatar = avatar;
  }
  return body;
}

function mapRole(role: UserRoleDto | null | undefined): UserRoleRef | null {
  if (!role || !Number.isInteger(role.id) || role.id <= 0 || typeof role.name !== 'string') {
    return null;
  }
  return {
    id: role.id,
    name: role.name,
    isProtected: role.is_protected === true,
  };
}

function mapMetric(dto: UserStatMetricDto): UserStatsMetric {
  return {
    value: dto.value,
    previous: dto.previous,
    changePct: dto.change_pct,
  };
}
