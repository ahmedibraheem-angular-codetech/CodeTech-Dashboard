import type { UserDto } from '../models/user.api';
import type { UserDraft } from '../models/user.model';
import {
  isAssignableRoleId,
  mapUser,
  mapUserStats,
  toUserWriteDto,
  userStatusLabelKey,
} from './user.mapper';

function userDto(overrides: Partial<UserDto> = {}): UserDto {
  return {
    id: 7,
    code: 'USE-00007',
    name: 'يوسف احمد',
    username: 'yousef',
    email: 'yousef@codetech.test',
    phone: '+966 55 000 0000',
    status: 'active',
    role: { id: 2, name: 'مدير المحتوى', is_protected: false },
    avatar: {
      uuid: 'avatar-uuid',
      name: 'avatar',
      file_name: 'avatar.png',
      mime_type: 'image/png',
      size: 10,
      url: 'https://cdn.example/avatar.png',
      download_url: 'https://cdn.example/avatar.png?download',
      created_at: '2026-10-29T10:00:00.000000Z',
    },
    blocked_reason: null,
    blocked_at: null,
    last_login_at: null,
    last_activity_at: '2026-10-29T10:12:00.000000Z',
    created_at: '2026-10-20T08:00:00.000000Z',
    updated_at: '2026-10-29T09:30:00.000000Z',
    ...overrides,
  };
}

describe('user mapper', () => {
  it('maps a user resource without treating role id as a slug', () => {
    const user = mapUser(userDto());
    expect(user.id).toBe('7');
    expect(user.code).toBe('USE-00007');
    expect(user.role).toEqual({ id: 2, name: 'مدير المحتوى', isProtected: false });
    expect(user.avatarUuid).toBe('avatar-uuid');
    expect(user.username).toBe('yousef');
    expect(user.status).toBe('active');
  });

  it('keeps a deleted role as null', () => {
    const user = mapUser(userDto({ role: null }));
    expect(user.role).toBeNull();
    expect(userStatusLabelKey(user.status)).toBe('status.active');
  });

  it('does not map an unknown status onto inactive or blocked', () => {
    const user = mapUser(userDto({ status: 'suspended' }));
    expect(user.status).toBeNull();
    expect(user.statusRaw).toBe('suspended');
    expect(userStatusLabelKey(user.status)).toBeNull();
  });

  it('maps inactive and blocked to their own labels', () => {
    expect(userStatusLabelKey('inactive')).toBe('users.statusInactive');
    expect(userStatusLabelKey('blocked')).toBe('users.statusBlocked');
    expect(mapUser(userDto({ status: 'blocked', blocked_reason: 'مخالفة' })).blockedReason).toBe(
      'مخالفة',
    );
  });

  it('maps stats including a missing trend', () => {
    const stats = mapUserStats({
      total: { value: 20, previous: 18, change_pct: 11.1 },
      active: { value: 15, previous: null, change_pct: null },
      inactive: { value: 3, previous: 3, change_pct: 0 },
      blocked: { value: 2, previous: 1, change_pct: 100 },
    });
    expect(stats.active.changePct).toBeNull();
    expect(stats.blocked.value).toBe(2);
    expect(stats.inactive.changePct).toBe(0);
  });

  it('omits avatar when it is unchanged and sends role_id', () => {
    const draft: UserDraft = {
      name: ' يوسف ',
      email: 'yousef@codetech.test',
      phone: '',
      roleId: 2,
      status: 'inactive',
    };
    expect(toUserWriteDto(draft, undefined)).toEqual({
      name: 'يوسف',
      email: 'yousef@codetech.test',
      phone: null,
      status: 'inactive',
      role_id: 2,
    });
    expect(toUserWriteDto(draft, null).avatar).toBeNull();
    expect(toUserWriteDto(draft, 'media-uuid').avatar).toBe('media-uuid');
  });

  it('accepts only role ids present in the loaded catalog', () => {
    const roles = [{ id: 2 }, { id: 4 }];
    expect(isAssignableRoleId(2, roles)).toBe(true);
    expect(isAssignableRoleId(1, roles)).toBe(false);
    expect(isAssignableRoleId(Number.NaN, roles)).toBe(false);
  });
});
